'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  ChevronRight,
  Loader2,
  TrendingUp,
  Save,
  X,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { NewButton } from '@/components/shared/NewButton';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { ApiRecursosTecnicosRepository } from '@/modules/recursos-tecnicos/recursos-tecnicos.api.repository';
import { ApiRecursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.api.repository';
import { ApiUnidadesRepository } from '@/modules/unidades/unidades.api.repository';
import { formatCurrency as fmtCurrency } from '@/lib/currencies';
import {
  ApiOrcamentoRepository,
  type Orcamento,
  type OrcamentoItem,
  type SaveOrcamentoItemInput,
} from '@/modules/financeiro/orcamento.api';

// ─── Constants ────────────────────────────────────────────────────────────────

const repo = new ApiOrcamentoRepository();
const paramsRepo = new ApiParametrizacoesRepository();
const rtRepo = new ApiRecursosTecnicosRepository();
const rfRepo = new ApiRecursosFisicosRepository();
const unidadesRepo = new ApiUnidadesRepository();

const STORAGE_KEY = 'kreato_orcamento_table';
const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'ano', label: 'Ano', required: true, defaultVisible: true },
  { key: 'centroLucroNome', label: 'Centro de Lucro', required: true, defaultVisible: true },
  { key: 'descricao', label: 'Descrição', required: false, defaultVisible: true },
  { key: 'total', label: 'Total', required: false, defaultVisible: true },
  { key: 'actions', label: 'Ações', required: true },
];
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => currentYear - 2 + i);
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

// ─── OrcamentoFormModal ───────────────────────────────────────────────────────

function OrcamentoFormModal({
  isOpen,
  onClose,
  onSave,
  editing,
  centrosLucro,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    ano: number;
    centroLucroId: string;
    descricao: string;
  }) => Promise<void>;
  editing: Orcamento | null;
  centrosLucro: { id: string; nome: string }[];
}) {
  const [ano, setAno] = useState(currentYear);
  const [centroLucroId, setCentroLucroId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAno(editing?.ano ?? currentYear);
    setCentroLucroId(editing?.centroLucroId ?? '');
    setDescricao(editing?.descricao ?? '');
  }, [isOpen, editing]);

  const isValid = !!centroLucroId;

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    try {
      await onSave({ id: editing?.id, ano, centroLucroId, descricao });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const centroOptions = centrosLucro.map((c) => ({ value: c.id, label: c.nome }));

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ano *</Label>
              <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                <SelectTrigger>
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
            <div className="space-y-2 col-span-2">
              <Label>Centro de Lucro *</Label>
              <SearchableSelect
                options={centroOptions}
                value={centroLucroId}
                onValueChange={setCentroLucroId}
                placeholder="Selecione..."
                searchPlaceholder="Pesquisar centro de lucro..."
                emptyMessage="Nenhum resultado."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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

function OrcamentoDetail({
  orcamento,
  isOpen,
  onClose,
  recursosTecnicos,
  recursosFisicos,
  moeda,
}: {
  orcamento: Orcamento | null;
  isOpen: boolean;
  onClose: () => void;
  recursosTecnicos: RecursoOption[];
  recursosFisicos: RecursoOption[];
  moeda: string;
}) {
  const { toast } = useToast();
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(false);

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
    if (!isOpen || !orcamento) return;
    void loadItens(orcamento.id);
  }, [isOpen, orcamento, loadItens]);

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

  if (!orcamento) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[1400px] max-w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary shrink-0" />
            Orçamento {orcamento.ano}
            <Badge variant="secondary" className="font-normal">
              {orcamento.centroLucroNome || orcamento.centroLucroId}
            </Badge>
          </DialogTitle>
          {orcamento.descricao && (
            <p className="text-sm text-muted-foreground">{orcamento.descricao}</p>
          )}
        </DialogHeader>

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
            <TabsList className="w-full grid grid-cols-3">
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
      </DialogContent>
    </Dialog>
  );
}

// ─── Card component ───────────────────────────────────────────────────────────

