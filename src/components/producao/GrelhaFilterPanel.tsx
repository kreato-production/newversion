'use client';

import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { StatusPlaneamentoApiItem } from '@/modules/parametrizacoes/parametrizacoes.api.repository';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GrelhaFilters {
  sortBy: '' | 'data-asc' | 'data-desc' | 'nome-asc' | 'nome-desc' | 'hora-asc' | 'hora-desc';
  canal: string[];
  statusGrelha: string[];
  statusPlaneamentoId: string[];
  tipoExibicao: string[];
  tipoAquisicao: string[];
  semana: string[];
  dataFrom: string;
  dataTo: string;
}

export const EMPTY_GRELHA_FILTERS: GrelhaFilters = {
  sortBy: 'data-asc',
  canal: [],
  statusGrelha: [],
  statusPlaneamentoId: [],
  tipoExibicao: [],
  tipoAquisicao: [],
  semana: [],
  dataFrom: '',
  dataTo: '',
};

export function countGrelhaActiveFilters(filters: GrelhaFilters): number {
  let n = 0;
  if (filters.sortBy && filters.sortBy !== 'data-asc') n++;
  if (filters.canal.length) n++;
  if (filters.statusGrelha.length) n++;
  if (filters.statusPlaneamentoId.length) n++;
  if (filters.tipoExibicao.length) n++;
  if (filters.tipoAquisicao.length) n++;
  if (filters.semana.length) n++;
  if (filters.dataFrom || filters.dataTo) n++;
  return n;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterSection({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <p className="font-semibold text-sm text-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && <div className="px-5 pb-4 space-y-2">{children}</div>}
    </div>
  );
}

function MultiChip({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
            selected.includes(opt.value)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-foreground border-border hover:border-primary hover:text-primary',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SortChip({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value === value ? '' : opt.value)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
            opt.value === value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-foreground border-border hover:border-primary hover:text-primary',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GrelhaFilterPanelProps {
  filters: GrelhaFilters;
  onChange: (next: GrelhaFilters) => void;
  resultCount: number;
  // Options derived from loaded data
  canalOptions: string[];
  statusGrelhaOptions: string[];
  tipoExibicaoOptions: string[];
  tipoAquisicaoOptions: string[];
  semanaOptions: string[];
  statusPlaneamentos: StatusPlaneamentoApiItem[];
}

export function GrelhaFilterPanel({
  filters,
  onChange,
  resultCount,
  canalOptions,
  statusGrelhaOptions,
  tipoExibicaoOptions,
  tipoAquisicaoOptions,
  semanaOptions,
  statusPlaneamentos,
}: GrelhaFilterPanelProps) {
  const [open, setOpen] = useState(false);
  const activeCount = countGrelhaActiveFilters(filters);

  const set = <K extends keyof GrelhaFilters>(key: K, value: GrelhaFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const clear = () => onChange({ ...EMPTY_GRELHA_FILTERS });

  const sortLabel =
    filters.sortBy === 'data-asc'
      ? 'Data (mais antiga)'
      : filters.sortBy === 'data-desc'
        ? 'Data (mais recente)'
        : filters.sortBy === 'hora-asc'
          ? 'Hora (mais cedo)'
          : filters.sortBy === 'hora-desc'
            ? 'Hora (mais tarde)'
            : filters.sortBy === 'nome-asc'
              ? 'Nome (A→Z)'
              : filters.sortBy === 'nome-desc'
                ? 'Nome (Z→A)'
                : 'Padrão';

  const toOptions = (vals: string[]) => vals.map((v) => ({ value: v, label: v }));

  return (
    <>
      <Button variant="outline" size="sm" className="relative gap-2" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" />
        Filtrar
        {activeCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-background border-2">
            {activeCount}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-[360px] sm:w-[400px] p-0 flex flex-col gap-0 overflow-hidden"
        >
          <SheetHeader className="flex-row items-center justify-between px-5 py-4 border-b shrink-0">
            <button
              type="button"
              className="h-8 w-8 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <SheetTitle className="text-base font-semibold">Filtrar</SheetTitle>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={clear}
            >
              Limpar
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <FilterSection title="Ordenar por" subtitle={sortLabel} defaultOpen>
              <SortChip
                value={filters.sortBy}
                onChange={(v) => set('sortBy', v as GrelhaFilters['sortBy'])}
                options={[
                  { value: 'data-asc', label: 'Data (mais antiga)' },
                  { value: 'data-desc', label: 'Data (mais recente)' },
                  { value: 'hora-asc', label: 'Hora (mais cedo)' },
                  { value: 'hora-desc', label: 'Hora (mais tarde)' },
                  { value: 'nome-asc', label: 'Nome (A→Z)' },
                  { value: 'nome-desc', label: 'Nome (Z→A)' },
                ]}
              />
            </FilterSection>

            <FilterSection
              title="Canal"
              subtitle={filters.canal.length ? filters.canal.join(', ') : 'Todos'}
            >
              <MultiChip
                options={toOptions(canalOptions)}
                selected={filters.canal}
                onChange={(v) => set('canal', v)}
              />
            </FilterSection>

            <FilterSection
              title="Status Grelha"
              subtitle={filters.statusGrelha.length ? filters.statusGrelha.join(', ') : 'Todos'}
            >
              <MultiChip
                options={toOptions(statusGrelhaOptions)}
                selected={filters.statusGrelha}
                onChange={(v) => set('statusGrelha', v)}
              />
            </FilterSection>

            <FilterSection
              title="Status de Planeamento"
              subtitle={
                filters.statusPlaneamentoId.length
                  ? `${filters.statusPlaneamentoId.length} selecionado(s)`
                  : 'Todos'
              }
            >
              <MultiChip
                options={statusPlaneamentos.map((s) => ({ value: s.id, label: s.nome }))}
                selected={filters.statusPlaneamentoId}
                onChange={(v) => set('statusPlaneamentoId', v)}
              />
            </FilterSection>

            <FilterSection
              title="Tipo de Exibição"
              subtitle={filters.tipoExibicao.length ? filters.tipoExibicao.join(', ') : 'Todos'}
            >
              <MultiChip
                options={toOptions(tipoExibicaoOptions)}
                selected={filters.tipoExibicao}
                onChange={(v) => set('tipoExibicao', v)}
              />
            </FilterSection>

            <FilterSection
              title="Tipo de Aquisição"
              subtitle={filters.tipoAquisicao.length ? filters.tipoAquisicao.join(', ') : 'Todos'}
            >
              <MultiChip
                options={toOptions(tipoAquisicaoOptions)}
                selected={filters.tipoAquisicao}
                onChange={(v) => set('tipoAquisicao', v)}
              />
            </FilterSection>

            <FilterSection
              title="Semana"
              subtitle={filters.semana.length ? `Semana(s): ${filters.semana.join(', ')}` : 'Todas'}
            >
              <MultiChip
                options={semanaOptions.map((s) => ({ value: s, label: `Semana ${s}` }))}
                selected={filters.semana}
                onChange={(v) => set('semana', v)}
              />
            </FilterSection>

            <FilterSection
              title="Data de Exibição"
              subtitle={
                filters.dataFrom || filters.dataTo
                  ? `${filters.dataFrom || '...'} → ${filters.dataTo || '...'}`
                  : 'Qualquer data'
              }
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">De</Label>
                  <Input
                    type="date"
                    value={filters.dataFrom}
                    onChange={(e) => set('dataFrom', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Até</Label>
                  <Input
                    type="date"
                    value={filters.dataTo}
                    onChange={(e) => set('dataTo', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </FilterSection>
          </div>

          <div className="shrink-0 px-5 py-4 border-t bg-background">
            <Button className="w-full rounded-full" onClick={() => setOpen(false)}>
              Ver {resultCount} {resultCount === 1 ? 'programa' : 'programas'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
