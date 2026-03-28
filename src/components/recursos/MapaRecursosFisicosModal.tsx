import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { getDateLocale, getDayAbbreviations } from '@/lib/dateLocale';
import { useLanguage } from '@/contexts/LanguageContext';
import type { RecursoFisico } from '@/modules/recursos-fisicos/recursos-fisicos.types';
import { useWeatherForecast } from '@/hooks/useWeatherForecast';
import { apiRequest } from '@/lib/api/http';

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

interface OcupacaoApiItem {
  recursoId: string;
  data: string;
  gravacaoId: string;
  gravacaoNome: string;
  horaInicio: string;
  horaFim: string;
}

interface MapaRecursosFisicosModalProps {
  isOpen: boolean;
  onClose: () => void;
  recursos: RecursoFisico[];
}

type ViewMode = 'semana' | 'mes' | 'periodo';
type StatusType = 'DI' | 'IN';

export const MapaRecursosFisicosModal = ({
  isOpen,
  onClose,
  recursos,
}: MapaRecursosFisicosModalProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('mes');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const { language } = useLanguage();
  const dateLocale = getDateLocale(language);
  const DIAS_SEMANA_ABREV = getDayAbbreviations(language);

  const { loading: weatherLoading, getWeatherForDate } = useWeatherForecast(16);
  const [ocupacoesMap, setOcupacoesMap] = useState<Record<string, OcupacaoData>>({});
  const [loadingOcupacoes, setLoadingOcupacoes] = useState(false);

  const horaParaMinutos = (hora: string): number => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  const formatarMinutos = (minutos: number): string => {
    if (minutos <= 0) return '0min';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas === 0) return `${mins}min`;
    if (mins === 0) return `${horas}h`;
    return `${horas}h${mins}min`;
  };

  const diasExibidos = useMemo(() => {
    if (viewMode === 'semana') {
      const inicio = startOfWeek(currentDate, { locale: dateLocale });
      const fim = endOfWeek(currentDate, { locale: dateLocale });
      return eachDayOfInterval({ start: inicio, end: fim });
    }

    if (viewMode === 'mes') {
      const inicio = startOfMonth(currentDate);
      const fim = endOfMonth(currentDate);
      return eachDayOfInterval({ start: inicio, end: fim });
    }

    if (viewMode === 'periodo' && periodoInicio && periodoFim) {
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
  }, [viewMode, currentDate, periodoInicio, periodoFim, dateLocale]);

  const getFaixasDisponiveis = (recursoId: string, dataStr: string) => {
    const recurso = recursos.find((item) => item.id === recursoId);
    if (!recurso || !recurso.faixasDisponibilidade) return [];

    const data = parseISO(dataStr);
    const diaSemana = getDay(data);

    return recurso.faixasDisponibilidade.filter((faixa) => {
      try {
        const inicio = parseISO(faixa.dataInicio);
        const fim = parseISO(faixa.dataFim);

        return (
          isWithinInterval(data, { start: inicio, end: fim }) &&
          faixa.diasSemana.includes(diaSemana)
        );
      } catch {
        return false;
      }
    });
  };

  useEffect(() => {
    const fetchOcupacoes = async () => {
      if (!isOpen || recursos.length === 0 || diasExibidos.length === 0) return;

      setLoadingOcupacoes(true);
      try {
        const dataInicio = format(diasExibidos[0], 'yyyy-MM-dd');
        const dataFim = format(diasExibidos[diasExibidos.length - 1], 'yyyy-MM-dd');
        const alocacoes = await apiRequest<OcupacaoApiItem[]>(
          `/recursos-fisicos/ocupacao?dataInicio=${dataInicio}&dataFim=${dataFim}`,
        );

        const newOcupacoesMap: Record<string, OcupacaoData> = {};

        for (const alocacao of alocacoes || []) {
          const key = `${alocacao.recursoId}_${alocacao.data}`;

          if (!newOcupacoesMap[key]) {
            const faixas = getFaixasDisponiveis(alocacao.recursoId, alocacao.data);
            const totalDisponivel = faixas.reduce((sum, faixa) => {
              return sum + (horaParaMinutos(faixa.horaFim) - horaParaMinutos(faixa.horaInicio));
            }, 0);

            newOcupacoesMap[key] = {
              recursoId: alocacao.recursoId,
              data: alocacao.data,
              ocupacoes: [],
              totalOcupado: 0,
              totalDisponivel,
              tempoLivre: totalDisponivel,
              percentualOcupacao: 0,
            };
          }

          const duracaoMinutos =
            horaParaMinutos(alocacao.horaFim) - horaParaMinutos(alocacao.horaInicio);

          newOcupacoesMap[key].ocupacoes.push({
            gravacaoId: alocacao.gravacaoId,
            gravacaoNome: alocacao.gravacaoNome,
            horaInicio: alocacao.horaInicio,
            horaFim: alocacao.horaFim,
            duracaoMinutos,
          });

          newOcupacoesMap[key].totalOcupado += Math.max(0, duracaoMinutos);
        }

        for (const key of Object.keys(newOcupacoesMap)) {
          const item = newOcupacoesMap[key];
          item.tempoLivre = Math.max(0, item.totalDisponivel - item.totalOcupado);
          item.percentualOcupacao =
            item.totalDisponivel > 0
              ? Math.round((item.totalOcupado / item.totalDisponivel) * 100)
              : 0;
        }

        setOcupacoesMap(newOcupacoesMap);
      } catch (error) {
        console.error('Erro ao buscar ocupacoes:', error);
        setOcupacoesMap({});
      } finally {
        setLoadingOcupacoes(false);
      }
    };

    fetchOcupacoes();
  }, [isOpen, recursos, diasExibidos]);

  const isWithinForecastRange = (dia: Date): boolean => {
    const today = new Date();
    const maxDate = addDays(today, 15);
    return dia >= today && dia <= maxDate;
  };

  const getStatusDia = (recurso: RecursoFisico, dia: Date): StatusType => {
    const diaNum = getDay(dia);

    if (!recurso.faixasDisponibilidade || recurso.faixasDisponibilidade.length === 0) {
      return 'IN';
    }

    const temDisponibilidade = recurso.faixasDisponibilidade.some((faixa) => {
      try {
        const inicio = parseISO(faixa.dataInicio);
        const fim = parseISO(faixa.dataFim);
        return (
          isWithinInterval(dia, { start: inicio, end: fim }) && faixa.diasSemana.includes(diaNum)
        );
      } catch {
        return false;
      }
    });

    return temDisponibilidade ? 'DI' : 'IN';
  };

  const getHorarioDisponivel = (recurso: RecursoFisico, dia: Date): string | null => {
    const diaNum = getDay(dia);

    for (const faixa of recurso.faixasDisponibilidade || []) {
      try {
        const inicio = parseISO(faixa.dataInicio);
        const fim = parseISO(faixa.dataFim);
        if (
          isWithinInterval(dia, { start: inicio, end: fim }) &&
          faixa.diasSemana.includes(diaNum)
        ) {
          return `${faixa.horaInicio} - ${faixa.horaFim}`;
        }
      } catch {
        continue;
      }
    }

    return null;
  };

  const getStatusConfig = (status: StatusType) => {
    if (status === 'DI') {
      return {
        label: 'DI',
        bg: 'bg-emerald-500',
        text: 'text-white',
        title: 'Disponível',
      };
    }

    return {
      label: 'IN',
      bg: 'bg-gray-400',
      text: 'text-white',
      title: 'Indisponível',
    };
  };

  const handlePrevious = () => {
    if (viewMode === 'semana') {
      setCurrentDate((prev) => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
      return;
    }

    if (viewMode === 'mes') {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'semana') {
      setCurrentDate((prev) => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
      return;
    }

    if (viewMode === 'mes') {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  const getTituloNavegacao = () => {
    if (viewMode === 'semana') {
      const inicio = startOfWeek(currentDate, { locale: dateLocale });
      const fim = endOfWeek(currentDate, { locale: dateLocale });
      return `${format(inicio, 'dd/MM', { locale: dateLocale })} - ${format(fim, 'dd/MM/yyyy', { locale: dateLocale })}`;
    }

    if (viewMode === 'mes') {
      return format(currentDate, 'MMMM yyyy', { locale: dateLocale });
    }

    if (periodoInicio && periodoFim) {
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

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Visualização:</Label>
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
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
            {(weatherLoading || loadingOcupacoes) && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{loadingOcupacoes ? 'Carregando ocupações...' : 'Carregando clima...'}</span>
              </div>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(90vh-200px)] border rounded-lg">
          <div className="min-w-max">
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
                              <span className="text-sm leading-none">
                                {weatherData.weatherIcon}
                              </span>
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
                            {format(dia, "EEEE, dd 'de' MMMM", { locale: dateLocale })}
                          </div>
                          {weatherData && (
                            <div className="mt-1 text-xs">
                              <span className="text-lg mr-1">{weatherData.weatherIcon}</span>
                              {weatherData.weatherDescription} - {weatherData.temperature}°C
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>

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
                    const ocupacaoKey = `${recurso.id}_${dataStr}`;
                    const ocupacaoData = ocupacoesMap[ocupacaoKey];
                    const faixas = getFaixasDisponiveis(recurso.id, dataStr);
                    const totalDisponivelCalc = faixas.reduce((sum, faixa) => {
                      return (
                        sum + (horaParaMinutos(faixa.horaFim) - horaParaMinutos(faixa.horaInicio))
                      );
                    }, 0);

                    const ocupacaoDetalhada: OcupacaoData = ocupacaoData || {
                      recursoId: recurso.id,
                      data: dataStr,
                      ocupacoes: [],
                      totalOcupado: 0,
                      totalDisponivel: totalDisponivelCalc,
                      tempoLivre: totalDisponivelCalc,
                      percentualOcupacao: 0,
                    };

                    const temOcupacoes = ocupacaoDetalhada.ocupacoes.length > 0;
                    const temDisponibilidade = ocupacaoDetalhada.totalDisponivel > 0;

                    let bgColor = config.bg;
                    let label = config.label;

                    if (status === 'DI' && temOcupacoes) {
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
                              {temDisponibilidade &&
                                temOcupacoes &&
                                ocupacaoDetalhada.percentualOcupacao < 100 && (
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
                                        <span className="font-medium">
                                          {formatarMinutos(ocupacaoDetalhada.totalDisponivel)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span>Ocupado:</span>
                                        <span className="font-medium text-amber-600">
                                          {formatarMinutos(ocupacaoDetalhada.totalOcupado)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span>Livre para uso:</span>
                                        <span className="font-medium text-emerald-600">
                                          {formatarMinutos(ocupacaoDetalhada.tempoLivre)}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {temOcupacoes && (
                                    <div className="pt-1 border-t">
                                      <div className="text-xs font-medium mb-1">
                                        Gravações alocadas:
                                      </div>
                                      {ocupacaoDetalhada.ocupacoes.map((ocupacao, index) => (
                                        <div
                                          key={index}
                                          className="text-xs flex items-center gap-1 py-0.5"
                                        >
                                          <Film className="w-3 h-3 text-muted-foreground" />
                                          <span className="font-medium">
                                            {ocupacao.gravacaoNome}
                                          </span>
                                          <span className="text-muted-foreground">
                                            ({ocupacao.horaInicio} - {ocupacao.horaFim})
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