function OrcamentoCard({
  item,
  onEdit,
  onDelete,
  onDetail,
  moeda,
}: {
  item: Orcamento;
  onEdit: () => void;
  onDelete: () => void;
  onDetail: () => void;
  moeda: string;
}) {
  return (
    <Card
      className="flex flex-col hover:shadow-md transition-shadow cursor-pointer"
      onClick={onDetail}
    >
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">
              {item.centroLucroNome || item.centroLucroId}
            </p>
            {item.descricao && (
              <p className="text-xs text-muted-foreground truncate">{item.descricao}</p>
            )}
          </div>
          <Badge variant="outline" className="shrink-0 text-xs">
            {item.ano}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 flex-1">
        {item.total > 0 && (
          <p className="text-sm font-semibold tabular-nums text-foreground mb-1">
            {fmtCurrency(item.total, moeda)}
          </p>
        )}
        <span className="text-xs text-primary flex items-center gap-1">
          Ver detalhes <ChevronRight className="h-3 w-3" />
        </span>
      </CardContent>
      <CardFooter
        className="px-4 py-2 border-t flex justify-end gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
          <Edit className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Detail panel (master-detail sidebar) ────────────────────────────────────

function OrcamentoDetailPanel({
  item,
  onEdit,
  onDelete,
  onOpenItems,
}: {
  item: Orcamento;
  onEdit: () => void;
  onDelete: () => void;
  onOpenItems: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-base">{item.centroLucroNome || item.centroLucroId}</h3>
        <Badge variant="outline" className="mt-1">
          {item.ano}
        </Badge>
      </div>
      {item.descricao && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Descrição</p>
            <p className="text-sm">{item.descricao}</p>
          </div>
        </>
      )}
      <Separator />
      <div className="flex flex-col gap-2">
        <Button size="sm" onClick={onOpenItems} className="w-full justify-start gap-2">
          <TrendingUp className="h-3.5 w-3.5" />
          Editar itens do orçamento
        </Button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit} className="flex-1 gap-1.5">
            <Edit className="h-3.5 w-3.5" /> Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

const Orcamento = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [list, setList] = useState<Orcamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [centrosLucro, setCentrosLucro] = useState<{ id: string; nome: string }[]>([]);
  const [recursosTecnicos, setRecursosTecnicos] = useState<RecursoOption[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<RecursoOption[]>([]);
  const [moeda, setMoeda] = useState('BRL');

  const [search, setSearch] = useState('');
  const [filterAno, setFilterAno] = useState<string>('todos');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Orcamento | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [detailOrcamento, setDetailOrcamento] = useState<Orcamento | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Orcamento | null>(null);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  // Load list + centros de lucro + recursos
  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ data }, centros, rts, rfs, unidades] = await Promise.all([
        repo.list({ limit: 500 }),
        paramsRepo.listCentrosLucro(),
        rtRepo.list().catch((): RecursoOption[] => []),
        rfRepo.list().catch((): RecursoOption[] => []),
        unidadesRepo.list().catch(() => []),
      ]);
      setList(data);
      setCentrosLucro(centros.data.map((c) => ({ id: c.id, nome: c.nome })));
      setRecursosTecnicos(rts.map((r) => ({ id: r.id, nome: r.nome })));
      setRecursosFisicos(rfs.map((r) => ({ id: r.id, nome: r.nome })));
      if (unidades.length > 0 && unidades[0].moeda) setMoeda(unidades[0].moeda);
    } catch {
      toast({ title: 'Erro ao carregar orçamentos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const anosDisponiveis = useMemo(
    () => [...new Set(list.map((o) => o.ano))].sort((a, b) => b - a),
    [list],
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return list.filter((o) => {
      const matchAno = filterAno === 'todos' || String(o.ano) === filterAno;
      const matchSearch =
        !term ||
        (o.centroLucroNome ?? '').toLowerCase().includes(term) ||
        String(o.ano).includes(term) ||
        (o.descricao ?? '').toLowerCase().includes(term);
      return matchAno && matchSearch;
    });
  }, [list, search, filterAno]);

  const handleSave = async (data: {
    id?: string;
    ano: number;
    centroLucroId: string;
    descricao: string;
  }) => {
    try {
      await repo.save(data);
      toast({ title: data.id ? 'Orçamento atualizado' : 'Orçamento criado' });
      await load();
    } catch {
      toast({ title: 'Erro ao salvar orçamento', variant: 'destructive' });
      throw new Error('save failed');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await repo.remove(deletingId);
      toast({ title: 'Orçamento removido' });
      setList((prev) => prev.filter((o) => o.id !== deletingId));
      if (selectedItem?.id === deletingId) setSelectedItem(null);
    } catch {
      toast({ title: 'Erro ao remover', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const openDetail = (o: Orcamento) => {
    setDetailOrcamento(o);
    setDetailOpen(true);
  };

  const columns: Column<Orcamento & { actions?: never }>[] = [
    {
      key: 'ano',
      label: 'Ano',
      className: 'w-20',
      render: (item) => (
        <Badge variant="outline" className="text-xs">
          {item.ano}
        </Badge>
      ),
    },
    {
      key: 'centroLucroNome',
      label: 'Centro de Lucro',
      render: (item) => (
        <span className="font-medium">{item.centroLucroNome || item.centroLucroId}</span>
      ),
    },
    {
      key: 'descricao',
      label: 'Descrição',
      render: (item) => (
        <span className="text-muted-foreground text-xs">{item.descricao || '-'}</span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      className: 'text-right tabular-nums',
      render: (item) => (
        <span
          className={`text-sm font-medium tabular-nums ${item.total > 0 ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {item.total > 0 ? fmtCurrency(item.total, moeda) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => openDetail(item)}
            title="Ver itens"
          >
            <TrendingUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setEditing(item);
              setModalOpen(true);
            }}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeletingId(item.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const tableVisibleKeys = mode === 'list' ? visibleColumnKeys : undefined;

  return (
    <div>
      <PageHeader title={t('orcamento.titulo')} description={t('orcamento.descricao')} />

      <ListActionBar>
        <NewButton
          tooltip={t('orcamento.novo')}
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        />

        {/* Year filter */}
        <Select value={filterAno} onValueChange={setFilterAno}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os anos</SelectItem>
            {anosDisponiveis.map((ano) => (
              <SelectItem key={ano} value={String(ano)}>
                {ano}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar orçamentos..." />
        {mode === 'list' && (
          <ColumnSelector
            columns={optionalColumns}
            visibleColumnKeys={visibleColumnKeys}
            onToggle={toggleColumn}
            onReset={resetColumns}
          />
        )}
        <ViewSwitcher mode={mode} onModeChange={setMode} />
      </ListActionBar>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataCard>
          {mode === 'list' ? (
            filtered.length === 0 ? (
              <EmptyState
                title="Nenhum orçamento encontrado"
                description="Crie o primeiro orçamento."
                icon={TrendingUp}
                onAction={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
                actionLabel={t('orcamento.novo')}
              />
            ) : (
              <SortableTable
                data={filtered}
                columns={columns}
                getRowKey={(item) => item.id}
                storageKey={STORAGE_KEY}
                visibleColumnKeys={tableVisibleKeys}
              />
            )
          ) : mode === 'cards' ? (
            <CardGrid
              data={filtered}
              getRowKey={(item) => item.id}
              emptyTitle="Nenhum orçamento encontrado"
              emptyDescription="Crie o primeiro orçamento."
              onEmptyAction={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              emptyActionLabel={t('orcamento.novo')}
              renderCard={(item) => (
                <OrcamentoCard
                  item={item}
                  onEdit={() => {
                    setEditing(item);
                    setModalOpen(true);
                  }}
                  onDelete={() => setDeletingId(item.id)}
                  onDetail={() => openDetail(item)}
                  moeda={moeda}
                />
              )}
            />
          ) : (
            <MasterDetail<Orcamento>
              data={filtered}
              selectedItem={selectedItem}
              onSelect={(item) => setSelectedItem(item)}
              getRowKey={(item) => item.id}
              detailTitle="Orçamento"
              emptyDetailTitle="Nenhum orçamento selecionado"
              emptyDetailDescription="Selecione um orçamento para ver os detalhes."
              renderRow={(item, isSelected) => (
                <div className={isSelected ? 'opacity-100' : ''}>
                  <p className="font-medium text-sm truncate">
                    {item.centroLucroNome || item.centroLucroId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.ano}
                    {item.descricao ? ` — ${item.descricao}` : ''}
                  </p>
                </div>
              )}
              renderDetail={(item) => (
                <OrcamentoDetailPanel
                  item={item}
                  onEdit={() => {
                    setEditing(item);
                    setModalOpen(true);
                  }}
                  onDelete={() => setDeletingId(item.id)}
                  onOpenItems={() => openDetail(item)}
                />
              )}
            />
          )}
        </DataCard>
      )}

      <OrcamentoFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editing={editing}
        centrosLucro={centrosLucro}
      />

      <OrcamentoDetail
        orcamento={detailOrcamento}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        recursosTecnicos={recursosTecnicos}
        recursosFisicos={recursosFisicos}
        moeda={moeda}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os itens do orçamento serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Orcamento;
