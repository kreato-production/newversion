import { useState, useEffect, useMemo, useCallback } from 'react';
import { parseISO, isWithinInterval } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, X, Clock, AlertTriangle, Ban, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRecursoFisicoDisponibilidade } from '@/hooks/useRecursoFisicoDisponibilidade';
import { ApiAlocacoesRepository } from '@/modules/alocacoes/alocacoes.api';
import { ApiGravacoesRepository } from '@/modules/gravacoes/gravacoes.api.repository';
import { ApiRecursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.api.repository';
import { ApiRecursosHumanosRepository } from '@/modules/recursos-humanos/recursos-humanos.api.repository';
import { ApiRecursosTecnicosRepository } from '@/modules/recursos-tecnicos/recursos-tecnicos.api.repository';

interface RecursoHumanoAlocado {
  id: string;
  recursoHumanoId: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
}

interface HorarioOcupacao {
  horaInicio: string;
  horaFim: string;
}

interface EstoqueItem {
  id: string;
  nome: string;
  codigo: string | null;
  numerador: number;
}

// Each RecursoAlocado = one instance (one gravacao_recursos anchor row)
interface RecursoAlocado {
  id: string; // local id
  anchorDbId: string; // gravacao_recursos.id from DB
  tipo: 'tecnico' | 'fisico';
  recursoId: string;
  recursoNome: string;
  funcaoOperador?: string;
  estoqueItemId?: string;
  estoqueItemNome?: string;
  horas: Record<string, number>; // day -> hours (duration)
  recursosHumanos: Record<string, RecursoHumanoAlocado[]>;
  horarios: Record<string, HorarioOcupacao>;
}

interface Ausencia {
  id: string;
  motivo: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
}

interface RecursoHumano {
  id: string;
  nome: string;
  funcao?: string;
  departamento?: string;
  ausencias?: Ausencia[];
  escalas?: Array<{
    id: string;
    dataInicio: string;
    horaInicio: string;
    dataFim: string;
    horaFim: string;
    diasSemana: number[];
  }>;
}

interface RecursosTabProps {
  gravacaoId: string;
}

const alocacoesRepository = new ApiAlocacoesRepository();
const gravacoesRepository = new ApiGravacoesRepository();
const recursosTecnicosRepository = new ApiRecursosTecnicosRepository();
const recursosFisicosRepository = new ApiRecursosFisicosRepository();
const recursosHumanosRepository = new ApiRecursosHumanosRepository();

// Convert decimal hours to HH:MM time string (duration from 00:00)
const hoursToTimeRange = (hours: number): { horaInicio: string; horaFim: string } => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return {
    horaInicio: '00:00',
    horaFim: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
  };
};

