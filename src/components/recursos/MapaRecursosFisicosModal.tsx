import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, MapPin, Loader2, Clock, Film } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isWithinInterval,
  parseISO,
  startOfWeek,
  endOfWeek,
  isSameDay,
  addDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { RecursoFisico, FaixaDisponibilidade } from '@/pages/recursos/RecursosFisicos';
import { useWeatherForecast } from '@/hooks/useWeatherForecast';
import { useRecursoFisicoDisponibilidade } from '@/hooks/useRecursoFisicoDisponibilidade';
import { supabase } from '@/integrations/supabase/client';

interface OcupacaoData {
  recursoId: string;
  data: string;
  ocupacoes: {
    gravacaoId: string;
    gravacaoNome: string;
    horaInicio: string;
    horaFim: string;
    duracaoMinutos: number;
  }[];
  totalOcupado: number;
  totalDisponivel: number;
  tempoLivre: number;
  percentualOcupacao: number;
}

interface MapaRecursosFisicosModalProps {
  isOpen: boolean;
  onClose: () => void;
  recursos: RecursoFisico[];
}

type ViewMode = 'semana' | 'mes' | 'periodo';
type StatusType = 'DI' | 'IN'; // Disponível ou Indisponível

const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const MapaRecursosFisicosModal = ({
  isOpen,
  onClose,
  recursos,
}: MapaRecursosFisicosModalProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('mes');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  
  const { weather, loading: weatherLoading, getWeatherForDate } = useWeatherForecast(16);
  const { getFaixasDisponiveis, formatarMinutos } = useRecursoFisicoDisponibilidade();
  
  const [ocupacoesMap, setOcupacoesMap] = useState<Record<string, OcupacaoData>>({});
  const [loadingOcupacoes, setLoadingOcupacoes] = useState(false);

  // Converter hora HH:mm para minutos
  const horaParaMinutos = (hora: string): number => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };
  // Calcular dias a exibir baseado no modo de visualização
  const diasExibidos = useMemo(() => {
    if (viewMode === 'semana') {
      const inicio = startOfWeek(currentDate, { locale: ptBR });
      const fim = endOfWeek(currentDate, { locale: ptBR });
      return eachDayOfInterval({ start: inicio, end: fim });
    } else if (viewMode === 'mes') {
      const inicio = startOfMonth(currentDate);
      const fim = endOfMonth(currentDate);
      return eachDayOfInterval({ start: inicio, end: fim });
    } else if (viewMode === 'periodo' && periodoInicio && periodoFim) {
      try {
        const inicio = parseISO(periodoInicio);
        const fim = parseISO(periodoFim);
        if (fim >= inicio) {
          return eachDayOfInterval({ start: inicio, end: fim });
        }
      } catch {
        return [];
      }
    }
    return [];
  }, [viewMode, currentDate, periodoInicio, periodoFim]);

  // Fetch ocupações do banco de dados quando o modal abre ou o período muda
  useEffect(() => {
    const fetchOcupacoes = async () => {
      if (!isOpen || recursos.length === 0 || diasExibidos.length === 0) return;
      
      setLoadingOcupacoes(true);
      try {
        const dataInicio = format(diasExibidos[0], 'yyyy-MM-dd');
        const dataFim = format(diasExibidos[diasExibidos.length - 1], 'yyyy-MM-dd');
        
        // Buscar todas as alocações de recursos físicos no período
        const { data: alocacoes } = await supabase
          .from('gravacao_recursos')
          .select(`
            recurso_fisico_id,
            hora_inicio,
            hora_fim,
            gravacoes:gravacao_id(id, nome, codigo, data_prevista)
          `)
          .not('recurso_fisico_id', 'is', null)
          .not('hora_inicio', 'is', null)
          .not('hora_fim', 'is', null);
        
        const newOcupacoesMap: Record<string, OcupacaoData> = {};
        
        // Processar alocações por recurso e data
        for (const alocacao of alocacoes || []) {
          const gravacao = alocacao.gravacoes as any;
          if (!gravacao?.data_prevista || !alocacao.recurso_fisico_id) continue;
          
          const dataGravacao = gravacao.data_prevista;
          // Verificar se a data está no período exibido
          if (dataGravacao < dataInicio || dataGravacao > dataFim) continue;
          
          const key = `${alocacao.recurso_fisico_id}_${dataGravacao}`;
          
          if (!newOcupacoesMap[key]) {
            // Obter faixas de disponibilidade para este recurso/data
            const faixas = getFaixasDisponiveis(alocacao.recurso_fisico_id, dataGravacao);
            const totalDisponivel = faixas.reduce((sum, f) => {
              return sum + (horaParaMinutos(f.horaFim) - horaParaMinutos(f.horaInicio));
            }, 0);
            
            newOcupacoesMap[key] = {
              recursoId: alocacao.recurso_fisico_id,
              data: dataGravacao,
              ocupacoes: [],
              totalOcupado: 0,
              totalDisponivel,
              tempoLivre: totalDisponivel,
              percentualOcupacao: 0,
            };
          }
          
          const duracaoMinutos = horaParaMinutos(alocacao.hora_fim) - horaParaMinutos(alocacao.hora_inicio);
          
          newOcupacoesMap[key].ocupacoes.push({
            gravacaoId: gravacao.id,
            gravacaoNome: gravacao.nome || gravacao.codigo,
            horaInicio: alocacao.hora_inicio,
            horaFim: alocacao.hora_fim,
            duracaoMinutos,
          });
          
          newOcupacoesMap[key].totalOcupado += duracaoMinutos;
        }
        
        // Calcular tempoLivre e percentualOcupacao
        for (const key of Object.keys(newOcupacoesMap)) {
          const data = newOcupacoesMap[key];
          data.tempoLivre = Math.max(0, data.totalDisponivel - data.totalOcupado);
          data.percentualOcupacao = data.totalDisponivel > 0 
            ? Math.round((data.totalOcupado / data.totalDisponivel) * 100) 
            : 0;
        }
        
        setOcupacoesMap(newOcupacoesMap);
      } catch (error) {
        console.error('Erro ao buscar ocupações:', error);
      } finally {
        setLoadingOcupacoes(false);
      }
    };
    
    fetchOcupacoes();
  }, [isOpen, recursos, diasExibidos, getFaixasDisponiveis]);

  // Verificar se um dia está dentro dos próximos 15 dias (para mostrar previsão)
  const isWithinForecastRange = (dia: Date): boolean => {
    const today = new Date();
    const maxDate = addDays(today, 15);
    return dia >= today && dia <= maxDate;
  };

  // Verificar status do recurso em um dia específico
  const getStatusDia = (recurso: RecursoFisico, dia: Date): StatusType => {
    const diaNum = getDay(dia); // 0 = Domingo, 6 = Sábado

    if (!recurso.faixasDisponibilidade || recurso.faixasDisponibilidade.length === 0) {
      return 'IN';
    }

    // Verificar se há alguma faixa que cubra este dia
    const temDisponibilidade = recurso.faixasDisponibilidade.some((faixa) => {
      try {
        const inicio = parseISO(faixa.dataInicio);
        const fim = parseISO(faixa.dataFim);
        const dentroDoIntervalo = isWithinInterval(dia, { start: inicio, end: fim });
        
        if (!dentroDoIntervalo) return false;

        // Verificar se o dia da semana está incluído
        if (faixa.diasSemana && faixa.diasSemana.length > 0) {
          return faixa.diasSemana.includes(diaNum);
        }

        return true;
      } catch {
        return false;
      }
    });

    return temDisponibilidade ? 'DI' : 'IN';
  };

  // Obter horário de disponibilidade para um dia
  const getHorarioDisponivel = (recurso: RecursoFisico, dia: Date): string | null => {
    const diaNum = getDay(dia);

    if (!recurso.faixasDisponibilidade) return null;

    for (const faixa of recurso.faixasDisponibilidade) {
      try {
        const inicio = parseISO(faixa.dataInicio);
        const fim = parseISO(faixa.dataFim);
        const dentroDoIntervalo = isWithinInterval(dia, { start: inicio, end: fim });
        
        if (dentroDoIntervalo && faixa.diasSemana?.includes(diaNum)) {
          return `${faixa.horaInicio} - ${faixa.horaFim}`;
        }
      } catch {
        continue;
      }
    }
    return null;
  };

  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'DI':
        return {
          label: 'DI',
          bg: 'bg-emerald-500',
          text: 'text-white',
          title: 'Disponível',
        };
      case 'IN':
        return {
          label: 'IN',
          bg: 'bg-gray-400',
          text: 'text-white',
          title: 'Indisponível',
        };
    }
  };

  const handlePrevious = () => {
    if (viewMode === 'semana') {
      setCurrentDate((prev) => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else if (viewMode === 'mes') {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'semana') {
      setCurrentDate((prev) => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else if (viewMode === 'mes') {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  const getTituloNavegacao = () => {
    if (viewMode === 'semana') {
      const inicio = startOfWeek(currentDate, { locale: ptBR });
      const fim = endOfWeek(currentDate, { locale: ptBR });
      return `${format(inicio, 'dd/MM', { locale: ptBR })} - ${format(fim, 'dd/MM/yyyy', { locale: ptBR })}`;
    } else if (viewMode === 'mes') {
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    } else if (periodoInicio && periodoFim) {
      return `${format(parseISO(periodoInicio), 'dd/MM/yyyy')} - ${format(parseISO(periodoFim), 'dd/MM/yyyy')}`;
    }
    return 'Selecione um período';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Mapa de Disponibilidade - Recursos Físicos
          </DialogTitle>
        </DialogHeader>

        {/* Controles */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Visualização:</Label>
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="mes">Mês</SelectItem>
                <SelectItem value="periodo">Período</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {viewMode === 'periodo' && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
                className="w-36"
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="date"
                value={periodoFim}
                onChange={(e) => setPeriodoFim(e.target.value)}
                className="w-36"
              />
            </div>
          )}

          {viewMode !== 'periodo' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="min-w-[180px] text-center font-medium capitalize">
                {getTituloNavegacao()}
              </span>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Legenda */}
          <div className="flex items-center gap-3 ml-auto text-xs flex-wrap">
            <span className="font-medium">Legenda:</span>
            <div className="flex items-center gap-1">
              <span className="w-6 h-5 bg-emerald-500 rounded flex items-center justify-center text-white text-[10px] font-bold">
                DI
              </span>
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-6 h-5 bg-amber-500 rounded flex items-center justify-center text-white text-[10px] font-bold">
                50%
              </span>
              <span>Parcial</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-6 h-5 bg-red-500 rounded flex items-center justify-center text-white text-[10px] font-bold">
                OC
              </span>
              <span>Ocupado</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-6 h-5 bg-gray-400 rounded flex items-center justify-center text-white text-[10px] font-bold">
                IN
              </span>
              <span>Indisponível</span>
            </div>
            {weatherLoading && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Carregando clima...</span>
              </div>
            )}
          </div>
        </div>

        {/* Mapa */}
        <ScrollArea className="h-[calc(90vh-200px)] border rounded-lg">
          <div className="min-w-max">
            {/* Cabeçalho com dias */}
            <div className="flex sticky top-0 bg-background z-10 border-b">
              <div className="w-56 min-w-56 px-3 py-2 font-medium text-sm border-r bg-muted/50 flex items-center">
                Recurso Físico
              </div>
              {diasExibidos.map((dia) => {
                const diaSemana = getDay(dia);
                const isFimDeSemana = diaSemana === 0 || diaSemana === 6;
                const isToday = isSameDay(dia, new Date());
                const weatherData = isWithinForecastRange(dia) ? getWeatherForDate(dia) : undefined;
                
                return (
                  <TooltipProvider key={dia.toISOString()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`w-14 min-w-14 px-1 py-1 text-center text-xs border-r ${
                            isToday 
                              ? 'bg-primary/20 ring-2 ring-primary ring-inset' 
                              : isFimDeSemana 
                                ? 'bg-orange-100 dark:bg-orange-900/30' 
                                : 'bg-muted/30'
                          }`}
                        >
                          <div className="font-medium">{format(dia, 'dd')}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {DIAS_SEMANA_ABREV[diaSemana]}
                          </div>
                          {weatherData && (
                            <div className="mt-0.5 flex flex-col items-center">
                              <span className="text-sm leading-none">{weatherData.weatherIcon}</span>
                              <span className="text-[9px] text-muted-foreground font-medium">
                                {weatherData.temperature}°
                              </span>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <div className="font-medium">
                            {format(dia, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </div>
                          {weatherData && (
                            <div className="mt-1 text-xs">
                              <span className="text-lg mr-1">{weatherData.weatherIcon}</span>
                              {weatherData.weatherDescription} - {weatherData.temperature}°C
                            </div>
                          )}
                          {!weatherData && isWithinForecastRange(dia) && weatherLoading && (
                            <div className="text-xs text-muted-foreground">
                              Carregando previsão...
                            </div>
                          )}
                          {!isWithinForecastRange(dia) && (
                            <div className="text-xs text-muted-foreground">
                              Previsão não disponível
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>

            {/* Corpo com recursos */}
            {recursos.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <MapPin className="w-8 h-8 mr-2" />
                Nenhum recurso físico cadastrado.
              </div>
            ) : (
              recursos.map((recurso) => (
                <div key={recurso.id} className="flex border-b hover:bg-muted/20">
                  <div className="w-56 min-w-56 px-3 py-1.5 text-xs border-r">
                    <div className="font-medium truncate">{recurso.nome}</div>
                    {recurso.codigoExterno && (
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {recurso.codigoExterno}
                      </div>
                    )}
                  </div>
                  {diasExibidos.map((dia) => {
                    const status = getStatusDia(recurso, dia);
                    const config = getStatusConfig(status);
                    const diaSemana = getDay(dia);
                    const isFimDeSemana = diaSemana === 0 || diaSemana === 6;
                    const isToday = isSameDay(dia, new Date());
                    const horario = status === 'DI' ? getHorarioDisponivel(recurso, dia) : null;
                    const dataStr = format(dia, 'yyyy-MM-dd');
                    
                    // Obter ocupação detalhada do mapa carregado
                    const ocupacaoKey = `${recurso.id}_${dataStr}`;
                    const ocupacaoData = ocupacoesMap[ocupacaoKey];
                    
                    // Obter faixas de disponibilidade para calcular total disponível
                    const faixas = getFaixasDisponiveis(recurso.id, dataStr);
                    const totalDisponivelCalc = faixas.reduce((sum, f) => {
                      return sum + (horaParaMinutos(f.horaFim) - horaParaMinutos(f.horaInicio));
                    }, 0);
                    
                    const ocupacaoDetalhada = ocupacaoData || {
                      ocupacoes: [],
                      totalOcupado: 0,
                      totalDisponivel: totalDisponivelCalc,
                      tempoLivre: totalDisponivelCalc,
                      percentualOcupacao: 0,
                    };
                    
                    const temOcupacoes = ocupacaoDetalhada.ocupacoes.length > 0;
                    const temDisponibilidade = ocupacaoDetalhada.totalDisponivel > 0;
                    
                    // Determinar cor baseado na ocupação
                    let bgColor = config.bg;
                    let label = config.label;
                    
                    if (status === 'DI' && temOcupacoes) {
                      // Se tem ocupações, mostrar percentual ou "OC" se totalmente ocupado
                      if (ocupacaoDetalhada.percentualOcupacao >= 100) {
                        bgColor = 'bg-red-500';
                        label = 'OC';
                      } else if (ocupacaoDetalhada.percentualOcupacao >= 50) {
                        bgColor = 'bg-amber-500';
                        label = `${ocupacaoDetalhada.percentualOcupacao}%`;
                      } else {
                        bgColor = 'bg-emerald-500';
                        label = `${ocupacaoDetalhada.percentualOcupacao}%`;
                      }
                    }
                    
                    return (
                      <TooltipProvider key={dia.toISOString()}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`w-14 min-w-14 p-0.5 border-r flex flex-col items-center justify-center gap-0.5 ${
                                isToday 
                                  ? 'bg-primary/10' 
                                  : isFimDeSemana 
                                    ? 'bg-orange-50 dark:bg-orange-900/20' 
                                    : ''
                              }`}
                            >
                              <span
                                className={`w-10 h-5 rounded flex items-center justify-center text-[9px] font-bold ${bgColor} text-white`}
                              >
                                {label}
                              </span>
                              {temDisponibilidade && temOcupacoes && ocupacaoDetalhada.percentualOcupacao < 100 && (
                                <Progress 
                                  value={ocupacaoDetalhada.percentualOcupacao} 
                                  className="h-1 w-10"
                                />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-2">
                              <div className="font-medium">{recurso.nome}</div>
                              <div className="text-xs">{format(dia, 'dd/MM/yyyy')}</div>
                              
                              {status === 'IN' ? (
                                <div className="text-xs text-muted-foreground">
                                  Recurso indisponível nesta data
                                </div>
                              ) : (
                                <>
                                  {horario && (
                                    <div className="text-xs">
                                      <Clock className="inline w-3 h-3 mr-1" />
                                      Disponível: {horario}
                                    </div>
                                  )}
                                  
                                  {temDisponibilidade && (
                                    <div className="pt-1 border-t space-y-1">
                                      <div className="flex justify-between text-xs">
                                        <span>Total disponível:</span>
                                        <span className="font-medium">{formatarMinutos(ocupacaoDetalhada.totalDisponivel)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span>Ocupado:</span>
                                        <span className="font-medium text-amber-600">{formatarMinutos(ocupacaoDetalhada.totalOcupado)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span>Livre para uso:</span>
                                        <span className="font-medium text-emerald-600">{formatarMinutos(ocupacaoDetalhada.tempoLivre)}</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {temOcupacoes && (
                                    <div className="pt-1 border-t">
                                      <div className="text-xs font-medium mb-1">Gravações alocadas:</div>
                                      {ocupacaoDetalhada.ocupacoes.map((oc, idx) => (
                                        <div key={idx} className="text-xs flex items-center gap-1 py-0.5">
                                          <Film className="w-3 h-3 text-muted-foreground" />
                                          <span className="font-medium">{oc.gravacaoNome}</span>
                                          <span className="text-muted-foreground">
                                            ({oc.horaInicio} - {oc.horaFim})
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
