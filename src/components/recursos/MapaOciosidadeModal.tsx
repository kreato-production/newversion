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
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
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
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import type { RecursoHumano } from '@/pages/recursos/RecursosHumanos';

interface MapaOciosidadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recursos: RecursoHumano[];
}

type ViewMode = 'semana' | 'mes' | 'periodo';

const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Color scale: Red (high idle) → Orange → Yellow → Green (low/no idle)
// percentage = idle percentage (0-100)
const getIdleColor = (idleMinutes: number, totalMinutes: number): { bg: string; text: string } => {
  if (totalMinutes === 0) return { bg: 'bg-muted/30', text: 'text-muted-foreground' };
  
  const idlePercent = (idleMinutes / totalMinutes) * 100;
  
  if (idlePercent >= 100) return { bg: 'bg-red-600', text: 'text-white' };
  if (idlePercent >= 80) return { bg: 'bg-red-500', text: 'text-white' };
  if (idlePercent >= 60) return { bg: 'bg-orange-500', text: 'text-white' };
  if (idlePercent >= 40) return { bg: 'bg-amber-500', text: 'text-white' };
  if (idlePercent >= 20) return { bg: 'bg-yellow-400', text: 'text-black' };
  if (idlePercent > 0) return { bg: 'bg-lime-500', text: 'text-white' };
  return { bg: 'bg-green-600', text: 'text-white' };
};

const formatMinutesToHours = (minutes: number): string => {
  if (minutes === 0) return '0h';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
};

