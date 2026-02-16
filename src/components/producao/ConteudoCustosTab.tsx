import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, Loader2, Film } from 'lucide-react';
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

interface RealizadoItem {
  recursoTecnicoId: string;
  recursoNome: string;
  quantidade: number;
  totalHoras: number;
  valorUnitarioMedio: number;
  valorTotal: number;
}

interface MatrizRow {
  recursoNome: string;
  estimado: EstimadoItem | null;
  realizado: RealizadoItem | null;
  saldo: number;
  desvioPercentual: number;
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
        .select('id')
        .eq('conteudo_id', conteudoId);

      const gravacaoIds = (gravacoesData || []).map(g => g.id);
      setNumGravacoes(gravacaoIds.length);

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

      // Group by recurso_tecnico_id and aggregate realized values
      // Only consider allocations that have both recurso_tecnico_id AND recurso_humano_id (actual RH assignment)
      const realizadoMap = new Map<string, {
        nome: string;
        totalQuantidade: number;
        totalHoras: number;
        totalCusto: number;
        totalCustoHora: number;
        countCustoHora: number;
      }>();

      // Also track anchor records (recurso_tecnico_id without recurso_humano_id) per gravação
      const anchorsByGravacao = new Map<string, Map<string, number>>(); // gravacao_id -> rt_id -> count

      allAlocs.forEach(aloc => {
        if (!aloc.recurso_tecnico_id) return;

        const rtId = aloc.recurso_tecnico_id;
        const rtNome = aloc.recursos_tecnicos?.nome || rtNameMap.get(rtId) || 'Desconhecido';

        if (!realizadoMap.has(rtId)) {
          realizadoMap.set(rtId, {
            nome: rtNome,
            totalQuantidade: 0,
            totalHoras: 0,
            totalCusto: 0,
            totalCustoHora: 0,
            countCustoHora: 0,
          });
        }

        // Anchor record (RT only, no RH) - counts as quantity per gravação
        if (!aloc.recurso_humano_id) {
          if (!anchorsByGravacao.has(aloc.gravacao_id)) {
            anchorsByGravacao.set(aloc.gravacao_id, new Map());
          }
          const gravAnchors = anchorsByGravacao.get(aloc.gravacao_id)!;
          gravAnchors.set(rtId, (gravAnchors.get(rtId) || 0) + 1);
        }

        // RH assignment to RT - has actual hours and costs
        if (aloc.recurso_humano_id && aloc.recursos_humanos) {
          const rh = aloc.recursos_humanos;
          const horas = calcularHorasEntreTempo(aloc.hora_inicio || '', aloc.hora_fim || '');
          const custoHora = rh.custo_hora || 0;

          const entry = realizadoMap.get(rtId)!;
          entry.totalQuantidade += 1;
          entry.totalHoras += horas;
          entry.totalCusto += horas * custoHora;
          if (custoHora > 0) {
            entry.totalCustoHora += custoHora;
            entry.countCustoHora += 1;
          }
        }
      });

      // If no RH assignments yet, use anchor counts for quantity
      realizadoMap.forEach((entry, rtId) => {
        if (entry.totalQuantidade === 0) {
          // Count total anchors across all gravações
          let totalAnchors = 0;
          anchorsByGravacao.forEach((gravAnchors) => {
            totalAnchors += gravAnchors.get(rtId) || 0;
          });
          // Average per gravação
          entry.totalQuantidade = gravacaoIds.length > 0 ? Math.round(totalAnchors / gravacaoIds.length) : 0;
        }
      });

