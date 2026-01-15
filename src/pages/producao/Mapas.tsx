import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar, ChevronLeft, ChevronRight, Filter, MapPin, Users, CalendarDays, CalendarRange, FileDown, Loader2 } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';

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
  alocacoes: Record<string, number>;
  recursosHumanos: Record<string, RecursoHumanoAlocado[]>;
  horarios: Record<string, HorarioOcupacao>;
}

interface Gravacao {
  id: string;
  nome: string;
  codigoExterno: string;
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

  // Refs para exportação PDF
  const fisicosRef = useRef<HTMLDivElement>(null);
  const humanosRef = useRef<HTMLDivElement>(null);

  // Carregar dados do localStorage
  const [gravacoes, setGravacoes] = useState<Gravacao[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<RecursoFisico[]>([]);
  const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([]);
  const [alocacoesPorGravacao, setAlocacoesPorGravacao] = useState<Record<string, RecursoAlocado[]>>({});
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);

  useEffect(() => {
    // Carregar gravações
    const storedGravacoes = localStorage.getItem('kreato_gravacoes');
    const gravacoesList: Gravacao[] = storedGravacoes ? JSON.parse(storedGravacoes) : [];
    setGravacoes(gravacoesList);

    // Carregar recursos físicos
    const storedFisicos = localStorage.getItem('kreato_recursos_fisicos');
    setRecursosFisicos(storedFisicos ? JSON.parse(storedFisicos) : []);

    // Carregar recursos humanos
    const storedHumanos = localStorage.getItem('kreato_recursos_humanos');
    setRecursosHumanos(storedHumanos ? JSON.parse(storedHumanos) : []);

    // Carregar tarefas
    const storedTarefas = localStorage.getItem('kreato_tarefas');
    setTarefas(storedTarefas ? JSON.parse(storedTarefas) : []);

    // Carregar alocações de cada gravação
    const alocacoes: Record<string, RecursoAlocado[]> = {};
    gravacoesList.forEach((g) => {
      const stored = localStorage.getItem(`kreato_gravacao_recursos_${g.id}`);
      if (stored) {
        alocacoes[g.id] = JSON.parse(stored);
      }
    });
    setAlocacoesPorGravacao(alocacoes);
  }, []);

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

  // Calcular ocupações de recursos físicos baseado nas alocações
  const ocupacoesFisicas = useMemo(() => {
    const ocupacoes: Record<string, Record<string, OcupacaoItem[]>> = {};

    Object.entries(alocacoesPorGravacao).forEach(([gravacaoId, recursos]) => {
      const gravacao = gravacoes.find((g) => g.id === gravacaoId);
      if (!gravacao) return;

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

              if (!ocupacoes[recurso.recursoId][dia]) {
                ocupacoes[recurso.recursoId][dia] = [];
              }

              ocupacoes[recurso.recursoId][dia].push({
                gravacao: gravacao.nome,
                gravacaoId: gravacao.id,
                horario: horarioStr,
              });
            }
          });
        });
    });

    return ocupacoes;
  }, [alocacoesPorGravacao, gravacoes]);

  // Calcular ocupações de recursos humanos baseado nas alocações
  const ocupacoesHumanas = useMemo(() => {
    const ocupacoes: Record<string, Record<string, OcupacaoItem[]>> = {};

    Object.entries(alocacoesPorGravacao).forEach(([gravacaoId, recursos]) => {
      const gravacao = gravacoes.find((g) => g.id === gravacaoId);
      if (!gravacao) return;

      recursos
        .filter((r) => r.tipo === 'tecnico')
        .forEach((recurso) => {
          Object.entries(recurso.recursosHumanos || {}).forEach(([dia, rhList]) => {
            rhList.forEach((rh) => {
              if (!ocupacoes[rh.recursoHumanoId]) {
                ocupacoes[rh.recursoHumanoId] = {};
              }

              if (!ocupacoes[rh.recursoHumanoId][dia]) {
                ocupacoes[rh.recursoHumanoId][dia] = [];
              }

              // Buscar a tarefa correspondente para obter a cor do status (considerando a data)
              const tarefaCorrespondente = tarefas.find(
                (t) =>
                  t.gravacaoId === gravacaoId &&
                  t.recursoHumanoId === rh.recursoHumanoId &&
                  t.recursoTecnicoId === recurso.recursoId &&
                  t.dataInicio === dia
              );

              ocupacoes[rh.recursoHumanoId][dia].push({
                gravacao: gravacao.nome,
                gravacaoId: gravacao.id,
                horario: `${rh.horaInicio} - ${rh.horaFim}`,
                recursoHumanoId: rh.recursoHumanoId,
                statusCor: tarefaCorrespondente?.statusCor,
              });
            });
          });
        });
    });

    return ocupacoes;
  }, [alocacoesPorGravacao, gravacoes, tarefas]);

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

  const filteredRecursosFisicos = recursosFisicos.filter((r) => {
    const matchTipo = filtroTipoFisico === 'Todos' || r.tipo === filtroTipoFisico;
    const matchNome = r.nome.toLowerCase().includes(filtroNomeFisico.toLowerCase());
    return matchTipo && matchNome;
  });

  const filteredRecursosHumanos = recursosHumanos.filter((r) => {
    const matchFuncao =
      filtroFuncaoHumano === 'Todas' ||
      r.funcao === filtroFuncaoHumano;
    const matchNome = r.nome.toLowerCase().includes(filtroNomeHumano.toLowerCase());
    return matchFuncao && matchNome;
  });

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
    emptyMessage: string
  ) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">Recurso</TableHead>
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
                  return (
                    <TableCell 
                      key={day.toISOString()} 
                      className={`text-center p-1 ${isWeekend ? 'bg-muted/50' : ''}`}
                    >
                      {ocupacoesDia.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {ocupacoesDia.map((oc, idx) => (
                            <div
                              key={idx}
                              className={`bg-primary/10 border border-primary/30 rounded text-xs ${viewMode === 'month' ? 'p-0.5' : 'p-1.5'}`}
                            >
                              <div className="font-medium text-primary truncate" title={oc.gravacao}>
                                {viewMode === 'month' ? oc.gravacao.substring(0, 8) + (oc.gravacao.length > 8 ? '...' : '') : oc.gravacao}
                              </div>
                              {viewMode === 'week' && (
                                <div className="text-muted-foreground">{oc.horario}</div>
                              )}
                            </div>
                          ))}
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
                                  return (
                                    <div
                                      key={idx}
                                      className={`rounded text-xs ${viewMode === 'month' ? 'p-0.5' : 'p-1.5'}`}
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
                                        title={oc.gravacao}
                                        style={bgColor ? { color: bgColor } : { color: 'hsl(var(--primary))' }}
                                      >
                                        {viewMode === 'month' ? oc.gravacao.substring(0, 8) + (oc.gravacao.length > 8 ? '...' : '') : oc.gravacao}
                                      </div>
                                      {viewMode === 'week' && (
                                        <div className="text-muted-foreground">{oc.horario}</div>
                                      )}
                                    </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Mapas de Ocupação</h1>
        <div className="flex items-center gap-2">
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
                  'Nenhum recurso físico encontrado. Cadastre recursos físicos e aloque-os em gravações.'
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
      </Tabs>
    </div>
  );
};

export default Mapas;