export const MapaOciosidadeModal = ({
  isOpen,
  onClose,
  recursos,
}: MapaOciosidadeModalProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('mes');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');

  // Allocation data from DB
  const [ocupacoes, setOcupacoes] = useState<Record<string, Record<string, number>>>({});

  // Fetch allocation data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchOcupacoes = async () => {
      // Fetch all tasks with gravacao dates
      const { data: tarefasData } = await supabase
        .from('tarefas')
        .select('id, gravacao_id, recurso_humano_id, data_inicio')
        .not('recurso_humano_id', 'is', null)
        .not('data_inicio', 'is', null);

      // Fetch gravacao dates
      const { data: gravacoesData } = await supabase
        .from('gravacoes')
        .select('id, data_prevista');

      const gravacaoDateMap: Record<string, string> = {};
      (gravacoesData || []).forEach((g: any) => {
        if (g.data_prevista) gravacaoDateMap[g.id] = g.data_prevista;
      });

      // Fetch all allocation hours
      const { data: alocacoesData } = await supabase
        .from('gravacao_recursos')
        .select('gravacao_id, recurso_humano_id, hora_inicio, hora_fim')
        .not('recurso_humano_id', 'is', null);

      // Build map: rhId -> gravacaoId -> { horaInicio, horaFim }
      const alocHorarios: Record<string, Record<string, { horaInicio: string; horaFim: string }>> = {};
      (alocacoesData || []).forEach((a: any) => {
        if (!a.recurso_humano_id || !a.hora_inicio || !a.hora_fim) return;
        if (!alocHorarios[a.recurso_humano_id]) alocHorarios[a.recurso_humano_id] = {};
        alocHorarios[a.recurso_humano_id][a.gravacao_id] = {
          horaInicio: a.hora_inicio.substring(0, 5),
          horaFim: a.hora_fim.substring(0, 5),
        };
      });

      // Calculate occupied minutes per RH per day
      const result: Record<string, Record<string, number>> = {};

      (tarefasData || []).forEach((t: any) => {
        if (!t.recurso_humano_id || !t.gravacao_id) return;
        const dia = t.data_inicio;
        if (!dia) return;

        const rhId = t.recurso_humano_id;
        if (!result[rhId]) result[rhId] = {};

        // Get allocated hours for this RH in this gravacao
        const horario = alocHorarios[rhId]?.[t.gravacao_id];
        let duracaoMinutos = 0;
        if (horario) {
          const [hi, mi] = horario.horaInicio.split(':').map(Number);
          const [hf, mf] = horario.horaFim.split(':').map(Number);
          duracaoMinutos = (hf * 60 + mf) - (hi * 60 + mi);
          if (duracaoMinutos < 0) duracaoMinutos = 0;
        }

        result[rhId][dia] = (result[rhId][dia] || 0) + duracaoMinutos;
      });

      setOcupacoes(result);
    };

    fetchOcupacoes();
  }, [isOpen]);

  // Group resources by department
  const recursosPorDepartamento = useMemo(() => {
    const grupos: Record<string, RecursoHumano[]> = {};
    recursos.forEach((recurso) => {
      const dept = recurso.departamento || 'Sem Departamento';
      if (!grupos[dept]) grupos[dept] = [];
      grupos[dept].push(recurso);
    });
    Object.keys(grupos).forEach((dept) => {
      grupos[dept].sort((a, b) => a.nome.localeCompare(b.nome));
    });
    return grupos;
  }, [recursos]);

  // Calculate display days
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
        if (fim >= inicio) return eachDayOfInterval({ start: inicio, end: fim });
      } catch { /* empty */ }
    }
    return [];
  }, [viewMode, currentDate, periodoInicio, periodoFim]);

  // Get total scale minutes for a resource on a specific day
  const getEscalaMinutos = (recurso: RecursoHumano, dia: Date): number => {
    if (!recurso.escalas || recurso.escalas.length === 0) return 0;
    
    const diaNum = getDay(dia);
    let totalMinutos = 0;

    // Check if absent
    if (recurso.ausencias && recurso.ausencias.length > 0) {
      const estaAusente = recurso.ausencias.some((ausencia) => {
        try {
          const inicio = parseISO(ausencia.dataInicio);
          const fim = parseISO(ausencia.dataFim);
          return isWithinInterval(dia, { start: inicio, end: fim });
        } catch { return false; }
      });
      if (estaAusente) return 0; // Absent = no scale = no idle
    }

    recurso.escalas.forEach((escala) => {
      try {
        const inicio = parseISO(escala.dataInicio);
        const fim = parseISO(escala.dataFim);
        if (!isWithinInterval(dia, { start: inicio, end: fim })) return;

        const diasSemana = escala.diasSemana && escala.diasSemana.length > 0 ? escala.diasSemana : [1, 2, 3, 4, 5];
        if (!diasSemana.includes(diaNum)) return;

        const [hi, mi] = escala.horaInicio.split(':').map(Number);
        const [hf, mf] = escala.horaFim.split(':').map(Number);
        totalMinutos += (hf * 60 + mf) - (hi * 60 + mi);
      } catch { /* empty */ }
    });

    return totalMinutos;
  };

  // Get occupied minutes for a resource on a specific day
  const getOcupadoMinutos = (rhId: string, diaStr: string): number => {
    return ocupacoes[rhId]?.[diaStr] || 0;
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
            <Clock className="w-5 h-5" />
            Mapa de Ociosidade
          </DialogTitle>
        </DialogHeader>

        {/* Controls */}
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

          {/* Legend */}
          <div className="flex items-center gap-2 ml-auto text-xs">
            <span className="font-medium">Legenda:</span>
            <div className="flex items-center gap-1">
              <span className="w-5 h-4 bg-green-600 rounded" />
              <span>0%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-5 h-4 bg-yellow-400 rounded" />
              <span>20%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-5 h-4 bg-amber-500 rounded" />
              <span>40%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-5 h-4 bg-orange-500 rounded" />
              <span>60%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-5 h-4 bg-red-500 rounded" />
              <span>80%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-5 h-4 bg-red-600 rounded" />
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Map */}
        <ScrollArea className="h-[calc(90vh-200px)] border rounded-lg">
          <div className="min-w-max">
            {/* Header with days */}
            <div className="flex sticky top-0 bg-background z-10 border-b">
              <div className="w-48 min-w-48 px-3 py-2 font-medium text-sm border-r bg-muted/50 flex items-center">
                Colaborador
              </div>
              {diasExibidos.map((dia) => {
                const diaSemana = getDay(dia);
                const isFimDeSemana = diaSemana === 0 || diaSemana === 6;
                return (
                  <div
                    key={dia.toISOString()}
                    className={`w-12 min-w-12 px-1 py-2 text-center text-xs border-r ${
                      isFimDeSemana ? 'bg-orange-100' : 'bg-muted/30'
                    }`}
                  >
                    <div className="font-medium">{format(dia, 'dd')}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {DIAS_SEMANA_ABREV[diaSemana]}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Body with departments and collaborators */}
            {Object.entries(recursosPorDepartamento)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([departamento, recursosGrupo]) => (
                <div key={departamento}>
                  {/* Department header */}
                  <div className="flex bg-muted/50 border-b">
                    <div className="w-48 min-w-48 px-3 py-1.5 font-semibold text-xs text-muted-foreground border-r">
                      {departamento}
                    </div>
                    {diasExibidos.map((dia) => (
                      <div key={dia.toISOString()} className="w-12 min-w-12 border-r" />
                    ))}
                  </div>

                  {/* Collaborators */}
                  {recursosGrupo.map((recurso) => (
                    <div key={recurso.id} className="flex border-b hover:bg-muted/20">
                      <div className="w-48 min-w-48 px-3 py-1.5 text-xs border-r truncate">
                        {recurso.nome} {recurso.sobrenome}
                      </div>
                      {diasExibidos.map((dia) => {
                        const diaStr = format(dia, 'yyyy-MM-dd');
                        const diaSemana = getDay(dia);
                        const isFimDeSemana = diaSemana === 0 || diaSemana === 6;
                        
                        const escalaMinutos = getEscalaMinutos(recurso, dia);
                        const ocupadoMinutos = getOcupadoMinutos(recurso.id, diaStr);
                        const ociosoMinutos = Math.max(0, escalaMinutos - ocupadoMinutos);
                        
                        // No scale = no cell content
                        if (escalaMinutos === 0) {
                          return (
                            <div
                              key={dia.toISOString()}
                              className={`w-12 min-w-12 p-0.5 border-r flex items-center justify-center ${isFimDeSemana ? 'bg-orange-100' : ''}`}
                            />
                          );
                        }

                        const colors = getIdleColor(ociosoMinutos, escalaMinutos);
                        const idlePercent = Math.round((ociosoMinutos / escalaMinutos) * 100);

                        // Get scale details for tooltip
                        const faixas: { horaInicio: string; horaFim: string }[] = [];
                        (recurso.escalas || []).forEach((escala) => {
                          try {
                            const inicio = parseISO(escala.dataInicio);
                            const fim = parseISO(escala.dataFim);
                            if (!isWithinInterval(dia, { start: inicio, end: fim })) return;
                            const diasSemana = escala.diasSemana?.length > 0 ? escala.diasSemana : [1, 2, 3, 4, 5];
                            if (!diasSemana.includes(diaSemana)) return;
                            faixas.push({ horaInicio: escala.horaInicio, horaFim: escala.horaFim });
                          } catch { /* empty */ }
                        });
                        faixas.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

                        return (
                          <div
                            key={dia.toISOString()}
                            className={`w-12 min-w-12 p-0.5 border-r flex items-center justify-center ${isFimDeSemana ? 'bg-orange-100' : ''}`}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className={`w-10 h-5 rounded flex items-center justify-center text-[9px] font-bold cursor-default ${colors.bg} ${colors.text}`}
                                  >
                                    {formatMinutesToHours(ociosoMinutos)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[220px]">
                                  <div className="text-xs space-y-1">
                                    <div className="font-semibold">{recurso.nome} {recurso.sobrenome}</div>
                                    <div className="text-muted-foreground">{format(dia, 'dd/MM/yyyy (EEEE)', { locale: ptBR })}</div>
                                    <div className="border-t pt-1 mt-1 space-y-0.5">
                                      <div className="font-medium">Escalas:</div>
                                      {faixas.map((f, i) => (
                                        <div key={i}>{f.horaInicio} - {f.horaFim}</div>
                                      ))}
                                    </div>
                                    <div className="border-t pt-1 mt-1 space-y-0.5">
                                      <div>Escala total: {formatMinutesToHours(escalaMinutos)}</div>
                                      <div>Ocupado: {formatMinutesToHours(ocupadoMinutos)}</div>
                                      <div className="font-semibold">Ocioso: {formatMinutesToHours(ociosoMinutos)} ({idlePercent}%)</div>
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
};
