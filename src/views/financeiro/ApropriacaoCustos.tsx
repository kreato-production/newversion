'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Loader2,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageComponents';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { useToast } from '@/hooks/use-toast';
import {
  ApiApropriacoesCustoRepository,
  type CostRow,
  type LookupItem,
} from '@/modules/financeiro/apropriacoes-custo.api';

// ─── Constants ────────────────────────────────────────────────────────────────

const repo = new ApiApropriacoesCustoRepository();
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const NONE = '__none__';

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  if (value === 0) return '-';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Build a 12-element array summing costs per month (1-indexed) */
function buildMonthlyArray(rows: CostRow[]): number[] {
  const arr = new Array<number>(12).fill(0);
  for (const r of rows) {
    const idx = r.mes - 1;
    if (idx >= 0 && idx < 12) arr[idx] += r.custo;
  }
  return arr;
}

function sumArr(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0);
}

// ─── Table primitives ─────────────────────────────────────────────────────────

function MonthCell({ value }: { value: number }) {
  return (
    <td className="px-2 py-1.5 text-right tabular-nums text-xs whitespace-nowrap text-muted-foreground">
      {fmt(value)}
    </td>
  );
}

function TotalCell({ value, bold }: { value: number; bold?: boolean }) {
  return (
    <td
      className={`px-3 py-1.5 text-right tabular-nums text-xs whitespace-nowrap bg-muted/40 border-l ${
        bold ? 'font-bold text-foreground' : 'font-medium'
      }`}
    >
      {fmt(value)}
    </td>
  );
}

function TableHead() {
  return (
    <thead>
      <tr className="border-b bg-muted/50">
        <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-52 min-w-[13rem]">
          &nbsp;
        </th>
        {MONTHS.map((m) => (
          <th key={m} className="px-2 py-2 text-right text-xs font-semibold text-muted-foreground w-20">
            {m}
          </th>
        ))}
        <th className="px-3 py-2 text-right text-xs font-semibold w-24 bg-muted/40 border-l">
          Total
        </th>
      </tr>
    </thead>
  );
}

// ─── Table 1: by Unidade de Negócio ──────────────────────────────────────────

type UnidadeRow = {
  id: string | null;
  nome: string;
  monthly: number[];
};

function buildUnidadeRows(rows: CostRow[]): UnidadeRow[] {
  const map = new Map<string, UnidadeRow>();
  for (const r of rows) {
    const key = r.unidadeId ?? '__sem_unidade__';
    if (!map.has(key)) {
      map.set(key, {
        id: r.unidadeId,
        nome: r.unidadeNome ?? 'Sem Unidade de Negócio',
        monthly: new Array<number>(12).fill(0),
      });
    }
    const row = map.get(key)!;
    const idx = r.mes - 1;
    if (idx >= 0 && idx < 12) row.monthly[idx] += r.custo;
  }
  return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome));
}

