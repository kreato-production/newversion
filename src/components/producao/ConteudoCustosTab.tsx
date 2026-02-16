import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Calculator, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { ExportDropdown } from '@/components/shared/ExportDropdown';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency as formatCurrencyUtil } from '@/lib/currencies';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ConteudoCustosTabProps {
  conteudoId: string;
  conteudoNome?: string;
}

interface EstimadoItem {
  recursoTecnicoId: string;
  recursoNome: string;
  quantidade: number;
  quantidadeHoras: number;
  valorHora: number;
  valorTotal: number;
  descontoPercentual: number;
  valorComDesconto: number;
}

interface GravacaoDetalhe {
  gravacaoId: string;
  gravacaoNome: string;
  gravacaoCodigo: string;
  quantidade: number;
  totalHoras: number;
  valorUnitario: number;
  valorTotal: number;
}

interface DrillDownRow {
  gravacaoId: string;
  gravacaoNome: string;
  gravacaoCodigo: string;
  // Estimado por gravação (proporcional)
  estQuantidade: number;
  estHoras: number;
  estValorUnitario: number;
  estValorTotal: number;
  estDescontoPercentual: number;
  estValorComDesconto: number;
  // Realizado por gravação
  realQuantidade: number;
  realHoras: number;
  realValorUnitario: number;
  realValorTotal: number;
  // Resumo por gravação
  saldo: number;
  desvioPercentual: number;
}

interface RealizadoItem {
  recursoTecnicoId: string;
  recursoNome: string;
  quantidade: number;
  totalHoras: number;
  valorUnitarioMedio: number;
  valorTotal: number;
  detalhes: GravacaoDetalhe[];
}

interface MatrizRow {
  recursoNome: string;
  recursoTecnicoId: string;
  estimadoAcumulado: {
    quantidade: number;
    horas: number;
    valorUnitario: number;
    valorTotal: number;
    descontoPercentual: number;
    valorComDesconto: number;
  } | null;
  estimadoPorGravacao: EstimadoItem | null;
  realizado: RealizadoItem | null;
  drillDown: DrillDownRow[];
  saldo: number;
  desvioPercentual: number;
  progressPercent: number;
}

const calcularHorasEntreTempo = (inicio: string, fim: string): number => {
  if (!inicio || !fim) return 0;
  const [horaInicio, minInicio] = inicio.split(':').map(Number);
  const [horaFim, minFim] = fim.split(':').map(Number);
  const totalMinutosInicio = horaInicio * 60 + minInicio;
  const totalMinutosFim = horaFim * 60 + minFim;
  const diferencaMinutos = totalMinutosFim - totalMinutosInicio;
  return diferencaMinutos > 0 ? diferencaMinutos / 60 : 0;
};

