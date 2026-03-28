import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getDateLocale, getDayAbbreviations } from '@/lib/dateLocale';
import { useLanguage } from '@/contexts/LanguageContext';
import { recursosHumanosRepository } from '@/modules/recursos-humanos/recursos-humanos.repository.provider';
import type { RecursoHumano } from '@/modules/recursos-humanos/recursos-humanos.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recursos: RecursoHumano[];
}

type ViewMode = 'semana' | 'mes' | 'periodo';

const colorByIdle = (idleMinutes: number, totalMinutes: number) => {
  if (totalMinutes === 0) return { bg: 'bg-muted/30', text: 'text-muted-foreground' };
  const idlePercent = (idleMinutes / totalMinutes) * 100;
  if (idlePercent >= 100) return { bg: 'bg-red-400', text: 'text-white' };
  if (idlePercent >= 80) return { bg: 'bg-red-300', text: 'text-red-900' };
  if (idlePercent >= 60) return { bg: 'bg-orange-300', text: 'text-orange-900' };
  if (idlePercent >= 40) return { bg: 'bg-amber-300', text: 'text-amber-900' };
  if (idlePercent >= 20) return { bg: 'bg-yellow-200', text: 'text-yellow-900' };
  if (idlePercent > 0) return { bg: 'bg-lime-300', text: 'text-lime-900' };
  return { bg: 'bg-green-300', text: 'text-green-900' };
};

