import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Filter, MapPin, Users, CalendarDays, CalendarRange, FileDown, Loader2, Clock, Film, User, DollarSign, Building2, Briefcase, Wrench, MapPinIcon } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, getDay, parseISO, getMonth, getYear, isSameDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { useWeatherForecast } from '@/hooks/useWeatherForecast';
import { useRecursoFisicoDisponibilidade } from '@/hooks/useRecursoFisicoDisponibilidade';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencies';

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
  tipo: 'tecnico' | 'fisico' | 'humano';
  recursoId?: string;
  recursoHumanoId?: string;
  horaInicio?: string;
  horaFim?: string;
  recursoNome?: string;
  alocacoes: Record<string, number>;
  recursosHumanos?: Record<string, RecursoHumanoAlocado[]>;
  horarios?: Record<string, HorarioOcupacao>;
}

interface Gravacao {
  id: string;
  nome: string;
  codigoExterno: string;
  centroLucro?: string;
  unidadeNegocio?: string;
  dataPrevista?: string;
}

interface RecursoFisico {
  id: string;
  nome: string;
  tipo?: string;
}

interface RecursoHumano {
  id: string;
  nome: string;
  funcao?: string;
}

interface OcupacaoItem {
  gravacao: string;
  gravacaoId: string;
  horario: string;
  horaInicio?: string;
  horaFim?: string;
  duracaoMinutos?: number;
  recursoHumanoId?: string;
  statusCor?: string;
}

interface Tarefa {
  id: string;
  gravacaoId: string;
  recursoHumanoId: string;
  recursoTecnicoId?: string;
  statusId: string;
  statusCor?: string;
  dataInicio?: string;
  dataFim?: string;
}

interface CentroLucro {
  id: string;
  nome: string;
  unidadeId?: string;
}

interface UnidadeNegocio {
  id: string;
  nome: string;
  moeda?: string;
}

