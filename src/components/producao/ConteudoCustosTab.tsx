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
  recursoId: string;
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
  estQuantidade: number;
  estHoras: number;
  estValorUnitario: number;
  estValorTotal: number;
  estDescontoPercentual: number;
  estValorComDesconto: number;
  realQuantidade: number;
  realHoras: number;
  realValorUnitario: number;
  realValorTotal: number;
  saldo: number;
  desvioPercentual: number;
  progressPercent: number;
}

interface RealizadoItem {
  recursoId: string;
  recursoNome: string;
  quantidade: number;
  totalHoras: number;
  valorUnitarioMedio: number;
  valorTotal: number;
  detalhes: GravacaoDetalhe[];
}

interface MatrizRow {
  recursoNome: string;
  recursoId: string;
  tipo: 'tecnico' | 'fisico';
  estimadoAcumulado: {
    quantidade: number;
    horas: number;
    valorUnitario: number;
    valorTotal: number;
    descontoPercentual: number;
    valorComDesconto: number;
  } | null;
  estimadoBase: EstimadoItem | null;
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
  const [rtEstimados, setRtEstimados] = useState<EstimadoItem[]>([]);
  const [rtRealizados, setRtRealizados] = useState<RealizadoItem[]>([]);
  const [rfEstimados, setRfEstimados] = useState<EstimadoItem[]>([]);
  const [rfRealizados, setRfRealizados] = useState<RealizadoItem[]>([]);
  const [moeda, setMoeda] = useState<string>('BRL');
  const [numGravacoes, setNumGravacoes] = useState(0);
  const [gravacoesList, setGravacoesList] = useState<{ id: string; nome: string; codigo: string }[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [terceirosEstimados, setTerceirosEstimados] = useState<{ servicoId: string; servicoNome: string; valorPrevisto: number }[]>([]);
  const [terceirosRealizados, setTerceirosRealizados] = useState<{ servicoNome: string; valorTotal: number; porGravacao: { gravacaoId: string; valor: number }[] }[]>([]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

      // === RECURSOS TÉCNICOS ESTIMADO ===
      const { data: rtPlanejados } = await supabase
        .from('conteudo_recursos_tecnicos')
        .select('*')
        .eq('conteudo_id', conteudoId);

      const rtIds = (rtPlanejados || []).map(p => p.recurso_tecnico_id);
      const { data: rtNamesData } = await supabase
        .from('recursos_tecnicos')
        .select('id, nome')
        .in('id', rtIds.length > 0 ? rtIds : ['__none__']);
      const rtNameMap = new Map((rtNamesData || []).map(r => [r.id, r.nome]));

      const rtEstItems: EstimadoItem[] = (rtPlanejados || []).map(p => ({
        recursoId: p.recurso_tecnico_id,
        recursoNome: rtNameMap.get(p.recurso_tecnico_id) || 'Desconhecido',
        quantidade: p.quantidade,
        quantidadeHoras: Number(p.quantidade_horas),
        valorHora: Number(p.valor_hora),
        valorTotal: Number(p.valor_total),
        descontoPercentual: Number(p.desconto_percentual),
        valorComDesconto: Number(p.valor_com_desconto),
      }));
      setRtEstimados(rtEstItems);

      // === RECURSOS FÍSICOS ESTIMADO ===
      const { data: rfPlanejados } = await supabase
        .from('conteudo_recursos_fisicos')
        .select('*')
        .eq('conteudo_id', conteudoId);

      const rfIds = (rfPlanejados || []).map(p => p.recurso_fisico_id);
      const { data: rfNamesData } = await supabase
        .from('recursos_fisicos')
        .select('id, nome, custo_hora')
        .in('id', rfIds.length > 0 ? rfIds : ['__none__']);
      const rfNameMap = new Map((rfNamesData || []).map(r => [r.id, r.nome]));
      const rfCustoMap = new Map((rfNamesData || []).map(r => [r.id, r.custo_hora || 0]));

      const rfEstItems: EstimadoItem[] = (rfPlanejados || []).map(p => ({
        recursoId: p.recurso_fisico_id,
        recursoNome: rfNameMap.get(p.recurso_fisico_id) || 'Desconhecido',
        quantidade: p.quantidade,
        quantidadeHoras: Number(p.quantidade_horas),
        valorHora: Number(p.valor_hora),
        valorTotal: Number(p.valor_total),
        descontoPercentual: Number(p.desconto_percentual),
        valorComDesconto: Number(p.valor_com_desconto),
      }));
      setRfEstimados(rfEstItems);

      // === GRAVAÇÕES ===
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
        setRtRealizados([]);
        setRfRealizados([]);
        setTerceirosRealizados([]);
        setIsLoading(false);

        // Still fetch terceiros estimados
        const { data: ctData } = await (supabase as any)
          .from('conteudo_terceiros')
          .select('servico_id, valor_previsto, servicos:servico_id(nome)')
          .eq('conteudo_id', conteudoId);
        setTerceirosEstimados((ctData || []).map((ct: any) => ({
          servicoId: ct.servico_id,
          servicoNome: ct.servicos?.nome || 'Serviço',
          valorPrevisto: Number(ct.valor_previsto) || 0,
        })));
        return;
      }

      // === RECURSOS TÉCNICOS REALIZADO ===
      const { data: alocsData } = await supabase
        .from('gravacao_recursos')
        .select(`
          id, gravacao_id, hora_inicio, hora_fim,
          recurso_humano_id, recurso_tecnico_id, recurso_fisico_id,
          recursos_humanos:recurso_humano_id(id, nome, sobrenome, custo_hora),
          recursos_tecnicos:recurso_tecnico_id(id, nome),
          recursos_fisicos:recurso_fisico_id(id, nome, custo_hora)
        `)
        .in('gravacao_id', gravacaoIds);

      const allAlocs = alocsData || [];

      // RT realized
      const rtRealMap = new Map<string, {
        nome: string;
        porGravacao: Map<string, { quantidade: number; totalHoras: number; totalCusto: number; totalCustoHora: number; countCustoHora: number }>;
      }>();

      // RF realized
      const rfRealMap = new Map<string, {
        nome: string;
        porGravacao: Map<string, { quantidade: number; totalHoras: number; totalCusto: number; totalCustoHora: number; countCustoHora: number }>;
      }>();

      allAlocs.forEach(aloc => {
        const gravId = aloc.gravacao_id;

        // Process RT allocations (entries with recurso_tecnico_id)
        if (aloc.recurso_tecnico_id) {
          const rtId = aloc.recurso_tecnico_id;
          const rtNome = aloc.recursos_tecnicos?.nome || rtNameMap.get(rtId) || 'Desconhecido';

          if (!rtRealMap.has(rtId)) {
            rtRealMap.set(rtId, { nome: rtNome, porGravacao: new Map() });
          }
          const rtEntry = rtRealMap.get(rtId)!;
          if (!rtEntry.porGravacao.has(gravId)) {
            rtEntry.porGravacao.set(gravId, { quantidade: 0, totalHoras: 0, totalCusto: 0, totalCustoHora: 0, countCustoHora: 0 });
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
            gravEntry.quantidade = Math.max(gravEntry.quantidade, 1);
          }
        }

        // Process RF allocations (entries with recurso_fisico_id, no recurso_tecnico_id)
        if (aloc.recurso_fisico_id && !aloc.recurso_tecnico_id) {
          const rfId = aloc.recurso_fisico_id;
          const rfNome = aloc.recursos_fisicos?.nome || rfNameMap.get(rfId) || 'Desconhecido';
          const rfCusto = aloc.recursos_fisicos?.custo_hora || rfCustoMap.get(rfId) || 0;

          if (!rfRealMap.has(rfId)) {
            rfRealMap.set(rfId, { nome: rfNome, porGravacao: new Map() });
          }
          const rfEntry = rfRealMap.get(rfId)!;
          if (!rfEntry.porGravacao.has(gravId)) {
            rfEntry.porGravacao.set(gravId, { quantidade: 0, totalHoras: 0, totalCusto: 0, totalCustoHora: 0, countCustoHora: 0 });
          }
          const gravEntry = rfEntry.porGravacao.get(gravId)!;

          const horas = calcularHorasEntreTempo(aloc.hora_inicio || '', aloc.hora_fim || '');
          gravEntry.quantidade += 1;
          gravEntry.totalHoras += horas;
          gravEntry.totalCusto += horas * rfCusto;
          if (rfCusto > 0) {
            gravEntry.totalCustoHora += rfCusto;
            gravEntry.countCustoHora += 1;
          }
        }
      });

      const buildRealizadoItems = (realMap: Map<string, any>): RealizadoItem[] => {
        return Array.from(realMap.entries()).map(([id, entry]) => {
          let totalQtd = 0, totalHoras = 0, totalCusto = 0, totalCustoHoraSum = 0, countCustoHora = 0;
          const detalhes: GravacaoDetalhe[] = [];

          entry.porGravacao.forEach((gEntry: any, gravId: string) => {
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
            recursoId: id,
            recursoNome: entry.nome,
            quantidade: totalQtd,
            totalHoras: Math.round(totalHoras * 10) / 10,
            valorUnitarioMedio: Math.round(avgCustoHoraGlobal * 100) / 100,
            valorTotal: Math.round(totalCusto * 100) / 100,
            detalhes,
          };
        });
      };

      setRtRealizados(buildRealizadoItems(rtRealMap));
      setRfRealizados(buildRealizadoItems(rfRealMap));

      // === TERCEIROS ===
      const { data: ctData } = await (supabase as any)
        .from('conteudo_terceiros')
        .select('servico_id, valor_previsto, servicos:servico_id(nome)')
        .eq('conteudo_id', conteudoId);

      setTerceirosEstimados((ctData || []).map((ct: any) => ({
        servicoId: ct.servico_id,
        servicoNome: ct.servicos?.nome || 'Serviço',
        valorPrevisto: Number(ct.valor_previsto) || 0,
      })));

      if (gravacaoIds.length > 0) {
        const { data: gtData } = await supabase
          .from('gravacao_terceiros')
          .select('gravacao_id, fornecedor_id, servico_id, valor, fornecedor_servicos:servico_id(id, nome)')
          .in('gravacao_id', gravacaoIds);

        const tercRealMap = new Map<string, { servicoNome: string; valorTotal: number; porGravacao: { gravacaoId: string; valor: number }[] }>();
        (gtData || []).forEach((gt: any) => {
          const sNome = gt.fornecedor_servicos?.nome || 'Serviço';
          if (!tercRealMap.has(sNome)) {
            tercRealMap.set(sNome, { servicoNome: sNome, valorTotal: 0, porGravacao: [] });
          }
          const entry = tercRealMap.get(sNome)!;
          entry.valorTotal += Number(gt.valor) || 0;
          entry.porGravacao.push({ gravacaoId: gt.gravacao_id, valor: Number(gt.valor) || 0 });
        });
        setTerceirosRealizados(Array.from(tercRealMap.values()));
      } else {
        setTerceirosRealizados([]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados de custos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conteudoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const buildMatrizRows = useCallback(
    (
      estimados: EstimadoItem[],
      realizados: RealizadoItem[],
      tipo: 'tecnico' | 'fisico',
    ): MatrizRow[] => {
      const allIds = new Set<string>();
      const estimadoMap = new Map<string, EstimadoItem>();
      const realizadoMap = new Map<string, RealizadoItem>();
      const mult = Math.max(1, numGravacoes);

      estimados.forEach(e => { allIds.add(e.recursoId); estimadoMap.set(e.recursoId, e); });
      realizados.forEach(r => { allIds.add(r.recursoId); realizadoMap.set(r.recursoId, r); });

      return Array.from(allIds).map(id => {
        const est = estimadoMap.get(id) || null;
        const real = realizadoMap.get(id) || null;

        const estimadoAcumulado = est ? {
          quantidade: est.quantidade * mult,
          horas: est.quantidadeHoras * mult,
          valorUnitario: est.valorHora,
          valorTotal: est.valorTotal * mult,
          descontoPercentual: est.descontoPercentual,
          valorComDesconto: est.valorComDesconto * mult,
        } : null;

        const estimadoTotal = estimadoAcumulado?.valorComDesconto || estimadoAcumulado?.valorTotal || 0;
        const realizadoTotal = real?.valorTotal || 0;
        const saldo = estimadoTotal - realizadoTotal;
        const desvioPercentual = realizadoTotal > estimadoTotal && estimadoTotal > 0
          ? Math.round(((realizadoTotal - estimadoTotal) / estimadoTotal) * 100) : 0;
        const progressPercent = estimadoTotal > 0
          ? Math.min(100, Math.round((realizadoTotal / estimadoTotal) * 100))
          : (realizadoTotal > 0 ? 100 : 0);

        const realDetalheMap = new Map<string, GravacaoDetalhe>();
        if (real?.detalhes) real.detalhes.forEach(d => realDetalheMap.set(d.gravacaoId, d));

        const drillDown: DrillDownRow[] = gravacoesList.map(grav => {
          const realDetalhe = realDetalheMap.get(grav.id);
          const estQtd = est?.quantidade || 0;
          const estHoras = est?.quantidadeHoras || 0;
          const estValorUnit = est?.valorHora || 0;
          const estTotal = est?.valorTotal || 0;
          const estDesc = est?.descontoPercentual || 0;
          const estComDesc = est?.valorComDesconto || 0;
          const realTotal = realDetalhe?.valorTotal || 0;
          const gravSaldo = estComDesc - realTotal;
          const gravDesvio = realTotal > estComDesc && estComDesc > 0
            ? Math.round(((realTotal - estComDesc) / estComDesc) * 100) : 0;
          const gravProgress = estComDesc > 0
            ? Math.min(100, Math.round((realTotal / estComDesc) * 100))
            : (realTotal > 0 ? 100 : 0);

          return {
            gravacaoId: grav.id, gravacaoNome: grav.nome, gravacaoCodigo: grav.codigo,
            estQuantidade: estQtd, estHoras, estValorUnitario: estValorUnit,
            estValorTotal: estTotal, estDescontoPercentual: estDesc, estValorComDesconto: estComDesc,
            realQuantidade: realDetalhe?.quantidade || 0, realHoras: realDetalhe?.totalHoras || 0,
            realValorUnitario: realDetalhe?.valorUnitario || 0, realValorTotal: realTotal,
            saldo: gravSaldo, desvioPercentual: gravDesvio, progressPercent: gravProgress,
          };
        });

        return {
          recursoNome: est?.recursoNome || real?.recursoNome || 'Desconhecido',
          recursoId: id, tipo, estimadoAcumulado, estimadoBase: est, realizado: real,
          drillDown, saldo, desvioPercentual, progressPercent,
        };
      });
    }, [numGravacoes, gravacoesList]);

  const rtMatrizRows = useMemo(() => buildMatrizRows(rtEstimados, rtRealizados, 'tecnico'), [buildMatrizRows, rtEstimados, rtRealizados]);
  const rfMatrizRows = useMemo(() => buildMatrizRows(rfEstimados, rfRealizados, 'fisico'), [buildMatrizRows, rfEstimados, rfRealizados]);

  const terceirosEstTotal = useMemo(() => terceirosEstimados.reduce((acc, t) => acc + t.valorPrevisto, 0), [terceirosEstimados]);
  const terceirosRealTotal = useMemo(() => terceirosRealizados.reduce((acc, t) => acc + t.valorTotal, 0), [terceirosRealizados]);

  const totais = useMemo(() => {
    const allRows = [...rtMatrizRows, ...rfMatrizRows];
    const estQtd = allRows.reduce((acc, r) => acc + (r.estimadoAcumulado?.quantidade || 0), 0);
    const estHoras = allRows.reduce((acc, r) => acc + (r.estimadoAcumulado?.horas || 0), 0);
    const estValorTotal = allRows.reduce((acc, r) => acc + (r.estimadoAcumulado?.valorTotal || 0), 0) + terceirosEstTotal;
    const estValorComDesc = allRows.reduce((acc, r) => acc + (r.estimadoAcumulado?.valorComDesconto || 0), 0) + terceirosEstTotal;

    const allRealizados = [...rtRealizados, ...rfRealizados];
    const realQtd = allRealizados.reduce((acc, r) => acc + r.quantidade, 0);
    const realHoras = allRealizados.reduce((acc, r) => acc + r.totalHoras, 0);
    const realValorTotal = allRealizados.reduce((acc, r) => acc + r.valorTotal, 0) + terceirosRealTotal;

    const saldo = estValorComDesc - realValorTotal;
    const desvio = realValorTotal > estValorComDesc && estValorComDesc > 0
      ? Math.round(((realValorTotal - estValorComDesc) / estValorComDesc) * 100) : 0;
    const progressPercent = estValorComDesc > 0
      ? Math.min(100, Math.round((realValorTotal / estValorComDesc) * 100))
      : (realValorTotal > 0 ? 100 : 0);

    return { estQtd, estHoras, estValorTotal, estValorComDesc, realQtd, realHoras, realValorTotal, saldo, desvio, progressPercent };
  }, [rtMatrizRows, rfMatrizRows, rtRealizados, rfRealizados, terceirosEstTotal, terceirosRealTotal]);

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
        { content: 'Recurso', rowSpan: 2 },
        { content: 'ESTIMADO (Acumulado)', colSpan: 6 },
        { content: 'REALIZADO', colSpan: 4 },
        { content: 'RESUMO', colSpan: 3 },
      ],
      ['Qtd', 'Horas', 'Vlr Unitário', 'Vlr Total', 'Desc.', 'Vlr c/ Desc.',
       'Qtd', 'Horas', 'Vlr Unitário', 'Vlr Total',
       'Saldo', 'Desvio', 'Progresso'],
    ];

    const allRows = [...rtMatrizRows, ...rfMatrizRows];
    const body = allRows.map(row => [
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
      totais.estQtd.toString(), totais.estHoras.toString(), '',
      formatCurrency(totais.estValorTotal), '', '',
      totais.realQtd.toString(), totais.realHoras.toString(), '',
      formatCurrency(totais.realValorTotal),
      formatCurrency(totais.saldo), `${totais.desvio}%`, `${totais.progressPercent}%`,
    ]);

    autoTable(doc, {
      startY: 38, head: headers, body,
      headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255], fontSize: 7, halign: 'center' },
      bodyStyles: { fontSize: 7 }, margin: { left: 10 }, theme: 'grid',
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
    const allRows = [...rtMatrizRows, ...rfMatrizRows];

    const data = [
      ['MATRIZ COMPARATIVA DE CUSTOS'],
      [`Conteúdo: ${titulo}`, `Data: ${dataExport}`, `Gravações: ${numGravacoes}`],
      [],
      [
        'Recurso',
        'Est. Qtd', 'Est. Horas', 'Est. Vlr Unitário', 'Est. Vlr Total', 'Est. Desconto', 'Est. Vlr c/ Desc.',
        'Real. Qtd', 'Real. Horas', 'Real. Vlr Unitário', 'Real. Vlr Total',
        'Saldo', 'Desvio', 'Progresso',
      ],
      ...allRows.map(row => [
        row.recursoNome,
        row.estimadoAcumulado?.quantidade || 0, row.estimadoAcumulado?.horas || 0,
        row.estimadoAcumulado?.valorUnitario || 0, row.estimadoAcumulado?.valorTotal || 0,
        row.estimadoAcumulado ? `${row.estimadoAcumulado.descontoPercentual}%` : '0%',
        row.estimadoAcumulado?.valorComDesconto || 0,
        row.realizado?.quantidade || 0, row.realizado?.totalHoras || 0,
        row.realizado?.valorUnitarioMedio || 0, row.realizado?.valorTotal || 0,
        row.saldo, `${row.desvioPercentual}%`, `${row.progressPercent}%`,
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

  const hasData = rtEstimados.length > 0 || rtRealizados.length > 0 || rfEstimados.length > 0 || rfRealizados.length > 0 || terceirosEstimados.length > 0 || terceirosRealizados.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Calculator className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum recurso associado</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Associe recursos técnicos, físicos ou terceiros ao conteúdo para visualizar a matriz comparativa.
        </p>
      </div>
    );
  }

  const totalColumns = 14;

  const renderGroupRows = (rows: MatrizRow[], groupLabel: string) => {
    if (rows.length === 0) return null;
    return (
      <>
        {/* Group header */}
        <TableRow className="bg-muted/60">
          <TableCell colSpan={totalColumns} className="font-semibold text-xs text-foreground py-1.5 uppercase tracking-wide">
            {groupLabel}
          </TableCell>
        </TableRow>
        {rows.map((row) => {
          const key = `${row.tipo}-${row.recursoId}`;
          const isExpanded = expandedRows.has(key);
          const hasDrillDown = row.drillDown.length > 0;

          return (
            <>
              <TableRow
                key={key}
                className={hasDrillDown ? 'cursor-pointer hover:bg-muted/70' : ''}
                onClick={() => hasDrillDown && toggleRow(key)}
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
                <TableCell className="text-center border-r">{row.estimadoAcumulado?.quantidade ?? '-'}</TableCell>
                <TableCell className="text-center border-r">{row.estimadoAcumulado?.horas ?? '-'}</TableCell>
                <TableCell className="text-right border-r">{row.estimadoAcumulado ? formatCurrency(row.estimadoAcumulado.valorUnitario) : '-'}</TableCell>
                <TableCell className="text-right border-r">{row.estimadoAcumulado ? formatCurrency(row.estimadoAcumulado.valorTotal) : '-'}</TableCell>
                <TableCell className="text-center border-r">{row.estimadoAcumulado ? `${row.estimadoAcumulado.descontoPercentual}%` : '-'}</TableCell>
                <TableCell className="text-right border-r">{row.estimadoAcumulado ? formatCurrency(row.estimadoAcumulado.valorComDesconto) : '-'}</TableCell>
                <TableCell className="text-center border-r">{row.realizado?.quantidade ?? '-'}</TableCell>
                <TableCell className="text-center border-r">{row.realizado?.totalHoras ?? '-'}</TableCell>
                <TableCell className="text-right border-r">{row.realizado ? formatCurrency(row.realizado.valorUnitarioMedio) : '-'}</TableCell>
                <TableCell className="text-right border-r">{row.realizado ? formatCurrency(row.realizado.valorTotal) : '-'}</TableCell>
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

              {isExpanded && row.drillDown.map((dd) => (
                <TableRow key={`${key}-${dd.gravacaoId}`} className="bg-muted/30">
                  <TableCell className="border-r pl-8 text-xs text-muted-foreground whitespace-nowrap">
                    {dd.gravacaoCodigo} - {dd.gravacaoNome}
                  </TableCell>
                  <TableCell className="text-center border-r text-xs">{dd.estQuantidade}</TableCell>
                  <TableCell className="text-center border-r text-xs">{dd.estHoras}</TableCell>
                  <TableCell className="text-right border-r text-xs">{formatCurrency(dd.estValorUnitario)}</TableCell>
                  <TableCell className="text-right border-r text-xs">{formatCurrency(dd.estValorTotal)}</TableCell>
                  <TableCell className="text-center border-r text-xs">{dd.estDescontoPercentual}%</TableCell>
                  <TableCell className="text-right border-r text-xs">{formatCurrency(dd.estValorComDesconto)}</TableCell>
                  <TableCell className="text-center border-r text-xs">{dd.realQuantidade}</TableCell>
                  <TableCell className="text-center border-r text-xs">{dd.realHoras}</TableCell>
                  <TableCell className="text-right border-r text-xs">{formatCurrency(dd.realValorUnitario)}</TableCell>
                  <TableCell className="text-right border-r text-xs">{formatCurrency(dd.realValorTotal)}</TableCell>
                  <TableCell className={`text-right border-r text-xs ${dd.saldo < 0 ? 'text-destructive' : dd.saldo > 0 ? 'text-green-600' : ''}`}>
                    {formatCurrency(dd.saldo)}
                  </TableCell>
                  <TableCell className={`text-center border-r text-xs ${dd.desvioPercentual > 0 ? 'text-destructive' : ''}`}>
                    {dd.desvioPercentual}%
                  </TableCell>
                  <TableCell className="px-2">
                    <div className="flex items-center gap-1">
                      <Progress value={dd.progressPercent} className="h-2 flex-1" />
                      <span className="text-[10px] text-muted-foreground w-8 text-right">{dd.progressPercent}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </>
          );
        })}
      </>
    );
  };

  const allTerceiros = [
    ...terceirosEstimados.map(te => {
      const realMatch = terceirosRealizados.find(tr => tr.servicoNome === te.servicoNome);
      const estVal = te.valorPrevisto;
      const realVal = realMatch?.valorTotal || 0;
      const saldo = estVal - realVal;
      const desvio = realVal > estVal && estVal > 0 ? Math.round(((realVal - estVal) / estVal) * 100) : 0;
      const progress = estVal > 0 ? Math.min(100, Math.round((realVal / estVal) * 100)) : (realVal > 0 ? 100 : 0);
      return { key: `terc-est-${te.servicoId}`, nome: te.servicoNome, estVal, realVal, saldo, desvio, progress };
    }),
    ...terceirosRealizados
      .filter(tr => !terceirosEstimados.some(te => te.servicoNome === tr.servicoNome))
      .map(tr => ({
        key: `terc-real-${tr.servicoNome}`, nome: tr.servicoNome,
        estVal: 0, realVal: tr.valorTotal, saldo: -tr.valorTotal, desvio: 0, progress: 100,
      })),
  ];

  const hasTerceiros = allTerceiros.length > 0;

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Matriz Comparativa de Custos</h3>
            <p className="text-sm text-muted-foreground">
              {numGravacoes} gravação(ões) • {rtMatrizRows.length} recurso(s) técnico(s) • {rfMatrizRows.length} recurso(s) físico(s){terceirosEstimados.length > 0 ? ` • ${terceirosEstimados.length} terceiro(s)` : ''} • Valores acumulados
            </p>
          </div>
        </div>
        <ExportDropdown onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />
      </div>

      <Card>
        <CardContent className="pt-4 px-2 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-0">
                <TableHead rowSpan={2} className="align-bottom border-r font-semibold text-foreground">
                  Recurso
                </TableHead>
                <TableHead colSpan={6} className="text-center font-bold text-white border-r bg-kreato-blue">
                  ESTIMADO
                </TableHead>
                <TableHead colSpan={4} className="text-center font-bold text-white border-r bg-kreato-cyan">
                  REALIZADO
                </TableHead>
                <TableHead colSpan={3} className="text-center font-bold text-white bg-kreato-orange">
                  RESUMO
                </TableHead>
              </TableRow>
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
              {/* Recursos Técnicos */}
              {renderGroupRows(rtMatrizRows, 'Recursos Técnicos')}

              {/* Recursos Físicos */}
              {renderGroupRows(rfMatrizRows, 'Recursos Físicos')}

              {/* Terceiros */}
              {hasTerceiros && (
                <>
                  <TableRow className="bg-muted/60">
                    <TableCell colSpan={totalColumns} className="font-semibold text-xs text-foreground py-1.5 uppercase tracking-wide">
                      Terceiros
                    </TableCell>
                  </TableRow>
                  {allTerceiros.map((t) => (
                    <TableRow key={t.key} className="bg-amber-50/30">
                      <TableCell className="font-medium border-r whitespace-nowrap">
                        🏢 {t.nome}
                      </TableCell>
                      <TableCell className="text-center border-r">-</TableCell>
                      <TableCell className="text-center border-r">-</TableCell>
                      <TableCell className="text-right border-r">-</TableCell>
                      <TableCell className="text-right border-r">{formatCurrency(t.estVal)}</TableCell>
                      <TableCell className="text-center border-r">-</TableCell>
                      <TableCell className="text-right border-r">-</TableCell>
                      <TableCell className="text-center border-r">-</TableCell>
                      <TableCell className="text-center border-r">-</TableCell>
                      <TableCell className="text-right border-r">-</TableCell>
                      <TableCell className="text-right border-r">{formatCurrency(t.realVal)}</TableCell>
                      <TableCell className={`text-right border-r font-medium ${t.saldo < 0 ? 'text-destructive' : t.saldo > 0 ? 'text-green-600' : ''}`}>
                        {formatCurrency(t.saldo)}
                      </TableCell>
                      <TableCell className={`text-center border-r font-medium ${t.desvio > 0 ? 'text-destructive' : ''}`}>
                        {t.desvio}%
                      </TableCell>
                      <TableCell className="px-2">
                        <div className="flex items-center gap-1">
                          <Progress value={t.progress} className="h-2 flex-1" />
                          <span className="text-[10px] text-muted-foreground w-8 text-right">{t.progress}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}

              {/* Total */}
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
