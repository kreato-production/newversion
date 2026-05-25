'use client';

import { useCallback, useEffect, useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { ApiUnidadesRepository } from '@/modules/unidades/unidades.api.repository';
import { ApiProgramasRepository } from '@/modules/programas/programas.api.repository';
import { conteudosRepository } from '@/modules/conteudos/conteudos.repository.provider';

const parametrizacoesRepo = new ApiParametrizacoesRepository();
const unidadesRepo = new ApiUnidadesRepository();
const programasRepo = new ApiProgramasRepository();

export interface GravacaoFilters {
  sortBy: '' | 'nome-asc' | 'nome-desc' | 'data-asc' | 'data-desc';
  status: string[];
  unidadeNegocioId: string[];
  centroLucro: string[];
  programaId: string[];
  tipoConteudo: string[];
  classificacao: string[];
  dataPrevistaFrom: string;
  dataPrevistaTo: string;
  orcamentoMin: string;
  orcamentoMax: string;
  conteudoId: string[];
}

export const EMPTY_FILTERS: GravacaoFilters = {
  sortBy: '',
  status: [],
  unidadeNegocioId: [],
  centroLucro: [],
  programaId: [],
  tipoConteudo: [],
  classificacao: [],
  dataPrevistaFrom: '',
  dataPrevistaTo: '',
  orcamentoMin: '',
  orcamentoMax: '',
  conteudoId: [],
};

export function countActiveFilters(filters: GravacaoFilters): number {
  let count = 0;
  if (filters.sortBy) count++;
  if (filters.status.length) count++;
  if (filters.unidadeNegocioId.length) count++;
  if (filters.centroLucro.length) count++;
  if (filters.programaId.length) count++;
  if (filters.tipoConteudo.length) count++;
  if (filters.classificacao.length) count++;
  if (filters.dataPrevistaFrom || filters.dataPrevistaTo) count++;
  if (filters.orcamentoMin || filters.orcamentoMax) count++;
  if (filters.conteudoId.length) count++;
  return count;
}

// ─── FilterSection ────────────────────────────────────────────────────────────

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

// ─── MultiChip ────────────────────────────────────────────────────────────────

function MultiChip({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

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

interface GravacaoFilterPanelProps {
  filters: GravacaoFilters;
  onChange: (next: GravacaoFilters) => void;
  resultCount: number;
}

export function GravacaoFilterPanel({ filters, onChange, resultCount }: GravacaoFilterPanelProps) {
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  // Option lists
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([]);
  const [unidadeOptions, setUnidadeOptions] = useState<{ value: string; label: string }[]>([]);
  const [centroOptions, setCentroOptions] = useState<{ value: string; label: string }[]>([]);
  const [programaOptions, setProgramaOptions] = useState<{ value: string; label: string }[]>([]);
  const [tipoOptions, setTipoOptions] = useState<{ value: string; label: string }[]>([]);
  const [classificacaoOptions, setClassificacaoOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [conteudoOptions, setConteudoOptions] = useState<{ value: string; label: string }[]>([]);

  const loadOptions = useCallback(async () => {
    try {
      const [optionsResult, statusResult, unidades, programas, conteudos] = await Promise.all([
        conteudosRepository.listOptions(),
        parametrizacoesRepo.listStatusGravacao(),
        unidadesRepo.list(),
        programasRepo.list(),
        conteudosRepository.list(),
      ]);

      setStatusOptions(statusResult.data.map((s) => ({ value: s.nome, label: s.nome })));
      setUnidadeOptions(unidades.map((u) => ({ value: u.id, label: u.nome })));
      setCentroOptions(optionsResult.centrosLucro.map((c) => ({ value: c.nome, label: c.nome })));
      setProgramaOptions(programas.map((p) => ({ value: p.id, label: p.nome })));
      setTipoOptions(optionsResult.tipos.map((t) => ({ value: t.nome, label: t.nome })));
      setClassificacaoOptions(
        optionsResult.classificacoes.map((c) => ({ value: c.nome, label: c.nome })),
      );
      setConteudoOptions(conteudos.map((c) => ({ value: c.id, label: c.descricao })));
    } catch {
      // silently ignore; filters will just be empty
    }
  }, []);

  useEffect(() => {
    if (open) void loadOptions();
  }, [open, loadOptions]);

  const set = <K extends keyof GravacaoFilters>(key: K, value: GravacaoFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const clear = () => onChange({ ...EMPTY_FILTERS });

  const sortLabel =
    filters.sortBy === 'nome-asc'
      ? 'Nome (A→Z)'
      : filters.sortBy === 'nome-desc'
        ? 'Nome (Z→A)'
        : filters.sortBy === 'data-asc'
          ? 'Data mais antiga'
          : filters.sortBy === 'data-desc'
            ? 'Data mais recente'
            : 'Relevância';

  const dateLabel =
    filters.dataPrevistaFrom || filters.dataPrevistaTo
      ? `${filters.dataPrevistaFrom || '...'} → ${filters.dataPrevistaTo || '...'}`
      : undefined;

  return (
    <>
      {/* ── Trigger button ── */}
      <Button variant="outline" size="sm" className="relative gap-2" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" />
        Filtrar
        {activeCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground border-background border-2">
            {activeCount}
          </Badge>
        )}
      </Button>

      {/* ── Filter sheet ── */}
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
              onClick={clear}
            >
              Limpar
            </button>
          </SheetHeader>

          {/* Scrollable filter list */}
          <div className="flex-1 overflow-y-auto">
            {/* Ordenação */}
            <FilterSection title="Ordenar por" subtitle={sortLabel} defaultOpen>
              <SortChip
                value={filters.sortBy}
                onChange={(v) => set('sortBy', v as GravacaoFilters['sortBy'])}
                options={[
                  { value: 'nome-asc', label: 'Nome (A→Z)' },
                  { value: 'nome-desc', label: 'Nome (Z→A)' },
                  { value: 'data-desc', label: 'Data mais recente' },
                  { value: 'data-asc', label: 'Data mais antiga' },
                ]}
              />
            </FilterSection>

            {/* ── Dados Gerais ── */}
            <FilterSection
              title="Status"
              subtitle={filters.status.length ? filters.status.join(', ') : 'Todos'}
            >
              <MultiChip
                options={statusOptions}
                selected={filters.status}
                onChange={(v) => set('status', v)}
              />
            </FilterSection>

            <FilterSection
              title="Unidade de Negócio"
              subtitle={
                filters.unidadeNegocioId.length
                  ? `${filters.unidadeNegocioId.length} selecionada(s)`
                  : 'Todas'
              }
            >
              <MultiChip
                options={unidadeOptions}
                selected={filters.unidadeNegocioId}
                onChange={(v) => set('unidadeNegocioId', v)}
              />
            </FilterSection>

            <FilterSection
              title="Centro de Custos"
              subtitle={
                filters.centroLucro.length
                  ? `${filters.centroLucro.length} selecionado(s)`
                  : 'Todos'
              }
            >
              <MultiChip
                options={centroOptions}
                selected={filters.centroLucro}
                onChange={(v) => set('centroLucro', v)}
              />
            </FilterSection>

            <FilterSection
              title="Programa"
              subtitle={
                filters.programaId.length ? `${filters.programaId.length} selecionado(s)` : 'Todos'
              }
            >
              <MultiChip
                options={programaOptions}
                selected={filters.programaId}
                onChange={(v) => set('programaId', v)}
              />
            </FilterSection>

            <FilterSection
              title="Tipo de Conteúdo"
              subtitle={filters.tipoConteudo.length ? filters.tipoConteudo.join(', ') : 'Todos'}
            >
              <MultiChip
                options={tipoOptions}
                selected={filters.tipoConteudo}
                onChange={(v) => set('tipoConteudo', v)}
              />
            </FilterSection>

            <FilterSection
              title="Classificação"
              subtitle={filters.classificacao.length ? filters.classificacao.join(', ') : 'Todas'}
            >
              <MultiChip
                options={classificacaoOptions}
                selected={filters.classificacao}
                onChange={(v) => set('classificacao', v)}
              />
            </FilterSection>

            <FilterSection
              title="Conteúdo"
              subtitle={
                filters.conteudoId.length ? `${filters.conteudoId.length} selecionado(s)` : 'Todos'
              }
            >
              <MultiChip
                options={conteudoOptions}
                selected={filters.conteudoId}
                onChange={(v) => set('conteudoId', v)}
              />
            </FilterSection>

            <FilterSection title="Data Prevista" subtitle={dateLabel ?? 'Qualquer data'}>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">De</Label>
                  <Input
                    type="date"
                    value={filters.dataPrevistaFrom}
                    onChange={(e) => set('dataPrevistaFrom', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Até</Label>
                  <Input
                    type="date"
                    value={filters.dataPrevistaTo}
                    onChange={(e) => set('dataPrevistaTo', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </FilterSection>

            <FilterSection
              title="Orçamento"
              subtitle={
                filters.orcamentoMin || filters.orcamentoMax
                  ? `${filters.orcamentoMin || '0'} – ${filters.orcamentoMax || '∞'}`
                  : 'Qualquer valor'
              }
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Mínimo"
                  value={filters.orcamentoMin}
                  onChange={(e) => set('orcamentoMin', e.target.value)}
                  className="h-8 text-sm"
                />
                <span className="text-muted-foreground text-sm shrink-0">–</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Máximo"
                  value={filters.orcamentoMax}
                  onChange={(e) => set('orcamentoMax', e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </FilterSection>
          </div>

          {/* ── Fixed footer ── */}
          <div className="shrink-0 px-5 py-4 border-t bg-background">
            <Button className="w-full rounded-full" onClick={() => setOpen(false)}>
              Ver {resultCount} {resultCount === 1 ? 'gravação' : 'gravações'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