      const realizadoItems: RealizadoItem[] = Array.from(realizadoMap.entries()).map(([rtId, entry]) => {
        const avgCustoHora = entry.countCustoHora > 0 ? entry.totalCustoHora / entry.countCustoHora : 0;

        return {
          recursoTecnicoId: rtId,
          recursoNome: entry.nome,
          quantidade: entry.totalQuantidade,
          totalHoras: Math.round(entry.totalHoras * 10) / 10,
          valorUnitarioMedio: Math.round(avgCustoHora * 100) / 100,
          valorTotal: Math.round(entry.totalCusto * 100) / 100,
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
      const estimadoTotal = est?.valorTotal || 0;
      const realizadoTotal = real?.valorTotal || 0;
      const saldo = estimadoTotal - realizadoTotal;
      // Desvio only when realizado exceeds estimado
      const desvioPercentual = realizadoTotal > estimadoTotal && estimadoTotal > 0
        ? Math.round(((realizadoTotal - estimadoTotal) / estimadoTotal) * 100)
        : 0;

      return {
        recursoNome: est?.recursoNome || real?.recursoNome || 'Desconhecido',
        estimado: est,
        realizado: real,
        saldo,
        desvioPercentual,
      };
    });
  }, [estimados, realizados]);

  const totais = useMemo(() => {
    const estQtd = estimados.reduce((acc, e) => acc + e.quantidade, 0);
    const estHoras = estimados.reduce((acc, e) => acc + e.quantidadeHoras, 0);
    const estValorTotal = estimados.reduce((acc, e) => acc + e.valorTotal, 0);
    const estDescontoMedio = estValorTotal > 0
      ? estimados.reduce((acc, e) => acc + (e.descontoPercentual * e.valorTotal / estValorTotal), 0)
      : 0;
    const estValorComDesc = estimados.reduce((acc, e) => acc + e.valorComDesconto, 0);

    const realQtd = realizados.reduce((acc, r) => acc + r.quantidade, 0);
    const realHoras = realizados.reduce((acc, r) => acc + r.totalHoras, 0);
    const realValorTotal = realizados.reduce((acc, r) => acc + r.valorTotal, 0);

    const saldo = estValorTotal - realValorTotal;
    const desvio = realValorTotal > estValorTotal && estValorTotal > 0
      ? Math.round(((realValorTotal - estValorTotal) / estValorTotal) * 100)
      : 0;

    return {
      estQtd, estHoras, estValorTotal, estDescontoMedio, estValorComDesc,
      realQtd, realHoras, realValorTotal,
      saldo, desvio,
    };
  }, [estimados, realizados]);

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const titulo = conteudoNome || 'Conteúdo';
    const dataExport = new Date().toLocaleDateString('pt-BR');

    // Header
    doc.setFillColor(26, 54, 93);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Matriz Comparativa de Custos', 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Conteúdo: ${titulo} | Data: ${dataExport}`, 14, 22);

    const headers = [
      [
        { content: 'Recurso Técnico', rowSpan: 2 },
        { content: 'ESTIMADO POR GRAVAÇÃO', colSpan: 6 },
        { content: 'REALIZADO', colSpan: 4 },
        { content: 'RESUMO', colSpan: 2 },
      ],
      ['Qtd', 'Horas', 'Vlr Unitário', 'Vlr Total', 'Desc.', 'Vlr c/ Desc.',
       'Qtd', 'Horas', 'Vlr Unitário', 'Vlr Total',
       'Saldo', 'Desvio'],
    ];

    const body = matrizRows.map(row => [
      row.recursoNome,
      row.estimado?.quantidade || '',
      row.estimado?.quantidadeHoras || '',
      row.estimado ? formatCurrency(row.estimado.valorHora) : '',
      row.estimado ? formatCurrency(row.estimado.valorTotal) : '',
      row.estimado ? `${row.estimado.descontoPercentual}%` : '',
      row.estimado ? formatCurrency(row.estimado.valorComDesconto) : '',
      row.realizado?.quantidade || '',
      row.realizado?.totalHoras || '',
      row.realizado ? formatCurrency(row.realizado.valorUnitarioMedio) : '',
      row.realizado ? formatCurrency(row.realizado.valorTotal) : '',
      formatCurrency(row.saldo),
      `${row.desvioPercentual}%`,
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
      [`Conteúdo: ${titulo}`, `Data: ${dataExport}`],
      [],
      [
        'Recurso Técnico',
        'Est. Qtd', 'Est. Horas', 'Est. Vlr Unitário', 'Est. Vlr Total', 'Est. Desconto', 'Est. Vlr c/ Desc.',
        'Real. Qtd', 'Real. Horas', 'Real. Vlr Unitário', 'Real. Vlr Total',
        'Saldo', 'Desvio',
      ],
      ...matrizRows.map(row => [
        row.recursoNome,
        row.estimado?.quantidade || 0,
        row.estimado?.quantidadeHoras || 0,
        row.estimado?.valorHora || 0,
        row.estimado?.valorTotal || 0,
        row.estimado ? `${row.estimado.descontoPercentual}%` : '0%',
        row.estimado?.valorComDesconto || 0,
        row.realizado?.quantidade || 0,
        row.realizado?.totalHoras || 0,
        row.realizado?.valorUnitarioMedio || 0,
        row.realizado?.valorTotal || 0,
        row.saldo,
        `${row.desvioPercentual}%`,
      ]),
      [
        'Total',
        totais.estQtd, totais.estHoras, '', totais.estValorTotal, '', '',
        totais.realQtd, totais.realHoras, '', totais.realValorTotal,
        totais.saldo, `${totais.desvio}%`,
      ],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = Array(13).fill({ wch: 14 });
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
              {numGravacoes} gravação(ões) • {matrizRows.length} recurso(s) técnico(s)
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
                  ESTIMADO POR GRAVAÇÃO
                </TableHead>
                <TableHead
                  colSpan={4}
                  className="text-center font-bold text-white border-r bg-kreato-cyan"
                >
                  REALIZADO
                </TableHead>
                <TableHead
                  colSpan={2}
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
                <TableHead className="text-center text-xs bg-kreato-orange/15">Desvio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrizRows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium border-r whitespace-nowrap">{row.recursoNome}</TableCell>
                  {/* Estimado */}
                  <TableCell className="text-center border-r">{row.estimado?.quantidade ?? '-'}</TableCell>
                  <TableCell className="text-center border-r">{row.estimado?.quantidadeHoras ?? '-'}</TableCell>
                  <TableCell className="text-right border-r">{row.estimado ? formatCurrency(row.estimado.valorHora) : '-'}</TableCell>
                  <TableCell className="text-right border-r">{row.estimado ? formatCurrency(row.estimado.valorTotal) : '-'}</TableCell>
                  <TableCell className="text-center border-r">{row.estimado ? `${row.estimado.descontoPercentual}%` : '-'}</TableCell>
                  <TableCell className="text-right border-r">{row.estimado ? formatCurrency(row.estimado.valorComDesconto) : '-'}</TableCell>
                  {/* Realizado */}
                  <TableCell className="text-center border-r">{row.realizado?.quantidade ?? '-'}</TableCell>
                  <TableCell className="text-center border-r">{row.realizado?.totalHoras ?? '-'}</TableCell>
                  <TableCell className="text-right border-r">{row.realizado ? formatCurrency(row.realizado.valorUnitarioMedio) : '-'}</TableCell>
                  <TableCell className="text-right border-r">{row.realizado ? formatCurrency(row.realizado.valorTotal) : '-'}</TableCell>
                  {/* Resumo */}
                  <TableCell className={`text-right border-r font-medium ${row.saldo < 0 ? 'text-destructive' : row.saldo > 0 ? 'text-green-600' : ''}`}>
                    {formatCurrency(row.saldo)}
                  </TableCell>
                  <TableCell className={`text-center font-medium ${row.desvioPercentual < 0 ? 'text-destructive' : ''}`}>
                    {row.desvioPercentual}%
                  </TableCell>
                </TableRow>
              ))}

              {/* Totals row */}
              <TableRow className="bg-muted/50 font-bold border-t-2">
                <TableCell className="border-r font-bold">Total</TableCell>
                <TableCell className="text-center border-r">{totais.estQtd}</TableCell>
                <TableCell className="text-center border-r">{totais.estHoras}</TableCell>
                <TableCell className="text-right border-r"></TableCell>
                <TableCell className="text-right border-r">{formatCurrency(totais.estValorTotal)}</TableCell>
                <TableCell className="text-center border-r"></TableCell>
                <TableCell className="text-right border-r"></TableCell>
                <TableCell className="text-center border-r">{totais.realQtd}</TableCell>
                <TableCell className="text-center border-r">{totais.realHoras}</TableCell>
                <TableCell className="text-right border-r"></TableCell>
                <TableCell className="text-right border-r">{formatCurrency(totais.realValorTotal)}</TableCell>
                <TableCell className={`text-right border-r font-bold ${totais.saldo < 0 ? 'text-destructive' : totais.saldo > 0 ? 'text-green-600' : ''}`}>
                  {formatCurrency(totais.saldo)}
                </TableCell>
                <TableCell className={`text-center font-bold ${totais.desvio < 0 ? 'text-destructive' : ''}`}>
                  {totais.desvio}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