const formatMinutes = (minutes: number) => {
  if (minutes === 0) return '0h';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m.toString().padStart(2, '0')}`;
};

export function MapaOciosidadeModal({ isOpen, onClose, recursos }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('mes');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [loading, setLoading] = useState(false);
  const [ocupacoes, setOcupacoes] = useState<Record<string, Record<string, number>>>({});
  const { language } = useLanguage();
  const dateLocale = getDateLocale(language);
  const diasSemana = getDayAbbreviations(language);

  const recursosPorDepartamento = useMemo(() => {
    const groups: Record<string, RecursoHumano[]> = {};
    recursos.forEach((recurso) => {
      const key = recurso.departamento || 'Sem Departamento';
      groups[key] = [...(groups[key] || []), recurso].sort((a, b) => a.nome.localeCompare(b.nome));
    });
    return groups;
  }, [recursos]);

  const diasExibidos = useMemo(() => {
    if (viewMode === 'semana')
      return eachDayOfInterval({
        start: startOfWeek(currentDate, { locale: dateLocale }),
        end: endOfWeek(currentDate, { locale: dateLocale }),
      });
    if (viewMode === 'mes')
      return eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
    if (periodoInicio && periodoFim) {
      try {
        const inicio = parseISO(periodoInicio);
        const fim = parseISO(periodoFim);
        if (fim >= inicio) return eachDayOfInterval({ start: inicio, end: fim });
      } catch {
        return [];
      }
    }
    return [];
  }, [viewMode, currentDate, periodoInicio, periodoFim, dateLocale]);

  useEffect(() => {
    if (!isOpen || diasExibidos.length === 0) return;
    let mounted = true;
    const dataInicio = format(diasExibidos[0], 'yyyy-MM-dd');
    const dataFim = format(diasExibidos[diasExibidos.length - 1], 'yyyy-MM-dd');
    setLoading(true);
    recursosHumanosRepository
      .listOcupacoes(dataInicio, dataFim)
      .then((rows) => {
        if (!mounted) return;
        const next: Record<string, Record<string, number>> = {};
        rows.forEach((item) => {
          const [hi, mi] = item.horaInicio.substring(0, 5).split(':').map(Number);
          const [hf, mf] = item.horaFim.substring(0, 5).split(':').map(Number);
          const minutos = Math.max(0, hf * 60 + mf - (hi * 60 + mi));
          next[item.recursoId] = next[item.recursoId] || {};
          next[item.recursoId][item.data] = (next[item.recursoId][item.data] || 0) + minutos;
        });
        setOcupacoes(next);
      })
      .catch((error) => {
        console.error('Error fetching ocupacoes RH:', error);
        if (mounted) setOcupacoes({});
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [diasExibidos, isOpen]);

  const escalaMinutos = (recurso: RecursoHumano, dia: Date) => {
    if (
      recurso.ausencias.some((ausencia) => {
        try {
          return isWithinInterval(dia, {
            start: parseISO(ausencia.dataInicio),
            end: parseISO(ausencia.dataFim),
          });
        } catch {
          return false;
        }
      })
    )
      return 0;
    const diaNum = getDay(dia);
    return recurso.escalas.reduce((sum, escala) => {
      try {
        if (
          !isWithinInterval(dia, {
            start: parseISO(escala.dataInicio),
            end: parseISO(escala.dataFim),
          })
        )
          return sum;
        const dias = escala.diasSemana?.length > 0 ? escala.diasSemana : [1, 2, 3, 4, 5];
        if (!dias.includes(diaNum)) return sum;
        const [hi, mi] = escala.horaInicio.split(':').map(Number);
        const [hf, mf] = escala.horaFim.split(':').map(Number);
        return sum + (hf * 60 + mf - (hi * 60 + mi));
      } catch {
        return sum;
      }
    }, 0);
  };

  const titulo = () => {
    if (viewMode === 'semana')
      return `${format(startOfWeek(currentDate, { locale: dateLocale }), 'dd/MM', { locale: dateLocale })} - ${format(endOfWeek(currentDate, { locale: dateLocale }), 'dd/MM/yyyy', { locale: dateLocale })}`;
    if (viewMode === 'mes') return format(currentDate, 'MMMM yyyy', { locale: dateLocale });
    return periodoInicio && periodoFim
      ? `${format(parseISO(periodoInicio), 'dd/MM/yyyy')} - ${format(parseISO(periodoFim), 'dd/MM/yyyy')}`
      : 'Selecione um periodo';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Mapa de Ociosidade
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Visualizacao:</Label>
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="mes">Mes</SelectItem>
                <SelectItem value="periodo">Periodo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {viewMode === 'periodo' ? (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
                className="w-36"
              />
              <span className="text-muted-foreground">ate</span>
              <Input
                type="date"
                value={periodoFim}
                onChange={(e) => setPeriodoFim(e.target.value)}
                className="w-36"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentDate((prev) =>
                    viewMode === 'semana'
                      ? new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000)
                      : subMonths(prev, 1),
                  )
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="min-w-[180px] text-center font-medium capitalize">{titulo()}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentDate((prev) =>
                    viewMode === 'semana'
                      ? new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000)
                      : addMonths(prev, 1),
                  )
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto text-xs">
            <span className="font-medium">Legenda:</span>
            <span className="w-5 h-4 bg-green-300 rounded" />
            <span>0%</span>
            <span className="w-5 h-4 bg-yellow-200 rounded" />
            <span>20%</span>
            <span className="w-5 h-4 bg-amber-300 rounded" />
            <span>40%</span>
            <span className="w-5 h-4 bg-orange-300 rounded" />
            <span>60%</span>
            <span className="w-5 h-4 bg-red-300 rounded" />
            <span>80%</span>
            <span className="w-5 h-4 bg-red-400 rounded" />
            <span>100%</span>
            {loading && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Carregando...
              </span>
            )}
          </div>
        </div>
        <ScrollArea className="h-[calc(90vh-200px)] border rounded-lg">
          <div className="min-w-max">
            <div className="flex sticky top-0 bg-background z-10 border-b">
              <div className="w-48 min-w-48 px-3 py-2 font-medium text-sm border-r bg-muted/50 flex items-center">
                Colaborador
              </div>
              {diasExibidos.map((dia) => {
                const weekEnd = [0, 6].includes(getDay(dia));
                return (
                  <div
                    key={dia.toISOString()}
                    className={`w-12 min-w-12 px-1 py-2 text-center text-xs border-r ${weekEnd ? 'bg-orange-100' : 'bg-muted/30'}`}
                  >
                    <div className="font-medium">{format(dia, 'dd')}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {diasSemana[getDay(dia)]}
                    </div>
                  </div>
                );
              })}
            </div>
            {Object.entries(recursosPorDepartamento)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([departamento, lista]) => (
                <div key={departamento}>
                  <div className="flex bg-muted/50 border-b">
                    <div className="w-48 min-w-48 px-3 py-1.5 font-semibold text-xs text-muted-foreground border-r">
                      {departamento}
                    </div>
                    {diasExibidos.map((dia) => (
                      <div key={dia.toISOString()} className="w-12 min-w-12 border-r" />
                    ))}
                  </div>
                  {lista.map((recurso) => (
                    <div key={recurso.id} className="flex border-b hover:bg-muted/20">
                      <div className="w-48 min-w-48 px-3 py-1.5 text-xs border-r truncate">
                        {recurso.nome} {recurso.sobrenome}
                      </div>
                      {diasExibidos.map((dia) => {
                        const diaStr = format(dia, 'yyyy-MM-dd');
                        const total = escalaMinutos(recurso, dia);
                        if (total === 0)
                          return (
                            <div
                              key={dia.toISOString()}
                              className={`w-12 min-w-12 p-0.5 border-r flex items-center justify-center ${[0, 6].includes(getDay(dia)) ? 'bg-orange-100' : ''}`}
                            />
                          );
                        const ocupado = ocupacoes[recurso.id]?.[diaStr] || 0;
                        const ocioso = Math.max(0, total - ocupado);
                        const percent = Math.round((ocioso / total) * 100);
                        const colors = colorByIdle(ocioso, total);
                        const faixas = recurso.escalas.filter((escala) => {
                          try {
                            const dias =
                              escala.diasSemana?.length > 0 ? escala.diasSemana : [1, 2, 3, 4, 5];
                            return (
                              isWithinInterval(dia, {
                                start: parseISO(escala.dataInicio),
                                end: parseISO(escala.dataFim),
                              }) && dias.includes(getDay(dia))
                            );
                          } catch {
                            return false;
                          }
                        });
                        return (
                          <div
                            key={dia.toISOString()}
                            className={`w-12 min-w-12 p-0.5 border-r flex items-center justify-center ${[0, 6].includes(getDay(dia)) ? 'bg-orange-100' : ''}`}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className={`w-10 h-5 rounded flex items-center justify-center text-[9px] font-bold cursor-default ${colors.bg} ${colors.text}`}
                                  >
                                    {formatMinutes(ocioso)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[220px]">
                                  <div className="text-xs space-y-1">
                                    <div className="font-semibold">
                                      {recurso.nome} {recurso.sobrenome}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {format(dia, 'dd/MM/yyyy')}
                                    </div>
                                    <div className="border-t pt-1 mt-1 space-y-0.5">
                                      <div className="font-medium">Escalas:</div>
                                      {faixas.map((faixa) => (
                                        <div key={faixa.id}>
                                          {faixa.horaInicio} - {faixa.horaFim}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="border-t pt-1 mt-1 space-y-0.5">
                                      <div>Escala total: {formatMinutes(total)}</div>
                                      <div>Ocupado: {formatMinutes(ocupado)}</div>
                                      <div className="font-semibold">
                                        Ocioso: {formatMinutes(ocioso)} ({percent}%)
                                      </div>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
