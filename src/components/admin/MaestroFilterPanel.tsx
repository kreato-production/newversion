'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';

export interface MaestroFilters {
  status: string[];
  esquemaTipo: string[];
  modulo: string[];
}

export const EMPTY_MAESTRO_FILTERS: MaestroFilters = {
  status: [],
  esquemaTipo: [],
  modulo: [],
};

export function countMaestroActiveFilters(f: MaestroFilters): number {
  return (f.status.length ? 1 : 0) + (f.esquemaTipo.length ? 1 : 0) + (f.modulo.length ? 1 : 0);
}

const STATUS_OPTIONS = ['Ativo', 'Inativo'];
const ESQUEMA_OPTIONS = [
  { value: '1-vez', label: '1 Vez' },
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
];

function CheckGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-input"
              checked={selected.includes(opt.value)}
              onChange={() => onToggle(opt.value)}
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface MaestroFilterPanelProps {
  filters: MaestroFilters;
  onChange: (f: MaestroFilters) => void;
  resultCount: number;
  moduloOptions: string[];
}

export function MaestroFilterPanel({
  filters,
  onChange,
  resultCount,
  moduloOptions,
}: MaestroFilterPanelProps) {
  const [open, setOpen] = useState(false);
  const activeCount = countMaestroActiveFilters(filters);

  function toggle(field: keyof MaestroFilters, value: string) {
    const current = filters[field] as string[];
    onChange({
      ...filters,
      [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" />
        Filtrar
        {activeCount > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
            {activeCount}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-80 flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base">Filtros</SheetTitle>
              {activeCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground"
                  onClick={() => onChange(EMPTY_MAESTRO_FILTERS)}
                >
                  <X className="h-3 w-3" />
                  Limpar
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <CheckGroup
              label="Status"
              options={STATUS_OPTIONS.map((v) => ({ value: v, label: v }))}
              selected={filters.status}
              onToggle={(v) => toggle('status', v)}
            />

            <CheckGroup
              label="Esquema de Execução"
              options={ESQUEMA_OPTIONS}
              selected={filters.esquemaTipo}
              onToggle={(v) => toggle('esquemaTipo', v)}
            />

            {moduloOptions.length > 0 && (
              <CheckGroup
                label="Módulo"
                options={moduloOptions.map((v) => ({ value: v, label: v }))}
                selected={filters.modulo}
                onToggle={(v) => toggle('modulo', v)}
              />
            )}
          </div>

          <div className="border-t px-6 py-4">
            <Button className="w-full" onClick={() => setOpen(false)}>
              Ver {resultCount} resultado{resultCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
