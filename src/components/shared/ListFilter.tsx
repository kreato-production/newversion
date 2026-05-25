'use client';

/**
 * Shared filter panel primitives used by all list views.
 *
 * Usage:
 *   <ListFilterPanel activeCount={n} resultCount={m} onClear={fn} entityLabel="gravações">
 *     <FilterSection title="Ordenar por" subtitle={sortLabel}>
 *       <SortChip value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
 *     </FilterSection>
 *     <FilterSection title="Status" subtitle={statusSubtitle}>
 *       <MultiChip selected={status} onChange={(v) => setFilter('status', v)} options={statusOptions} />
 *     </FilterSection>
 *     <FilterSection title="Data" subtitle={dateSubtitle}>
 *       <DateRangeFilter from={from} to={to} onFromChange={...} onToChange={...} />
 *     </FilterSection>
 *   </ListFilterPanel>
 */

import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// ─── FilterSection ────────────────────────────────────────────────────────────

export function FilterSection({
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
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[260px]">
              {subtitle}
            </p>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
        )}
      </button>
      {open && <div className="px-5 pb-4 space-y-2">{children}</div>}
    </div>
  );
}

// ─── MultiChip ────────────────────────────────────────────────────────────────

export function MultiChip({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  if (options.length === 0)
    return <p className="text-xs text-muted-foreground italic">Nenhuma opção disponível</p>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary hover:text-primary',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── SortChip ────────────────────────────────────────────────────────────────

export function SortChip({
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

// ─── DateRangeFilter ──────────────────────────────────────────────────────────

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">De</Label>
        <Input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Até</Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}

// ─── NumberRangeFilter ────────────────────────────────────────────────────────

export function NumberRangeFilter({
  min,
  max,
  onMinChange,
  onMaxChange,
  placeholder = ['Mínimo', 'Máximo'],
}: {
  min: string;
  max: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  placeholder?: [string, string];
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min="0"
        step="0.01"
        placeholder={placeholder[0]}
        value={min}
        onChange={(e) => onMinChange(e.target.value)}
        className="h-8 text-sm"
      />
      <span className="text-muted-foreground text-sm shrink-0">–</span>
      <Input
        type="number"
        min="0"
        step="0.01"
        placeholder={placeholder[1]}
        value={max}
        onChange={(e) => onMaxChange(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}

// ─── ListFilterPanel (the shell) ──────────────────────────────────────────────

export function ListFilterPanel({
  activeCount,
  resultCount,
  onClear,
  entityLabel = 'registros',
  children,
}: {
  activeCount: number;
  resultCount: number;
  onClear: () => void;
  entityLabel?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

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
          {/* Header */}
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
              onClick={() => {
                onClear();
              }}
            >
              Limpar
            </button>
          </SheetHeader>

          {/* Scrollable filter content */}
          <div className="flex-1 overflow-y-auto">{children}</div>

          {/* Footer */}
          <div className="shrink-0 px-5 py-4 border-t bg-background">
            <Button className="w-full rounded-full" onClick={() => setOpen(false)}>
              Ver {resultCount} {resultCount === 1 ? entityLabel.replace(/s$/, '') : entityLabel}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const SORT_OPTIONS_NOME = [
  { value: 'nome-asc', label: 'Nome (A→Z)' },
  { value: 'nome-desc', label: 'Nome (Z→A)' },
] as const;

export const SORT_OPTIONS_DATA = [
  { value: 'data-desc', label: 'Mais recente' },
  { value: 'data-asc', label: 'Mais antigo' },
] as const;

export const SORT_OPTIONS_NOME_DATA = [...SORT_OPTIONS_NOME, ...SORT_OPTIONS_DATA] as const;

/** Derives unique non-empty string values from an array of objects for a given key */
export function uniqueChips<T>(items: T[], key: keyof T): { value: string; label: string }[] {
  const seen = new Set<string>();
  const result: { value: string; label: string }[] = [];
  for (const item of items) {
    const v = String(item[key] ?? '').trim();
    if (v && !seen.has(v)) {
      seen.add(v);
      result.push({ value: v, label: v });
    }
  }
  return result.sort((a, b) => a.label.localeCompare(b.label));
}

/** Returns subtitle text for a multi-select filter */
export function chipsSubtitle(selected: string[], allLabel = 'Todos'): string {
  if (selected.length === 0) return allLabel;
  if (selected.length <= 2) return selected.join(', ');
  return `${selected.slice(0, 2).join(', ')} +${selected.length - 2}`;
}

/** Returns subtitle for a sort filter */
export function sortSubtitle(
  value: string,
  options: readonly { value: string; label: string }[],
  defaultLabel = 'Relevância',
): string {
  return options.find((o) => o.value === value)?.label ?? defaultLabel;
}

/** Returns subtitle for a date range filter */
export function dateRangeSubtitle(from: string, to: string, noneLabel = 'Qualquer data'): string {
  if (!from && !to) return noneLabel;
  return `${from || '...'} → ${to || '...'}`;
}