// Convert hora_inicio/hora_fim to decimal hours
const timeRangeToHours = (inicio: string | null, fim: string | null): number => {
  if (!inicio || !fim) return 0;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fim.split(':').map(Number);
  return (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
};

export const RecursosTab = ({ gravacaoId }: RecursosTabProps) => {
  const { toast } = useToast();
  const { verificarDisponibilidade, getFaixasDisponiveis, getOcupacoesRecurso } =
    useRecursoFisicoDisponibilidade();

  const [mesAno, setMesAno] = useState<string>('');
  const [gravacaoDataPrevista, setGravacaoDataPrevista] = useState<string | null>(null);

  const [recursos, setRecursos] = useState<RecursoAlocado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recursosTecnicos, setRecursosTecnicos] = useState<
    { id: string; nome: string; funcaoOperador?: string }[]
  >([]);
  const [recursosFisicos, setRecursosFisicos] = useState<{ id: string; nome: string }[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<'tecnico' | 'fisico'>('tecnico');
  const [selectedRecurso, setSelectedRecurso] = useState('');
  const [selectedEstoqueItem, setSelectedEstoqueItem] = useState('');
  const [estoqueItens, setEstoqueItens] = useState<EstoqueItem[]>([]);
  const [gravacaoInfo, setGravacaoInfo] = useState<{ nome: string; codigo: string } | null>(null);

  // Modal de recursos humanos (para recursos tÃ©cnicos)
  const [rhModalOpen, setRhModalOpen] = useState(false);
  const [rhModalRecurso, setRhModalRecurso] = useState<RecursoAlocado | null>(null);
  const [rhModalDia, setRhModalDia] = useState('');
  const [selectedRH, setSelectedRH] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('18:00');

  // Modal de horÃ¡rio de ocupaÃ§Ã£o (para recursos fÃ­sicos)
  const [horarioModalOpen, setHorarioModalOpen] = useState(false);
  const [horarioModalRecurso, setHorarioModalRecurso] = useState<RecursoAlocado | null>(null);
  const [horarioModalDia, setHorarioModalDia] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFim, setHorarioFim] = useState('18:00');

  // Fetch gravacao info and set initial month
  useEffect(() => {
    const fetchGravacao = async () => {
      try {
        const gravacoes = await gravacoesRepository.list();
        const data = gravacoes.find((item) => item.id === gravacaoId);
        if (!data) {
          return;
        }

        setGravacaoInfo({ nome: data.nome, codigo: data.codigo });
        setGravacaoDataPrevista(data.dataPrevista || null);
        if (data.dataPrevista) {
          const [ano, mes] = data.dataPrevista.split('-');
          setMesAno(`${ano}-${mes}`);
        } else {
          const now = new Date();
          setMesAno(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        }
      } catch (error) {
        console.error('Error fetching gravacao info:', error);
      }
    };
    fetchGravacao();
  }, [gravacaoId]);

  // Fetch resources from Supabase
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [tecnicosData, fisicosData, humanosData] = await Promise.all([
          recursosTecnicosRepository.list(),
          recursosFisicosRepository.list(),
          recursosHumanosRepository.list(),
        ]);

        setRecursosTecnicos(
          tecnicosData.map((item) => ({
            id: item.id,
            nome: item.nome,
            funcaoOperador: item.funcaoOperador || undefined,
          })),
        );

        setRecursosFisicos(
          fisicosData
            .filter((item) => (item.estoqueItens || []).length > 0)
            .map((item) => ({ id: item.id, nome: item.nome })),
        );

        setRecursosHumanos(
          humanosData
            .filter((item) => item.status === 'Ativo')
            .map((item) => ({
              id: item.id,
              nome: `${item.nome} ${item.sobrenome}`.trim(),
              funcao: item.funcao || undefined,
              departamento: item.departamento || undefined,
              ausencias: item.ausencias || [],
              escalas: item.escalas || [],
            })),
        );
      } catch (error) {
        console.error('Error fetching resource options:', error);
      }
    };
    fetchResources();
  }, []);

  // Fetch stock items when a physical resource is selected
  useEffect(() => {
    const fetchEstoqueItens = async () => {
      if (selectedTipo !== 'fisico' || !selectedRecurso) {
        setEstoqueItens([]);
        setSelectedEstoqueItem('');
        return;
      }

      try {
        const fisicosData = await recursosFisicosRepository.list();
        const recurso = fisicosData.find((item) => item.id === selectedRecurso);
        setEstoqueItens(
          (recurso?.estoqueItens || []).map((item) => ({
            id: item.id,
            nome: item.nome,
            codigo: item.codigo || null,
            numerador: item.numerador,
          })),
        );
      } catch (error) {
        console.error('Error fetching estoque itens:', error);
        setEstoqueItens([]);
      }
      setSelectedEstoqueItem('');
    };
    fetchEstoqueItens();
  }, [selectedTipo, selectedRecurso]);

  // Fetch allocated resources - each anchor = one row
  const fetchAlocacoes = useCallback(async () => {
    if (!gravacaoId) return;

    setIsLoading(true);
    try {
      const response = await alocacoesRepository.listByGravacao(gravacaoId);
      setGravacaoInfo({ nome: response.gravacao.nome, codigo: response.gravacao.codigo });
      setGravacaoDataPrevista(response.gravacao.dataPrevista || null);
      setRecursos(response.data as RecursoAlocado[]);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [gravacaoId]);

  useEffect(() => {
    fetchAlocacoes();
  }, [fetchAlocacoes]);

  // Conflict detection
  const [conflitosCache, setConflitosCache] = useState<Record<string, Record<string, string>>>({});

  const getConflitosRecurso = useCallback(
    async (recursoId: string, tipo: 'tecnico' | 'fisico'): Promise<Record<string, string>> => {
      const conflitos: Record<string, string> = {};
      const response = await alocacoesRepository.listConflicts(gravacaoId, tipo, recursoId);

      for (const item of response.data || []) {
        if (item.dataPrevista) {
          conflitos[item.dataPrevista] = item.gravacaoNome;
        }
      }

      return conflitos;
    },
    [gravacaoId],
  );

  useEffect(() => {
    const loadConflitos = async () => {
      const cache: Record<string, Record<string, string>> = {};
      for (const recurso of recursos) {
        const key = `${recurso.tipo}_${recurso.recursoId}`;
        if (!cache[key]) {
          cache[key] = await getConflitosRecurso(recurso.recursoId, recurso.tipo);
        }
      }
      setConflitosCache(cache);
    };
    if (recursos.length > 0) {
      loadConflitos();
    }
  }, [recursos, getConflitosRecurso]);

  const diasDoMes = useMemo(() => {
    const [ano, mes] = mesAno.split('-').map(Number);
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const dias: { dia: number; diaSemana: number; isWeekend: boolean; dataKey: string }[] = [];

    for (let d = 1; d <= ultimoDia; d++) {
      const data = new Date(ano, mes - 1, d);
      const diaSemana = data.getDay();
      dias.push({
        dia: d,
        diaSemana,
        isWeekend: diaSemana === 0 || diaSemana === 6,
        dataKey: `${mesAno}-${String(d).padStart(2, '0')}`,
      });
    }
    return dias;
  }, [mesAno]);

  // Add resource - always creates a new anchor (allows duplicates)
  const handleAddRecurso = async () => {
    if (!selectedRecurso) return;

    const lista = selectedTipo === 'tecnico' ? recursosTecnicos : recursosFisicos;
    const recurso = lista.find((r) => r.id === selectedRecurso);
    if (!recurso) return;

    try {
      const novoRecurso = await alocacoesRepository.addAnchor(gravacaoId, {
        tipo: selectedTipo,
        recursoId: selectedRecurso,
        estoqueItemId: selectedEstoqueItem || null,
      });

      setRecursos([...recursos, novoRecurso as RecursoAlocado]);
      setSelectedRecurso('');
      setSelectedEstoqueItem('');
    } catch (error) {
      console.error('Error adding resource allocation:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar recurso.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveRecurso = async (recursoLocalId: string) => {
    const recurso = recursos.find((r) => r.id === recursoLocalId);
    if (!recurso) return;

    try {
      await alocacoesRepository.removeAllocation(gravacaoId, recurso.anchorDbId);
      setRecursos(recursos.filter((r) => r.id !== recursoLocalId));
    } catch (error) {
      console.error('Error removing resource allocation:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover recurso.',
        variant: 'destructive',
      });
    }
  };

  const handleHorasChange = async (recursoLocalId: string, dia: string, horasValue: number) => {
    const recursoAtual = recursos.find((r) => r.id === recursoLocalId);
    if (!recursoAtual) return;

    const updated = recursos.map((r) => {
      if (r.id === recursoLocalId) {
        return {
          ...r,
          horas: { ...r.horas, [dia]: horasValue },
        };
      }
      return r;
    });
    setRecursos(updated);

    const { horaInicio: hi, horaFim: hf } = hoursToTimeRange(horasValue);

    await alocacoesRepository.updateHorario(gravacaoId, recursoAtual.anchorDbId, {
      horaInicio: hi,
      horaFim: hf,
    });
  };

  const openRHModal = (recurso: RecursoAlocado, dia: string) => {
    setRhModalRecurso(recurso);
    setRhModalDia(dia);
    setSelectedRH('');
    setHoraInicio('08:00');
    setHoraFim('18:00');
    setRhModalOpen(true);
  };

  const fetchEscalaColaborador = async (rhId: string, dia: string) => {
    if (!rhId || !dia) return null;

    const dataObj = parseISO(dia);
    const diaSemana = dataObj.getDay();
    const colaborador = recursosHumanos.find((item) => item.id === rhId);
    const escalas = colaborador?.escalas || [];

    if (escalas.length === 0) return null;

    for (const escala of escalas) {
      const dataInicio = parseISO(escala.dataInicio);
      const dataFim = parseISO(escala.dataFim);
      if (!isWithinInterval(dataObj, { start: dataInicio, end: dataFim })) {
        continue;
      }

      const diasSemana = escala.diasSemana || [1, 2, 3, 4, 5];
      if (diasSemana.includes(diaSemana)) {
        return {
          horaInicio: escala.horaInicio?.substring(0, 5) || '08:00',
          horaFim: escala.horaFim?.substring(0, 5) || '18:00',
        };
      }
    }

    return null;
  };

  useEffect(() => {
    const updateHorariosFromEscala = async () => {
      if (!selectedRH || !rhModalDia) return;

      const escala = await fetchEscalaColaborador(selectedRH, rhModalDia);
      if (escala) {
        setHoraInicio(escala.horaInicio);
        setHoraFim(escala.horaFim);
      } else {
        setHoraInicio('08:00');
        setHoraFim('18:00');
      }
    };

    updateHorariosFromEscala();
  }, [selectedRH, rhModalDia, recursosHumanos]);

  const handleAddRH = async () => {
    if (!selectedRH || !rhModalRecurso) return;

    const rh = recursosHumanos.find((r) => r.id === selectedRH);
    if (!rh) return;

    const novoRH: RecursoHumanoAlocado = {
      id: crypto.randomUUID(),
      recursoHumanoId: selectedRH,
      nome: rh.nome,
      horaInicio,
      horaFim,
    };

    const updated = recursos.map((r) => {
      if (r.id === rhModalRecurso.id) {
        const rhAtual = r.recursosHumanos[rhModalDia] || [];
        return {
          ...r,
          recursosHumanos: {
            ...r.recursosHumanos,
            [rhModalDia]: [...rhAtual, novoRH],
          },
        };
      }
      return r;
    });

    setRecursos(updated);

    try {
      const saved = await alocacoesRepository.addColaborador(
        gravacaoId,
        rhModalRecurso.anchorDbId,
        {
          recursoHumanoId: selectedRH,
          horaInicio,
          horaFim,
        },
      );

      setRecursos((prev) =>
        prev.map((r) => {
          if (r.id === rhModalRecurso.id) {
            const rhList = r.recursosHumanos[rhModalDia] || [];
            return {
              ...r,
              recursosHumanos: {
                ...r.recursosHumanos,
                [rhModalDia]: rhList.map((item) =>
                  item.id === novoRH.id ? { ...item, ...saved } : item,
                ),
              },
            };
          }
          return r;
        }),
      );

      toast({
        title: 'Colaborador alocado',
        description: `${rh.nome} foi alocado com sucesso.`,
      });

      setSelectedRH('');
      setHoraInicio('08:00');
      setHoraFim('18:00');
    } catch (error) {
      console.error('Error adding resource human allocation:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alocar colaborador.',
        variant: 'destructive',
      });
      setRecursos(recursos);
    }
  };

  const handleRemoveRH = async (recursoLocalId: string, dia: string, rhId: string) => {
    const recurso = recursos.find((r) => r.id === recursoLocalId);
    const rhInfo = recurso?.recursosHumanos[dia]?.find((rh) => rh.id === rhId);

    const updated = recursos.map((r) => {
      if (r.id === recursoLocalId) {
        return {
          ...r,
          recursosHumanos: {
            ...r.recursosHumanos,
            [dia]: (r.recursosHumanos[dia] || []).filter((rh) => rh.id !== rhId),
          },
        };
      }
      return r;
    });
    setRecursos(updated);

    if (rhInfo) {
      try {
        await alocacoesRepository.removeAllocation(gravacaoId, rhInfo.id);
        toast({
          title: 'Colaborador desalocado',
          description: `${rhInfo.nome} foi removido com sucesso.`,
        });
      } catch (error) {
        console.error('Error removing resource human allocation:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao remover colaborador.',
          variant: 'destructive',
        });
        setRecursos(recursos);
      }
    }
  };

  const getRHCount = (recurso: RecursoAlocado, dia: string) => {
    return (recurso.recursosHumanos[dia] || []).length;
  };

  // Functions for occupancy time (physical resources)
  const openHorarioModal = (recurso: RecursoAlocado, dia: string) => {
    setHorarioModalRecurso(recurso);
    setHorarioModalDia(dia);
    const horarioExistente = recurso.horarios[dia];

    const faixas = getFaixasDisponiveis(recurso.recursoId, dia);
    if (faixas.length > 0 && !horarioExistente) {
      setHorarioInicio(faixas[0].horaInicio);
      setHorarioFim(faixas[0].horaFim);
    } else {
      setHorarioInicio(horarioExistente?.horaInicio || '08:00');
      setHorarioFim(horarioExistente?.horaFim || '18:00');
    }

    setHorarioModalOpen(true);
  };

  const [horarioModalDisponibilidade, setHorarioModalDisponibilidade] = useState<{
    faixas: { horaInicio: string; horaFim: string }[];
    ocupacoes: { gravacaoId: string; gravacaoNome: string; horaInicio: string; horaFim: string }[];
    disponibilidade: { disponivel: boolean; motivo?: string };
  } | null>(null);

  useEffect(() => {
    const loadDisponibilidade = async () => {
      if (!horarioModalRecurso || !horarioModalDia) {
        setHorarioModalDisponibilidade(null);
        return;
      }

      const faixas = getFaixasDisponiveis(horarioModalRecurso.recursoId, horarioModalDia);
      const ocupacoes = await getOcupacoesRecurso(
        horarioModalRecurso.recursoId,
        horarioModalDia,
        gravacaoId,
      );
      const disponibilidade = verificarDisponibilidade(
        horarioModalRecurso.recursoId,
        horarioModalDia,
        horarioInicio,
        horarioFim,
        gravacaoId,
      );

      setHorarioModalDisponibilidade({ faixas, ocupacoes, disponibilidade });
    };

    loadDisponibilidade();
  }, [
    horarioModalRecurso,
    horarioModalDia,
    horarioInicio,
    horarioFim,
    gravacaoId,
    getFaixasDisponiveis,
    getOcupacoesRecurso,
    verificarDisponibilidade,
  ]);

  const handleSaveHorario = async () => {
    if (!horarioModalRecurso) return;

    const disponibilidade = verificarDisponibilidade(
      horarioModalRecurso.recursoId,
      horarioModalDia,
      horarioInicio,
      horarioFim,
      gravacaoId,
    );

    if (!disponibilidade.disponivel) {
      toast({
        title: 'HorÃ¡rio indisponÃ­vel',
        description: disponibilidade.motivo || 'O horÃ¡rio selecionado nÃ£o estÃ¡ disponÃ­vel.',
        variant: 'destructive',
      });
      return;
    }

    // Update local state
    const updated = recursos.map((r) => {
      if (r.id === horarioModalRecurso.id) {
        // Also update horas based on the time range
        const hours = timeRangeToHours(horarioInicio, horarioFim);
        return {
          ...r,
          horas: { ...r.horas, [horarioModalDia]: hours },
          horarios: {
            ...r.horarios,
            [horarioModalDia]: { horaInicio: horarioInicio, horaFim: horarioFim },
          },
        };
      }
      return r;
    });

    setRecursos(updated);

    // Sync with database
    await alocacoesRepository.updateHorario(gravacaoId, horarioModalRecurso.anchorDbId, {
      horaInicio: horarioInicio,
      horaFim: horarioFim,
    });

    setHorarioModalOpen(false);
  };

  const handleRemoveHorario = async () => {
    if (!horarioModalRecurso) return;

    const updated = recursos.map((r) => {
      if (r.id === horarioModalRecurso.id) {
        const { [horarioModalDia]: _, ...restHorarios } = r.horarios;
        const { [horarioModalDia]: __, ...restHoras } = r.horas;
        return { ...r, horarios: restHorarios, horas: restHoras };
      }
      return r;
    });

    setRecursos(updated);

    await alocacoesRepository.updateHorario(gravacaoId, horarioModalRecurso.anchorDbId, {
      horaInicio: null,
      horaFim: null,
    });

    setHorarioModalOpen(false);
  };

  const getHorario = (recurso: RecursoAlocado, dia: string): HorarioOcupacao | undefined => {
    return recurso.horarios[dia];
  };

  const mesesDisponiveis = useMemo(() => {
    const meses = [];
    const now = new Date();
    for (let i = -6; i <= 12; i++) {
      const data = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const valor = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const label = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      meses.push({ valor, label });
    }
    return meses;
  }, []);

  const recursosDisponiveis = selectedTipo === 'tecnico' ? recursosTecnicos : recursosFisicos;
  const recursosTecnicosAlocados = recursos.filter((r) => r.tipo === 'tecnico');
  const recursosFisicosAlocados = recursos.filter((r) => r.tipo === 'fisico');

  const rhAlocadosNoDia = useMemo(() => {
    if (!rhModalRecurso || !rhModalDia) return [];
    const recursoAtual = recursos.find((r) => r.id === rhModalRecurso.id);
    return recursoAtual?.recursosHumanos[rhModalDia] || [];
  }, [recursos, rhModalRecurso, rhModalDia]);

  const isColaboradorAusente = (rh: RecursoHumano, dataStr: string): boolean => {
    if (!rh.ausencias || rh.ausencias.length === 0) return false;
    const data = parseISO(dataStr);
    return rh.ausencias.some((ausencia) => {
      const inicio = parseISO(ausencia.dataInicio);
      const fim = parseISO(ausencia.dataFim);
      return isWithinInterval(data, { start: inicio, end: fim });
    });
  };

  const getMotivoAusencia = (rh: RecursoHumano, dataStr: string): string | null => {
    if (!rh.ausencias || rh.ausencias.length === 0) return null;
    const data = parseISO(dataStr);
    const ausencia = rh.ausencias.find((a) => {
      const inicio = parseISO(a.dataInicio);
      const fim = parseISO(a.dataFim);
      return isWithinInterval(data, { start: inicio, end: fim });
    });
    return ausencia?.motivo || null;
  };

  const recursosHumanosFiltrados = useMemo(() => {
    let filtrados = recursosHumanos;
    if (rhModalRecurso?.funcaoOperador) {
      filtrados = filtrados.filter(
        (rh) => rh.funcao?.toLowerCase() === rhModalRecurso.funcaoOperador?.toLowerCase(),
      );
    }
    if (rhModalDia) {
      filtrados = filtrados.filter((rh) => !isColaboradorAusente(rh, rhModalDia));
    }
    return filtrados;
  }, [recursosHumanos, rhModalRecurso?.funcaoOperador, rhModalDia]);

  const colaboradoresAusentes = useMemo(() => {
    if (!rhModalDia) return [];
    let filtrados = recursosHumanos;
    if (rhModalRecurso?.funcaoOperador) {
      filtrados = filtrados.filter(
        (rh) => rh.funcao?.toLowerCase() === rhModalRecurso.funcaoOperador?.toLowerCase(),
      );
    }
    return filtrados
      .filter((rh) => isColaboradorAusente(rh, rhModalDia))
      .map((rh) => ({
        ...rh,
        motivoAusencia: getMotivoAusencia(rh, rhModalDia),
      }));
  }, [recursosHumanos, rhModalRecurso?.funcaoOperador, rhModalDia]);

  const renderRecursosTable = (
    recursosLista: RecursoAlocado[],
    tipoLabel: string,
    tipoIcon: string,
    isTecnico: boolean,
  ) => {
    if (recursosLista.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <span className="text-muted-foreground">{tipoIcon}</span>
          {tipoLabel}
          <span className="text-xs text-muted-foreground">({recursosLista.length})</span>
        </h4>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-1.5 py-1 font-medium sticky left-0 bg-muted/50 min-w-40 text-xs">
                  Recurso
                </th>
                {diasDoMes.map((d) => (
                  <th
                    key={d.dia}
                    className={`px-0.5 py-1 text-center font-medium w-12 ${d.isWeekend ? 'bg-weekend' : ''}`}
                  >
                    {d.dia}
                  </th>
                ))}
                <th className="px-1 py-1 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {recursosLista.map((recurso) => {
                const conflitosKey = `${recurso.tipo}_${recurso.recursoId}`;
                const conflitos = conflitosCache[conflitosKey] || {};

                return (
                  <tr key={recurso.id} className="border-b">
                    <td className="px-1.5 py-0.5 sticky left-0 bg-card font-medium text-xs whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{recurso.recursoNome}</span>
                        {recurso.estoqueItemNome && (
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {recurso.estoqueItemNome}
                          </span>
                        )}
                      </div>
                    </td>
                    {diasDoMes.map((d) => {
                      const rhCount = getRHCount(recurso, d.dataKey);
                      const rhList = recurso.recursosHumanos[d.dataKey] || [];
                      const horasValue = recurso.horas[d.dataKey] || 0;
                      const faltaColaborador = isTecnico && horasValue > 0 && rhCount === 0;
                      const horario = getHorario(recurso, d.dataKey);
                      const faltaHorario = !isTecnico && horasValue > 0 && !horario;
                      const conflito = conflitos[d.dataKey];

                      return (
                        <td
                          key={d.dia}
                          className={`px-0 py-0.5 text-center ${d.isWeekend ? 'bg-weekend' : ''} ${conflito ? 'bg-destructive/10' : ''}`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            {conflito ? (
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="w-10 h-6 flex items-center justify-center bg-destructive/20 rounded border border-destructive/30 cursor-not-allowed">
                                      <AlertTriangle className="w-3 h-3 text-destructive" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    <p className="font-medium text-destructive">
                                      Recurso indisponÃ­vel
                                    </p>
                                    <p className="text-muted-foreground">Alocado em: {conflito}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                className="w-10 h-6 text-center p-0 text-[10px]"
                                value={horasValue > 0 ? horasValue : ''}
                                placeholder="h"
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  handleHorasChange(recurso.id, d.dataKey, val);
                                }}
                              />
                            )}
                            {isTecnico && (
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className={`h-5 w-5 relative ${
                                        faltaColaborador
                                          ? 'text-destructive hover:text-destructive'
                                          : rhCount > 0
                                            ? 'text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                      onClick={() => openRHModal(recurso, d.dataKey)}
                                    >
                                      <Users className="w-3 h-3" />
                                      {rhCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] rounded-full w-3 h-3 flex items-center justify-center">
                                          {rhCount}
                                        </span>
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    {rhCount > 0 ? (
                                      <div className="space-y-1">
                                        <p className="font-medium text-xs">
                                          {rhCount} colaborador(es):
                                        </p>
                                        <ul className="text-xs space-y-0.5">
                                          {rhList.map((rh) => (
                                            <li key={rh.id} className="text-muted-foreground">
                                              â€¢ {rh.nome} ({rh.horaInicio} - {rh.horaFim})
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : faltaColaborador ? (
                                      <p className="text-xs text-destructive font-medium">
                                        AtenÃ§Ã£o: recurso sem colaborador associado!
                                      </p>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        Clique para adicionar colaboradores
                                      </p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {!isTecnico && (
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className={`h-5 w-5 relative ${
                                        faltaHorario
                                          ? 'text-destructive hover:text-destructive'
                                          : horario
                                            ? 'text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                      onClick={() => openHorarioModal(recurso, d.dataKey)}
                                    >
                                      <Clock className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    {horario ? (
                                      <div className="space-y-1">
                                        <p className="font-medium text-xs">
                                          HorÃ¡rio de ocupaÃ§Ã£o:
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {horario.horaInicio} - {horario.horaFim}
                                        </p>
                                      </div>
                                    ) : faltaHorario ? (
                                      <p className="text-xs text-destructive font-medium">
                                        AtenÃ§Ã£o: defina o horÃ¡rio de ocupaÃ§Ã£o!
                                      </p>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        Clique para definir horÃ¡rio
                                      </p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-0 py-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveRecurso(recurso.id)}
                        className="h-6 w-6 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">MÃªs/Ano</label>
          <Select value={mesAno} onValueChange={setMesAno}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mesesDisponiveis.map((m) => (
                <SelectItem key={m.valor} value={m.valor}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">Tipo</label>
          <Select
            value={selectedTipo}
            onValueChange={(v) => setSelectedTipo(v as 'tecnico' | 'fisico')}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tecnico">TÃ©cnico</SelectItem>
              <SelectItem value="fisico">FÃ­sico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 flex-1 min-w-48">
          <label className="text-sm text-muted-foreground">Recurso</label>
          <Select value={selectedRecurso} onValueChange={setSelectedRecurso}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um recurso..." />
            </SelectTrigger>
            <SelectContent>
              {recursosDisponiveis.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTipo === 'fisico' && selectedRecurso && estoqueItens.length > 0 && (
          <div className="space-y-1 flex-1 min-w-48">
            <label className="text-sm text-muted-foreground">Item de Estoque (opcional)</label>
            <Select
              value={selectedEstoqueItem || '__none__'}
              onValueChange={(v) => setSelectedEstoqueItem(v === '__none__' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um item..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum (qualquer item)</SelectItem>
                {estoqueItens.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    #{item.numerador} - {item.nome}
                    {item.codigo ? ` (${item.codigo})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={handleAddRecurso} disabled={!selectedRecurso} size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {recursos.length > 0 && (
        <div className="space-y-4">
          {renderRecursosTable(recursosTecnicosAlocados, 'Recursos TÃ©cnicos', 'ðŸ”§', true)}
          {renderRecursosTable(recursosFisicosAlocados, 'Recursos FÃ­sicos', 'ðŸ¢', false)}
        </div>
      )}

      {recursos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum recurso adicionado ainda.</p>
          <p className="text-sm">Adicione recursos tÃ©cnicos ou fÃ­sicos acima.</p>
        </div>
      )}

      {/* Modal for managing human resources */}
      <Dialog open={rhModalOpen} onOpenChange={setRhModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recursos Humanos - {rhModalRecurso?.recursoNome}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Data:{' '}
              {rhModalDia ? new Date(rhModalDia + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {colaboradoresAusentes.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                  ⚠️ Colaboradores indisponíveis nesta data:
                </p>
                <div className="space-y-1">
                  {colaboradoresAusentes.map((rh) => (
                    <div
                      key={rh.id}
                      className="text-xs text-muted-foreground flex items-center gap-2"
                    >
                      <span>â€¢ {rh.nome}</span>
                      <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px]">
                        {rh.motivoAusencia}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <Label className="text-sm font-medium">Adicionar Colaborador</Label>
              {rhModalRecurso?.funcaoOperador && (
                <p className="text-xs text-muted-foreground">
                  Exibindo colaboradores com funÃ§Ã£o:{' '}
                  <strong>{rhModalRecurso.funcaoOperador}</strong>
                </p>
              )}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Colaborador</Label>
                  <Select value={selectedRH} onValueChange={setSelectedRH}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {recursosHumanosFiltrados.length === 0 ? (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          {colaboradoresAusentes.length > 0
                            ? 'Todos os colaboradores estÃ£o ausentes nesta data'
                            : `Nenhum colaborador encontrado${rhModalRecurso?.funcaoOperador ? ` com funÃ§Ã£o "${rhModalRecurso.funcaoOperador}"` : ''}`}
                        </div>
                      ) : (
                        recursosHumanosFiltrados.map((rh) => (
                          <SelectItem key={rh.id} value={rh.id}>
                            {rh.nome} {rh.funcao ? `(${rh.funcao})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hora InÃ­cio</Label>
                    <Input
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hora Fim</Label>
                    <Input
                      type="time"
                      value={horaFim}
                      onChange={(e) => setHoraFim(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleAddRH} disabled={!selectedRH} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {rhAlocadosNoDia.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Colaboradores Alocados</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {rhAlocadosNoDia.map((rh) => (
                    <div
                      key={rh.id}
                      className="flex items-center justify-between p-2 border rounded-lg bg-background"
                    >
                      <div>
                        <p className="font-medium text-sm">{rh.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {rh.horaInicio} - {rh.horaFim}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveRH(rhModalRecurso!.id, rhModalDia, rh.id)}
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rhAlocadosNoDia.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Nenhum colaborador alocado para este dia.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRhModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal for defining occupancy time (physical resources) */}
      <Dialog open={horarioModalOpen} onOpenChange={setHorarioModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              HorÃ¡rio de OcupaÃ§Ã£o - {horarioModalRecurso?.recursoNome}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Data:{' '}
              {horarioModalDia
                ? new Date(horarioModalDia + 'T12:00:00').toLocaleDateString('pt-BR')
                : ''}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {horarioModalDisponibilidade && (
              <div className="space-y-2">
                {horarioModalDisponibilidade.faixas.length > 0 ? (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      Faixas de Disponibilidade
                    </Label>
                    <div className="space-y-1">
                      {horarioModalDisponibilidade.faixas.map((faixa, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="font-mono">
                            {faixa.horaInicio} - {faixa.horaFim}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 border border-dashed rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      Nenhuma faixa de disponibilidade definida para esta data.
                    </p>
                  </div>
                )}

                {horarioModalDisponibilidade.ocupacoes.length > 0 && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5 text-destructive">
                      <Ban className="w-3.5 h-3.5" />
                      PerÃ­odos jÃ¡ ocupados
                    </Label>
                    <div className="space-y-1">
                      {horarioModalDisponibilidade.ocupacoes.map((oc, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span
                            className="text-muted-foreground truncate max-w-[150px]"
                            title={oc.gravacaoNome}
                          >
                            {oc.gravacaoNome}
                          </span>
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {oc.horaInicio} - {oc.horaFim}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!horarioModalDisponibilidade.disponibilidade.disponivel && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-destructive">
                        {horarioModalDisponibilidade.disponibilidade.motivo}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hora InÃ­cio</Label>
                <Input
                  type="time"
                  value={horarioInicio}
                  onChange={(e) => setHorarioInicio(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hora Fim</Label>
                <Input
                  type="time"
                  value={horarioFim}
                  onChange={(e) => setHorarioFim(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {horarioModalRecurso?.horarios[horarioModalDia] && (
              <Button variant="destructive" onClick={handleRemoveHorario}>
                Remover
              </Button>
            )}
            <Button variant="outline" onClick={() => setHorarioModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveHorario}
              disabled={
                horarioModalDisponibilidade &&
                !horarioModalDisponibilidade.disponibilidade.disponivel
              }
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
