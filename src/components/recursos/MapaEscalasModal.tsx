import { useState, useMemo } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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
import type { RecursoHumano, Escala} from '@/pages/recursos/RecursosHumanos';

interface MapaEscalasModalProps {
  isOpen: boolean;
  onClose: () => void;
  recursos: RecursoHumano[];
  onUpdateRecurso?: (recurso: RecursoHumano) => void;
}

type ViewMode = 'semana' | 'mes' | 'periodo';
type StatusType = 'FG' | 'AU' | 'DI';

const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const MapaEscalasModal = ({
  isOpen,
  onClose,
  recursos,
  onUpdateRecurso,
}: MapaEscalasModalProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('mes');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');

  // Agrupar recursos por departamento
  const recursosPorDepartamento = useMemo(() => {
    const grupos: Record<string, RecursoHumano[]> = {};
    
    recursos.forEach((recurso) => {
      const dept = recurso.departamento || 'Sem Departamento';
      if (!grupos[dept]) {
        grupos[dept] = [];
      }
      grupos[dept].push(recurso);
    });

    // Ordenar recursos dentro de cada grupo por nome
    Object.keys(grupos).forEach((dept) => {
      grupos[dept].sort((a, b) => a.nome.localeCompare(b.nome));
    });

    return grupos;
  }, [recursos]);

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

  // Verificar status do colaborador em um dia específico
  const getStatusDia = (recurso: RecursoHumano, dia: Date): 'FG' | 'AU' | 'DI' => {
    const diaNum = getDay(dia); // 0 = Domingo, 6 = Sábado

    // Verificar se está ausente
    if (recurso.ausencias && recurso.ausencias.length > 0) {
      const estaAusente = recurso.ausencias.some((ausencia) => {
        try {
          const inicio = parseISO(ausencia.dataInicio);
          const fim = parseISO(ausencia.dataFim);
          return isWithinInterval(dia, { start: inicio, end: fim });
        } catch {
          return false;
        }
      });
      if (estaAusente) return 'AU';
    }

    // Verificar se tem escala definida para este dia
    if (recurso.escalas && recurso.escalas.length > 0) {
      const temEscala = recurso.escalas.some((escala) => {
        try {
          const inicio = parseISO(escala.dataInicio);
          const fim = parseISO(escala.dataFim);
          const dentroDoIntervalo = isWithinInterval(dia, { start: inicio, end: fim });
          
          if (!dentroDoIntervalo) return false;

          // Se tem dias da semana definidos, verificar se o dia atual está incluído
          if (escala.diasSemana && escala.diasSemana.length > 0) {
            return escala.diasSemana.includes(diaNum);
          }

          // Se não tem dias específicos, considera todos os dias
          return true;
        } catch {
          return false;
        }
      });
      if (temEscala) return 'DI';
    }

    // Sem ausência e sem escala = Folga
    return 'FG';
  };

  const getStatusConfig = (status: 'FG' | 'AU' | 'DI') => {
    switch (status) {
      case 'FG':
        return {
          label: 'FG',
          bg: 'bg-green-500',
          text: 'text-white',
          title: 'Folga',
        };
      case 'AU':
        return {
          label: 'AU',
          bg: 'bg-orange-500',
          text: 'text-white',
          title: 'Ausente',
        };
      case 'DI':
        return {
          label: 'DI',
          bg: 'bg-blue-500',
          text: 'text-white',
          title: 'Disponível',
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
            <Calendar className="w-5 h-5" />
            Mapa de Escalas
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
          <div className="flex items-center gap-3 ml-auto text-xs">
            <span className="font-medium">Legenda:</span>
            <div className="flex items-center gap-1">
              <span className="w-6 h-5 bg-green-500 rounded flex items-center justify-center text-white text-[10px] font-bold">
                FG
              </span>
              <span>Folga</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-6 h-5 bg-orange-500 rounded flex items-center justify-center text-white text-[10px] font-bold">
                AU
              </span>
              <span>Ausente</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-6 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-[10px] font-bold">
                DI
              </span>
              <span>Disponível</span>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <ScrollArea className="h-[calc(90vh-200px)] border rounded-lg">
          <div className="min-w-max">
            {/* Cabeçalho com dias */}
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
                    className={`w-10 min-w-10 px-1 py-2 text-center text-xs border-r ${
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

            {/* Corpo com departamentos e colaboradores */}
            {Object.entries(recursosPorDepartamento)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([departamento, recursosGrupo]) => (
                <div key={departamento}>
                  {/* Header do departamento */}
                  <div className="flex bg-muted/50 border-b">
                    <div className="w-48 min-w-48 px-3 py-1.5 font-semibold text-xs text-muted-foreground border-r">
                      {departamento}
                    </div>
                    {diasExibidos.map((dia) => (
                      <div key={dia.toISOString()} className="w-10 min-w-10 border-r" />
                    ))}
                  </div>

                  {/* Colaboradores */}
                  {recursosGrupo.map((recurso) => (
                    <div key={recurso.id} className="flex border-b hover:bg-muted/20">
                      <div className="w-48 min-w-48 px-3 py-1.5 text-xs border-r truncate">
                        {recurso.nome} {recurso.sobrenome}
                      </div>
                      {diasExibidos.map((dia) => {
                        const status = getStatusDia(recurso, dia);
                        const config = getStatusConfig(status);
                        const diaSemana = getDay(dia);
                        const isFimDeSemana = diaSemana === 0 || diaSemana === 6;
                        const isEditable = status !== 'AU';
                        
                        const handleStatusChange = (newStatus: StatusType) => {
                          if (!onUpdateRecurso || newStatus === status) return;
                          
                          const diaStr = format(dia, 'yyyy-MM-dd');
                          const diaNum = getDay(dia);
                          let updatedRecurso = { ...recurso };
                          
                          if (newStatus === 'DI') {
                            // Adicionar escala para este dia específico
                            const novaEscala: Escala = {
                              id: crypto.randomUUID(),
                              dataInicio: diaStr,
                              horaInicio: '08:00',
                              dataFim: diaStr,
                              horaFim: '18:00',
                              diasSemana: [diaNum],
                            };
                            updatedRecurso.escalas = [...(recurso.escalas || []), novaEscala];
                          } else if (newStatus === 'FG') {
                            // Remover escala(s) que afetam este dia
                            updatedRecurso.escalas = (recurso.escalas || []).filter((escala) => {
                              try {
                                const inicio = parseISO(escala.dataInicio);
                                const fim = parseISO(escala.dataFim);
                                const dentroIntervalo = isWithinInterval(dia, { start: inicio, end: fim });
                                
                                if (!dentroIntervalo) return true;
                                
                                // Se é exatamente este dia, remover completamente
                                if (escala.dataInicio === diaStr && escala.dataFim === diaStr) {
                                  return false;
                                }
                                
                                // Se tem o dia da semana incluído, remover o dia da semana
                                if (escala.diasSemana?.includes(diaNum)) {
                                  escala.diasSemana = escala.diasSemana.filter(d => d !== diaNum);
                                  return escala.diasSemana.length > 0;
                                }
                                
                                return true;
                              } catch {
                                return true;
                              }
                            });
                          }
                          
                          onUpdateRecurso(updatedRecurso);
                        };
                        
                        return (
                          <div 
                            key={dia.toISOString()} 
                            className={`w-10 min-w-10 p-0.5 border-r flex items-center justify-center ${isFimDeSemana ? 'bg-orange-100' : ''}`}
                          >
                            {isEditable && onUpdateRecurso ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className={`w-7 h-5 rounded flex items-center justify-center text-[10px] font-bold cursor-pointer hover:opacity-80 transition-opacity ${config.bg} ${config.text}`}
                                  >
                                    {config.label}
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center" className="min-w-[100px] bg-background z-50">
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange('DI')}
                                    className={`flex items-center gap-2 cursor-pointer ${status === 'DI' ? 'bg-muted' : ''}`}
                                  >
                                    <span className="w-5 h-4 bg-blue-500 rounded flex items-center justify-center text-[9px] font-bold text-white">
                                      DI
                                    </span>
                                    <span className="text-xs">Disponível</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange('FG')}
                                    className={`flex items-center gap-2 cursor-pointer ${status === 'FG' ? 'bg-muted' : ''}`}
                                  >
                                    <span className="w-5 h-4 bg-green-500 rounded flex items-center justify-center text-[9px] font-bold text-white">
                                      FG
                                    </span>
                                    <span className="text-xs">Folga</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className={`w-7 h-5 rounded flex items-center justify-center text-[10px] font-bold ${config.bg} ${config.text}`}
                                    >
                                      {config.label}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">
                                      {recurso.nome} {recurso.sobrenome}
                                    </p>
                                    <p className="text-xs">
                                      {format(dia, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                                    </p>
                                    <p className="text-xs">
                                      Status: <span className="font-medium">{config.title}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground italic">
                                      (Ausências não podem ser alteradas aqui)
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}

            {recursos.length === 0 && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Nenhum colaborador cadastrado
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