const Mapas = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [filtroTipoFisico, setFiltroTipoFisico] = useState('Todos');
  const [filtroNomeFisico, setFiltroNomeFisico] = useState('');
  const [filtroFuncaoHumano, setFiltroFuncaoHumano] = useState('Todas');
  const [filtroNomeHumano, setFiltroNomeHumano] = useState('');
  const [filtroGravacao, setFiltroGravacao] = useState('Todas');
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('fisicos');
  
  // Weather forecast hook
  const { getWeatherForDate, loading: weatherLoading } = useWeatherForecast(16);
  
  // Hook de disponibilidade de recursos físicos
  const { getFaixasDisponiveis } = useRecursoFisicoDisponibilidade();
  
  // Helper para verificar se dia está dentro do range de previsão (próximos 15 dias)
  const isWithinForecastRange = (dia: Date): boolean => {
    const today = new Date();
    const maxDate = addDays(today, 15);
    return dia >= today && dia <= maxDate;
  };
  // Filtros para apropriação de custos
  const [filtroCentroLucro, setFiltroCentroLucro] = useState('Todos');
  const [filtroUnidadeNegocio, setFiltroUnidadeNegocio] = useState('Todas');
  
  // Estado para controlar expansão das linhas de Centro de Lucro
  const [expandedCentrosLucro, setExpandedCentrosLucro] = useState<Set<string>>(new Set());
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());

  // Refs para exportação PDF
  const fisicosRef = useRef<HTMLDivElement>(null);
  const humanosRef = useRef<HTMLDivElement>(null);

  // Carregar dados do localStorage
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<RecursoFisico[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([]);
  const [alocacoesPorGravacao, setAlocacoesPorGravacao] = useState<Record<string, RecursoAlocado[]>>({});
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [centrosLucro, setCentrosLucro] = useState<CentroLucro[]>([]);
  const [unidadesNegocio, setUnidadesNegocio] = useState<UnidadeNegocio[]>([]);

  // Função para calcular horas entre horários
  const calcularHorasEntreTempo = (inicio: string, fim: string): number => {
    if (!inicio || !fim) return 0;
    const [horaInicio, minInicio] = inicio.split(':').map(Number);
    const [horaFim, minFim] = fim.split(':').map(Number);
    const totalMinutosInicio = horaInicio * 60 + minInicio;
    const totalMinutosFim = horaFim * 60 + minFim;
    const diferencaMinutos = totalMinutosFim - totalMinutosInicio;
    return diferencaMinutos > 0 ? diferencaMinutos / 60 : 0;
  };

  // Armazenar dados de recursos para cálculo de custos
  const [recursosHumanosCadastro, setRecursosHumanosCadastro] = useState<any[]>([]);
  const [recursosFisicosCadastro, setRecursosFisicosCadastro] = useState<any[]>([]);
  const [gravacaoRecursos, setGravacaoRecursos] = useState<Record<string, any[]>>({});
  const [gravacaoTerceiros, setGravacaoTerceiros] = useState<Record<string, any[]>>({});

  // Função para calcular custo total de uma gravação
  const calcularCustoGravacao = (gravacaoId: string): number => {
    let custoTotal = 0;
    
    const recursos = gravacaoRecursos[gravacaoId] || [];
    const rhProcessados = new Set<string>();
    
    recursos.forEach((recurso: any) => {
      if (recurso.tipo === 'fisico') {
        const recursoFisico = recursosFisicosCadastro.find((rf: any) => rf.id === recurso.recursoId);
        const custoHora = parseFloat(recursoFisico?.custoHora || 0);
        
        let totalHoras = 0;
        Object.entries(recurso.horarios || {}).forEach(([, horario]: [string, any]) => {
          const horas = calcularHorasEntreTempo(horario.horaInicio, horario.horaFim);
          if (horas > 0) totalHoras += horas;
        });
        
        custoTotal += totalHoras * custoHora;
      } else if (recurso.tipo === 'tecnico') {
        // Recursos humanos vinculados a recursos técnicos
        Object.entries(recurso.recursosHumanos || {}).forEach(([, rhList]: [string, any]) => {
          if (Array.isArray(rhList)) {
            rhList.forEach((rh: any) => {
              const rhKey = `${rh.recursoHumanoId}_${recurso.recursoId}_${rh.horaInicio}_${rh.horaFim}`;
              if (!rhProcessados.has(rhKey)) {
                rhProcessados.add(rhKey);
                const horas = calcularHorasEntreTempo(rh.horaInicio, rh.horaFim);
                const colaborador = recursosHumanosCadastro.find((r: any) => r.id === rh.recursoHumanoId);
                const custoHora = parseFloat(colaborador?.custoHora || 0);
                custoTotal += horas * custoHora;
              }
            });
          }
        });
      } else if (recurso.tipo === 'humano' && recurso.recursoHumanoId) {
        // Recursos humanos diretos
        const rhKey = `${recurso.recursoHumanoId}_direct_${recurso.horaInicio}_${recurso.horaFim}`;
        if (!rhProcessados.has(rhKey)) {
          rhProcessados.add(rhKey);
          const horas = calcularHorasEntreTempo(recurso.horaInicio, recurso.horaFim);
          const colaborador = recursosHumanosCadastro.find((r: any) => r.id === recurso.recursoHumanoId);
          const custoHora = parseFloat(colaborador?.custoHora || 0);
          custoTotal += horas * custoHora;
        }
      }
    });
    
    const terceiros = gravacaoTerceiros[gravacaoId] || [];
    terceiros.forEach((terceiro: any) => {
      custoTotal += parseFloat(terceiro.valor || 0);
    });
    
    return custoTotal;
  };

  // Função para recarregar dados do Supabase
  const recarregarDados = useCallback(async () => {
    try {
      // Carregar gravações
      const { data: gravData } = await supabase
        .from('gravacoes')
        .select('id, nome, codigo_externo, centro_lucro_id, unidade_negocio_id, data_prevista')
        .order('nome');
      
      const gravacoesList: Gravacao[] = (gravData || []).map((g: any) => ({
        id: g.id,
        nome: g.nome,
        codigoExterno: g.codigo_externo || '',
        centroLucro: g.centro_lucro_id || '',
        unidadeNegocio: g.unidade_negocio_id || '',
        dataPrevista: g.data_prevista || '',
      }));
      setGravacoes(gravacoesList);

      // Carregar recursos físicos
      const { data: fisicosData } = await supabase
        .from('recursos_fisicos')
        .select('id, nome, custo_hora')
        .order('nome');
      setRecursosFisicos((fisicosData || []).map((rf: any) => ({ id: rf.id, nome: rf.nome })));
      setRecursosFisicosCadastro((fisicosData || []).map((rf: any) => ({ id: rf.id, nome: rf.nome, custoHora: rf.custo_hora })));

      // Carregar recursos humanos
      const { data: humanosData } = await supabase
        .from('recursos_humanos')
        .select('id, nome, sobrenome, custo_hora, funcao_id, funcoes:funcao_id(nome)')
        .order('nome');
      setRecursosHumanos((humanosData || []).map((rh: any) => ({ 
        id: rh.id, 
        nome: `${rh.nome} ${rh.sobrenome}`,
        funcao: rh.funcoes?.nome || '',
      })));
      setRecursosHumanosCadastro((humanosData || []).map((rh: any) => ({ 
        id: rh.id, 
        nome: `${rh.nome} ${rh.sobrenome}`, 
        custoHora: rh.custo_hora,
        funcao: rh.funcoes?.nome || 'Sem função',
      })));

      // Carregar tarefas
      const { data: tarefasData } = await supabase
        .from('tarefas')
        .select('id, gravacao_id, recurso_humano_id, recurso_tecnico_id, status_id, data_inicio, data_fim, status_tarefa:status_id(cor)');
      setTarefas((tarefasData || []).map((t: any) => ({
        id: t.id,
        gravacaoId: t.gravacao_id,
        recursoHumanoId: t.recurso_humano_id,
        recursoTecnicoId: t.recurso_tecnico_id,
        statusId: t.status_id,
        dataInicio: t.data_inicio,
        dataFim: t.data_fim,
        statusCor: t.status_tarefa?.cor,
      })));
      
      // Carregar centros de lucro
      const { data: centrosData } = await supabase
        .from('centros_lucro')
        .select('id, nome')
        .order('nome');
      setCentrosLucro(centrosData || []);
      
      // Carregar unidades de negócio com moeda
      const { data: unidadesData } = await supabase
        .from('unidades_negocio')
        .select('id, nome, moeda')
        .order('nome');
      setUnidadesNegocio((unidadesData || []).map((u: any) => ({ id: u.id, nome: u.nome, moeda: u.moeda || 'BRL' })));

      // Carregar alocações de cada gravação
      const alocacoes: Record<string, RecursoAlocado[]> = {};
      const recursosMap: Record<string, any[]> = {};
      const terceirosMap: Record<string, any[]> = {};
      
      for (const g of gravacoesList) {
        const { data: recursosData } = await supabase
          .from('gravacao_recursos')
          .select('*')
          .eq('gravacao_id', g.id);
        
        if (recursosData && recursosData.length > 0) {
          // Group resources by type
          const fisicosSet = new Map<string, any>();
          const tecnicosSet = new Map<string, any>();
          const humanosDirectos: any[] = [];
          
          recursosData.forEach((r: any) => {
            const dataAlocacao = g.dataPrevista || '';
            
            if (r.recurso_fisico_id) {
              // Recurso físico
              const existing = fisicosSet.get(r.recurso_fisico_id);
              if (!existing) {
                fisicosSet.set(r.recurso_fisico_id, {
                  id: r.id,
                  tipo: 'fisico',
                  recursoId: r.recurso_fisico_id,
                  recursoNome: '',
                  alocacoes: { [dataAlocacao]: 1 },
                  recursosHumanos: {},
                  horarios: r.hora_inicio && r.hora_fim ? { [dataAlocacao]: { horaInicio: r.hora_inicio, horaFim: r.hora_fim } } : {},
                });
              }
            } else if (r.recurso_tecnico_id) {
              // Recurso técnico - pode ter ou não recurso humano associado
              const existingTec = tecnicosSet.get(r.recurso_tecnico_id);
              if (!existingTec) {
                tecnicosSet.set(r.recurso_tecnico_id, {
                  id: r.id,
                  tipo: 'tecnico',
                  recursoId: r.recurso_tecnico_id,
                  recursoNome: '',
                  alocacoes: { [dataAlocacao]: 1 },
                  recursosHumanos: { [dataAlocacao]: [] },
                  horarios: r.hora_inicio && r.hora_fim ? { [dataAlocacao]: { horaInicio: r.hora_inicio, horaFim: r.hora_fim } } : {},
                });
              }
              
              // Se tem recurso humano, adicionar à lista de RH desse recurso técnico
              if (r.recurso_humano_id) {
                const tec = tecnicosSet.get(r.recurso_tecnico_id);
                if (tec) {
                  if (!tec.recursosHumanos[dataAlocacao]) {
                    tec.recursosHumanos[dataAlocacao] = [];
                  }
                  tec.recursosHumanos[dataAlocacao].push({
                    recursoHumanoId: r.recurso_humano_id,
                    horaInicio: r.hora_inicio,
                    horaFim: r.hora_fim,
                  });
                }
              }
            } else if (r.recurso_humano_id) {
              // Recurso humano direto (sem recurso técnico)
              humanosDirectos.push({
                id: r.id,
                tipo: 'humano',
                recursoHumanoId: r.recurso_humano_id,
                horaInicio: r.hora_inicio,
                horaFim: r.hora_fim,
                alocacoes: { [dataAlocacao]: 1 },
              });
            }
          });
          
          const transformed: RecursoAlocado[] = [
            ...Array.from(fisicosSet.values()),
            ...Array.from(tecnicosSet.values()),
            ...humanosDirectos,
          ];
          
          alocacoes[g.id] = transformed;
          recursosMap[g.id] = transformed;
        }

        const { data: terceirosData } = await supabase
          .from('gravacao_terceiros')
          .select('*')
          .eq('gravacao_id', g.id);
        
        if (terceirosData) {
          terceirosMap[g.id] = terceirosData;
        }
      }
      
      setAlocacoesPorGravacao(alocacoes);
      setGravacaoRecursos(recursosMap);
      setGravacaoTerceiros(terceirosMap);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }, []);

  // Carregar dados inicialmente e quando a aba mudar
  useEffect(() => {
    recarregarDados();
  }, [activeTab, recarregarDados]);

  // Também recarregar quando o componente ganhar foco
  useEffect(() => {
    const handleFocus = () => recarregarDados();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [recarregarDados]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // Dias do mês
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Dias a exibir baseado no modo de visualização
  const displayDays = viewMode === 'week' ? weekDays : monthDays;

  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handlePrev = () => {
    if (viewMode === 'week') {
      handlePrevWeek();
    } else {
      handlePrevMonth();
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      handleNextWeek();
    } else {
      handleNextMonth();
    }
  };

  // Calcular ocupações de recursos físicos baseado nas alocações do state
  const ocupacoesFisicas = useMemo(() => {
    const ocupacoes: Record<string, Record<string, OcupacaoItem[]>> = {};
    
    // Usar dados do state ao invés de localStorage
    gravacoes.forEach((gravacao) => {
      const recursos = alocacoesPorGravacao[gravacao.id] || [];
      
      recursos
        .filter((r) => r.tipo === 'fisico')
        .forEach((recurso) => {
          if (!ocupacoes[recurso.recursoId]) {
            ocupacoes[recurso.recursoId] = {};
          }

          Object.entries(recurso.alocacoes).forEach(([dia, qtd]) => {
            if (qtd > 0) {
              const horario = recurso.horarios[dia];
              const horarioStr = horario
                ? `${horario.horaInicio} - ${horario.horaFim}`
                : 'Horário não definido';

              // Calcular duração em minutos
              let duracaoMinutos = 0;
              if (horario) {
                const [horaIni, minIni] = horario.horaInicio.split(':').map(Number);
                const [horaFim, minFim] = horario.horaFim.split(':').map(Number);
                duracaoMinutos = (horaFim * 60 + minFim) - (horaIni * 60 + minIni);
              }

              if (!ocupacoes[recurso.recursoId][dia]) {
                ocupacoes[recurso.recursoId][dia] = [];
              }

              ocupacoes[recurso.recursoId][dia].push({
                gravacao: gravacao.nome,
                gravacaoId: gravacao.id,
                horario: horarioStr,
                horaInicio: horario?.horaInicio,
                horaFim: horario?.horaFim,
                duracaoMinutos,
              });
            }
          });
        });
    });

    return ocupacoes;
  }, [alocacoesPorGravacao, gravacoes]);

  // Calcular ocupações de recursos humanos baseado nas tarefas
  // Buscar horários reais dos colaboradores alocados (gravacao_recursos)
  const [rhHorariosAlocados, setRhHorariosAlocados] = useState<Record<string, Record<string, { horaInicio: string; horaFim: string }>>>({});
  const [rhEscalas, setRhEscalas] = useState<Record<string, any[]>>({});

  // Buscar horários de alocação e escalas dos RH
  useEffect(() => {
    const fetchRhData = async () => {
      // Buscar todas as alocações de RH com horários
      const { data: alocacoesData } = await supabase
        .from('gravacao_recursos')
        .select('gravacao_id, recurso_humano_id, hora_inicio, hora_fim')
        .not('recurso_humano_id', 'is', null);

      const horariosMap: Record<string, Record<string, { horaInicio: string; horaFim: string }>> = {};
      (alocacoesData || []).forEach((aloc: any) => {
        if (!aloc.recurso_humano_id || !aloc.hora_inicio || !aloc.hora_fim) return;
        
        // Buscar a data da gravação
        const gravacao = gravacoes.find(g => g.id === aloc.gravacao_id);
        if (!gravacao?.dataPrevista) return;
        
        const key = `${aloc.recurso_humano_id}_${gravacao.dataPrevista}_${aloc.gravacao_id}`;
        horariosMap[aloc.recurso_humano_id] = horariosMap[aloc.recurso_humano_id] || {};
        horariosMap[aloc.recurso_humano_id][key] = {
          horaInicio: aloc.hora_inicio?.substring(0, 5) || '08:00',
          horaFim: aloc.hora_fim?.substring(0, 5) || '18:00',
        };
      });
      setRhHorariosAlocados(horariosMap);

      // Buscar escalas de todos os RH
      const rhIds = recursosHumanos.map(rh => rh.id);
      if (rhIds.length > 0) {
        const { data: escalasData } = await supabase
          .from('rh_escalas')
          .select('*')
          .in('recurso_humano_id', rhIds);
        
        const escalasMap: Record<string, any[]> = {};
        (escalasData || []).forEach((escala: any) => {
          if (!escalasMap[escala.recurso_humano_id]) {
            escalasMap[escala.recurso_humano_id] = [];
          }
          escalasMap[escala.recurso_humano_id].push(escala);
        });
        setRhEscalas(escalasMap);
      }
    };
    
    if (gravacoes.length > 0 && recursosHumanos.length > 0) {
      fetchRhData();
    }
  }, [gravacoes, recursosHumanos]);

  // Função para obter escala do colaborador em um dia específico
  const getEscalaParaDia = (rhId: string, dia: string): { horaInicio: string; horaFim: string; totalMinutos: number } | null => {
    const escalas = rhEscalas[rhId] || [];
    if (escalas.length === 0) return null;

    const dataObj = parseISO(dia);
    const diaSemana = dataObj.getDay();

    for (const escala of escalas) {
      const dataInicio = parseISO(escala.data_inicio);
      const dataFim = parseISO(escala.data_fim);
      
      if (isWithinInterval(dataObj, { start: dataInicio, end: dataFim })) {
        const diasSemana = escala.dias_semana || [1, 2, 3, 4, 5];
        if (diasSemana.includes(diaSemana)) {
          const horaInicio = escala.hora_inicio?.substring(0, 5) || '08:00';
          const horaFim = escala.hora_fim?.substring(0, 5) || '18:00';
          
          const [hi, mi] = horaInicio.split(':').map(Number);
          const [hf, mf] = horaFim.split(':').map(Number);
          const totalMinutos = (hf * 60 + mf) - (hi * 60 + mi);
          
          return { horaInicio, horaFim, totalMinutos };
        }
      }
    }
    return null;
  };

  const ocupacoesHumanas = useMemo(() => {
    const ocupacoes: Record<string, Record<string, OcupacaoItem[]>> = {};

    // As ocupações de RH vêm das tarefas que têm recurso_humano_id
    tarefas.forEach((tarefa) => {
      if (!tarefa.recursoHumanoId || !tarefa.dataInicio) return;

      const gravacao = gravacoes.find((g) => g.id === tarefa.gravacaoId);
      if (!gravacao) return;

      const dia = tarefa.dataInicio;

      if (!ocupacoes[tarefa.recursoHumanoId]) {
        ocupacoes[tarefa.recursoHumanoId] = {};
      }

      if (!ocupacoes[tarefa.recursoHumanoId][dia]) {
        ocupacoes[tarefa.recursoHumanoId][dia] = [];
      }

      // Evitar duplicatas
      const jaExiste = ocupacoes[tarefa.recursoHumanoId][dia].some(
        (oc) => oc.gravacaoId === gravacao.id && oc.recursoHumanoId === tarefa.recursoHumanoId
      );

      if (!jaExiste) {
        // Buscar horário real da alocação
        const key = `${tarefa.recursoHumanoId}_${dia}_${gravacao.id}`;
        const horarioAlocado = rhHorariosAlocados[tarefa.recursoHumanoId]?.[key];
        
        let horarioStr = 'Conforme escala';
        let duracaoMinutos = 0;
        
        if (horarioAlocado) {
          horarioStr = `${horarioAlocado.horaInicio} - ${horarioAlocado.horaFim}`;
          const [hi, mi] = horarioAlocado.horaInicio.split(':').map(Number);
          const [hf, mf] = horarioAlocado.horaFim.split(':').map(Number);
          duracaoMinutos = (hf * 60 + mf) - (hi * 60 + mi);
        }

        ocupacoes[tarefa.recursoHumanoId][dia].push({
          gravacao: gravacao.nome,
          gravacaoId: gravacao.id,
          horario: horarioStr,
          horaInicio: horarioAlocado?.horaInicio,
          horaFim: horarioAlocado?.horaFim,
          duracaoMinutos,
          recursoHumanoId: tarefa.recursoHumanoId,
          statusCor: tarefa.statusCor,
        });
      }
    });

    return ocupacoes;
  }, [gravacoes, tarefas, rhHorariosAlocados]);

  // Obter tipos únicos de recursos físicos
  const tiposRecursoFisico = useMemo(() => {
    const tipos = new Set<string>();
    tipos.add('Todos');
    recursosFisicos.forEach((r) => {
      if (r.tipo) tipos.add(r.tipo);
    });
    return Array.from(tipos);
  }, [recursosFisicos]);

  // Obter funções únicas de recursos humanos
  const funcoesRecursoHumano = useMemo(() => {
    const funcoes = new Set<string>();
    funcoes.add('Todas');
    recursosHumanos.forEach((r) => {
      if (r.funcao) funcoes.add(r.funcao);
    });
    return Array.from(funcoes);
  }, [recursosHumanos]);

  // Anos disponíveis para filtro de apropriação de custos
  const anosDisponiveis = useMemo(() => {
    const anos = new Set<number>();
    gravacoes.forEach((g) => {
      if (g.dataPrevista) {
        try {
          const parsed = parseISO(g.dataPrevista);
          if (!isNaN(parsed.getTime())) {
            anos.add(getYear(parsed));
          }
        } catch {
          // Ignora datas inválidas
        }
      }
    });
    if (anos.size === 0) {
      anos.add(new Date().getFullYear());
    }
    return Array.from(anos).sort((a, b) => b - a);
  }, [gravacoes]);

  // Interface para detalhes de recurso no breakdown
  interface RecursoDetalhe {
    nome: string;
    tipo: 'humano' | 'fisico' | 'terceiro';
    custosMensais: number[];
    total: number;
  }

  // Dados de apropriação de custos por Centro de Lucro com breakdown de recursos
  const apropriacaoPorCentroLucro = useMemo(() => {
    const anoSelecionado = parseInt(filtroAno);
    const resultado: Record<string, { 
      nome: string; 
      custosMensais: number[]; 
      total: number;
      detalhes: RecursoDetalhe[];
    }> = {};
    
    gravacoes.forEach((gravacao) => {
      if (!gravacao.dataPrevista || !gravacao.centroLucro) return;
      
      // Filtrar por unidade de negócio se selecionada
      if (filtroUnidadeNegocio !== 'Todas' && gravacao.unidadeNegocio !== filtroUnidadeNegocio) return;
      
      try {
        const data = parseISO(gravacao.dataPrevista);
        if (isNaN(data.getTime()) || getYear(data) !== anoSelecionado) return;
        
        const mesIndex = getMonth(data);
        
        // Buscar o nome do centro de lucro pelo ID
        const centroLucroObj = centrosLucro.find(c => c.id === gravacao.centroLucro);
        const centroLucroNome = centroLucroObj?.nome || gravacao.centroLucro;
        
        if (!resultado[gravacao.centroLucro]) {
          resultado[gravacao.centroLucro] = {
            nome: centroLucroNome,
            custosMensais: Array(12).fill(0),
            total: 0,
            detalhes: [],
          };
        }
        
        // Calcular custos detalhados por recurso
        const recursos = gravacaoRecursos[gravacao.id] || [];
        const rhProcessados = new Set<string>();
        
        recursos.forEach((recurso: any) => {
          if (recurso.tipo === 'fisico') {
            const recursoFisico = recursosFisicosCadastro.find((rf: any) => rf.id === recurso.recursoId);
            const custoHora = parseFloat(recursoFisico?.custoHora || 0);
            const nomeRecurso = recursoFisico?.nome || 'Recurso Físico';
            
            let totalHoras = 0;
            Object.entries(recurso.horarios || {}).forEach(([, horario]: [string, any]) => {
              const horas = calcularHorasEntreTempo(horario.horaInicio, horario.horaFim);
              if (horas > 0) totalHoras += horas;
            });
            
            const custoRecurso = totalHoras * custoHora;
            if (custoRecurso > 0) {
              // Verificar se já existe esse recurso nos detalhes
              let detalheExistente = resultado[gravacao.centroLucro].detalhes.find(
                d => d.nome === nomeRecurso && d.tipo === 'fisico'
              );
              if (!detalheExistente) {
                detalheExistente = {
                  nome: nomeRecurso,
                  tipo: 'fisico',
                  custosMensais: Array(12).fill(0),
                  total: 0,
                };
                resultado[gravacao.centroLucro].detalhes.push(detalheExistente);
              }
              detalheExistente.custosMensais[mesIndex] += custoRecurso;
              detalheExistente.total += custoRecurso;
            }
          } else if (recurso.tipo === 'tecnico') {
            // Recursos humanos vinculados a recursos técnicos
            Object.entries(recurso.recursosHumanos || {}).forEach(([, rhList]: [string, any]) => {
              if (Array.isArray(rhList)) {
                rhList.forEach((rh: any) => {
                  const rhKey = `${rh.recursoHumanoId}_${recurso.recursoId}_${rh.horaInicio}_${rh.horaFim}`;
                  if (!rhProcessados.has(rhKey)) {
                    rhProcessados.add(rhKey);
                    const horas = calcularHorasEntreTempo(rh.horaInicio, rh.horaFim);
                    const colaborador = recursosHumanosCadastro.find((r: any) => r.id === rh.recursoHumanoId);
                    const custoHora = parseFloat(colaborador?.custoHora || 0);
                    const custoRecurso = horas * custoHora;
                    const nomeFuncao = colaborador?.funcao || 'Sem função';
                    
                    if (custoRecurso > 0) {
                      let detalheExistente = resultado[gravacao.centroLucro].detalhes.find(
                        d => d.nome === nomeFuncao && d.tipo === 'humano'
                      );
                      if (!detalheExistente) {
                        detalheExistente = {
                          nome: nomeFuncao,
                          tipo: 'humano',
                          custosMensais: Array(12).fill(0),
                          total: 0,
                        };
                        resultado[gravacao.centroLucro].detalhes.push(detalheExistente);
                      }
                      detalheExistente.custosMensais[mesIndex] += custoRecurso;
                      detalheExistente.total += custoRecurso;
                    }
                  }
                });
              }
            });
          } else if (recurso.tipo === 'humano' && recurso.recursoHumanoId) {
            // Recursos humanos diretos
            const rhKey = `${recurso.recursoHumanoId}_direct_${recurso.horaInicio}_${recurso.horaFim}`;
            if (!rhProcessados.has(rhKey)) {
              rhProcessados.add(rhKey);
              const horas = calcularHorasEntreTempo(recurso.horaInicio, recurso.horaFim);
              const colaborador = recursosHumanosCadastro.find((r: any) => r.id === recurso.recursoHumanoId);
              const custoHora = parseFloat(colaborador?.custoHora || 0);
              const custoRecurso = horas * custoHora;
              const nomeFuncao = colaborador?.funcao || 'Sem função';
              
              if (custoRecurso > 0) {
                let detalheExistente = resultado[gravacao.centroLucro].detalhes.find(
                  d => d.nome === nomeFuncao && d.tipo === 'humano'
                );
                if (!detalheExistente) {
                  detalheExistente = {
                    nome: nomeFuncao,
                    tipo: 'humano',
                    custosMensais: Array(12).fill(0),
                    total: 0,
                  };
                  resultado[gravacao.centroLucro].detalhes.push(detalheExistente);
                }
                detalheExistente.custosMensais[mesIndex] += custoRecurso;
                detalheExistente.total += custoRecurso;
              }
            }
          }
        });
        
        // Terceiros
        const terceiros = gravacaoTerceiros[gravacao.id] || [];
        terceiros.forEach((terceiro: any) => {
          const valorTerceiro = parseFloat(terceiro.valor || 0);
          if (valorTerceiro > 0) {
            const nomeTerceiro = 'Serviços de Terceiros';
            let detalheExistente = resultado[gravacao.centroLucro].detalhes.find(
              d => d.nome === nomeTerceiro && d.tipo === 'terceiro'
            );
            if (!detalheExistente) {
              detalheExistente = {
                nome: nomeTerceiro,
                tipo: 'terceiro',
                custosMensais: Array(12).fill(0),
                total: 0,
              };
              resultado[gravacao.centroLucro].detalhes.push(detalheExistente);
            }
            detalheExistente.custosMensais[mesIndex] += valorTerceiro;
            detalheExistente.total += valorTerceiro;
          }
        });
        
        // Calcular custo total da gravação para o centro de lucro
        const custoTotal = calcularCustoGravacao(gravacao.id);
        resultado[gravacao.centroLucro].custosMensais[mesIndex] += custoTotal;
        resultado[gravacao.centroLucro].total += custoTotal;
      } catch {
        // Ignora gravações com datas inválidas
      }
    });
    
    // Filtrar por centro de lucro se selecionado
    if (filtroCentroLucro !== 'Todos') {
      const filtrado: typeof resultado = {};
      if (resultado[filtroCentroLucro]) {
        filtrado[filtroCentroLucro] = resultado[filtroCentroLucro];
      }
      return filtrado;
    }
    
    return resultado;
  }, [gravacoes, filtroAno, filtroCentroLucro, filtroUnidadeNegocio, centrosLucro, gravacaoRecursos, gravacaoTerceiros, recursosFisicosCadastro, recursosHumanosCadastro]);

  // Função para alternar expansão de centro de lucro
  const toggleCentroLucroExpansion = (centroLucroId: string) => {
    setExpandedCentrosLucro(prev => {
      const newSet = new Set(prev);
      if (newSet.has(centroLucroId)) {
        newSet.delete(centroLucroId);
      } else {
        newSet.add(centroLucroId);
      }
      return newSet;
    });
  };

  // Dados de apropriação de custos por Unidade de Negócio
  const apropriacaoPorUnidadeNegocio = useMemo(() => {
    const anoSelecionado = parseInt(filtroAno);
    const resultado: Record<string, { nome: string; custosMensais: number[]; total: number }> = {};
    
    gravacoes.forEach((gravacao) => {
      if (!gravacao.dataPrevista || !gravacao.unidadeNegocio) return;
      
      // Filtrar por centro de lucro se selecionado
      if (filtroCentroLucro !== 'Todos' && gravacao.centroLucro !== filtroCentroLucro) return;
      
      try {
        const data = parseISO(gravacao.dataPrevista);
        if (isNaN(data.getTime()) || getYear(data) !== anoSelecionado) return;
        
        const mesIndex = getMonth(data);
        const custo = calcularCustoGravacao(gravacao.id);
        
        // Buscar o nome da unidade de negócio pelo ID
        const unidadeObj = unidadesNegocio.find(u => u.id === gravacao.unidadeNegocio);
        const unidadeNome = unidadeObj?.nome || gravacao.unidadeNegocio;
        
        if (!resultado[gravacao.unidadeNegocio]) {
          resultado[gravacao.unidadeNegocio] = {
            nome: unidadeNome,
            custosMensais: Array(12).fill(0),
            total: 0,
          };
        }
        
        resultado[gravacao.unidadeNegocio].custosMensais[mesIndex] += custo;
        resultado[gravacao.unidadeNegocio].total += custo;
      } catch {
        // Ignora gravações com datas inválidas
      }
    });
    
    // Filtrar por unidade de negócio se selecionada
    if (filtroUnidadeNegocio !== 'Todas') {
      const filtrado: typeof resultado = {};
      if (resultado[filtroUnidadeNegocio]) {
        filtrado[filtroUnidadeNegocio] = resultado[filtroUnidadeNegocio];
      }
      return filtrado;
    }
    
    return resultado;
  }, [gravacoes, filtroAno, filtroCentroLucro, filtroUnidadeNegocio, unidadesNegocio]);

  // Totais gerais de apropriação
  const totaisApropriacao = useMemo(() => {
    const custosMensais = Array(12).fill(0);
    let total = 0;
    
    Object.values(apropriacaoPorCentroLucro).forEach((item) => {
      item.custosMensais.forEach((custo, i) => {
        custosMensais[i] += custo;
      });
      total += item.total;
    });
    
    return { custosMensais, total };
  }, [apropriacaoPorCentroLucro]);

  // Lista única de centros de lucro e unidades para filtros (agora usando objetos com id e nome)
  const centrosLucroUnicos = useMemo(() => {
    const centrosIds = new Set<string>();
    const centrosResult: { id: string; nome: string }[] = [];
    gravacoes.forEach((g) => {
      if (g.centroLucro && !centrosIds.has(g.centroLucro)) {
        centrosIds.add(g.centroLucro);
        const centroObj = centrosLucro.find(c => c.id === g.centroLucro);
        centrosResult.push({ id: g.centroLucro, nome: centroObj?.nome || g.centroLucro });
      }
    });
    return centrosResult.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [gravacoes, centrosLucro]);

  const unidadesNegocioUnicas = useMemo(() => {
    const unidadesIds = new Set<string>();
    const unidadesResult: { id: string; nome: string }[] = [];
    gravacoes.forEach((g) => {
      if (g.unidadeNegocio && !unidadesIds.has(g.unidadeNegocio)) {
        unidadesIds.add(g.unidadeNegocio);
        const unidadeObj = unidadesNegocio.find(u => u.id === g.unidadeNegocio);
        unidadesResult.push({ id: g.unidadeNegocio, nome: unidadeObj?.nome || g.unidadeNegocio });
      }
    });
    return unidadesResult.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [gravacoes, unidadesNegocio]);

  const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Determinar a moeda para formatação com base no filtro de Unidade de Negócio
  const moedaSelecionada = useMemo(() => {
    if (filtroUnidadeNegocio !== 'Todas') {
      const unidade = unidadesNegocio.find(u => u.id === filtroUnidadeNegocio);
      return unidade?.moeda || 'BRL';
    }
    // Se "Todas", verificar se há apenas uma unidade na listagem
    const unidadesEmUso = Object.keys(apropriacaoPorUnidadeNegocio);
    if (unidadesEmUso.length === 1) {
      const unidade = unidadesNegocio.find(u => u.id === unidadesEmUso[0]);
      return unidade?.moeda || 'BRL';
    }
    // Múltiplas unidades ou nenhuma - usar BRL como padrão
    return 'BRL';
  }, [filtroUnidadeNegocio, unidadesNegocio, apropriacaoPorUnidadeNegocio]);

  const formatarMoeda = useCallback((valor: number): string => {
    return formatCurrencyUtil(valor, moedaSelecionada);
  }, [moedaSelecionada]);

  const getOcupacaoCelula = (
    ocupacoes: Record<string, Record<string, OcupacaoItem[]>>,
    recursoId: string,
    data: Date
  ) => {
    const dataStr = format(data, 'yyyy-MM-dd');
    let items = ocupacoes[recursoId]?.[dataStr] || [];
    
    // Filtrar por gravação se selecionado
    if (filtroGravacao !== 'Todas') {
      items = items.filter((item) => item.gravacaoId === filtroGravacao);
    }
    
    return items;
  };

  // Filter physical resources: only show those with allocations in the selected period
  const filteredRecursosFisicos = useMemo(() => {
    // Get date strings for the current display period
    const periodoDatas = displayDays.map((d) => format(d, 'yyyy-MM-dd'));
    
    // Get resource IDs that have allocations in this period
    const recursosComAlocacao = new Set<string>();
    Object.keys(ocupacoesFisicas).forEach((recursoId) => {
      const ocupacoesPorDia = ocupacoesFisicas[recursoId];
      // Check if any day in the period has allocations
      const temAlocacaoNoPeriodo = periodoDatas.some((data) => 
        ocupacoesPorDia[data] && ocupacoesPorDia[data].length > 0
      );
      if (temAlocacaoNoPeriodo) {
        recursosComAlocacao.add(recursoId);
      }
    });
    
    return recursosFisicos.filter((r) => {
      // Must have allocation in the period
      if (!recursosComAlocacao.has(r.id)) return false;
      
      const matchTipo = filtroTipoFisico === 'Todos' || r.tipo === filtroTipoFisico;
      const matchNome = r.nome.toLowerCase().includes(filtroNomeFisico.toLowerCase());
      return matchTipo && matchNome;
    });
  }, [recursosFisicos, ocupacoesFisicas, displayDays, filtroTipoFisico, filtroNomeFisico]);

  // Filter human resources: only show those with allocations in the selected period
  const filteredRecursosHumanos = useMemo(() => {
    // Get date strings for the current display period
    const periodoDatas = displayDays.map((d) => format(d, 'yyyy-MM-dd'));
    
    // Get resource IDs that have allocations (from tasks) in this period
    const recursosComAlocacao = new Set<string>();
    Object.keys(ocupacoesHumanas).forEach((recursoId) => {
      const ocupacoesPorDia = ocupacoesHumanas[recursoId];
      // Check if any day in the period has allocations
      const temAlocacaoNoPeriodo = periodoDatas.some((data) => 
        ocupacoesPorDia[data] && ocupacoesPorDia[data].length > 0
      );
      if (temAlocacaoNoPeriodo) {
        recursosComAlocacao.add(recursoId);
      }
    });
    
    return recursosHumanos.filter((r) => {
      // Must have allocation in the period
      if (!recursosComAlocacao.has(r.id)) return false;
      
      const matchFuncao = filtroFuncaoHumano === 'Todas' || r.funcao === filtroFuncaoHumano;
      const matchNome = r.nome.toLowerCase().includes(filtroNomeHumano.toLowerCase());
      return matchFuncao && matchNome;
    });
  }, [recursosHumanos, ocupacoesHumanas, displayDays, filtroFuncaoHumano, filtroNomeHumano]);

  // Agrupar recursos humanos por função
  const recursosHumanosAgrupados = useMemo(() => {
    const grupos: Record<string, RecursoHumano[]> = {};
    filteredRecursosHumanos.forEach((r) => {
      const grupo = r.funcao || 'Sem função';
      if (!grupos[grupo]) {
        grupos[grupo] = [];
      }
      grupos[grupo].push(r);
    });
    return grupos;
  }, [filteredRecursosHumanos]);

  // Exportar a vista atual como PDF usando jsPDF
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const titulo =
        activeTab === 'fisicos'
          ? 'Mapa de Ocupação - Recursos Físicos'
          : 'Mapa de Ocupação - Recursos Humanos';

      const periodo =
        viewMode === 'week'
          ? `${format(currentWeekStart, 'dd/MM/yyyy')} - ${format(addDays(currentWeekStart, 6), 'dd/MM/yyyy')}`
          : format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });

      // Criar PDF em paisagem
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let y = margin;

      // Título
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(titulo, pageWidth / 2, y, { align: 'center' });
      y += 8;

      // Período
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Período: ${periodo}`, pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Preparar dados da tabela
      const recursos = activeTab === 'fisicos' ? filteredRecursosFisicos : filteredRecursosHumanos;
      const ocupacoes = activeTab === 'fisicos' ? ocupacoesFisicas : ocupacoesHumanas;

      // Função auxiliar para desenhar tabela no PDF
      const drawTable = (
        recursosList: { id: string; nome: string }[],
        startY: number
      ): number => {
        const colWidth = viewMode === 'week' ? 35 : 22;
        const firstColWidth = 45;
        const rowHeight = 8;
        const headerHeight = 12;
        let currentY = startY;

        if (recursosList.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.text('Nenhum recurso encontrado', margin, currentY + 10);
          return currentY + 20;
        }

        // Calcular quantas colunas cabem por página
        const availableWidth = pageWidth - margin * 2 - firstColWidth;
        const colsPerPage = Math.floor(availableWidth / colWidth);
        const totalCols = displayDays.length;
        const pageGroups = Math.ceil(totalCols / colsPerPage);

        for (let pageGroup = 0; pageGroup < pageGroups; pageGroup++) {
          const startCol = pageGroup * colsPerPage;
          const endCol = Math.min(startCol + colsPerPage, totalCols);
          const pageDays = displayDays.slice(startCol, endCol);

          if (pageGroup > 0) {
            doc.addPage();
            currentY = margin + 20;
          }

          // Cabeçalho da tabela
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, currentY, firstColWidth + pageDays.length * colWidth, headerHeight, 'F');
          doc.setDrawColor(200, 200, 200);
          doc.rect(margin, currentY, firstColWidth + pageDays.length * colWidth, headerHeight, 'S');

          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('Recurso', margin + 2, currentY + 7);

          pageDays.forEach((day, i) => {
            const x = margin + firstColWidth + i * colWidth;
            doc.line(x, currentY, x, currentY + headerHeight);
            const dayLabel = viewMode === 'week' 
              ? format(day, 'EEE dd/MM', { locale: ptBR })
              : format(day, 'dd/MM');
            doc.text(dayLabel, x + colWidth / 2, currentY + 7, { align: 'center' });
          });

          currentY += headerHeight;

          // Linhas de recursos
          recursosList.forEach((recurso) => {
            // Verificar se precisa de nova página
            if (currentY > pageHeight - 20) {
              doc.addPage();
              currentY = margin;

              // Redesenhar cabeçalho
              doc.setFillColor(240, 240, 240);
              doc.rect(margin, currentY, firstColWidth + pageDays.length * colWidth, headerHeight, 'F');
              doc.setDrawColor(200, 200, 200);
              doc.rect(margin, currentY, firstColWidth + pageDays.length * colWidth, headerHeight, 'S');
              doc.setFontSize(8);
              doc.setFont('helvetica', 'bold');
              doc.text('Recurso', margin + 2, currentY + 7);
              pageDays.forEach((day, i) => {
                const x = margin + firstColWidth + i * colWidth;
                doc.line(x, currentY, x, currentY + headerHeight);
                const dayLabel = viewMode === 'week' 
                  ? format(day, 'EEE dd/MM', { locale: ptBR })
                  : format(day, 'dd/MM');
                doc.text(dayLabel, x + colWidth / 2, currentY + 7, { align: 'center' });
              });
              currentY += headerHeight;
            }

            // Calcular altura da linha baseado no conteúdo
            let maxOcupacoes = 1;
            pageDays.forEach((day) => {
              const dataStr = format(day, 'yyyy-MM-dd');
              let items = ocupacoes[recurso.id]?.[dataStr] || [];
              if (filtroGravacao !== 'Todas') {
                items = items.filter((item) => item.gravacaoId === filtroGravacao);
              }
              maxOcupacoes = Math.max(maxOcupacoes, items.length);
            });
            const currentRowHeight = Math.max(rowHeight, maxOcupacoes * 6 + 2);

            // Desenhar linha
            doc.setDrawColor(220, 220, 220);
            doc.rect(margin, currentY, firstColWidth + pageDays.length * colWidth, currentRowHeight, 'S');

            // Nome do recurso
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            const nomeRecurso = recurso.nome.length > 18 ? recurso.nome.substring(0, 18) + '...' : recurso.nome;
            doc.text(nomeRecurso, margin + 2, currentY + currentRowHeight / 2 + 1);

            // Células de ocupação
            pageDays.forEach((day, i) => {
              const x = margin + firstColWidth + i * colWidth;
              doc.line(x, currentY, x, currentY + currentRowHeight);

              const dataStr = format(day, 'yyyy-MM-dd');
              let items = ocupacoes[recurso.id]?.[dataStr] || [];
              if (filtroGravacao !== 'Todas') {
                items = items.filter((item) => item.gravacaoId === filtroGravacao);
              }

              if (items.length > 0) {
                doc.setFontSize(6);
                items.forEach((oc, idx) => {
                  const cellY = currentY + 4 + idx * 6;
                  const gravNome = oc.gravacao.length > 12 ? oc.gravacao.substring(0, 12) + '..' : oc.gravacao;
                  
                  // Aplicar cor do status se disponível (para recursos humanos)
                  if (oc.statusCor) {
                    // Converter hex para RGB
                    const hex = oc.statusCor.replace('#', '');
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    doc.setTextColor(r, g, b);
                  } else {
                    doc.setTextColor(0, 0, 0);
                  }
                  
                  doc.setFont('helvetica', 'bold');
                  doc.text(gravNome, x + 1, cellY);
                  doc.setTextColor(100, 100, 100);
                  if (viewMode === 'week') {
                    doc.setFont('helvetica', 'normal');
                    const horario = oc.horario.length > 15 ? oc.horario.substring(0, 15) : oc.horario;
                    doc.text(horario, x + 1, cellY + 3);
                  }
                });
              } else {
                doc.setFontSize(7);
                doc.setTextColor(180, 180, 180);
                doc.text('-', x + colWidth / 2, currentY + currentRowHeight / 2, { align: 'center' });
                doc.setTextColor(0, 0, 0);
              }
            });

            currentY += currentRowHeight;
          });
        }

        return currentY;
      };

      // Se for recursos humanos, desenhar agrupado por função
      if (activeTab === 'humanos') {
        const grupoKeys = Object.keys(recursosHumanosAgrupados).sort();
        
        if (grupoKeys.length === 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.text('Nenhum recurso humano encontrado', margin, y + 10);
        } else {
          grupoKeys.forEach((grupo) => {
            // Verificar se precisa de nova página
            if (y > pageHeight - 40) {
              doc.addPage();
              y = margin;
            }

            // Nome do grupo
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(`${grupo} (${recursosHumanosAgrupados[grupo].length})`, margin, y);
            y += 6;

            // Desenhar tabela para este grupo
            y = drawTable(recursosHumanosAgrupados[grupo], y);
            y += 8;
          });
        }
      } else {
        // Recursos físicos - tabela única
        y = drawTable(recursos, y);
      }

      // Rodapé
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} - Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }

      // Salvar PDF
      const nomeArquivo = `mapa-ocupacao-${activeTab}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(nomeArquivo);
    } finally {
      window.setTimeout(() => setIsExporting(false), 400);
    }
  };

  const renderNavigator = () => (
    <div className="flex items-center gap-2">
      <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'week' | 'month')}>
        <ToggleGroupItem value="week" aria-label="Semana" className="gap-1.5">
          <CalendarDays className="h-4 w-4" />
          <span className="hidden sm:inline">Semana</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="month" aria-label="Mês" className="gap-1.5">
          <CalendarRange className="h-4 w-4" />
          <span className="hidden sm:inline">Mês</span>
        </ToggleGroupItem>
      </ToggleGroup>
      <Button variant="outline" size="icon" onClick={handlePrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md min-w-[200px] justify-center">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {viewMode === 'week' ? (
            <>
              {format(currentWeekStart, "dd 'de' MMMM", { locale: ptBR })} -{' '}
              {format(addDays(currentWeekStart, 6), "dd 'de' MMMM", { locale: ptBR })}
            </>
          ) : (
            format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })
          )}
        </span>
      </div>
      <Button variant="outline" size="icon" onClick={handleNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderOcupacaoMatriz = (
    recursos: { id: string; nome: string }[],
    ocupacoes: Record<string, Record<string, OcupacaoItem[]>>,
    emptyMessage: string,
    showWeather: boolean = false
  ) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">Recurso</TableHead>
            {displayDays.map((day) => {
              const isWeekend = getDay(day) === 0 || getDay(day) === 6;
              const isToday = isSameDay(day, new Date());
              const weatherData = showWeather && isWithinForecastRange(day) ? getWeatherForDate(day) : undefined;
              
              return (
                <TableHead 
                  key={day.toISOString()} 
                  className={`text-center ${viewMode === 'month' ? 'min-w-[80px] px-1' : 'min-w-[140px]'} ${isWeekend ? 'bg-muted/50' : ''} ${isToday ? 'bg-primary/10 ring-2 ring-primary ring-inset' : ''}`}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-muted-foreground">
                            {viewMode === 'week' ? format(day, 'EEEE', { locale: ptBR }) : format(day, 'EEE', { locale: ptBR })}
                          </span>
                          <span className="font-semibold">{format(day, 'dd/MM')}</span>
                          {showWeather && weatherData && (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              <span className="text-sm leading-none">{weatherData.weatherIcon}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {weatherData.temperature}°
                              </span>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <div className="font-medium">
                            {format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </div>
                          {showWeather && weatherData && (
                            <div className="mt-1 text-xs">
                              <span className="text-lg mr-1">{weatherData.weatherIcon}</span>
                              {weatherData.weatherDescription} - {weatherData.temperature}°C
                            </div>
                          )}
                          {showWeather && !weatherData && isWithinForecastRange(day) && weatherLoading && (
                            <div className="text-xs text-muted-foreground">
                              Carregando previsão...
                            </div>
                          )}
                          {showWeather && !isWithinForecastRange(day) && (
                            <div className="text-xs text-muted-foreground">
                              Previsão não disponível
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {recursos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={displayDays.length + 1} className="text-center text-muted-foreground py-8">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            recursos.map((recurso) => (
              <TableRow key={recurso.id}>
                <TableCell className="sticky left-0 bg-background z-10 font-medium">
                  {recurso.nome}
                </TableCell>
                {displayDays.map((day) => {
                  const ocupacoesDia = getOcupacaoCelula(ocupacoes, recurso.id, day);
                  const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                  const dataStr = format(day, 'yyyy-MM-dd');
                  
                  // Obter informações de disponibilidade para recursos físicos
                  const faixasDisponiveis = showWeather ? getFaixasDisponiveis(recurso.id, dataStr) : [];
                  const totalDisponivelMinutos = faixasDisponiveis.reduce((sum, f) => {
                    const [horaIni, minIni] = f.horaInicio.split(':').map(Number);
                    const [horaFim, minFim] = f.horaFim.split(':').map(Number);
                    return sum + ((horaFim * 60 + minFim) - (horaIni * 60 + minIni));
                  }, 0);
                  const temFaixas = totalDisponivelMinutos > 0;
                  
                  // Calcular duração total ocupada neste dia baseado nas ocupações reais
                  const duracaoTotalMinutos = ocupacoesDia.reduce((sum, oc) => sum + (oc.duracaoMinutos || 0), 0);
                  const tempoLivreMinutos = Math.max(0, totalDisponivelMinutos - duracaoTotalMinutos);
                  const percentualOcupacao = totalDisponivelMinutos > 0 
                    ? Math.round((duracaoTotalMinutos / totalDisponivelMinutos) * 100)
                    : 0;
                  
                  // Criar objeto de ocupação detalhada com dados reais
                  const ocupacaoDetalhada = temFaixas ? {
                    totalDisponivel: totalDisponivelMinutos,
                    totalOcupado: duracaoTotalMinutos,
                    tempoLivre: tempoLivreMinutos,
                    percentualOcupacao,
                  } : null;
                  
                  const duracaoHoras = Math.floor(duracaoTotalMinutos / 60);
                  const duracaoMinutos = duracaoTotalMinutos % 60;
                  const duracaoStr = duracaoTotalMinutos > 0 
                    ? `${duracaoHoras}h${duracaoMinutos > 0 ? `${duracaoMinutos}min` : ''}`
                    : '';
                  
                  return (
                    <TableCell 
                      key={day.toISOString()} 
                      className={`text-center p-1 ${isWeekend ? 'bg-muted/50' : ''}`}
                    >
                      {ocupacoesDia.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {ocupacoesDia.map((oc, idx) => {
                            const gravacaoData = gravacoes.find(g => g.id === oc.gravacaoId);
                            return (
                              <HoverCard key={idx} openDelay={200} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                  <div
                                    className={`bg-primary/10 border border-primary/30 rounded text-xs cursor-pointer hover:bg-primary/20 transition-colors ${viewMode === 'month' ? 'p-0.5' : 'p-1.5'}`}
                                  >
                                    <div className="font-medium text-primary truncate" title={oc.gravacao}>
                                      {viewMode === 'month' ? oc.gravacao.substring(0, 8) + (oc.gravacao.length > 8 ? '...' : '') : oc.gravacao}
                                    </div>
                                    {viewMode === 'week' && (
                                      <>
                                        <div className="text-muted-foreground">{oc.horario}</div>
                                        {oc.duracaoMinutos && oc.duracaoMinutos > 0 && (
                                          <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                                            ({Math.floor(oc.duracaoMinutos / 60)}h{oc.duracaoMinutos % 60 > 0 ? `${oc.duracaoMinutos % 60}min` : ''})
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80" side="top" align="center">
                                  <div className="space-y-3">
                                    <div className="flex items-start gap-2">
                                      <Film className="h-4 w-4 text-primary mt-0.5" />
                                      <div>
                                        <p className="text-sm font-semibold">{oc.gravacao}</p>
                                        {gravacaoData?.codigoExterno && (
                                          <p className="text-xs text-muted-foreground">Cód: {gravacaoData.codigoExterno}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <p className="text-sm">{format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm">{oc.horario}</p>
                                        {oc.duracaoMinutos && oc.duracaoMinutos > 0 && (
                                          <p className="text-xs text-muted-foreground">
                                            Duração: {Math.floor(oc.duracaoMinutos / 60)}h{oc.duracaoMinutos % 60 > 0 ? `${oc.duracaoMinutos % 60}min` : ''}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <p className="text-sm">{recurso.nome}</p>
                                    </div>
                                    
                                    {/* Informação de ocupação do dia */}
                                    {showWeather && ocupacaoDetalhada && temFaixas && (
                                      <div className="pt-2 border-t space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-muted-foreground">Ocupação do dia:</span>
                                          <span className="font-medium">{ocupacaoDetalhada.percentualOcupacao}%</span>
                                        </div>
                                        <Progress value={ocupacaoDetalhada.percentualOcupacao} className="h-1.5" />
                                        <div className="grid grid-cols-2 gap-x-4 text-[10px] text-muted-foreground">
                                          <span>Disponível: {Math.floor(ocupacaoDetalhada.totalDisponivel / 60)}h{ocupacaoDetalhada.totalDisponivel % 60 > 0 ? `${ocupacaoDetalhada.totalDisponivel % 60}min` : ''}</span>
                                          <span>Ocupado: {Math.floor(ocupacaoDetalhada.totalOcupado / 60)}h{ocupacaoDetalhada.totalOcupado % 60 > 0 ? `${ocupacaoDetalhada.totalOcupado % 60}min` : ''}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs pt-1 border-t">
                                          <span className="font-medium text-emerald-600">Tempo livre:</span>
                                          <span className="font-bold text-emerald-600">
                                            {Math.floor(ocupacaoDetalhada.tempoLivre / 60)}h{ocupacaoDetalhada.tempoLivre % 60 > 0 ? `${ocupacaoDetalhada.tempoLivre % 60}min` : ''}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            );
                          })}
                          
                          {/* Barra de ocupação do dia (apenas para recursos físicos com faixas) */}
                          {showWeather && ocupacaoDetalhada && temFaixas && ocupacoesDia.length > 0 && viewMode === 'week' && (
                            <div className="mt-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="space-y-0.5">
                                      <Progress 
                                        value={ocupacaoDetalhada.percentualOcupacao} 
                                        className="h-1"
                                      />
                                      <div className="text-[9px] text-muted-foreground text-center">
                                        Livre: {Math.floor(ocupacaoDetalhada.tempoLivre / 60)}h{ocupacaoDetalhada.tempoLivre % 60 > 0 ? `${ocupacaoDetalhada.tempoLivre % 60}min` : ''}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs space-y-1">
                                      <p>Ocupado: {Math.floor(ocupacaoDetalhada.totalOcupado / 60)}h{ocupacaoDetalhada.totalOcupado % 60 > 0 ? ` ${ocupacaoDetalhada.totalOcupado % 60}min` : ''}</p>
                                      <p>Disponível: {Math.floor(ocupacaoDetalhada.totalDisponivel / 60)}h{ocupacaoDetalhada.totalDisponivel % 60 > 0 ? ` ${ocupacaoDetalhada.totalDisponivel % 60}min` : ''}</p>
                                      <p className="font-medium text-emerald-600">Livre para uso: {Math.floor(ocupacaoDetalhada.tempoLivre / 60)}h{ocupacaoDetalhada.tempoLivre % 60 > 0 ? ` ${ocupacaoDetalhada.tempoLivre % 60}min` : ''}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderOcupacaoMatrizAgrupada = (
    grupos: Record<string, RecursoHumano[]>,
    ocupacoes: Record<string, Record<string, OcupacaoItem[]>>,
    emptyMessage: string
  ) => {
    const grupoKeys = Object.keys(grupos).sort();
    
    if (grupoKeys.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {grupoKeys.map((grupo) => (
          <div key={grupo}>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold text-foreground">{grupo}</h4>
              <span className="text-xs text-muted-foreground">({grupos[grupo].length})</span>
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">Colaborador</TableHead>
                    {displayDays.map((day) => {
                      const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                      return (
                        <TableHead 
                          key={day.toISOString()} 
                          className={`text-center ${viewMode === 'month' ? 'min-w-[80px] px-1' : 'min-w-[140px]'} ${isWeekend ? 'bg-muted/50' : ''}`}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              {viewMode === 'week' ? format(day, 'EEEE', { locale: ptBR }) : format(day, 'EEE', { locale: ptBR })}
                            </span>
                            <span className="font-semibold">{format(day, 'dd/MM')}</span>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grupos[grupo].map((recurso) => (
                    <TableRow key={recurso.id}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">
                        {recurso.nome}
                      </TableCell>
                      {displayDays.map((day) => {
                        const ocupacoesDia = getOcupacaoCelula(ocupacoes, recurso.id, day);
                        const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                        return (
                          <TableCell 
                            key={day.toISOString()} 
                            className={`text-center p-1 ${isWeekend ? 'bg-muted/50' : ''}`}
                          >
                            {ocupacoesDia.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {ocupacoesDia.map((oc, idx) => {
                                  const bgColor = oc.statusCor || undefined;
                                  const gravacaoData = gravacoes.find(g => g.id === oc.gravacaoId);
                                  const recursoHumanoData = recursosHumanos.find(rh => rh.id === oc.recursoHumanoId);
                                  const dataStr = format(day, 'yyyy-MM-dd');
                                  
                                  // Calcular tempo de escala e ocupação
                                  const escala = getEscalaParaDia(recurso.id, dataStr);
                                  const todasOcupacoesDia = ocupacoes[recurso.id]?.[dataStr] || [];
                                  const tempoTotalOcupadoMinutos = todasOcupacoesDia.reduce((sum, o) => sum + (o.duracaoMinutos || 0), 0);
                                  const tempoEscalaMinutos = escala?.totalMinutos || 0;
                                  const tempoOciosoMinutos = Math.max(0, tempoEscalaMinutos - tempoTotalOcupadoMinutos);
                                  const percentualOcupacao = tempoEscalaMinutos > 0 
                                    ? Math.round((tempoTotalOcupadoMinutos / tempoEscalaMinutos) * 100)
                                    : 0;

                                  return (
                                    <HoverCard key={idx} openDelay={200} closeDelay={100}>
                                      <HoverCardTrigger asChild>
                                        <div
                                          className={`rounded text-xs cursor-pointer transition-opacity hover:opacity-80 ${viewMode === 'month' ? 'p-0.5' : 'p-1.5'}`}
                                          style={bgColor ? {
                                            backgroundColor: `${bgColor}20`,
                                            borderColor: `${bgColor}50`,
                                            borderWidth: '1px',
                                            borderStyle: 'solid',
                                          } : {
                                            backgroundColor: 'hsl(var(--primary) / 0.1)',
                                            borderColor: 'hsl(var(--primary) / 0.3)',
                                            borderWidth: '1px',
                                            borderStyle: 'solid',
                                          }}
                                        >
                                          <div 
                                            className="font-medium truncate" 
                                            style={bgColor ? { color: bgColor } : { color: 'hsl(var(--primary))' }}
                                          >
                                            {viewMode === 'month' ? oc.gravacao.substring(0, 8) + (oc.gravacao.length > 8 ? '...' : '') : oc.gravacao}
                                          </div>
                                          {viewMode === 'week' && (
                                            <div className="text-muted-foreground">{oc.horario}</div>
                                          )}
                                        </div>
                                      </HoverCardTrigger>
                                      <HoverCardContent className="w-80" side="top" align="center">
                                        <div className="space-y-3">
                                          <div className="flex items-start gap-2">
                                            <Film className="h-4 w-4 text-primary mt-0.5" />
                                            <div>
                                              <p className="text-sm font-semibold">{oc.gravacao}</p>
                                              {gravacaoData?.codigoExterno && (
                                                <p className="text-xs text-muted-foreground">Cód: {gravacaoData.codigoExterno}</p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-sm">{format(day, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-sm">{oc.horario}</p>
                                            {oc.duracaoMinutos && oc.duracaoMinutos > 0 && (
                                              <span className="text-xs text-muted-foreground">
                                                ({Math.floor(oc.duracaoMinutos / 60)}h{oc.duracaoMinutos % 60 > 0 ? ` ${oc.duracaoMinutos % 60}min` : ''})
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-sm">{recurso.nome}</p>
                                          </div>
                                          {recursoHumanoData?.funcao && (
                                            <div className="flex items-center gap-2">
                                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                                              <p className="text-sm text-muted-foreground">{recursoHumanoData.funcao}</p>
                                            </div>
                                          )}
                                          {bgColor && (
                                            <div className="flex items-center gap-2">
                                              <div 
                                                className="w-3 h-3 rounded-full" 
                                                style={{ backgroundColor: bgColor }}
                                              />
                                              <p className="text-sm text-muted-foreground">Status da tarefa</p>
                                            </div>
                                          )}
                                          
                                          {/* Informações de tempo/ociosidade */}
                                          {escala && (
                                            <div className="border-t pt-3 mt-3 space-y-2">
                                              <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Escala do dia:</span>
                                                <span className="font-medium">{escala.horaInicio} - {escala.horaFim} ({Math.floor(tempoEscalaMinutos / 60)}h)</span>
                                              </div>
                                              <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Tempo ocupado:</span>
                                                <span className="font-medium text-amber-600">
                                                  {Math.floor(tempoTotalOcupadoMinutos / 60)}h{tempoTotalOcupadoMinutos % 60 > 0 ? ` ${tempoTotalOcupadoMinutos % 60}min` : ''} ({percentualOcupacao}%)
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Tempo ocioso:</span>
                                                <span className="font-medium text-emerald-600">
                                                  {Math.floor(tempoOciosoMinutos / 60)}h{tempoOciosoMinutos % 60 > 0 ? ` ${tempoOciosoMinutos % 60}min` : ''}
                                                </span>
                                              </div>
                                              <div className="pt-1">
                                                <Progress value={percentualOcupacao} className="h-2" />
                                              </div>
                                              {todasOcupacoesDia.length > 1 && (
                                                <p className="text-xs text-muted-foreground pt-1">
                                                  * {todasOcupacoesDia.length} gravações neste dia
                                                </p>
                                              )}
                                            </div>
                                          )}
                                          {!escala && (
                                            <div className="border-t pt-3 mt-3">
                                              <p className="text-xs text-muted-foreground italic">
                                                Sem escala de trabalho definida para este dia
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </HoverCardContent>
                                    </HoverCard>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="rounded-lg mb-4 overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gradient-to-r from-kreato-cyan via-primary to-kreato-orange">
          <div>
            <h1 className="text-2xl font-bold text-white">Mapas de Ocupação</h1>
            <p className="text-white/80 mt-1">Visualize a alocação de recursos por período</p>
          </div>
        </div>
      </div>

      {/* Barra de Botões entre título e tabuladores */}
      <div className="flex items-center justify-start gap-2 py-3 px-4 mb-4 border-b border-border/50 bg-muted/30 rounded-lg">
        {renderNavigator()}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          disabled={isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          Exportar PDF
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="fisicos" className="gap-2">
            <MapPin className="h-4 w-4" />
            Recursos Físicos
          </TabsTrigger>
          <TabsTrigger value="humanos" className="gap-2">
            <Users className="h-4 w-4" />
            Recursos Humanos
          </TabsTrigger>
          <TabsTrigger value="custos" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Apropriação de Custos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fisicos" className="space-y-4">
          {showFilters && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Filtros - Recursos Físicos</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de Recurso</Label>
                    <Select value={filtroTipoFisico} onValueChange={setFiltroTipoFisico}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposRecursoFisico.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome do Recurso</Label>
                    <Input
                      placeholder="Buscar por nome..."
                      value={filtroNomeFisico}
                      onChange={(e) => setFiltroNomeFisico(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Gravação/Projeto</Label>
                    <Select value={filtroGravacao} onValueChange={setFiltroGravacao}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todas">Todas</SelectItem>
                        {gravacoes.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div ref={fisicosRef}>
            <Card>
              <CardContent className="p-4">
                {renderOcupacaoMatriz(
                  filteredRecursosFisicos,
                  ocupacoesFisicas,
                  'Nenhum recurso físico encontrado. Cadastre recursos físicos e aloque-os em gravações.',
                  true // showWeather - mostrar previsão do tempo para recursos físicos
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="humanos" className="space-y-4">
          {showFilters && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Filtros - Recursos Humanos</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Função</Label>
                    <Select value={filtroFuncaoHumano} onValueChange={setFiltroFuncaoHumano}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {funcoesRecursoHumano.map((funcao) => (
                          <SelectItem key={funcao} value={funcao}>
                            {funcao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome do Colaborador</Label>
                    <Input
                      placeholder="Buscar por nome..."
                      value={filtroNomeHumano}
                      onChange={(e) => setFiltroNomeHumano(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Gravação/Projeto</Label>
                    <Select value={filtroGravacao} onValueChange={setFiltroGravacao}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todas">Todas</SelectItem>
                        {gravacoes.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div ref={humanosRef}>
            <Card>
              <CardContent className="p-4">
                {renderOcupacaoMatrizAgrupada(
                  recursosHumanosAgrupados,
                  ocupacoesHumanas,
                  'Nenhum recurso humano encontrado. Cadastre colaboradores e aloque-os em recursos técnicos das gravações.'
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="custos" className="space-y-4">
          {/* Filtros de Apropriação de Custos */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros de Apropriação
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Ano</Label>
                  <Select value={filtroAno} onValueChange={setFiltroAno}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {anosDisponiveis.map((ano) => (
                        <SelectItem key={ano} value={ano.toString()}>
                          {ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Centro de Lucro</Label>
                  <Select value={filtroCentroLucro} onValueChange={setFiltroCentroLucro}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos">Todos</SelectItem>
                      {centrosLucroUnicos.map((centro) => (
                        <SelectItem key={centro.id} value={centro.id}>
                          {centro.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Unidade de Negócio</Label>
                  <Select value={filtroUnidadeNegocio} onValueChange={setFiltroUnidadeNegocio}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todas">Todas</SelectItem>
                      {unidadesNegocioUnicas.map((unidade) => (
                        <SelectItem key={unidade.id} value={unidade.id}>
                          {unidade.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela por Unidade de Negócio - MOVIDA PARA CIMA */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Custos por Unidade de Negócio - {filtroAno}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Unidade de Negócio</TableHead>
                      {mesesAbrev.map((mes) => (
                        <TableHead key={mes} className="text-right min-w-[100px]">{mes}</TableHead>
                      ))}
                      <TableHead className="text-right min-w-[120px] bg-muted/50 font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(apropriacaoPorUnidadeNegocio).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                          Nenhum custo encontrado para o período selecionado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {Object.values(apropriacaoPorUnidadeNegocio)
                          .sort((a, b) => a.nome.localeCompare(b.nome))
                          .map((item) => (
                            <TableRow key={item.nome}>
                              <TableCell className="sticky left-0 bg-background z-10 font-medium">
                                {item.nome}
                              </TableCell>
                              {item.custosMensais.map((custo, i) => (
                                <TableCell key={i} className="text-right tabular-nums">
                                  {custo > 0 ? formatarMoeda(custo) : <span className="text-muted-foreground">-</span>}
                                </TableCell>
                              ))}
                              <TableCell className="text-right font-bold bg-muted/50 tabular-nums">
                                {formatarMoeda(item.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Tabela por Centro de Lucro - COM COLLAPSE */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Custos por Centro de Lucro - {filtroAno}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-10 min-w-[250px]">Centro de Lucro</TableHead>
                      {mesesAbrev.map((mes) => (
                        <TableHead key={mes} className="text-right min-w-[100px]">{mes}</TableHead>
                      ))}
                      <TableHead className="text-right min-w-[120px] bg-muted/50 font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(apropriacaoPorCentroLucro).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                          Nenhum custo encontrado para o período selecionado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {Object.entries(apropriacaoPorCentroLucro)
                          .sort(([, a], [, b]) => a.nome.localeCompare(b.nome))
                          .map(([centroId, item]) => {
                            const isExpanded = expandedCentrosLucro.has(centroId);
                            const hasDetails = item.detalhes && item.detalhes.length > 0;
                            
                            return (
                              <>
                                <TableRow 
                                  key={centroId}
                                  className={hasDetails ? 'cursor-pointer hover:bg-muted/50' : ''}
                                  onClick={() => hasDetails && toggleCentroLucroExpansion(centroId)}
                                >
                                  <TableCell className="sticky left-0 bg-background z-10 font-medium">
                                    <div className="flex items-center gap-2">
                                      {hasDetails && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCentroLucroExpansion(centroId);
                                          }}
                                        >
                                          {isExpanded ? (
                                            <ChevronUp className="h-4 w-4" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4" />
                                          )}
                                        </Button>
                                      )}
                                      {!hasDetails && <span className="w-6" />}
                                      {item.nome}
                                    </div>
                                  </TableCell>
                                  {item.custosMensais.map((custo, i) => (
                                    <TableCell key={i} className="text-right tabular-nums">
                                      {custo > 0 ? formatarMoeda(custo) : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                  ))}
                                  <TableCell className="text-right font-bold bg-muted/50 tabular-nums">
                                    {formatarMoeda(item.total)}
                                  </TableCell>
                                </TableRow>
                                
                                {/* Linhas de detalhes (recursos) - exibidas quando expandido */}
                                {isExpanded && item.detalhes && item.detalhes.map((detalhe, detalheIndex) => (
                                  <TableRow 
                                    key={`${centroId}-detalhe-${detalheIndex}`}
                                    className="bg-muted/30"
                                  >
                                    <TableCell className="sticky left-0 bg-muted/30 z-10 pl-10">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {detalhe.tipo === 'humano' && <Users className="h-3 w-3" />}
                                        {detalhe.tipo === 'fisico' && <MapPinIcon className="h-3 w-3" />}
                                        {detalhe.tipo === 'terceiro' && <Briefcase className="h-3 w-3" />}
                                        {detalhe.nome}
                                      </div>
                                    </TableCell>
                                    {detalhe.custosMensais.map((custo, i) => (
                                      <TableCell key={i} className="text-right tabular-nums text-sm text-muted-foreground">
                                        {custo > 0 ? formatarMoeda(custo) : <span className="text-muted-foreground/50">-</span>}
                                      </TableCell>
                                    ))}
                                    <TableCell className="text-right tabular-nums text-sm text-muted-foreground bg-muted/40">
                                      {formatarMoeda(detalhe.total)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </>
                            );
                          })}
                        <TableRow className="bg-primary/5 font-bold">
                          <TableCell className="sticky left-0 bg-primary/5 z-10">
                            <div className="flex items-center gap-2">
                              <span className="w-6" />
                              Total Geral
                            </div>
                          </TableCell>
                          {totaisApropriacao.custosMensais.map((custo, i) => (
                            <TableCell key={i} className="text-right tabular-nums">
                              {custo > 0 ? formatarMoeda(custo) : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                          ))}
                          <TableCell className="text-right tabular-nums bg-primary/10">
                            {formatarMoeda(totaisApropriacao.total)}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Mapas;
