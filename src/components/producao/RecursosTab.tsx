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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, X, Clock, AlertTriangle, Ban, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRecursoFisicoDisponibilidade } from '@/hooks/useRecursoFisicoDisponibilidade';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

interface RecursoAlocado {
  id: string;
  tipo: 'tecnico' | 'fisico';
  recursoId: string;
  recursoNome: string;
  funcaoOperador?: string;
  estoqueItemId?: string;
  estoqueItemNome?: string;
  alocacoes: Record<string, number>;
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
}

interface RecursosTabProps {
  gravacaoId: string;
}

export const RecursosTab = ({ gravacaoId }: RecursosTabProps) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const { verificarDisponibilidade, getFaixasDisponiveis, getOcupacoesRecurso } = useRecursoFisicoDisponibilidade();
  
  const [mesAno, setMesAno] = useState<string>('');
  const [gravacaoDataPrevista, setGravacaoDataPrevista] = useState<string | null>(null);

  const [recursos, setRecursos] = useState<RecursoAlocado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recursosTecnicos, setRecursosTecnicos] = useState<{ id: string; nome: string; funcaoOperador?: string }[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<{ id: string; nome: string }[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<'tecnico' | 'fisico'>('tecnico');
  const [selectedRecurso, setSelectedRecurso] = useState('');
  const [selectedEstoqueItem, setSelectedEstoqueItem] = useState('');
  const [estoqueItens, setEstoqueItens] = useState<EstoqueItem[]>([]);
  const [gravacaoInfo, setGravacaoInfo] = useState<{ nome: string; codigo: string } | null>(null);

  // Modal de recursos humanos (para recursos técnicos)
  const [rhModalOpen, setRhModalOpen] = useState(false);
  const [rhModalRecurso, setRhModalRecurso] = useState<RecursoAlocado | null>(null);
  const [rhModalDia, setRhModalDia] = useState('');
  const [selectedRH, setSelectedRH] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('18:00');

  // Modal de horário de ocupação (para recursos físicos)
  const [horarioModalOpen, setHorarioModalOpen] = useState(false);
  const [horarioModalRecurso, setHorarioModalRecurso] = useState<RecursoAlocado | null>(null);
  const [horarioModalDia, setHorarioModalDia] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFim, setHorarioFim] = useState('18:00');

  // Fetch gravacao info and set initial month
  useEffect(() => {
    const fetchGravacao = async () => {
      const { data } = await supabase
        .from('gravacoes')
        .select('nome, codigo, data_prevista')
        .eq('id', gravacaoId)
        .single();
      if (data) {
        setGravacaoInfo(data);
        setGravacaoDataPrevista(data.data_prevista);
        // Inicializar mesAno com base na data_prevista da gravação
        if (data.data_prevista) {
          const [ano, mes] = data.data_prevista.split('-');
          setMesAno(`${ano}-${mes}`);
        } else {
          // Fallback para mês atual
          const now = new Date();
          setMesAno(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        }
      }
    };
    fetchGravacao();
  }, [gravacaoId]);

  // Fetch resources from Supabase
  useEffect(() => {
    const fetchResources = async () => {
      if (!session) return;

      // Fetch recursos técnicos with function info
      const { data: tecnicosData } = await supabase
        .from('recursos_tecnicos')
        .select('id, nome, funcao_operador_id, funcoes:funcao_operador_id(nome)')
        .order('nome');
      
      setRecursosTecnicos(
        (tecnicosData || []).map((t: any) => ({
          id: t.id,
          nome: t.nome,
          funcaoOperador: t.funcoes?.nome,
        }))
      );

      // Fetch recursos físicos que têm pelo menos 1 item em estoque
      const { data: fisicosData } = await supabase
        .from('recursos_fisicos')
        .select('id, nome, rf_estoque_itens(id)')
        .order('nome');
      
      // Filtrar apenas recursos que possuem itens em estoque
      const fisicosComEstoque = (fisicosData || [])
        .filter((r: any) => r.rf_estoque_itens && r.rf_estoque_itens.length > 0)
        .map((r: any) => ({ id: r.id, nome: r.nome }));
      setRecursosFisicos(fisicosComEstoque);

      // Fetch recursos humanos with function and absences
      const { data: humanosData } = await supabase
        .from('recursos_humanos')
        .select('id, nome, sobrenome, funcao_id, funcoes:funcao_id(nome), departamento_id, departamentos:departamento_id(nome)')
        .eq('status', 'Ativo')
        .order('nome');

      // Fetch absences for all human resources
      const humanIds = (humanosData || []).map((h: any) => h.id);
      const { data: ausenciasData } = await supabase
        .from('rh_ausencias')
        .select('*')
        .in('recurso_humano_id', humanIds);

      const ausenciasByRH: Record<string, Ausencia[]> = {};
      (ausenciasData || []).forEach((a: any) => {
        if (!ausenciasByRH[a.recurso_humano_id]) ausenciasByRH[a.recurso_humano_id] = [];
        ausenciasByRH[a.recurso_humano_id].push({
          id: a.id,
          motivo: a.motivo,
          dataInicio: a.data_inicio,
          dataFim: a.data_fim,
          dias: a.dias,
        });
      });

      setRecursosHumanos(
        (humanosData || []).map((h: any) => ({
          id: h.id,
          nome: `${h.nome} ${h.sobrenome}`,
          funcao: h.funcoes?.nome,
          departamento: h.departamentos?.nome,
          ausencias: ausenciasByRH[h.id] || [],
        }))
      );
    };
    fetchResources();
  }, [session]);

  // Fetch stock items when a physical resource is selected
  useEffect(() => {
    const fetchEstoqueItens = async () => {
      if (selectedTipo !== 'fisico' || !selectedRecurso) {
        setEstoqueItens([]);
        setSelectedEstoqueItem('');
        return;
      }

      const { data } = await supabase
        .from('rf_estoque_itens')
        .select('id, nome, codigo, numerador')
        .eq('recurso_fisico_id', selectedRecurso)
        .order('numerador');

      setEstoqueItens(data || []);
      setSelectedEstoqueItem('');
    };
    fetchEstoqueItens();
  }, [selectedTipo, selectedRecurso]);

  // Fetch allocated resources for this recording
  const fetchAlocacoes = useCallback(async () => {
    if (!session || !gravacaoId) return;

    setIsLoading(true);
    try {
      // Primeiro buscar a data_prevista da gravação
      const { data: gravacaoData } = await supabase
        .from('gravacoes')
        .select('data_prevista')
        .eq('id', gravacaoId)
        .single();
      
      const dataPrevista = gravacaoData?.data_prevista;

      const { data: alocacoesData } = await supabase
        .from('gravacao_recursos')
        .select(`
          id,
          hora_inicio,
          hora_fim,
          recurso_tecnico_id,
          recurso_fisico_id,
          recurso_humano_id,
          recursos_tecnicos:recurso_tecnico_id(id, nome, funcao_operador_id, funcoes:funcao_operador_id(nome)),
          recursos_fisicos:recurso_fisico_id(id, nome),
          recursos_humanos:recurso_humano_id(id, nome, sobrenome)
        `)
        .eq('gravacao_id', gravacaoId);

      // Group allocations by resource
      const resourceMap = new Map<string, RecursoAlocado>();
      
      (alocacoesData || []).forEach((aloc: any) => {
        // Determinar o tipo de recurso
        // Se tem recurso_humano_id E recurso_tecnico_id, é uma alocação de RH em recurso técnico
        // Se tem apenas recurso_tecnico_id, é apenas o recurso técnico
        // Se tem apenas recurso_fisico_id (e não é alocação de RH), é recurso físico
        const isTecnicoRH = !!aloc.recurso_tecnico_id && !!aloc.recurso_humano_id;
        const isTecnicoSomente = !!aloc.recurso_tecnico_id && !aloc.recurso_humano_id;
        const isFisico = !!aloc.recurso_fisico_id && !aloc.recurso_tecnico_id;
        
        let resourceKey = '';
        let recurso: RecursoAlocado | undefined;

        // Processar recursos técnicos (com ou sem RH)
        if ((isTecnicoRH || isTecnicoSomente) && aloc.recursos_tecnicos) {
          resourceKey = `tecnico_${aloc.recurso_tecnico_id}`;
          if (!resourceMap.has(resourceKey)) {
            resourceMap.set(resourceKey, {
              id: aloc.recurso_tecnico_id,
              tipo: 'tecnico',
              recursoId: aloc.recurso_tecnico_id,
              recursoNome: aloc.recursos_tecnicos.nome,
              funcaoOperador: aloc.recursos_tecnicos.funcoes?.nome,
              alocacoes: {},
              recursosHumanos: {},
              horarios: {},
            });
          }
          recurso = resourceMap.get(resourceKey);

          // Marcar alocação na data_prevista - incrementar para cada registro âncora
          if (recurso && dataPrevista && isTecnicoSomente) {
            recurso.alocacoes[dataPrevista] = (recurso.alocacoes[dataPrevista] || 0) + 1;
          }

          // Se é alocação de RH em recurso técnico
          if (isTecnicoRH && aloc.recursos_humanos && recurso && dataPrevista) {
            const rhName = `${aloc.recursos_humanos.nome} ${aloc.recursos_humanos.sobrenome}`;
            if (!recurso.recursosHumanos[dataPrevista]) {
              recurso.recursosHumanos[dataPrevista] = [];
            }
            
            // Verificar se já existe para evitar duplicatas
            const jaExiste = recurso.recursosHumanos[dataPrevista].some(
              (rh) => rh.recursoHumanoId === aloc.recurso_humano_id
            );
            
            if (!jaExiste) {
              recurso.recursosHumanos[dataPrevista].push({
                id: aloc.id,
                recursoHumanoId: aloc.recurso_humano_id,
                nome: rhName,
                horaInicio: aloc.hora_inicio?.substring(0, 5) || '08:00',
                horaFim: aloc.hora_fim?.substring(0, 5) || '18:00',
              });
            }
          }
        } else if (isFisico && aloc.recursos_fisicos) {
          resourceKey = `fisico_${aloc.recurso_fisico_id}`;
          if (!resourceMap.has(resourceKey)) {
            resourceMap.set(resourceKey, {
              id: aloc.recurso_fisico_id,
              tipo: 'fisico',
              recursoId: aloc.recurso_fisico_id,
              recursoNome: aloc.recursos_fisicos.nome,
              alocacoes: {},
              recursosHumanos: {},
              horarios: {},
            });
          }
          recurso = resourceMap.get(resourceKey);
          
          // Marcar alocação na data_prevista e guardar horários
          if (recurso && dataPrevista) {
            recurso.alocacoes[dataPrevista] = (recurso.alocacoes[dataPrevista] || 0) + 1;
            
            if (aloc.hora_inicio && aloc.hora_fim) {
              recurso.horarios[dataPrevista] = {
                horaInicio: aloc.hora_inicio?.substring(0, 5) || '08:00',
                horaFim: aloc.hora_fim?.substring(0, 5) || '18:00',
              };
            }
          }
        }
      });

      setRecursos(Array.from(resourceMap.values()));
    } catch (error) {
      console.error('Error fetching allocations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session, gravacaoId]);

  useEffect(() => {
    fetchAlocacoes();
  }, [fetchAlocacoes]);

  // Check for conflicts in other recordings
  const getConflito = useCallback(async (recursoId: string, tipo: 'tecnico' | 'fisico', dia: string): Promise<{ gravacaoNome: string } | null> => {
    const column = tipo === 'tecnico' ? 'recurso_tecnico_id' : 'recurso_fisico_id';
    
    const { data } = await supabase
      .from('gravacao_recursos')
      .select(`
        gravacao_id,
        gravacoes:gravacao_id(nome, codigo, data_prevista)
      `)
      .eq(column, recursoId)
      .neq('gravacao_id', gravacaoId);

    for (const item of data || []) {
      const gravacao = item.gravacoes as any;
      if (gravacao?.data_prevista === dia) {
        return { gravacaoNome: gravacao.nome || gravacao.codigo };
      }
    }
    
    return null;
  }, [gravacaoId]);

  // Get conflicts for all dates of a resource
  const getConflitosRecurso = useCallback(async (recursoId: string, tipo: 'tecnico' | 'fisico'): Promise<Record<string, string>> => {
    const conflitos: Record<string, string> = {};
    const column = tipo === 'tecnico' ? 'recurso_tecnico_id' : 'recurso_fisico_id';
    
    const { data } = await supabase
      .from('gravacao_recursos')
      .select(`
        gravacao_id,
        gravacoes:gravacao_id(nome, codigo, data_prevista)
      `)
      .eq(column, recursoId)
      .neq('gravacao_id', gravacaoId);

    for (const item of data || []) {
      const gravacao = item.gravacoes as any;
      if (gravacao?.data_prevista) {
        conflitos[gravacao.data_prevista] = gravacao.nome || gravacao.codigo;
      }
    }
    
    return conflitos;
  }, [gravacaoId]);

  // For UI rendering, we need synchronous conflict data
  const [conflitosCache, setConflitosCache] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    const loadConflitos = async () => {
      const cache: Record<string, Record<string, string>> = {};
      for (const recurso of recursos) {
        const key = `${recurso.tipo}_${recurso.recursoId}`;
        cache[key] = await getConflitosRecurso(recurso.recursoId, recurso.tipo);
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

  const handleAddRecurso = async () => {
    if (!selectedRecurso) return;
    
    const lista = selectedTipo === 'tecnico' ? recursosTecnicos : recursosFisicos;
    const recurso = lista.find((r) => r.id === selectedRecurso);
    if (!recurso) return;

    // Para recursos físicos, verificar se o item de estoque + recurso já existe
    if (selectedTipo === 'fisico') {
      const exists = recursos.find(
        (r) => r.recursoId === selectedRecurso && r.tipo === 'fisico' && r.estoqueItemId === (selectedEstoqueItem || undefined)
      );
      if (exists) {
        toast({
          title: 'Item já adicionado',
          description: 'Este item de estoque já está na lista.',
          variant: 'destructive',
        });
        return;
      }
    } else {
      const exists = recursos.find((r) => r.recursoId === selectedRecurso && r.tipo === selectedTipo);
      if (exists) {
        toast({
          title: 'Recurso já adicionado',
          description: 'Este recurso já está na lista.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Obter informações do item de estoque selecionado
    const estoqueItem = selectedEstoqueItem ? estoqueItens.find((e) => e.id === selectedEstoqueItem) : undefined;

    // Para recursos técnicos, criar registro base no banco (sem recurso_humano_id)
    // Isso garante que o recurso técnico persista mesmo sem colaboradores associados
    if (selectedTipo === 'tecnico') {
      // Verificar se já existe registro base
      const { data: existingBase } = await supabase
        .from('gravacao_recursos')
        .select('id')
        .eq('gravacao_id', gravacaoId)
        .eq('recurso_tecnico_id', selectedRecurso)
        .is('recurso_humano_id', null)
        .maybeSingle();

      if (!existingBase) {
        await supabase.from('gravacao_recursos').insert({
          gravacao_id: gravacaoId,
          recurso_tecnico_id: selectedRecurso,
          recurso_humano_id: null,
        });
      }
    }

    // Add to local state
    const novoRecurso: RecursoAlocado = {
      id: crypto.randomUUID(),
      tipo: selectedTipo,
      recursoId: selectedRecurso,
      recursoNome: recurso.nome,
      funcaoOperador: selectedTipo === 'tecnico' ? (recurso as any).funcaoOperador : undefined,
      estoqueItemId: estoqueItem?.id,
      estoqueItemNome: estoqueItem ? `#${estoqueItem.numerador} - ${estoqueItem.nome}${estoqueItem.codigo ? ` (${estoqueItem.codigo})` : ''}` : undefined,
      alocacoes: {},
      recursosHumanos: {},
      horarios: {},
    };

    setRecursos([...recursos, novoRecurso]);
    setSelectedRecurso('');
    setSelectedEstoqueItem('');
  };

  const handleRemoveRecurso = async (id: string) => {
    const recurso = recursos.find((r) => r.id === id || r.recursoId === id);
    if (!recurso) return;

    // Delete from database - inclui registro base e todas as alocações de RH
    const column = recurso.tipo === 'tecnico' ? 'recurso_tecnico_id' : 'recurso_fisico_id';
    
    // Para recursos técnicos, também excluir tarefas associadas
    if (recurso.tipo === 'tecnico') {
      // Buscar todos os RHs alocados para este recurso técnico
      const { data: alocacoes } = await supabase
        .from('gravacao_recursos')
        .select('recurso_humano_id')
        .eq('gravacao_id', gravacaoId)
        .eq('recurso_tecnico_id', recurso.recursoId)
        .not('recurso_humano_id', 'is', null);

      // Excluir tarefas de cada colaborador
      for (const aloc of alocacoes || []) {
        if (aloc.recurso_humano_id) {
          await removeTaskForRH(aloc.recurso_humano_id, recurso.recursoId);
        }
      }
    }

    await supabase
      .from('gravacao_recursos')
      .delete()
      .eq('gravacao_id', gravacaoId)
      .eq(column, recurso.recursoId);

    setRecursos(recursos.filter((r) => r.id !== id && r.recursoId !== id));
  };

  const handleAlocacaoChange = async (recursoId: string, dia: string, valor: number) => {
    const recursoAtual = recursos.find((r) => r.id === recursoId || r.recursoId === recursoId);
    if (!recursoAtual) return;

    if (valor > 0) {
      // Check for conflicts
      const conflito = await getConflito(recursoAtual.recursoId, recursoAtual.tipo, dia);
      if (conflito) {
        toast({
          title: 'Conflito de alocação',
          description: `Este recurso já está alocado para a gravação "${conflito.gravacaoNome}" nesta data.`,
          variant: 'destructive',
        });
        return;
      }

      // Check availability for physical resources
      if (recursoAtual.tipo === 'fisico') {
        const disponibilidade = verificarDisponibilidade(recursoAtual.recursoId, dia, undefined, undefined, gravacaoId);
        if (!disponibilidade.disponivel) {
          toast({
            title: 'Recurso indisponível',
            description: disponibilidade.motivo || 'Este recurso físico não está disponível nesta data.',
            variant: 'destructive',
          });
          return;
        }
      }
    }

    // Update local state
    const updated = recursos.map((r) => {
      if (r.id === recursoId || r.recursoId === recursoId) {
        return {
          ...r,
          alocacoes: {
            ...r.alocacoes,
            [dia]: valor,
          },
        };
      }
      return r;
    });
    setRecursos(updated);

    // Sync with database
    const column = recursoAtual.tipo === 'tecnico' ? 'recurso_tecnico_id' : 'recurso_fisico_id';
    
    if (valor > 0) {
      // Check if allocation exists
      const { data: existing } = await supabase
        .from('gravacao_recursos')
        .select('id')
        .eq('gravacao_id', gravacaoId)
        .eq(column, recursoAtual.recursoId)
        .maybeSingle();

      if (!existing) {
        // Insert new allocation
        await supabase.from('gravacao_recursos').insert({
          gravacao_id: gravacaoId,
          [column]: recursoAtual.recursoId,
        });
      }
    }
  };

  const openRHModal = (recurso: RecursoAlocado, dia: string) => {
    setRhModalRecurso(recurso);
    setRhModalDia(dia);
    setSelectedRH('');
    setHoraInicio('08:00');
    setHoraFim('18:00');
    setRhModalOpen(true);
  };

  // Buscar escala do colaborador para preencher horários automaticamente
  const fetchEscalaColaborador = async (rhId: string, dia: string) => {
    if (!rhId || !dia) return null;
    
    const dataObj = parseISO(dia);
    const diaSemana = dataObj.getDay(); // 0 = domingo, 1 = segunda, etc.

    // Buscar escalas do colaborador que incluem a data
    const { data: escalas } = await supabase
      .from('rh_escalas')
      .select('*')
      .eq('recurso_humano_id', rhId)
      .lte('data_inicio', dia)
      .gte('data_fim', dia);

    if (!escalas || escalas.length === 0) return null;

    // Encontrar uma escala que inclua o dia da semana
    for (const escala of escalas) {
      const diasSemana = escala.dias_semana || [1, 2, 3, 4, 5];
      if (diasSemana.includes(diaSemana)) {
        return {
          horaInicio: escala.hora_inicio?.substring(0, 5) || '08:00',
          horaFim: escala.hora_fim?.substring(0, 5) || '18:00',
        };
      }
    }

    return null;
  };

  // Effect para atualizar horários quando colaborador é selecionado
  useEffect(() => {
    const updateHorariosFromEscala = async () => {
      if (!selectedRH || !rhModalDia) return;
      
      const escala = await fetchEscalaColaborador(selectedRH, rhModalDia);
      if (escala) {
        setHoraInicio(escala.horaInicio);
        setHoraFim(escala.horaFim);
      } else {
        // Se não houver escala, usar horários padrão
        setHoraInicio('08:00');
        setHoraFim('18:00');
      }
    };

    updateHorariosFromEscala();
  }, [selectedRH, rhModalDia]);

  // Create automatic task for RH
  const createTaskForRH = async (
    rhId: string, 
    rhNome: string, 
    recursoTecnicoId: string, 
    recursoTecnicoNome: string, 
    dia: string,
    horaInicio: string,
    horaFim: string
  ) => {
    // Get default status
    const { data: statusData } = await supabase
      .from('status_tarefa')
      .select('id')
      .eq('codigo', 'PEND')
      .single();

    // Check if task already exists
    const { data: existingTask } = await supabase
      .from('tarefas')
      .select('id')
      .eq('gravacao_id', gravacaoId)
      .eq('recurso_humano_id', rhId)
      .eq('recurso_tecnico_id', recursoTecnicoId)
      .eq('data_inicio', dia)
      .maybeSingle();

    if (existingTask) return;

    // Create task with hora_inicio and hora_fim
    await supabase.from('tarefas').insert({
      gravacao_id: gravacaoId,
      recurso_humano_id: rhId,
      recurso_tecnico_id: recursoTecnicoId,
      titulo: `Operação: ${recursoTecnicoNome}`,
      descricao: `Tarefa automática criada para operação do recurso técnico "${recursoTecnicoNome}" na gravação "${gravacaoInfo?.nome || gravacaoInfo?.codigo || ''}"`,
      status_id: statusData?.id,
      prioridade: 'media',
      data_inicio: dia,
      data_fim: dia,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
    });
  };

  // Remove automatic task for RH - regardless of status
  const removeTaskForRH = async (rhId: string, recursoTecnicoId: string) => {
    // Delete ALL tasks associated with this collaborator and technical resource
    // regardless of the task's current status (Pendente, Concluída, etc.)
    await supabase
      .from('tarefas')
      .delete()
      .eq('gravacao_id', gravacaoId)
      .eq('recurso_humano_id', rhId)
      .eq('recurso_tecnico_id', recursoTecnicoId);
  };

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

    // Update local state
    const updated = recursos.map((r) => {
      if (r.id === rhModalRecurso.id || r.recursoId === rhModalRecurso.recursoId) {
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

    // Save to database
    await supabase.from('gravacao_recursos').insert({
      gravacao_id: gravacaoId,
      recurso_tecnico_id: rhModalRecurso.recursoId,
      recurso_humano_id: selectedRH,
      hora_inicio: horaInicio,
      hora_fim: horaFim,
    });

    // Create automatic task with hora_inicio and hora_fim
    await createTaskForRH(
      selectedRH,
      rh.nome,
      rhModalRecurso.recursoId,
      rhModalRecurso.recursoNome,
      rhModalDia,
      horaInicio,
      horaFim
    );

    toast({
      title: 'Colaborador alocado',
      description: `${rh.nome} foi alocado e uma tarefa foi criada automaticamente.`,
    });

    setSelectedRH('');
    setHoraInicio('08:00');
    setHoraFim('18:00');
  };

  const handleRemoveRH = async (recursoId: string, dia: string, rhId: string) => {
    const recurso = recursos.find((r) => r.id === recursoId || r.recursoId === recursoId);
    const rhInfo = recurso?.recursosHumanos[dia]?.find((rh) => rh.id === rhId);

    // Update local state
    const updated = recursos.map((r) => {
      if (r.id === recursoId || r.recursoId === recursoId) {
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

    // Remove from database
    if (rhInfo && recurso) {
      await supabase
        .from('gravacao_recursos')
        .delete()
        .eq('gravacao_id', gravacaoId)
        .eq('recurso_tecnico_id', recurso.recursoId)
        .eq('recurso_humano_id', rhInfo.recursoHumanoId);

      // Check if RH is still allocated to this resource
      const aindaAlocado = updated.some((r) => {
        if (r.recursoId !== recurso.recursoId) return false;
        return Object.values(r.recursosHumanos).some((rhList) =>
          rhList.some((rh) => rh.recursoHumanoId === rhInfo.recursoHumanoId)
        );
      });

      if (!aindaAlocado) {
        await removeTaskForRH(rhInfo.recursoHumanoId, recurso.recursoId);
        toast({
          title: 'Colaborador desalocado',
          description: `${rhInfo.nome} foi removido e a tarefa associada foi excluída.`,
        });
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
      const ocupacoes = await getOcupacoesRecurso(horarioModalRecurso.recursoId, horarioModalDia, gravacaoId);
      const disponibilidade = verificarDisponibilidade(
        horarioModalRecurso.recursoId,
        horarioModalDia,
        horarioInicio,
        horarioFim,
        gravacaoId
      );

      setHorarioModalDisponibilidade({ faixas, ocupacoes, disponibilidade });
    };

    loadDisponibilidade();
  }, [horarioModalRecurso, horarioModalDia, horarioInicio, horarioFim, gravacaoId, getFaixasDisponiveis, getOcupacoesRecurso, verificarDisponibilidade]);

  const handleSaveHorario = async () => {
    if (!horarioModalRecurso) return;

    const disponibilidade = verificarDisponibilidade(
      horarioModalRecurso.recursoId,
      horarioModalDia,
      horarioInicio,
      horarioFim,
      gravacaoId
    );

    if (!disponibilidade.disponivel) {
      toast({
        title: 'Horário indisponível',
        description: disponibilidade.motivo || 'O horário selecionado não está disponível.',
        variant: 'destructive',
      });
      return;
    }

    // Update local state
    const updated = recursos.map((r) => {
      if (r.id === horarioModalRecurso.id || r.recursoId === horarioModalRecurso.recursoId) {
        return {
          ...r,
          horarios: {
            ...r.horarios,
            [horarioModalDia]: {
              horaInicio: horarioInicio,
              horaFim: horarioFim,
            },
          },
        };
      }
      return r;
    });

    setRecursos(updated);

    // Sync with database
    const { data: existing } = await supabase
      .from('gravacao_recursos')
      .select('id')
      .eq('gravacao_id', gravacaoId)
      .eq('recurso_fisico_id', horarioModalRecurso.recursoId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('gravacao_recursos')
        .update({ hora_inicio: horarioInicio, hora_fim: horarioFim })
        .eq('id', existing.id);
    } else {
      await supabase.from('gravacao_recursos').insert({
        gravacao_id: gravacaoId,
        recurso_fisico_id: horarioModalRecurso.recursoId,
        hora_inicio: horarioInicio,
        hora_fim: horarioFim,
      });
    }

    setHorarioModalOpen(false);
  };

  const handleRemoveHorario = async () => {
    if (!horarioModalRecurso) return;

    // Update local state
    const updated = recursos.map((r) => {
      if (r.id === horarioModalRecurso.id || r.recursoId === horarioModalRecurso.recursoId) {
        const { [horarioModalDia]: _, ...restHorarios } = r.horarios;
        return {
          ...r,
          horarios: restHorarios,
        };
      }
      return r;
    });

    setRecursos(updated);

    // Remove from database
    await supabase
      .from('gravacao_recursos')
      .delete()
      .eq('gravacao_id', gravacaoId)
      .eq('recurso_fisico_id', horarioModalRecurso.recursoId);

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
    const recursoAtual = recursos.find((r) => r.id === rhModalRecurso.id || r.recursoId === rhModalRecurso.recursoId);
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
        (rh) => rh.funcao?.toLowerCase() === rhModalRecurso.funcaoOperador?.toLowerCase()
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
        (rh) => rh.funcao?.toLowerCase() === rhModalRecurso.funcaoOperador?.toLowerCase()
      );
    }

    return filtrados
      .filter((rh) => isColaboradorAusente(rh, rhModalDia))
      .map((rh) => ({
        ...rh,
        motivoAusencia: getMotivoAusencia(rh, rhModalDia),
      }));
  }, [recursosHumanos, rhModalRecurso?.funcaoOperador, rhModalDia]);

  const renderRecursosTable = (recursosLista: RecursoAlocado[], tipoLabel: string, tipoIcon: string, isTecnico: boolean) => {
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
                    className={`px-0.5 py-1 text-center font-medium w-10 ${d.isWeekend ? 'bg-weekend' : ''}`}
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
                      const qtdAlocada = recurso.alocacoes[d.dataKey] || 0;
                      const faltaColaborador = isTecnico && qtdAlocada > 0 && rhCount === 0;
                      const horario = getHorario(recurso, d.dataKey);
                      const faltaHorario = !isTecnico && qtdAlocada > 0 && !horario;
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
                                    <div className="w-8 h-6 flex items-center justify-center bg-destructive/20 rounded border border-destructive/30 cursor-not-allowed">
                                      <AlertTriangle className="w-3 h-3 text-destructive" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    <p className="font-medium text-destructive">Recurso indisponível</p>
                                    <p className="text-muted-foreground">Alocado em: {conflito}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <Input
                                type="number"
                                min="0"
                                className="w-8 h-6 text-center p-0 text-[10px]"
                                value={recurso.alocacoes[d.dataKey] || ''}
                                onChange={(e) =>
                                  handleAlocacaoChange(
                                    recurso.id,
                                    d.dataKey,
                                    parseInt(e.target.value) || 0
                                  )
                                }
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
                                        <p className="font-medium text-xs">{rhCount} colaborador(es):</p>
                                        <ul className="text-xs space-y-0.5">
                                          {rhList.map((rh) => (
                                            <li key={rh.id} className="text-muted-foreground">
                                              • {rh.nome} ({rh.horaInicio} - {rh.horaFim})
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : faltaColaborador ? (
                                      <p className="text-xs text-destructive font-medium">
                                        Atenção: recurso sem colaborador associado!
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
                                        <p className="font-medium text-xs">Horário de ocupação:</p>
                                        <p className="text-xs text-muted-foreground">
                                          {horario.horaInicio} - {horario.horaFim}
                                        </p>
                                      </div>
                                    ) : faltaHorario ? (
                                      <p className="text-xs text-destructive font-medium">
                                        Atenção: defina o horário de ocupação!
                                      </p>
                                    ) : (
                                      <p className="text-xs text-muted-foreground">
                                        Clique para definir horário
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
          <label className="text-sm text-muted-foreground">Mês/Ano</label>
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
          <Select value={selectedTipo} onValueChange={(v) => setSelectedTipo(v as 'tecnico' | 'fisico')}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tecnico">Técnico</SelectItem>
              <SelectItem value="fisico">Físico</SelectItem>
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
                    #{item.numerador} - {item.nome}{item.codigo ? ` (${item.codigo})` : ''}
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
          {renderRecursosTable(recursosTecnicosAlocados, 'Recursos Técnicos', '🔧', true)}
          {renderRecursosTable(recursosFisicosAlocados, 'Recursos Físicos', '🏢', false)}
        </div>
      )}

      {recursos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum recurso adicionado ainda.</p>
          <p className="text-sm">Adicione recursos técnicos ou físicos acima.</p>
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
              Data: {rhModalDia ? new Date(rhModalDia + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
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
                    <div key={rh.id} className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>• {rh.nome}</span>
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
                  Exibindo colaboradores com função: <strong>{rhModalRecurso.funcaoOperador}</strong>
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
                            ? 'Todos os colaboradores estão ausentes nesta data'
                            : `Nenhum colaborador encontrado${rhModalRecurso?.funcaoOperador ? ` com função "${rhModalRecurso.funcaoOperador}"` : ''}`}
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
                    <Label className="text-xs text-muted-foreground">Hora Início</Label>
                    <Input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Hora Fim</Label>
                    <Input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
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
                    <div key={rh.id} className="flex items-center justify-between p-2 border rounded-lg bg-background">
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
              Horário de Ocupação - {horarioModalRecurso?.recursoNome}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Data: {horarioModalDia ? new Date(horarioModalDia + 'T12:00:00').toLocaleDateString('pt-BR') : ''}
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
                      Períodos já ocupados
                    </Label>
                    <div className="space-y-1">
                      {horarioModalDisponibilidade.ocupacoes.map((oc, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate max-w-[150px]" title={oc.gravacaoNome}>
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
                <Label className="text-xs text-muted-foreground">Hora Início</Label>
                <Input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hora Fim</Label>
                <Input type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} />
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
              disabled={horarioModalDisponibilidade && !horarioModalDisponibilidade.disponibilidade.disponivel}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
