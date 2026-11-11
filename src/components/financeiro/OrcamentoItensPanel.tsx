'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, Loader2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { useToast } from '@/hooks/use-toast';
import { ApiRecursosTecnicosRepository } from '@/modules/recursos-tecnicos/recursos-tecnicos.api.repository';
import { ApiRecursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.api.repository';
import { ApiUnidadesRepository } from '@/modules/unidades/unidades.api.repository';
import type { UnidadeNegocio } from '@/modules/unidades/unidades.types';
import { formatCurrency as fmtCurrency } from '@/lib/currencies';
import {
  ApiOrcamentoRepository,
  type Orcamento,
  type OrcamentoItem,
  type SaveOrcamentoItemInput,
} from '@/modules/financeiro/orcamento.api';

const repo = new ApiOrcamentoRepository();
const rtRepo = new ApiRecursosTecnicosRepository();
const rfRepo = new ApiRecursosFisicosRepository();
const unidadesRepo = new ApiUnidadesRepository();

const MONTHS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const;
const MONTH_KEYS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;
type MonthKey = (typeof MONTH_KEYS)[number];

type Categoria = 'recursos_tecnicos' | 'equipamentos' | 'despesas';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  if (v === 0) return '-';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function sumItem(item: OrcamentoItem): number {
  return MONTH_KEYS.reduce((s, k) => s + (item[k] ?? 0), 0);
}

function sumCategoria(itens: OrcamentoItem[], cat: Categoria): number[] {
  const filtered = itens.filter((i) => i.categoria === cat);
  return MONTH_KEYS.map((k) => filtered.reduce((s, i) => s + (i[k] ?? 0), 0));
}

// ─── ItemRow (inline editable) ────────────────────────────────────────────────

type ItemState = Record<MonthKey, string>;

function emptyState(item?: OrcamentoItem): ItemState {
  const s = {} as ItemState;
  MONTH_KEYS.forEach((k) => {
    s[k] = item ? String(item[k]) : '';
  });
  return s;
}

function ItemRow({
  item,
  onSave,
  onDelete,
}: {
  item: OrcamentoItem;
  onSave: (id: string, values: Partial<OrcamentoItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<ItemState>(() => emptyState(item));
  const [isSaving, setIsSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const values: Partial<OrcamentoItem> = {};
      MONTH_KEYS.forEach((k) => {
        values[k] = parseFloat(state[k]) || 0;
      });
      await onSave(item.id, values);
      setEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setState(emptyState(item));
    setEditing(false);
  };

  const total = editing
    ? MONTH_KEYS.reduce((s, k) => s + (parseFloat(state[k]) || 0), 0)
    : sumItem(item);

  return (
    <>
      <tr className="border-b hover:bg-muted/10 group">
        <td
          className="px-3 py-1.5 text-sm font-medium min-w-36 max-w-48 truncate"
          title={item.itemNome}
        >
          {item.itemNome}
        </td>
        {MONTH_KEYS.map((k) => (
          <td key={k} className="px-1 py-1 text-right">
            {editing ? (
              <Input
                type="number"
                min="0"
                step="0.01"
                className="h-7 text-xs w-20 text-right tabular-nums"
                value={state[k]}
                onChange={(e) => setState((p) => ({ ...p, [k]: e.target.value }))}
              />
            ) : (
              <span className="text-xs tabular-nums text-muted-foreground">{fmt(item[k])}</span>
            )}
          </td>
        ))}
        <td className="px-3 py-1.5 text-right text-xs font-semibold tabular-nums bg-muted/20 border-l">
          {fmt(total)}
        </td>
        <td className="px-2 py-1">
          {editing ? (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 text-primary" />
                )}
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setDeleting(true)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          )}
        </td>
      </tr>

      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(item.id)}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── NewItemRow ───────────────────────────────────────────────────────────────

type RecursoOption = { id: string; nome: string };

function NewItemRow({
  categoria,
  recursos,
  onAdd,
}: {
  categoria: Categoria;
  recursos: RecursoOption[];
  onAdd: (input: SaveOrcamentoItemInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [recursoId, setRecursoId] = useState('');
  const [state, setState] = useState<ItemState>(() => emptyState());
  const [isSaving, setIsSaving] = useState(false);

  const usesDropdown = categoria !== 'despesas' && recursos.length > 0;
  const isValid = usesDropdown ? !!recursoId : !!nome.trim();

  const recursoOptions = recursos.map((r) => ({ value: r.id, label: r.nome }));

  if (!open) {
    return (
      <tr>
        <td colSpan={15} className="px-3 py-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1.5 text-xs"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar item
          </Button>
        </td>
      </tr>
    );
  }

  const handleAdd = async () => {
    if (!isValid) return;
    setIsSaving(true);
    try {
      const values: Partial<SaveOrcamentoItemInput> = {};
      MONTH_KEYS.forEach((k) => {
        (values as Record<MonthKey, number>)[k] = parseFloat(state[k]) || 0;
      });
      const itemNome = usesDropdown
        ? (recursos.find((r) => r.id === recursoId)?.nome ?? '')
        : nome.trim();
      await onAdd({
        categoria,
        itemNome,
        recursoId: usesDropdown ? recursoId : undefined,
        ...values,
      } as SaveOrcamentoItemInput);
      setNome('');
      setRecursoId('');
      setState(emptyState());
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <tr className="border-b bg-muted/5">
      <td className="px-2 py-1 min-w-36">
        {usesDropdown ? (
          <SearchableSelect
            options={recursoOptions}
            value={recursoId}
            onValueChange={setRecursoId}
            placeholder="Selecione..."
            searchPlaceholder="Pesquisar..."
            emptyMessage="Nenhum encontrado."
            triggerClassName="h-7 text-xs"
          />
        ) : (
          <Input
            autoFocus
            className="h-7 text-sm"
            placeholder="Nome do item..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
          />
        )}
      </td>
      {MONTH_KEYS.map((k) => (
        <td key={k} className="px-1 py-1">
          <Input
            type="number"
            min="0"
            step="0.01"
            className="h-7 text-xs w-20 text-right tabular-nums"
            value={state[k]}
            onChange={(e) => setState((p) => ({ ...p, [k]: e.target.value }))}
          />
        </td>
      ))}
      <td className="px-3 py-1 bg-muted/20 border-l text-right text-xs tabular-nums font-semibold">
        {fmt(MONTH_KEYS.reduce((s, k) => s + (parseFloat(state[k]) || 0), 0))}
      </td>
      <td className="px-2 py-1">
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleAdd}
            disabled={!isValid || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 text-primary" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setOpen(false);
              setRecursoId('');
              setNome('');
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ─── CategoriaTab ─────────────────────────────────────────────────────────────

function CategoriaTab({
  orcamentoId,
  categoria,
  itens,
  recursos,
  onSaveItem,
  onDeleteItem,
}: {
  orcamentoId: string;
  categoria: Categoria;
  itens: OrcamentoItem[];
  recursos: RecursoOption[];
  onSaveItem: (id: string, values: Partial<OrcamentoItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const filtered = itens.filter((i) => i.categoria === categoria);
  const totals = sumCategoria(itens, categoria);
  const grandTotal = totals.reduce((s, v) => s + v, 0);

  const handleAdd = useCallback(
    async (input: SaveOrcamentoItemInput) => {
      try {
        await repo.saveItem(orcamentoId, { ...input, categoria });
        toast({ title: 'Item adicionado', variant: 'default' });
        // trigger refresh via parent, but parent uses local state
        // We'll use a custom event to signal refresh
        window.dispatchEvent(new CustomEvent('orcamento-refresh', { detail: orcamentoId }));
      } catch {
        toast({ title: 'Erro ao adicionar item', variant: 'destructive' });
      }
    },
    [orcamentoId, categoria, toast],
  );

  if (filtered.length === 0 && itens.length === 0) {
    // show add row immediately
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-40 min-w-36">
              Item
            </th>
            {MONTHS.map((m) => (
              <th
                key={m}
                className="px-1 py-2 text-right text-xs font-semibold text-muted-foreground w-20"
              >
                {m}
              </th>
            ))}
            <th className="px-3 py-2 text-right text-xs font-semibold w-24 bg-muted/60 border-l">
              Total
            </th>
            <th className="px-2 py-2 w-16" />
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <ItemRow key={item.id} item={item} onSave={onSaveItem} onDelete={onDeleteItem} />
          ))}
          <NewItemRow categoria={categoria} recursos={recursos} onAdd={handleAdd} />
          {filtered.length > 0 && (
            <tr className="border-t-2 bg-muted/30 font-semibold">
              <td className="px-3 py-2 text-sm font-bold text-muted-foreground">Subtotal</td>
              {totals.map((v, i) => (
                <td key={i} className="px-1 py-2 text-right text-xs tabular-nums font-semibold">
                  {fmt(v)}
                </td>
              ))}
              <td className="px-3 py-2 text-right text-xs font-bold tabular-nums bg-muted/40 border-l">
                {fmt(grandTotal)}
              </td>
              <td />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── OrcamentoDetail (Dialog) ─────────────────────────────────────────────────

const CATEGORIA_LABELS: Record<Categoria, string> = {
  recursos_tecnicos: 'Recursos Técnicos',
  equipamentos: 'Equipamentos',
  despesas: 'Despesas',
};

/**
 * Monthly budget items of an orçamento, by category, edited inline row by row
 * (each row saves by itself). Shown on the orçamento form page in edit mode.
 */
export function OrcamentoItensPanel({ orcamento }: { orcamento: Orcamento }) {
  const { toast } = useToast();
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recursosTecnicos, setRecursosTecnicos] = useState<RecursoOption[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<RecursoOption[]>([]);
  const [moeda, setMoeda] = useState('BRL');

  useEffect(() => {
    void Promise.all([
      rtRepo.list().catch((): RecursoOption[] => []),
      rfRepo.list().catch((): RecursoOption[] => []),
      unidadesRepo.list().catch((): UnidadeNegocio[] => []),
    ]).then(([rts, rfs, unidades]) => {
      setRecursosTecnicos(rts.map((r) => ({ id: r.id, nome: r.nome })));
      setRecursosFisicos(rfs.map((r) => ({ id: r.id, nome: r.nome })));
      if (unidades.length > 0 && unidades[0].moeda) setMoeda(unidades[0].moeda);
    });
  }, []);

  const loadItens = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const data = await repo.listItens(id);
        setItens(data);
      } catch {
        toast({ title: 'Erro ao carregar itens', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadItens(orcamento.id);
  }, [orcamento.id, loadItens]);

  useEffect(() => {
    const handler = (e: CustomEvent<string>) => {
      if (e.detail === orcamento?.id) void loadItens(e.detail);
    };
    window.addEventListener('orcamento-refresh', handler as EventListener);
    return () => window.removeEventListener('orcamento-refresh', handler as EventListener);
  }, [orcamento, loadItens]);

  const handleSaveItem = useCallback(
    async (id: string, values: Partial<OrcamentoItem>) => {
      if (!orcamento) return;
      try {
        const item = itens.find((i) => i.id === id)!;
        const updated = await repo.saveItem(orcamento.id, { ...item, ...values, id });
        setItens((prev) => prev.map((i) => (i.id === id ? updated : i)));
        toast({ title: 'Salvo' });
      } catch {
        toast({ title: 'Erro ao salvar', variant: 'destructive' });
      }
    },
    [orcamento, itens, toast],
  );

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (!orcamento) return;
      try {
        await repo.removeItem(orcamento.id, itemId);
        setItens((prev) => prev.filter((i) => i.id !== itemId));
        toast({ title: 'Removido' });
      } catch {
        toast({ title: 'Erro ao remover', variant: 'destructive' });
      }
    },
    [orcamento, toast],
  );

  const totalGeral = useMemo(
    () => MONTH_KEYS.reduce((s, k) => s + itens.reduce((a, i) => a + (i[k] ?? 0), 0), 0),
    [itens],
  );

  return (
    <div className="space-y-4">
      {/* Totals banner */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border bg-muted/30 px-4 py-3 text-sm">
        {(['recursos_tecnicos', 'equipamentos', 'despesas'] as Categoria[]).map((cat) => {
          const total = sumCategoria(itens, cat).reduce((s, v) => s + v, 0);
          return (
            <div key={cat} className="flex flex-col">
              <span className="text-xs text-muted-foreground">{CATEGORIA_LABELS[cat]}</span>
              <span className="font-semibold tabular-nums">{fmtCurrency(total, moeda)}</span>
            </div>
          );
        })}
        <div className="ml-auto flex flex-col items-end">
          <span className="text-xs text-muted-foreground">Total Geral</span>
          <span className="font-bold tabular-nums text-primary">
            {fmtCurrency(totalGeral, moeda)}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="recursos_tecnicos" className="w-full">
          <TabsList>
            <TabsTrigger value="recursos_tecnicos">Recursos Técnicos</TabsTrigger>
            <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
          </TabsList>

          {(['recursos_tecnicos', 'equipamentos', 'despesas'] as Categoria[]).map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-4">
              <CategoriaTab
                orcamentoId={orcamento.id}
                categoria={cat}
                itens={itens}
                recursos={
                  cat === 'recursos_tecnicos'
                    ? recursosTecnicos
                    : cat === 'equipamentos'
                      ? recursosFisicos
                      : []
                }
                onSaveItem={handleSaveItem}
                onDeleteItem={handleDeleteItem}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
