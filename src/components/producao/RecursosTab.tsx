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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Trash2, Users, X, Clock, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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

interface RecursoAlocado {
  id: string;
  tipo: 'tecnico' | 'fisico';
  recursoId: string;
  recursoNome: string;
  funcaoOperador?: string; // Função do operador (para recursos técnicos)
  alocacoes: Record<string, number>; // dia -> quantidade
  recursosHumanos: Record<string, RecursoHumanoAlocado[]>; // dia -> lista de recursos humanos (para técnicos)
  horarios: Record<string, HorarioOcupacao>; // dia -> horário de ocupação (para físicos)
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
  const [mesAno, setMesAno] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [recursos, setRecursos] = useState<RecursoAlocado[]>(() => {
    const stored = localStorage.getItem(`kreato_gravacao_recursos_${gravacaoId}`);
    const data = stored ? JSON.parse(stored) : [];
    return data.map((r: RecursoAlocado) => ({
      ...r,
      recursosHumanos: r.recursosHumanos || {},
      horarios: r.horarios || {},
    }));
  });

  const [recursosTecnicos, setRecursosTecnicos] = useState<{ id: string; nome: string; funcaoOperador?: string }[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<{ id: string; nome: string }[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<'tecnico' | 'fisico'>('tecnico');
  const [selectedRecurso, setSelectedRecurso] = useState('');

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

  useEffect(() => {
    const tecnicos = localStorage.getItem('kreato_recursos_tecnicos');
    const fisicos = localStorage.getItem('kreato_recursos_fisicos');
    const humanos = localStorage.getItem('kreato_recursos_humanos');
    setRecursosTecnicos(tecnicos ? JSON.parse(tecnicos) : []);
    setRecursosFisicos(fisicos ? JSON.parse(fisicos) : []);
    setRecursosHumanos(humanos ? JSON.parse(humanos) : []);
  }, []);

  const saveToStorage = (data: RecursoAlocado[]) => {
    localStorage.setItem(`kreato_gravacao_recursos_${gravacaoId}`, JSON.stringify(data));
    setRecursos(data);
  };

  // Verifica se um recurso está alocado em outra gravação na mesma data
  const getConflito = useCallback((recursoId: string, tipo: 'tecnico' | 'fisico', dia: string): { gravacaoNome: string } | null => {
    // Buscar todas as gravações
    const gravacoes = localStorage.getItem('kreato_gravacoes');
    const listaGravacoes = gravacoes ? JSON.parse(gravacoes) : [];
    
    // Buscar recursos de todas as outras gravações
    for (const gravacao of listaGravacoes) {
      if (gravacao.id === gravacaoId) continue; // Pular a gravação atual
      
      const recursosGravacao = localStorage.getItem(`kreato_gravacao_recursos_${gravacao.id}`);
      if (!recursosGravacao) continue;
      
      const recursos: RecursoAlocado[] = JSON.parse(recursosGravacao);
      const recursoConflitante = recursos.find(
        (r) => r.recursoId === recursoId && r.tipo === tipo
      );
      
      if (recursoConflitante) {
        // Verificar se está alocado neste dia
        const alocacao = recursoConflitante.alocacoes[dia];
        if (alocacao && alocacao > 0) {
          return { gravacaoNome: gravacao.nome || gravacao.codigo };
        }
      }
    }
    
    return null;
  }, [gravacaoId]);

  // Verifica conflitos para todas as datas de um recurso
  const getConflitosRecurso = useCallback((recursoId: string, tipo: 'tecnico' | 'fisico'): Record<string, string> => {
    const conflitos: Record<string, string> = {};
    const gravacoes = localStorage.getItem('kreato_gravacoes');
    const listaGravacoes = gravacoes ? JSON.parse(gravacoes) : [];
    
    for (const gravacao of listaGravacoes) {
      if (gravacao.id === gravacaoId) continue;
      
      const recursosGravacao = localStorage.getItem(`kreato_gravacao_recursos_${gravacao.id}`);
      if (!recursosGravacao) continue;
      
      const recursos: RecursoAlocado[] = JSON.parse(recursosGravacao);
      const recursoConflitante = recursos.find(
        (r) => r.recursoId === recursoId && r.tipo === tipo
      );
      
      if (recursoConflitante) {
        Object.entries(recursoConflitante.alocacoes).forEach(([dia, qtd]) => {
          if (qtd > 0) {
            conflitos[dia] = gravacao.nome || gravacao.codigo;
          }
        });
      }
    }
    
    return conflitos;
  }, [gravacaoId]);

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

  const handleAddRecurso = () => {
    if (!selectedRecurso) return;
    
    const lista = selectedTipo === 'tecnico' ? recursosTecnicos : recursosFisicos;
    const recurso = lista.find((r) => r.id === selectedRecurso);
    if (!recurso) return;

    const exists = recursos.find((r) => r.recursoId === selectedRecurso && r.tipo === selectedTipo);
    if (exists) return;

    const novoRecurso: RecursoAlocado = {
      id: crypto.randomUUID(),
      tipo: selectedTipo,
      recursoId: selectedRecurso,
      recursoNome: recurso.nome,
      funcaoOperador: selectedTipo === 'tecnico' ? (recurso as { id: string; nome: string; funcaoOperador?: string }).funcaoOperador : undefined,
      alocacoes: {},
      recursosHumanos: {},
      horarios: {},
    };

    saveToStorage([...recursos, novoRecurso]);
    setSelectedRecurso('');
  };

  const handleRemoveRecurso = (id: string) => {
    saveToStorage(recursos.filter((r) => r.id !== id));
  };

  const handleAlocacaoChange = (recursoId: string, dia: string, valor: number) => {
    // Encontrar o recurso atual
    const recursoAtual = recursos.find((r) => r.id === recursoId);
    if (!recursoAtual) return;

    // Se está tentando alocar (valor > 0), verificar conflito
    if (valor > 0) {
      const conflito = getConflito(recursoAtual.recursoId, recursoAtual.tipo, dia);
      if (conflito) {
        toast({
          title: 'Conflito de alocação',
          description: `Este recurso já está alocado para a gravação "${conflito.gravacaoNome}" nesta data.`,
          variant: 'destructive',
        });
        return; // Não permite a alocação
      }
    }

    const updated = recursos.map((r) => {
      if (r.id === recursoId) {
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
    saveToStorage(updated);
  };

  const openRHModal = (recurso: RecursoAlocado, dia: string) => {
    setRhModalRecurso(recurso);
    setRhModalDia(dia);
    setSelectedRH('');
    setHoraInicio('08:00');
    setHoraFim('18:00');
    setRhModalOpen(true);
  };

  // Função para criar tarefa automática
  const createTaskForRH = (rhId: string, rhNome: string, recursoTecnicoId: string, recursoTecnicoNome: string, dia: string) => {
    // Buscar informações da gravação
    const gravacoes = localStorage.getItem('kreato_gravacoes');
    const listaGravacoes = gravacoes ? JSON.parse(gravacoes) : [];
    const gravacao = listaGravacoes.find((g: any) => g.id === gravacaoId);
    
    // Buscar status de tarefa padrão (Pendente)
    const statusList = localStorage.getItem('kreato_status_tarefa');
    const statuses = statusList ? JSON.parse(statusList) : [];
    const statusPendente = statuses.find((s: any) => s.codigo === 'PEND') || statuses[0];
    
    // Buscar tarefas existentes
    const tarefasStorage = localStorage.getItem('kreato_tarefas');
    const tarefas = tarefasStorage ? JSON.parse(tarefasStorage) : [];
    
    // Verificar se já existe uma tarefa para este colaborador, recurso técnico, gravação e DATA
    const tarefaExistente = tarefas.find((t: any) => 
      t.gravacaoId === gravacaoId && 
      t.recursoHumanoId === rhId && 
      t.recursoTecnicoId === recursoTecnicoId &&
      t.dataInicio === dia
    );
    
    if (tarefaExistente) return; // Já existe tarefa para esta data
    
    // Criar nova tarefa
    const novaTarefa = {
      id: crypto.randomUUID(),
      gravacaoId: gravacaoId,
      gravacaoNome: gravacao?.nome || gravacao?.codigo || '',
      recursoHumanoId: rhId,
      recursoHumanoNome: rhNome,
      recursoTecnicoId: recursoTecnicoId,
      recursoTecnicoNome: recursoTecnicoNome,
      titulo: `Operação: ${recursoTecnicoNome}`,
      descricao: `Tarefa automática criada para operação do recurso técnico "${recursoTecnicoNome}" na gravação "${gravacao?.nome || gravacao?.codigo || ''}"`,
      statusId: statusPendente?.id || '',
      statusNome: statusPendente?.nome || 'Pendente',
      statusCor: statusPendente?.cor || '#f59e0b',
      prioridade: 'media' as const,
      dataInicio: dia,
      dataFim: dia,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
      observacoes: '',
    };
    
    localStorage.setItem('kreato_tarefas', JSON.stringify([...tarefas, novaTarefa]));
    window.dispatchEvent(new CustomEvent('kreato:tarefas-updated'));
  };

  // Função para remover tarefa automática
  const removeTaskForRH = (rhId: string, recursoTecnicoId: string) => {
    const tarefasStorage = localStorage.getItem('kreato_tarefas');
    const tarefas = tarefasStorage ? JSON.parse(tarefasStorage) : [];
    
    // Remover tarefa associada a este colaborador e recurso técnico nesta gravação
    const tarefasAtualizadas = tarefas.filter((t: any) => 
      !(t.gravacaoId === gravacaoId && 
        t.recursoHumanoId === rhId && 
        t.recursoTecnicoId === recursoTecnicoId)
    );
    
    localStorage.setItem('kreato_tarefas', JSON.stringify(tarefasAtualizadas));
    window.dispatchEvent(new CustomEvent('kreato:tarefas-updated'));
  };

  const handleAddRH = () => {
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

    saveToStorage(updated);
    
    // Criar tarefa automática para o colaborador
    createTaskForRH(
      selectedRH, 
      rh.nome, 
      rhModalRecurso.recursoId, 
      rhModalRecurso.recursoNome, 
      rhModalDia
    );
    
    toast({
      title: 'Colaborador alocado',
      description: `${rh.nome} foi alocado e uma tarefa foi criada automaticamente.`,
    });
    
    setSelectedRH('');
    setHoraInicio('08:00');
    setHoraFim('18:00');
  };

  const handleRemoveRH = (recursoId: string, dia: string, rhId: string) => {
    // Encontrar o recurso e o RH para obter informações antes de remover
    const recurso = recursos.find((r) => r.id === recursoId);
    const rhInfo = recurso?.recursosHumanos[dia]?.find((rh) => rh.id === rhId);
    
    const updated = recursos.map((r) => {
      if (r.id === recursoId) {
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
    saveToStorage(updated);
    
    // Remover tarefa automática se o colaborador não estiver mais alocado a este recurso
    if (rhInfo && recurso) {
      // Verificar se o colaborador ainda está alocado em outros dias para este recurso
      const aindaAlocado = updated.some((r) => {
        if (r.id !== recursoId) return false;
        return Object.values(r.recursosHumanos).some(rhList => 
          rhList.some(rh => rh.recursoHumanoId === rhInfo.recursoHumanoId)
        );
      });
      
      if (!aindaAlocado) {
        removeTaskForRH(rhInfo.recursoHumanoId, recurso.recursoId);
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

  // Funções para horário de ocupação (recursos físicos)
  const openHorarioModal = (recurso: RecursoAlocado, dia: string) => {
    setHorarioModalRecurso(recurso);
    setHorarioModalDia(dia);
    const horarioExistente = recurso.horarios[dia];
    setHorarioInicio(horarioExistente?.horaInicio || '08:00');
    setHorarioFim(horarioExistente?.horaFim || '18:00');
    setHorarioModalOpen(true);
  };

  const handleSaveHorario = () => {
    if (!horarioModalRecurso) return;

    const updated = recursos.map((r) => {
      if (r.id === horarioModalRecurso.id) {
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

    saveToStorage(updated);
    setHorarioModalOpen(false);
  };

  const handleRemoveHorario = () => {
    if (!horarioModalRecurso) return;

    const updated = recursos.map((r) => {
      if (r.id === horarioModalRecurso.id) {
        const { [horarioModalDia]: _, ...restHorarios } = r.horarios;
        return {
          ...r,
          horarios: restHorarios,
        };
      }
      return r;
    });

    saveToStorage(updated);
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

  // Agrupar recursos por tipo
  const recursosTecnicosAlocados = recursos.filter((r) => r.tipo === 'tecnico');
  const recursosFisicosAlocados = recursos.filter((r) => r.tipo === 'fisico');

  // Buscar diretamente do estado atual para refletir mudanças imediatas
  const rhAlocadosNoDia = useMemo(() => {
    if (!rhModalRecurso || !rhModalDia) return [];
    const recursoAtual = recursos.find((r) => r.id === rhModalRecurso.id);
    return recursoAtual?.recursosHumanos[rhModalDia] || [];
  }, [recursos, rhModalRecurso, rhModalDia]);

  // Verificar se um colaborador está ausente em uma data específica
  const isColaboradorAusente = (rh: RecursoHumano, dataStr: string): boolean => {
    if (!rh.ausencias || rh.ausencias.length === 0) return false;
    
    const data = parseISO(dataStr);
    return rh.ausencias.some((ausencia) => {
      const inicio = parseISO(ausencia.dataInicio);
      const fim = parseISO(ausencia.dataFim);
      return isWithinInterval(data, { start: inicio, end: fim });
    });
  };

  // Obter motivo da ausência para uma data
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

  // Filtrar recursos humanos pela função do recurso técnico E disponibilidade
  const recursosHumanosFiltrados = useMemo(() => {
    let filtrados = recursosHumanos;
    
    // Filtrar por função se definida
    if (rhModalRecurso?.funcaoOperador) {
      filtrados = filtrados.filter(
        (rh) => rh.funcao?.toLowerCase() === rhModalRecurso.funcaoOperador?.toLowerCase()
      );
    }
    
    // Filtrar colaboradores ausentes no dia selecionado
    if (rhModalDia) {
      filtrados = filtrados.filter((rh) => !isColaboradorAusente(rh, rhModalDia));
    }
    
    return filtrados;
  }, [recursosHumanos, rhModalRecurso?.funcaoOperador, rhModalDia]);

  // Colaboradores ausentes no dia (para mostrar informação)
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
                // Obter conflitos para este recurso
                const conflitos = getConflitosRecurso(recurso.recursoId, recurso.tipo);
                
                return (
                <tr key={recurso.id} className="border-b">
                  <td className="px-1.5 py-0.5 sticky left-0 bg-card font-medium text-xs whitespace-nowrap">
                    {recurso.recursoNome}
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
                          {/* Ícone de colaborador para recursos TÉCNICOS */}
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
                          {/* Ícone de horário para recursos FÍSICOS */}
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
              )})}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
                <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

      {/* Modal para gerenciar recursos humanos */}
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
            {/* Aviso de colaboradores ausentes */}
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

            {/* Formulário para adicionar */}
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
                            : `Nenhum colaborador encontrado${rhModalRecurso?.funcaoOperador ? ` com função "${rhModalRecurso.funcaoOperador}"` : ''}`
                          }
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

            {/* Lista de recursos humanos alocados */}
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

      {/* Modal para definir horário de ocupação (recursos físicos) */}
      <Dialog open={horarioModalOpen} onOpenChange={setHorarioModalOpen}>
        <DialogContent className="sm:max-w-sm">
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hora Início</Label>
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
            <Button onClick={handleSaveHorario}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