function UnidadeTable({ rows }: { rows: CostRow[] }) {
  const unidadeRows = useMemo(() => buildUnidadeRows(rows), [rows]);
  const grandTotal = useMemo(
    () => unidadeRows.reduce((arr, r) => arr.map((v, i) => v + r.monthly[i]), new Array(12).fill(0) as number[]),
    [unidadeRows],
  );

  if (unidadeRows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhum custo encontrado para o período selecionado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <TableHead />
        <tbody>
          {unidadeRows.map((u) => (
            <tr key={u.id ?? 'none'} className="border-b hover:bg-muted/20 transition-colors">
              <td className="px-3 py-1.5 font-medium text-sm">{u.nome}</td>
              {u.monthly.map((v, i) => <MonthCell key={i} value={v} />)}
              <TotalCell value={sumArr(u.monthly)} bold />
            </tr>
          ))}
          {/* Grand total */}
          <tr className="bg-muted/30 font-semibold border-t-2">
            <td className="px-3 py-2 text-sm font-bold">Total Geral</td>
            {grandTotal.map((v, i) => (
              <td key={i} className="px-2 py-2 text-right tabular-nums text-xs font-semibold whitespace-nowrap">
                {fmt(v)}
              </td>
            ))}
            <TotalCell value={sumArr(grandTotal)} bold />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Table 2: by Centro de Custo ──────────────────────────────────────────────

type RecursoRow = {
  nome: string;
  monthly: number[];
};

type CentroRow = {
  id: string | null;
  nome: string;
  recursos: RecursoRow[];
  monthly: number[]; // aggregated
};

function buildCentroRows(rows: CostRow[]): CentroRow[] {
  // centroLucro → recurso → monthly sums
  const centroMap = new Map<string, CentroRow>();

  for (const r of rows) {
    const cKey = r.centroLucroId ?? '__sem_cl__';
    if (!centroMap.has(cKey)) {
      centroMap.set(cKey, {
        id: r.centroLucroId,
        nome: r.centroLucroNome ?? 'Sem Centro de Custo',
        recursos: [],
        monthly: new Array<number>(12).fill(0),
      });
    }
    const centro = centroMap.get(cKey)!;
    const idx = r.mes - 1;
    if (idx >= 0 && idx < 12) centro.monthly[idx] += r.custo;

    let recurso = centro.recursos.find((rr) => rr.nome === r.recursoNome);
    if (!recurso) {
      recurso = { nome: r.recursoNome, monthly: new Array<number>(12).fill(0) };
      centro.recursos.push(recurso);
    }
    if (idx >= 0 && idx < 12) recurso.monthly[idx] += r.custo;
  }

  const result = [...centroMap.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  result.forEach((c) => c.recursos.sort((a, b) => a.nome.localeCompare(b.nome)));
  return result;
}

function CentroTable({ rows }: { rows: CostRow[] }) {
  const centroRows = useMemo(() => buildCentroRows(rows), [rows]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const grandTotal = useMemo(
    () => centroRows.reduce((arr, r) => arr.map((v, i) => v + r.monthly[i]), new Array(12).fill(0) as number[]),
    [centroRows],
  );

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (centroRows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhum custo encontrado para o período selecionado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <TableHead />
        <tbody>
          {centroRows.map((centro) => {
            const isOpen = expanded.has(centro.id ?? '__sem_cl__');
            return (
              <>
                {/* Centro row */}
                <tr
                  key={`centro-${centro.id}`}
                  className="border-b bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => toggle(centro.id ?? '__sem_cl__')}
                >
                  <td className="px-3 py-2 font-semibold text-sm">
                    <div className="flex items-center gap-1.5">
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      {centro.nome}
                    </div>
                  </td>
                  {centro.monthly.map((v, i) => <MonthCell key={i} value={v} />)}
                  <TotalCell value={sumArr(centro.monthly)} bold />
                </tr>

                {/* Recurso rows */}
                {isOpen &&
                  centro.recursos.map((rec) => (
                    <tr
                      key={`rec-${centro.id}-${rec.nome}`}
                      className="border-b hover:bg-muted/10 transition-colors"
                    >
                      <td className="pl-8 pr-3 py-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="h-3.5 w-3.5 shrink-0 opacity-30">↳</span>
                          {rec.nome}
                        </div>
                      </td>
                      {rec.monthly.map((v, i) => <MonthCell key={i} value={v} />)}
                      <TotalCell value={sumArr(rec.monthly)} />
                    </tr>
                  ))}
              </>
            );
          })}

          {/* Grand total */}
          <tr className="bg-muted/30 font-semibold border-t-2">
            <td className="px-3 py-2 text-sm font-bold">Total Geral</td>
            {grandTotal.map((v, i) => (
              <td key={i} className="px-2 py-2 text-right tabular-nums text-xs font-semibold whitespace-nowrap">
                {fmt(v)}
              </td>
            ))}
            <TotalCell value={sumArr(grandTotal)} bold />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Filters bar ──────────────────────────────────────────────────────────────

type Filters = {
  ano: number;
  centroLucroId: string | null;
  unidadeId: string | null;
};

function FiltersBar({
  filters,
  centrosLucro,
  unidades,
  onChange,
}: {
  filters: Filters;
  centrosLucro: LookupItem[];
  unidades: LookupItem[];
  onChange: (f: Filters) => void;
}) {
  const centroLucroOptions = [
    { value: NONE, label: 'Todos' },
    ...centrosLucro.map((c) => ({ value: c.id, label: c.nome })),
  ];

  const unidadeOptions = [
    { value: NONE, label: 'Todas' },
    ...unidades.map((u) => ({ value: u.id, label: u.nome })),
  ];

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Ano</Label>
            <Select
              value={String(filters.ano)}
              onValueChange={(v) => onChange({ ...filters, ano: Number(v) })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Centro de Custo</Label>
            <SearchableSelect
              options={centroLucroOptions}
              value={filters.centroLucroId ?? NONE}
              onValueChange={(v) => onChange({ ...filters, centroLucroId: v === NONE ? null : v })}
              placeholder="Todos"
              searchPlaceholder="Pesquisar centro de custo..."
              emptyMessage="Nenhum centro de custo encontrado."
              triggerClassName="h-8"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Unidades de Negócio</Label>
            <SearchableSelect
              options={unidadeOptions}
              value={filters.unidadeId ?? NONE}
              onValueChange={(v) => onChange({ ...filters, unidadeId: v === NONE ? null : v })}
              placeholder="Todas"
              searchPlaceholder="Pesquisar unidade de negócio..."
              emptyMessage="Nenhuma unidade de negócio encontrada."
              triggerClassName="h-8"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Summary badges ───────────────────────────────────────────────────────────

function SummaryBadges({ rows }: { rows: CostRow[] }) {
  const totalGeral = rows.reduce((s, r) => s + r.custo, 0);
  const unidades = new Set(rows.map((r) => r.unidadeId)).size;
  const centros = new Set(rows.map((r) => r.centroLucroId)).size;

  if (totalGeral === 0) return null;

  return (
    <div className="flex gap-3 mb-4 flex-wrap">
      <Badge variant="outline" className="gap-1.5 text-xs px-3 py-1">
        <TrendingUp className="h-3 w-3" />
        Total: {fmt(totalGeral)}
      </Badge>
      <Badge variant="outline" className="gap-1.5 text-xs px-3 py-1">
        <Building2 className="h-3 w-3" />
        {unidades} unidade{unidades !== 1 ? 's' : ''}
      </Badge>
      <Badge variant="outline" className="gap-1.5 text-xs px-3 py-1">
        {centros} centro{centros !== 1 ? 's' : ''} de custo
      </Badge>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const ApropriacaoCustos = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<CostRow[]>([]);
  const [centrosLucro, setCentrosLucro] = useState<LookupItem[]>([]);
  const [unidades, setUnidades] = useState<LookupItem[]>([]);
  const [filters, setFilters] = useState<Filters>({
    ano: currentYear,
    centroLucroId: null,
    unidadeId: null,
  });

  const load = useCallback(
    async (f: Filters) => {
      setIsLoading(true);
      try {
        const data = await repo.get(f);
        setRows(data.rows);
        setCentrosLucro(data.centrosLucro);
        setUnidades(data.unidades);
      } catch (err) {
        console.error(err);
        toast({ title: 'Erro', description: 'Erro ao carregar dados de apropriação de custos', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void load(filters);
  }, [load, filters]);

  const handleFiltersChange = (f: Filters) => {
    setFilters(f);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Apropriação de Custos"
        description="Visualize a distribuição de custos por unidades de negócio e centros de custo"
      />

      {/* Filters */}
      <FiltersBar
        filters={filters}
        centrosLucro={centrosLucro}
        unidades={unidades}
        onChange={handleFiltersChange}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <SummaryBadges rows={rows} />

          {/* Table 1: by Unidade */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Custos por Unidade de Negócio — {filters.ano}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <UnidadeTable rows={rows} />
            </CardContent>
          </Card>

          {/* Table 2: by Centro de Custo */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Custos por Centro de Custo — {filters.ano}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clique num centro de custo para expandir os recursos
              </p>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <CentroTable rows={rows} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ApropriacaoCustos;