export const ConteudoCustosTab = ({ conteudoId, conteudoNome }: ConteudoCustosTabProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [estimados, setEstimados] = useState<EstimadoItem[]>([]);
  const [realizados, setRealizados] = useState<RealizadoItem[]>([]);
  const [moeda, setMoeda] = useState<string>('BRL');
  const [numGravacoes, setNumGravacoes] = useState(0);
  const [gravacoesList, setGravacoesList] = useState<{ id: string; nome: string; codigo: string }[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (rtId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rtId)) next.delete(rtId);
      else next.add(rtId);
      return next;
    });
  };

  const formatCurrency = useCallback((value: number) => {
    return formatCurrencyUtil(value, moeda);
  }, [moeda]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch content data for currency
      const { data: conteudoData } = await supabase
        .from('conteudos')
        .select('unidade_negocio_id')
        .eq('id', conteudoId)
        .single();

      if (conteudoData?.unidade_negocio_id) {
        const { data: unidadeData } = await supabase
          .from('unidades_negocio')
          .select('moeda')
          .eq('id', conteudoData.unidade_negocio_id)
          .single();
        if (unidadeData?.moeda) setMoeda(unidadeData.moeda);
      }

      // Fetch planned resources (conteudo_recursos_tecnicos)
      const { data: planejadosData } = await supabase
        .from('conteudo_recursos_tecnicos')
        .select('*')
        .eq('conteudo_id', conteudoId);

      // Fetch RT names
      const rtIds = (planejadosData || []).map(p => p.recurso_tecnico_id);
      const { data: rtNamesData } = await supabase
        .from('recursos_tecnicos')
        .select('id, nome')
        .in('id', rtIds.length > 0 ? rtIds : ['__none__']);

      const rtNameMap = new Map((rtNamesData || []).map(r => [r.id, r.nome]));

      const estimadoItems: EstimadoItem[] = (planejadosData || []).map(p => ({
        recursoTecnicoId: p.recurso_tecnico_id,
        recursoNome: rtNameMap.get(p.recurso_tecnico_id) || 'Desconhecido',
        quantidade: p.quantidade,
        quantidadeHoras: Number(p.quantidade_horas),
        valorHora: Number(p.valor_hora),
        valorTotal: Number(p.valor_total),
        descontoPercentual: Number(p.desconto_percentual),
        valorComDesconto: Number(p.valor_com_desconto),
      }));
      setEstimados(estimadoItems);

      // Fetch all gravações for this content
      const { data: gravacoesData } = await supabase
        .from('gravacoes')
        .select('id, nome, codigo')
        .eq('conteudo_id', conteudoId);

      const gravacoes = gravacoesData || [];
      const gravacaoIds = gravacoes.map(g => g.id);
      const gravacaoMap = new Map(gravacoes.map(g => [g.id, { nome: g.nome, codigo: g.codigo }]));
      setNumGravacoes(gravacaoIds.length);
      setGravacoesList(gravacoes);

      if (gravacaoIds.length === 0) {
        setRealizados([]);
        setIsLoading(false);
        return;
      }

      // Fetch all resource allocations across all recordings
      const { data: alocsData } = await supabase
        .from('gravacao_recursos')
        .select(`
          id,
          gravacao_id,
          hora_inicio,
          hora_fim,
          recurso_humano_id,
          recurso_tecnico_id,
          recursos_humanos:recurso_humano_id(id, nome, sobrenome, custo_hora),
          recursos_tecnicos:recurso_tecnico_id(id, nome)
        `)
        .in('gravacao_id', gravacaoIds);

      const allAlocs = alocsData || [];

      // Group by recurso_tecnico_id, then by gravacao_id for drill-down
      const realizadoMap = new Map<string, {
        nome: string;
        porGravacao: Map<string, {
          quantidade: number;
          totalHoras: number;
          totalCusto: number;
          totalCustoHora: number;
          countCustoHora: number;
        }>;
      }>();

      allAlocs.forEach(aloc => {
        if (!aloc.recurso_tecnico_id) return;

        const rtId = aloc.recurso_tecnico_id;
        const rtNome = aloc.recursos_tecnicos?.nome || rtNameMap.get(rtId) || 'Desconhecido';
        const gravId = aloc.gravacao_id;

        if (!realizadoMap.has(rtId)) {
          realizadoMap.set(rtId, { nome: rtNome, porGravacao: new Map() });
        }

        const rtEntry = realizadoMap.get(rtId)!;
        if (!rtEntry.porGravacao.has(gravId)) {
          rtEntry.porGravacao.set(gravId, {
            quantidade: 0,
            totalHoras: 0,
            totalCusto: 0,
            totalCustoHora: 0,
            countCustoHora: 0,
          });
        }

        const gravEntry = rtEntry.porGravacao.get(gravId)!;

        if (aloc.recurso_humano_id && aloc.recursos_humanos) {
          const rh = aloc.recursos_humanos;
          const horas = calcularHorasEntreTempo(aloc.hora_inicio || '', aloc.hora_fim || '');
          const custoHora = rh.custo_hora || 0;

          gravEntry.quantidade += 1;
          gravEntry.totalHoras += horas;
          gravEntry.totalCusto += horas * custoHora;
          if (custoHora > 0) {
            gravEntry.totalCustoHora += custoHora;
            gravEntry.countCustoHora += 1;
          }
        } else if (!aloc.recurso_humano_id) {
          // Anchor record - count as quantity if no RH assigned yet
          gravEntry.quantidade = Math.max(gravEntry.quantidade, 1);
        }
      });

      const realizadoItems: RealizadoItem[] = Array.from(realizadoMap.entries()).map(([rtId, rtEntry]) => {
        let totalQtd = 0;
        let totalHoras = 0;
        let totalCusto = 0;
        let totalCustoHoraSum = 0;
        let countCustoHora = 0;
        const detalhes: GravacaoDetalhe[] = [];

        rtEntry.porGravacao.forEach((gEntry, gravId) => {
          const gravInfo = gravacaoMap.get(gravId);
          const avgCustoHora = gEntry.countCustoHora > 0 ? gEntry.totalCustoHora / gEntry.countCustoHora : 0;

          totalQtd += gEntry.quantidade;
          totalHoras += gEntry.totalHoras;
          totalCusto += gEntry.totalCusto;
          totalCustoHoraSum += gEntry.totalCustoHora;
          countCustoHora += gEntry.countCustoHora;

          detalhes.push({
            gravacaoId: gravId,
            gravacaoNome: gravInfo?.nome || 'Gravação',
            gravacaoCodigo: gravInfo?.codigo || '',
            quantidade: gEntry.quantidade,
            totalHoras: Math.round(gEntry.totalHoras * 10) / 10,
            valorUnitario: Math.round(avgCustoHora * 100) / 100,
            valorTotal: Math.round(gEntry.totalCusto * 100) / 100,
          });
        });

        const avgCustoHoraGlobal = countCustoHora > 0 ? totalCustoHoraSum / countCustoHora : 0;

        return {
          recursoTecnicoId: rtId,
          recursoNome: rtEntry.nome,
          quantidade: totalQtd,
          totalHoras: Math.round(totalHoras * 10) / 10,
          valorUnitarioMedio: Math.round(avgCustoHoraGlobal * 100) / 100,
          valorTotal: Math.round(totalCusto * 100) / 100,
          detalhes,
        };
      });

      setRealizados(realizadoItems);
    } catch (err) {
      console.error('Erro ao carregar dados de custos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conteudoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const matrizRows = useMemo((): MatrizRow[] => {
    const allRtIds = new Set<string>();
    const estimadoMap = new Map<string, EstimadoItem>();
    const realizadoMap = new Map<string, RealizadoItem>();

    estimados.forEach(e => {
      allRtIds.add(e.recursoTecnicoId);
      estimadoMap.set(e.recursoTecnicoId, e);
    });

    realizados.forEach(r => {
      allRtIds.add(r.recursoTecnicoId);
      realizadoMap.set(r.recursoTecnicoId, r);
    });

    return Array.from(allRtIds).map(rtId => {
      const est = estimadoMap.get(rtId) || null;
      const real = realizadoMap.get(rtId) || null;

      // Accumulated estimated = per-recording values × numGravacoes
      const estimadoAcumulado = est ? {
        quantidade: est.quantidade * numGravacoes,
        horas: est.quantidadeHoras * numGravacoes,
        valorUnitario: est.valorHora,
        valorTotal: est.valorTotal * numGravacoes,
        descontoPercentual: est.descontoPercentual,
        valorComDesconto: est.valorComDesconto * numGravacoes,
      } : null;

      const estimadoTotal = estimadoAcumulado?.valorTotal || 0;
      const realizadoTotal = real?.valorTotal || 0;
      const saldo = estimadoTotal - realizadoTotal;
      const desvioPercentual = realizadoTotal > estimadoTotal && estimadoTotal > 0
        ? Math.round(((realizadoTotal - estimadoTotal) / estimadoTotal) * 100)
        : 0;
      const progressPercent = estimadoTotal > 0
        ? Math.min(100, Math.round((realizadoTotal / estimadoTotal) * 100))
        : (realizadoTotal > 0 ? 100 : 0);

      // Build drill-down rows for ALL gravações
      const realDetalheMap = new Map<string, GravacaoDetalhe>();
      if (real?.detalhes) {
        real.detalhes.forEach(d => realDetalheMap.set(d.gravacaoId, d));
      }

      const drillDown: DrillDownRow[] = gravacoesList.map(grav => {
        const realDetalhe = realDetalheMap.get(grav.id);
        const estQtd = est?.quantidade || 0;
        const estHoras = est?.quantidadeHoras || 0;
        const estValorUnit = est?.valorHora || 0;
        const estTotal = est?.valorTotal || 0;
        const estDesc = est?.descontoPercentual || 0;
        const estComDesc = est?.valorComDesconto || 0;

        const realTotal = realDetalhe?.valorTotal || 0;
        const gravSaldo = estTotal - realTotal;
        const gravDesvio = realTotal > estTotal && estTotal > 0
          ? Math.round(((realTotal - estTotal) / estTotal) * 100)
          : 0;

        return {
          gravacaoId: grav.id,
          gravacaoNome: grav.nome,
          gravacaoCodigo: grav.codigo,
          estQuantidade: estQtd,
          estHoras,
          estValorUnitario: estValorUnit,
          estValorTotal: estTotal,
          estDescontoPercentual: estDesc,
          estValorComDesconto: estComDesc,
          realQuantidade: realDetalhe?.quantidade || 0,
          realHoras: realDetalhe?.totalHoras || 0,
          realValorUnitario: realDetalhe?.valorUnitario || 0,
          realValorTotal: realTotal,
          saldo: gravSaldo,
          desvioPercentual: gravDesvio,
        };
      });

      return {
        recursoNome: est?.recursoNome || real?.recursoNome || 'Desconhecido',
        recursoTecnicoId: rtId,
        estimadoAcumulado,
        estimadoPorGravacao: est,
        realizado: real,
        drillDown,
        saldo,
        desvioPercentual,
        progressPercent,
      };
    });
  }, [estimados, realizados, numGravacoes, gravacoesList]);

  const totais = useMemo(() => {
    const estQtd = matrizRows.reduce((acc, r) => acc + (r.estimadoAcumulado?.quantidade || 0), 0);
    const estHoras = matrizRows.reduce((acc, r) => acc + (r.estimadoAcumulado?.horas || 0), 0);
    const estValorTotal = matrizRows.reduce((acc, r) => acc + (r.estimadoAcumulado?.valorTotal || 0), 0);
    const estValorComDesc = matrizRows.reduce((acc, r) => acc + (r.estimadoAcumulado?.valorComDesconto || 0), 0);

    const realQtd = realizados.reduce((acc, r) => acc + r.quantidade, 0);
    const realHoras = realizados.reduce((acc, r) => acc + r.totalHoras, 0);
    const realValorTotal = realizados.reduce((acc, r) => acc + r.valorTotal, 0);

    const saldo = estValorTotal - realValorTotal;
    const desvio = realValorTotal > estValorTotal && estValorTotal > 0
      ? Math.round(((realValorTotal - estValorTotal) / estValorTotal) * 100)
      : 0;
    const progressPercent = estValorTotal > 0
      ? Math.min(100, Math.round((realValorTotal / estValorTotal) * 100))
      : (realValorTotal > 0 ? 100 : 0);

    return {
      estQtd, estHoras, estValorTotal, estValorComDesc,
      realQtd, realHoras, realValorTotal,
      saldo, desvio, progressPercent,
    };
  }, [matrizRows, realizados]);

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const titulo = conteudoNome || 'Conteúdo';
    const dataExport = new Date().toLocaleDateString('pt-BR');

    doc.setFillColor(26, 54, 93);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Matriz Comparativa de Custos', 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Conteúdo: ${titulo} | Data: ${dataExport} | Gravações: ${numGravacoes}`, 14, 22);

    const headers = [
      [
        { content: 'Recurso Técnico', rowSpan: 2 },
        { content: 'ESTIMADO (Acumulado)', colSpan: 6 },
        { content: 'REALIZADO', colSpan: 4 },
        { content: 'RESUMO', colSpan: 3 },
      ],
      ['Qtd', 'Horas', 'Vlr Unitário', 'Vlr Total', 'Desc.', 'Vlr c/ Desc.',
       'Qtd', 'Horas', 'Vlr Unitário', 'Vlr Total',
       'Saldo', 'Desvio', 'Progresso'],
    ];

    const body = matrizRows.map(row => [
      row.recursoNome,
      row.estimadoAcumulado?.quantidade || '',
      row.estimadoAcumulado?.horas || '',
      row.estimadoAcumulado ? formatCurrency(row.estimadoAcumulado.valorUnitario) : '',
      row.estimadoAcumulado ? formatCurrency(row.estimadoAcumulado.valorTotal) : '',
      row.estimadoAcumulado ? `${row.estimadoAcumulado.descontoPercentual}%` : '',
      row.estimadoAcumulado ? formatCurrency(row.estimadoAcumulado.valorComDesconto) : '',
      row.realizado?.quantidade || '',
      row.realizado?.totalHoras || '',
      row.realizado ? formatCurrency(row.realizado.valorUnitarioMedio) : '',
      row.realizado ? formatCurrency(row.realizado.valorTotal) : '',
      formatCurrency(row.saldo),
      `${row.desvioPercentual}%`,
      `${row.progressPercent}%`,
    ]);

    body.push([
      'Total',
      totais.estQtd.toString(),
      totais.estHoras.toString(),
      '',
      formatCurrency(totais.estValorTotal),
      '',
      '',
      totais.realQtd.toString(),
      totais.realHoras.toString(),
      '',
      formatCurrency(totais.realValorTotal),
      formatCurrency(totais.saldo),
      `${totais.desvio}%`,
      `${totais.progressPercent}%`,
    ]);

    autoTable(doc, {
      startY: 38,
      head: headers,
      body,
      headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255], fontSize: 7, halign: 'center' },
      bodyStyles: { fontSize: 7 },
      margin: { left: 10 },
      theme: 'grid',
      didParseCell: (data) => {
        if (data.row.index === body.length - 1 && data.row.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
    });

    doc.save(`matriz-custos-${titulo.toLowerCase().replace(/\s+/g, '-')}-${dataExport.replace(/\//g, '-')}.pdf`);
    toast({ title: 'PDF exportado', description: 'A matriz de custos foi exportada com sucesso.' });
  };

  const handleExportExcel = () => {
    const titulo = conteudoNome || 'Conteúdo';
    const dataExport = new Date().toLocaleDateString('pt-BR');

    const data = [
      ['MATRIZ COMPARATIVA DE CUSTOS'],
      [`Conteúdo: ${titulo}`, `Data: ${dataExport}`, `Gravações: ${numGravacoes}`],
      [],
      [
        'Recurso Técnico',
        'Est. Qtd', 'Est. Horas', 'Est. Vlr Unitário', 'Est. Vlr Total', 'Est. Desconto', 'Est. Vlr c/ Desc.',
        'Real. Qtd', 'Real. Horas', 'Real. Vlr Unitário', 'Real. Vlr Total',
        'Saldo', 'Desvio', 'Progresso',
      ],
      ...matrizRows.map(row => [
        row.recursoNome,
        row.estimadoAcumulado?.quantidade || 0,
        row.estimadoAcumulado?.horas || 0,
        row.estimadoAcumulado?.valorUnitario || 0,
        row.estimadoAcumulado?.valorTotal || 0,
        row.estimadoAcumulado ? `${row.estimadoAcumulado.descontoPercentual}%` : '0%',
        row.estimadoAcumulado?.valorComDesconto || 0,
        row.realizado?.quantidade || 0,
        row.realizado?.totalHoras || 0,
        row.realizado?.valorUnitarioMedio || 0,
        row.realizado?.valorTotal || 0,
        row.saldo,
        `${row.desvioPercentual}%`,
        `${row.progressPercent}%`,
      ]),
      [
        'Total',
        totais.estQtd, totais.estHoras, '', totais.estValorTotal, '', '',
        totais.realQtd, totais.realHoras, '', totais.realValorTotal,
        totais.saldo, `${totais.desvio}%`, `${totais.progressPercent}%`,
      ],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = Array(14).fill({ wch: 14 });
    ws['!cols'][0] = { wch: 22 };
    XLSX.utils.book_append_sheet(wb, ws, 'Matriz Custos');
    XLSX.writeFile(wb, `matriz-custos-${titulo.toLowerCase().replace(/\s+/g, '-')}-${dataExport.replace(/\//g, '-')}.xlsx`);
    toast({ title: 'Excel exportado', description: 'A matriz de custos foi exportada com sucesso.' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (estimados.length === 0 && realizados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum recurso técnico associado</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Associe recursos técnicos ao conteúdo e aloque recursos humanos nas gravações para visualizar a matriz comparativa.
        </p>
      </div>
    );
  }

  const totalColumns = 14; // RT name + 6 est + 4 real + 3 resumo

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Matriz Comparativa de Custos</h3>
            <p className="text-sm text-muted-foreground">
              {numGravacoes} gravação(ões) • {matrizRows.length} recurso(s) técnico(s) • Valores acumulados
            </p>
          </div>
        </div>
        <ExportDropdown onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
      </div>

      {/* Matrix Table */}
      <Card>
        <CardContent className="pt-4 px-2 overflow-x-auto">
          <Table>
            <TableHeader>
              {/* Group headers */}
              <TableRow className="border-b-0">
                <TableHead rowSpan={2} className="align-bottom border-r font-semibold text-foreground">
                  Recurso Técnico
                </TableHead>
                <TableHead
                  colSpan={6}
                  className="text-center font-bold text-white border-r bg-kreato-blue"
                >
                  ESTIMADO
                </TableHead>
                <TableHead
                  colSpan={4}
                  className="text-center font-bold text-white border-r bg-kreato-cyan"
                >
                  REALIZADO
                </TableHead>
                <TableHead
                  colSpan={3}
                  className="text-center font-bold text-white bg-kreato-orange"
                >
                  RESUMO
                </TableHead>
              </TableRow>
              {/* Sub-headers */}
              <TableRow>
                <TableHead className="text-center text-xs border-r bg-kreato-blue/15">Quantidade</TableHead>
                <TableHead className="text-center text-xs border-r bg-kreato-blue/15">Horas</TableHead>
                <TableHead className="text-right text-xs border-r bg-kreato-blue/15">Valor Unitário</TableHead>
                <TableHead className="text-right text-xs border-r bg-kreato-blue/15">Valor Total</TableHead>
                <TableHead className="text-center text-xs border-r bg-kreato-blue/15">Desconto</TableHead>
                <TableHead className="text-right text-xs border-r bg-kreato-blue/15">Vlr Total c/ Desc.</TableHead>
                <TableHead className="text-center text-xs border-r bg-kreato-cyan/15">Quantidade</TableHead>
                <TableHead className="text-center text-xs border-r bg-kreato-cyan/15">Horas</TableHead>
                <TableHead className="text-right text-xs border-r bg-kreato-cyan/15">Valor Unitário</TableHead>
                <TableHead className="text-right text-xs border-r bg-kreato-cyan/15">Valor Total</TableHead>
                <TableHead className="text-right text-xs border-r bg-kreato-orange/15">Saldo</TableHead>
                <TableHead className="text-center text-xs border-r bg-kreato-orange/15">Desvio</TableHead>
                <TableHead className="text-center text-xs bg-kreato-orange/15 min-w-[100px]">Progresso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrizRows.map((row) => {
                const isExpanded = expandedRows.has(row.recursoTecnicoId);
                const hasDrillDown = row.drillDown.length > 0;

                return (
                  <>
                    {/* Main row */}
                    <TableRow
                      key={row.recursoTecnicoId}
                      className={hasDrillDown ? 'cursor-pointer hover:bg-muted/70' : ''}
                      onClick={() => hasDrillDown && toggleRow(row.recursoTecnicoId)}
                    >
                      <TableCell className="font-medium border-r whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {hasDrillDown && (
                            isExpanded
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          {row.recursoNome}
                        </div>
                      </TableCell>
                      {/* Estimado Acumulado */}
                      <TableCell className="text-center border-r">{row.estimadoAcumulado?.quantidade ?? '-'}</TableCell>
                      <TableCell className="text-center border-r">{row.estimadoAcumulado?.horas ?? '-'}</TableCell>
                      <TableCell className="text-right border-r">{row.estimadoAcumulado ? formatCurrency(row.estimadoAcumulado.valorUnitario) : '-'}</TableCell>
                      <TableCell className="text-right border-r">{row.estimadoAcumulado ? formatCurrency(row.estimadoAcumulado.valorTotal) : '-'}</TableCell>
                      <TableCell className="text-center border-r">{row.estimadoAcumulado ? `${row.estimadoAcumulado.descontoPercentual}%` : '-'}</TableCell>
                      <TableCell className="text-right border-r">{row.estimadoAcumulado ? formatCurrency(row.estimadoAcumulado.valorComDesconto) : '-'}</TableCell>
                      {/* Realizado */}
                      <TableCell className="text-center border-r">{row.realizado?.quantidade ?? '-'}</TableCell>
                      <TableCell className="text-center border-r">{row.realizado?.totalHoras ?? '-'}</TableCell>
                      <TableCell className="text-right border-r">{row.realizado ? formatCurrency(row.realizado.valorUnitarioMedio) : '-'}</TableCell>
                      <TableCell className="text-right border-r">{row.realizado ? formatCurrency(row.realizado.valorTotal) : '-'}</TableCell>
                      {/* Resumo */}
                      <TableCell className={`text-right border-r font-medium ${row.saldo < 0 ? 'text-destructive' : row.saldo > 0 ? 'text-green-600' : ''}`}>
                        {formatCurrency(row.saldo)}
                      </TableCell>
                      <TableCell className={`text-center border-r font-medium ${row.desvioPercentual > 0 ? 'text-destructive' : ''}`}>
                        {row.desvioPercentual}%
                      </TableCell>
                      <TableCell className="px-2">
                        <div className="flex items-center gap-1">
                          <Progress value={row.progressPercent} className="h-2 flex-1" />
                          <span className="text-[10px] text-muted-foreground w-8 text-right">{row.progressPercent}%</span>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Drill-down detail rows */}
                    {isExpanded && row.drillDown.map((dd) => (
                      <TableRow key={`${row.recursoTecnicoId}-${dd.gravacaoId}`} className="bg-muted/30">
                        <TableCell className="border-r pl-8 text-xs text-muted-foreground whitespace-nowrap">
                          {dd.gravacaoCodigo} - {dd.gravacaoNome}
                        </TableCell>
                        {/* Estimado proporcional por gravação */}
                        <TableCell className="text-center border-r text-xs">{dd.estQuantidade}</TableCell>
                        <TableCell className="text-center border-r text-xs">{dd.estHoras}</TableCell>
                        <TableCell className="text-right border-r text-xs">{formatCurrency(dd.estValorUnitario)}</TableCell>
                        <TableCell className="text-right border-r text-xs">{formatCurrency(dd.estValorTotal)}</TableCell>
                        <TableCell className="text-center border-r text-xs">{dd.estDescontoPercentual}%</TableCell>
                        <TableCell className="text-right border-r text-xs">{formatCurrency(dd.estValorComDesconto)}</TableCell>
                        {/* Realizado per gravação */}
                        <TableCell className="text-center border-r text-xs">{dd.realQuantidade}</TableCell>
                        <TableCell className="text-center border-r text-xs">{dd.realHoras}</TableCell>
                        <TableCell className="text-right border-r text-xs">{formatCurrency(dd.realValorUnitario)}</TableCell>
                        <TableCell className="text-right border-r text-xs">{formatCurrency(dd.realValorTotal)}</TableCell>
                        {/* Resumo per gravação */}
                        <TableCell className={`text-right border-r text-xs ${dd.saldo < 0 ? 'text-destructive' : dd.saldo > 0 ? 'text-green-600' : ''}`}>
                          {formatCurrency(dd.saldo)}
                        </TableCell>
                        <TableCell className={`text-center border-r text-xs ${dd.desvioPercentual > 0 ? 'text-destructive' : ''}`}>
                          {dd.desvioPercentual}%
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    ))}
                  </>
                );
              })}

              {/* Totals row */}
              <TableRow className="bg-muted/50 font-bold border-t-2">
                <TableCell className="border-r font-bold">Total</TableCell>
                <TableCell className="text-center border-r">{totais.estQtd}</TableCell>
                <TableCell className="text-center border-r">{totais.estHoras}</TableCell>
                <TableCell className="text-right border-r"></TableCell>
                <TableCell className="text-right border-r">{formatCurrency(totais.estValorTotal)}</TableCell>
                <TableCell className="text-center border-r"></TableCell>
                <TableCell className="text-right border-r">{formatCurrency(totais.estValorComDesc)}</TableCell>
                <TableCell className="text-center border-r">{totais.realQtd}</TableCell>
                <TableCell className="text-center border-r">{totais.realHoras}</TableCell>
                <TableCell className="text-right border-r"></TableCell>
                <TableCell className="text-right border-r">{formatCurrency(totais.realValorTotal)}</TableCell>
                <TableCell className={`text-right border-r font-bold ${totais.saldo < 0 ? 'text-destructive' : totais.saldo > 0 ? 'text-green-600' : ''}`}>
                  {formatCurrency(totais.saldo)}
                </TableCell>
                <TableCell className={`text-center border-r font-bold ${totais.desvio > 0 ? 'text-destructive' : ''}`}>
                  {totais.desvio}%
                </TableCell>
                <TableCell className="px-2">
                  <div className="flex items-center gap-1">
                    <Progress value={totais.progressPercent} className="h-2 flex-1" />
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{totais.progressPercent}%</span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
