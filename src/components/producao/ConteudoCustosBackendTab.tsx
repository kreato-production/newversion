'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Calculator, Download } from 'lucide-react';
import { formatCurrency as fmt } from '@/lib/currencies';
import { conteudosRepository } from '@/modules/conteudos/conteudos.repository.provider';
import { conteudosRelacionamentosApi } from '@/modules/conteudos/conteudos-relacionamentos.api';
import { gravacoesRepository } from '@/modules/gravacoes/gravacoes.repository.provider';
import { ApiAlocacoesRepository } from '@/modules/alocacoes/alocacoes.api';
import { ApiRecursosHumanosRepository } from '@/modules/recursos-humanos/recursos-humanos.api.repository';
import { ApiRecursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.api.repository';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConteudoCustosBackendTabProps {
  conteudoId: string;
  conteudoNome?: string;
}

type MatrizRow = {
  recursoId: string;
  recursoNome: string;
  // Estimado
  estQtd: number;
  estHoras: number;
  estValorHora: number;
  estValorTotal: number;
  estDesconto: number;
  estValorComDesconto: number;
  // Realizado
  realQtd: number;
  realHoras: number;
  realValorHora: number;
  realValorTotal: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const alocacoesApi = new ApiAlocacoesRepository();
const recursosHumanosApi = new ApiRecursosHumanosRepository();
const recursosFisicosApi = new ApiRecursosFisicosRepository();

function hoursBetween(inicio?: string | null, fim?: string | null) {
  if (!inicio || !fim) return 0;
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fim.split(':').map(Number);
  const start = hi * 60 + mi;
  const end = hf * 60 + mf;
  return end > start ? (end - start) / 60 : 0;
}

function dash(value: number) {
  return value === 0 ? '-' : null;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="flex items-center gap-1.5 min-w-[80px]">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs w-9 text-right">{Math.round(clamped)}%</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const ConteudoCustosBackendTab = ({
  conteudoId,
  conteudoNome,
}: ConteudoCustosBackendTabProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [moeda, setMoeda] = useState('BRL');
  const [rtRows, setRtRows] = useState<MatrizRow[]>([]);
  const [rfRows, setRfRows] = useState<MatrizRow[]>([]);
  const [gravacoesCount, setGravacoesCount] = useState(0);

  const f = (v: number) => fmt(v, moeda);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [conteudos, options, gravacoes, overview, rhs, rfs] = await Promise.all([
          conteudosRepository.list(),
          conteudosRepository.listOptions(),
          gravacoesRepository.list(),
          alocacoesApi.listOverview(),
          recursosHumanosApi.list(),
          recursosFisicosApi.list(),
        ]);

        // Currency
        const conteudo = conteudos.find((c) => c.id === conteudoId);
        const unidade = options.unidades.find((u) => u.id === conteudo?.unidadeNegocioId);
        setMoeda(unidade?.moeda || 'BRL');

        // Gravações for this conteudo
        const gravConteudo = gravacoes.filter((g) => g.conteudoId === conteudoId);
        setGravacoesCount(gravConteudo.length);
        const gravIds = new Set(gravConteudo.map((g) => g.id));

        // ── Estimado: aggregate from Espaços resources ──────────────────────
        const espacos = await conteudosRelacionamentosApi.listEspacos(conteudoId);

        type EstEntry = {
          nome: string;
          qtd: number;
          horas: number;
          valorHora: number;
          valorTotal: number;
          desconto: number;
          valorComDesconto: number;
        };
        const rtEstMap = new Map<string, EstEntry>();
        const rfEstMap = new Map<string, EstEntry>();

        await Promise.all(
          espacos.flatMap((esp) => [
            conteudosRelacionamentosApi
              .listEspacoResources(conteudoId, esp.id, 'tecnico')
              .then(({ items }) => {
                for (const item of items) {
                  const hrs = hoursBetween(item.horaInicio, item.horaFim) * item.quantidade;
                  const ex = rtEstMap.get(item.recursoId);
                  if (ex) {
                    ex.qtd += item.quantidade;
                    ex.horas += hrs;
                    ex.valorTotal += item.valorTotal;
                    ex.valorComDesconto += item.valorComDesconto;
                  } else {
                    rtEstMap.set(item.recursoId, {
                      nome: item.recursoNome,
                      qtd: item.quantidade,
                      horas: hrs,
                      valorHora: item.valorHora,
                      valorTotal: item.valorTotal,
                      desconto: item.descontoPercentual,
                      valorComDesconto: item.valorComDesconto,
                    });
                  }
                }
              }),
            conteudosRelacionamentosApi
              .listEspacoResources(conteudoId, esp.id, 'fisico')
              .then(({ items }) => {
                for (const item of items) {
                  const hrs = hoursBetween(item.horaInicio, item.horaFim) * item.quantidade;
                  const ex = rfEstMap.get(item.recursoId);
                  if (ex) {
                    ex.qtd += item.quantidade;
                    ex.horas += hrs;
                    ex.valorTotal += item.valorTotal;
                    ex.valorComDesconto += item.valorComDesconto;
                  } else {
                    rfEstMap.set(item.recursoId, {
                      nome: item.recursoNome,
                      qtd: item.quantidade,
                      horas: hrs,
                      valorHora: item.valorHora,
                      valorTotal: item.valorTotal,
                      desconto: item.descontoPercentual,
                      valorComDesconto: item.valorComDesconto,
                    });
                  }
                }
              }),
          ]),
        );

        // ── Realizado: aggregate from alocações ─────────────────────────────
        const rhMap = new Map(rhs.map((r) => [r.id, r.custoHora || 0]));
        const rfCostMap = new Map(rfs.map((r) => [r.id, r.custoHora || 0]));

        type RealEntry = { nome: string; gravIds: Set<string>; horas: number; valorTotal: number };
        const rtRealMap = new Map<string, RealEntry>();
        const rfRealMap = new Map<string, RealEntry>();

        for (const al of overview.alocacoes.filter((a) => gravIds.has(a.gravacaoId))) {
          if (al.recursoTecnicoId && al.recursoTecnicoNome) {
            const hrs = hoursBetween(al.horaInicio, al.horaFim);
            const cost = al.recursoHumanoId ? rhMap.get(al.recursoHumanoId) || 0 : 0;
            const ex = rtRealMap.get(al.recursoTecnicoId);
            if (ex) {
              ex.gravIds.add(al.gravacaoId);
              ex.horas += hrs;
              ex.valorTotal += hrs * cost;
            } else
              rtRealMap.set(al.recursoTecnicoId, {
                nome: al.recursoTecnicoNome,
                gravIds: new Set([al.gravacaoId]),
                horas: hrs,
                valorTotal: hrs * cost,
              });
          }
          if (al.recursoFisicoId && al.recursoFisicoNome && !al.recursoTecnicoId) {
            const hrs = hoursBetween(al.horaInicio, al.horaFim);
            const cost = rfCostMap.get(al.recursoFisicoId) || 0;
            const ex = rfRealMap.get(al.recursoFisicoId);
            if (ex) {
              ex.gravIds.add(al.gravacaoId);
              ex.horas += hrs;
              ex.valorTotal += hrs * cost;
            } else
              rfRealMap.set(al.recursoFisicoId, {
                nome: al.recursoFisicoNome,
                gravIds: new Set([al.gravacaoId]),
                horas: hrs,
                valorTotal: hrs * cost,
              });
          }
        }

        // ── Build matrix rows ────────────────────────────────────────────────
        const buildRows = (
          estMap: Map<string, EstEntry>,
          realMap: Map<string, RealEntry>,
        ): MatrizRow[] => {
          const allIds = new Set([...estMap.keys(), ...realMap.keys()]);
          return [...allIds].map((id) => {
            const est = estMap.get(id);
            const real = realMap.get(id);
            const realHoras = real?.horas ?? 0;
            const realValorTotal = real?.valorTotal ?? 0;
            return {
              recursoId: id,
              recursoNome: est?.nome || real?.nome || id,
              estQtd: est?.qtd ?? 0,
              estHoras: est?.horas ?? 0,
              estValorHora: est?.valorHora ?? 0,
              estValorTotal: est?.valorTotal ?? 0,
              estDesconto: est?.desconto ?? 0,
              estValorComDesconto: est?.valorComDesconto ?? 0,
              realQtd: real ? real.gravIds.size : 0,
              realHoras,
              realValorHora: realHoras > 0 ? realValorTotal / realHoras : 0,
              realValorTotal,
            };
          });
        };

        setRtRows(buildRows(rtEstMap, rtRealMap));
        setRfRows(buildRows(rfEstMap, rfRealMap));
      } catch (err) {
        console.error('Error loading custos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [conteudoId]);

  const totals = useMemo(() => {
    const all = [...rtRows, ...rfRows];
    return all.reduce(
      (acc, r) => ({
        estQtd: acc.estQtd + r.estQtd,
        estHoras: acc.estHoras + r.estHoras,
        estValorTotal: acc.estValorTotal + r.estValorTotal,
        estValorComDesconto: acc.estValorComDesconto + r.estValorComDesconto,
        realQtd: acc.realQtd + r.realQtd,
        realHoras: acc.realHoras + r.realHoras,
        realValorTotal: acc.realValorTotal + r.realValorTotal,
      }),
      {
        estQtd: 0,
        estHoras: 0,
        estValorTotal: 0,
        estValorComDesconto: 0,
        realQtd: 0,
        realHoras: 0,
        realValorTotal: 0,
      },
    );
  }, [rtRows, rfRows]);

  const handleExport = () => {
    const header = [
      'Recurso',
      'Est.Qtd',
      'Est.Horas',
      'Est.VlrUnitário',
      'Est.VlrTotal',
      'Est.Desconto%',
      'Est.VlrComDesc',
      'Real.Qtd',
      'Real.Horas',
      'Real.VlrUnitário',
      'Real.VlrTotal',
      'Saldo',
      'Desvio%',
    ];
    const rows = [
      ['RECURSOS TÉCNICOS', ...Array(12).fill('')],
      ...rtRows.map((r) => matrizRowToCsv(r)),
      ['EQUIPAMENTOS', ...Array(12).fill('')],
      ...rfRows.map((r) => matrizRowToCsv(r)),
    ];
    const csv = [header, ...rows].map((r) => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custos-${conteudoNome || conteudoId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderRow = (row: MatrizRow) => {
    const saldo = row.estValorComDesconto - row.realValorTotal;
    const desvio =
      row.estValorComDesconto > 0
        ? (row.realValorTotal / row.estValorComDesconto) * 100
        : row.realValorTotal > 0
          ? 100
          : 0;
    const estEmpty = row.estValorComDesconto === 0 && row.estQtd === 0;

    return (
      <TableRow key={row.recursoId} className="text-xs">
        <TableCell className="font-medium text-xs pl-4">{row.recursoNome}</TableCell>
        {/* Estimado */}
        <TableCell className="text-center text-xs">{estEmpty ? '-' : row.estQtd || '-'}</TableCell>
        <TableCell className="text-center text-xs">
          {estEmpty ? '-' : row.estHoras > 0 ? row.estHoras.toFixed(0) : '-'}
        </TableCell>
        <TableCell className="text-right text-xs font-mono">
          {estEmpty ? '-' : f(row.estValorHora)}
        </TableCell>
        <TableCell className="text-right text-xs font-mono">
          {estEmpty ? '-' : f(row.estValorTotal)}
        </TableCell>
        <TableCell className="text-center text-xs">
          {estEmpty ? '-' : row.estDesconto > 0 ? `${row.estDesconto}%` : '-'}
        </TableCell>
        <TableCell className="text-right text-xs font-mono">
          {estEmpty ? '-' : f(row.estValorComDesconto)}
        </TableCell>
        {/* Realizado */}
        <TableCell className="text-center text-xs">{row.realQtd || '-'}</TableCell>
        <TableCell className="text-center text-xs">
          {row.realHoras > 0 ? row.realHoras.toFixed(0) : '-'}
        </TableCell>
        <TableCell className="text-right text-xs font-mono">
          {row.realValorHora > 0 ? f(row.realValorHora) : '-'}
        </TableCell>
        <TableCell className="text-right text-xs font-mono">
          {row.realValorTotal > 0 ? f(row.realValorTotal) : '-'}
        </TableCell>
        {/* Resumo */}
        <TableCell
          className={`text-right text-xs font-mono font-semibold ${saldo < 0 ? 'text-destructive' : saldo > 0 ? 'text-emerald-600' : ''}`}
        >
          {f(saldo)}
        </TableCell>
        <TableCell className="text-center text-xs">{Math.round(desvio)}%</TableCell>
        <TableCell className="text-xs">
          <ProgressBar pct={desvio} />
        </TableCell>
      </TableRow>
    );
  };

  const totalSaldo = totals.estValorComDesconto - totals.realValorTotal;
  const totalDesvio =
    totals.estValorComDesconto > 0
      ? (totals.realValorTotal / totals.estValorComDesconto) * 100
      : totals.realValorTotal > 0
        ? 100
        : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600 shrink-0">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Matriz Comparativa de Custos</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {gravacoesCount} gravação(ões)
              {rtRows.length > 0 && ` • ${rtRows.length} recurso(s) técnico(s)`}
              {rfRows.length > 0 && ` • ${rfRows.length} equipamento(s)`}
              {' • Valores acumulados'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" />
          Exportar
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            {/* Group headers */}
            <TableRow className="border-b-0">
              <TableHead rowSpan={2} className="text-xs align-bottom pb-2 min-w-[140px]">
                Recurso
              </TableHead>
              <TableHead
                colSpan={6}
                className="text-center text-xs font-bold bg-blue-600 text-white border-x"
              >
                ESTIMADO
              </TableHead>
              <TableHead
                colSpan={4}
                className="text-center text-xs font-bold bg-cyan-500 text-white border-x"
              >
                REALIZADO
              </TableHead>
              <TableHead
                colSpan={3}
                className="text-center text-xs font-bold bg-orange-500 text-white"
              >
                RESUMO
              </TableHead>
            </TableRow>
            {/* Sub-headers */}
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs text-center w-14">Quantidade</TableHead>
              <TableHead className="text-xs text-center w-14">Horas</TableHead>
              <TableHead className="text-xs text-right w-24">Valor Unitário</TableHead>
              <TableHead className="text-xs text-right w-24">Valor Total</TableHead>
              <TableHead className="text-xs text-center w-16">Desconto</TableHead>
              <TableHead className="text-xs text-right w-28 border-r">Vlr Total c/ Desc.</TableHead>
              <TableHead className="text-xs text-center w-14">Quantidade</TableHead>
              <TableHead className="text-xs text-center w-14">Horas</TableHead>
              <TableHead className="text-xs text-right w-24">Valor Unitário</TableHead>
              <TableHead className="text-xs text-right w-24 border-r">Valor Total</TableHead>
              <TableHead className="text-xs text-right w-24">Saldo</TableHead>
              <TableHead className="text-xs text-center w-14">Desvio</TableHead>
              <TableHead className="text-xs w-28">Progresso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rtRows.length === 0 && rfRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center text-muted-foreground py-10 text-xs">
                  Nenhum dado disponível. Associe espaços e alocações às gravações deste conteúdo.
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rtRows.length > 0 && (
                  <>
                    <TableRow className="bg-muted/40">
                      <TableCell
                        colSpan={14}
                        className="py-1.5 px-4 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                      >
                        Recursos Técnicos
                      </TableCell>
                    </TableRow>
                    {rtRows.map(renderRow)}
                  </>
                )}
                {rfRows.length > 0 && (
                  <>
                    <TableRow className="bg-muted/40">
                      <TableCell
                        colSpan={14}
                        className="py-1.5 px-4 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                      >
                        Equipamentos
                      </TableCell>
                    </TableRow>
                    {rfRows.map(renderRow)}
                  </>
                )}
                {/* Total row */}
                <TableRow className="border-t-2 font-bold bg-muted/20">
                  <TableCell className="text-xs font-bold pl-4">Total</TableCell>
                  <TableCell className="text-center text-xs">{totals.estQtd || 0}</TableCell>
                  <TableCell className="text-center text-xs">
                    {totals.estHoras > 0 ? totals.estHoras.toFixed(0) : 0}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right text-xs font-mono">
                    {f(totals.estValorTotal)}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right text-xs font-mono border-r">
                    {f(totals.estValorComDesconto)}
                  </TableCell>
                  <TableCell className="text-center text-xs">{totals.realQtd}</TableCell>
                  <TableCell className="text-center text-xs">
                    {totals.realHoras > 0 ? totals.realHoras.toFixed(0) : 0}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right text-xs font-mono border-r">
                    {f(totals.realValorTotal)}
                  </TableCell>
                  <TableCell
                    className={`text-right text-xs font-mono ${totalSaldo < 0 ? 'text-destructive' : totalSaldo > 0 ? 'text-emerald-600' : ''}`}
                  >
                    {f(totalSaldo)}
                  </TableCell>
                  <TableCell className="text-center text-xs">{Math.round(totalDesvio)}%</TableCell>
                  <TableCell>
                    <ProgressBar pct={totalDesvio} />
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

function matrizRowToCsv(r: MatrizRow): string[] {
  const saldo = r.estValorComDesconto - r.realValorTotal;
  const desvio = r.estValorComDesconto > 0 ? (r.realValorTotal / r.estValorComDesconto) * 100 : 0;
  return [
    r.recursoNome,
    String(r.estQtd),
    r.estHoras.toFixed(2),
    r.estValorHora.toFixed(2),
    r.estValorTotal.toFixed(2),
    `${r.estDesconto}%`,
    r.estValorComDesconto.toFixed(2),
    String(r.realQtd),
    r.realHoras.toFixed(2),
    r.realValorHora.toFixed(2),
    r.realValorTotal.toFixed(2),
    saldo.toFixed(2),
    `${Math.round(desvio)}%`,
  ];
}
