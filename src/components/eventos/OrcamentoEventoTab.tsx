'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, Loader2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { useToast } from '@/hooks/use-toast';
import { fornecedoresRepository } from '@/modules/fornecedores/fornecedores.repository.provider';
import { conteudosRepository } from '@/modules/conteudos/conteudos.repository.provider';
import type { Fornecedor, FornecedorServico } from '@/modules/fornecedores/fornecedores.types';
import type { OrcamentoEventoItem } from '@/modules/gestao-eventos/gestao-eventos.api.repository';

// ── helpers ──────────────────────────────────────────────────────────────────

type CentroOption = { id: string; nome: string; parentId: string | null; status: string };

function buildHierarchy(
  items: CentroOption[],
  parentId: string | null = null,
  level = 0,
): { id: string; nome: string; displayName: string }[] {
  return items
    .filter((item) => item.parentId === parentId)
    .flatMap((child) => {
      const prefix = level > 0 ? `${'| '.repeat(level - 1)}|- ` : '';
      return [
        { id: child.id, nome: child.nome, displayName: `${prefix}${child.nome}` },
        ...buildHierarchy(items, child.id, level + 1),
      ];
    });
}

const MOEDA_SYMBOL: Record<string, string> = {
  BRL: 'R$',
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'Fr',
  ARS: '$',
  MXN: '$',
};
function moedaSymbol(m: string | null | undefined) {
  return MOEDA_SYMBOL[m ?? ''] ?? (m || 'R$');
}

function fmtValor(valor: number, moeda: string) {
  return `${moedaSymbol(moeda)} ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
}

// ── types ─────────────────────────────────────────────────────────────────────

type ItemForm = {
  fornecedorId: string;
  fornecedorNome: string;
  servicoIds: string[];
  servicoNomes: string[];
  centroLucroId: string;
  centroLucroNome: string;
  valor: string;
  moeda: string;
  dataPagamento: string;
};

const emptyForm = (moeda = 'BRL'): ItemForm => ({
  fornecedorId: '',
  fornecedorNome: '',
  servicoIds: [],
  servicoNomes: [],
  centroLucroId: '',
  centroLucroNome: '',
  valor: '',
  moeda,
  dataPagamento: '',
});

// ── component ─────────────────────────────────────────────────────────────────

interface OrcamentoEventoTabProps {
  value: OrcamentoEventoItem[];
  onChange: (items: OrcamentoEventoItem[]) => void;
  unidadeNegocioId: string | null | undefined;
  readOnly?: boolean;
  disabled?: boolean;
}

export function OrcamentoEventoTab({
  value,
  onChange,
  unidadeNegocioId,
  readOnly,
  disabled,
}: OrcamentoEventoTabProps) {
  const { toast } = useToast();

  // lookup data
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [centrosLucro, setCentrosLucro] = useState<CentroOption[]>([]);
  const [centroLucroUnidades, setCentroLucroUnidades] = useState<
    { centroLucroId: string; unidadeNegocioId: string }[]
  >([]);
  const [unidades, setUnidades] = useState<{ id: string; nome: string; moeda?: string | null }[]>(
    [],
  );
  const [loadingOpts, setLoadingOpts] = useState(true);

  // form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm());
  const [servicos, setServicos] = useState<FornecedorServico[]>([]);
  const [loadingServicos, setLoadingServicos] = useState(false);

  // load options once
  useEffect(() => {
    Promise.all([fornecedoresRepository.list(), conteudosRepository.listOptions()])
      .then(([fornList, opts]) => {
        setFornecedores(fornList);
        setCentrosLucro(opts.centrosLucro as CentroOption[]);
        setCentroLucroUnidades(opts.centroLucroUnidades);
        setUnidades(opts.unidades);
      })
      .catch(() =>
        toast({ title: 'Erro', description: 'Erro ao carregar opções.', variant: 'destructive' }),
      )
      .finally(() => setLoadingOpts(false));
  }, [toast]);

  // moeda from selected unidade
  const moedaAtual = useMemo(() => {
    const u = unidades.find((u) => u.id === unidadeNegocioId);
    return u?.moeda ?? 'BRL';
  }, [unidades, unidadeNegocioId]);

  // sync moeda in form when unidade changes (only for new items)
  useEffect(() => {
    if (!editId) setForm((prev) => ({ ...prev, moeda: moedaAtual }));
  }, [moedaAtual, editId]);

  // centros filtered by unidade
  const filteredCentros = useMemo(() => {
    if (!unidadeNegocioId) return centrosLucro;
    const allowed = new Set(
      centroLucroUnidades
        .filter((cu) => cu.unidadeNegocioId === unidadeNegocioId)
        .map((cu) => cu.centroLucroId),
    );
    return centrosLucro.filter((c) => allowed.has(c.id));
  }, [centrosLucro, centroLucroUnidades, unidadeNegocioId]);

  const hierarchicalCentros = useMemo(() => buildHierarchy(filteredCentros), [filteredCentros]);

  // load services for a fornecedor
  const loadServicos = useCallback(async (fornecedorId: string) => {
    if (!fornecedorId) {
      setServicos([]);
      return;
    }
    setLoadingServicos(true);
    try {
      const result = await fornecedoresRepository.listServicos(fornecedorId);
      setServicos(result.items);
    } catch {
      setServicos([]);
    } finally {
      setLoadingServicos(false);
    }
  }, []);

  // ── form actions ─────────────────────────────────────────────────────────────

  const handleFornecedorChange = useCallback(
    async (id: string) => {
      const f = fornecedores.find((f) => f.id === id);
      setForm((prev) => ({
        ...prev,
        fornecedorId: id,
        fornecedorNome: f?.nome ?? '',
        servicoIds: [],
        servicoNomes: [],
      }));
      setServicos([]);
      await loadServicos(id);
    },
    [fornecedores, loadServicos],
  );

  const toggleServico = (id: string, nome: string) => {
    setForm((prev) => {
      const has = prev.servicoIds.includes(id);
      return {
        ...prev,
        servicoIds: has ? prev.servicoIds.filter((s) => s !== id) : [...prev.servicoIds, id],
        servicoNomes: has
          ? prev.servicoNomes.filter((n) => n !== nome)
          : [...prev.servicoNomes, nome],
      };
    });
  };

  const handleCentroChange = (id: string) => {
    const c = hierarchicalCentros.find((c) => c.id === id);
    setForm((prev) => ({ ...prev, centroLucroId: id, centroLucroNome: c?.nome ?? '' }));
  };

  const resetForm = () => {
    setForm(emptyForm(moedaAtual));
    setServicos([]);
    setShowForm(false);
    setEditId(null);
  };

  const startEdit = async (item: OrcamentoEventoItem) => {
    setShowForm(false);
    setEditId(item.id);
    setForm({
      fornecedorId: item.fornecedorId,
      fornecedorNome: item.fornecedorNome,
      servicoIds: item.servicoIds,
      servicoNomes: item.servicoNomes,
      centroLucroId: item.centroLucroId ?? '',
      centroLucroNome: item.centroLucroNome ?? '',
      valor: item.valor > 0 ? String(item.valor) : '',
      moeda: item.moeda || moedaAtual,
      dataPagamento: item.dataPagamento ?? '',
    });
    await loadServicos(item.fornecedorId);
  };

  const saveItem = () => {
    if (!form.fornecedorId) {
      toast({ title: 'Atenção', description: 'Selecione um fornecedor.', variant: 'destructive' });
      return;
    }
    const valorNum = parseFloat(form.valor.replace(',', '.'));
    if (isNaN(valorNum) || valorNum < 0) {
      toast({ title: 'Atenção', description: 'Informe um valor válido.', variant: 'destructive' });
      return;
    }

    const item: OrcamentoEventoItem = {
      id: editId ?? crypto.randomUUID(),
      fornecedorId: form.fornecedorId,
      fornecedorNome: form.fornecedorNome,
      servicoIds: form.servicoIds,
      servicoNomes: form.servicoNomes,
      centroLucroId: form.centroLucroId || null,
      centroLucroNome: form.centroLucroNome || null,
      valor: valorNum,
      moeda: form.moeda || moedaAtual,
      dataPagamento: form.dataPagamento || null,
    };

    onChange(editId ? value.map((i) => (i.id === editId ? item : i)) : [...value, item]);
    resetForm();
  };

  const removeItem = (id: string) => onChange(value.filter((i) => i.id !== id));

  // totals grouped by moeda
  const totais = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of value) {
      const m = item.moeda || 'BRL';
      map[m] = (map[m] ?? 0) + item.valor;
    }
    return Object.entries(map);
  }, [value]);

  const isFormOpen = showForm || editId !== null;
  const isEdit = editId !== null;

  // ── form JSX ─────────────────────────────────────────────────────────────────

  const formNode = (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        {isEdit ? 'Editar item' : 'Novo item'}
      </p>

      {/* Fornecedor */}
      <div className="space-y-1">
        <Label className="text-xs">
          Fornecedor <span className="text-destructive">*</span>
        </Label>
        <SearchableSelect
          options={fornecedores.map((f) => ({ value: f.id, label: f.nome }))}
          value={form.fornecedorId}
          onValueChange={(v) => void handleFornecedorChange(v)}
          placeholder="Selecione o fornecedor..."
          searchPlaceholder="Pesquisar fornecedor..."
          disabled={disabled || loadingOpts}
        />
      </div>

      {/* Serviços */}
      {form.fornecedorId && (
        <div className="space-y-1">
          <Label className="text-xs">Serviços</Label>
          {loadingServicos ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />A carregar serviços...
            </div>
          ) : servicos.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">
              Nenhum serviço cadastrado para este fornecedor.
            </p>
          ) : (
            <div className="rounded-md border bg-background p-2 space-y-1.5 max-h-32 overflow-y-auto">
              {servicos.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`svc-${s.id}`}
                    checked={form.servicoIds.includes(s.id)}
                    onCheckedChange={() => toggleServico(s.id, s.nome)}
                    disabled={disabled}
                  />
                  <label htmlFor={`svc-${s.id}`} className="text-xs cursor-pointer leading-none">
                    {s.nome}
                    {s.valor != null && (
                      <span className="ml-1.5 text-muted-foreground">
                        ({fmtValor(s.valor, form.moeda)})
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Centro | Valor | Data */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Centro de Custo</Label>
          <SearchableSelect
            options={hierarchicalCentros.map((c) => ({
              value: c.id,
              label: c.nome,
              displayLabel: c.displayName,
            }))}
            value={form.centroLucroId}
            onValueChange={handleCentroChange}
            placeholder="Selecione..."
            searchPlaceholder="Pesquisar..."
            disabled={disabled || loadingOpts}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Valor ({form.moeda || moedaAtual})</Label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono pointer-events-none">
              {moedaSymbol(form.moeda || moedaAtual)}
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.valor}
              onChange={(e) => setForm((prev) => ({ ...prev, valor: e.target.value }))}
              placeholder="0.00"
              disabled={disabled}
              className="pl-7 text-right"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Data de Pagamento</Label>
          <Input
            type="date"
            value={form.dataPagamento}
            onChange={(e) => setForm((prev) => ({ ...prev, dataPagamento: e.target.value }))}
            disabled={disabled}
          />
        </div>
      </div>

      {/* actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={saveItem}
          disabled={disabled || !form.fornecedorId}
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          {isEdit ? 'Atualizar' : 'Adicionar'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={resetForm} disabled={disabled}>
          <X className="h-3.5 w-3.5 mr-1" />
          Cancelar
        </Button>
      </div>
    </div>
  );

  // ── render ────────────────────────────────────────────────────────────────────

  if (loadingOpts) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* add button */}
      {!readOnly && !isFormOpen && (
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={() => setShowForm(true)} disabled={disabled}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Adicionar Item
          </Button>
        </div>
      )}

      {/* form (add or edit) */}
      {isFormOpen && formNode}

      {/* items table */}
      {value.length === 0 ? (
        <div className="rounded-md border h-36 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30">
          <DollarSign className="h-8 w-8 opacity-30" />
          <p className="text-sm font-medium">Nenhum item de orçamento</p>
          {!readOnly && <p className="text-xs">Clique em "Adicionar Item" para incluir custos</p>}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 text-left font-medium">Fornecedor</th>
                <th className="px-3 py-2 text-left font-medium">Serviços</th>
                <th className="px-3 py-2 text-left font-medium">Centro de Custo</th>
                <th className="px-3 py-2 text-right font-medium">Valor</th>
                <th className="px-3 py-2 text-center font-medium">Data Pag.</th>
                {!readOnly && <th className="w-16 px-2 py-2" />}
              </tr>
            </thead>
            <tbody>
              {value.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b last:border-0 transition-colors ${
                    editId === item.id ? 'bg-primary/5' : 'hover:bg-muted/20'
                  }`}
                >
                  <td className="px-3 py-2 font-medium">{item.fornecedorNome}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {item.servicoNomes.length > 0 ? (
                      item.servicoNomes.join(', ')
                    ) : (
                      <span className="italic">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{item.centroLucroNome ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {fmtValor(item.valor, item.moeda)}
                  </td>
                  <td className="px-3 py-2 text-center text-muted-foreground">
                    {fmtDate(item.dataPagamento)}
                  </td>
                  {!readOnly && (
                    <td className="px-2 py-1">
                      <div className="flex gap-1 justify-end">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => void startEdit(item)}
                          disabled={disabled || isFormOpen}
                          title="Editar"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                          disabled={disabled || isFormOpen}
                          title="Remover"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {totais.length > 0 && (
              <tfoot>
                {totais.map(([moeda, total]) => (
                  <tr key={moeda} className="border-t bg-muted/30 font-semibold">
                    <td colSpan={3} className="px-3 py-2 text-right text-muted-foreground">
                      Total ({moeda})
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">
                      {fmtValor(total, moeda)}
                    </td>
                    <td colSpan={readOnly ? 1 : 2} />
                  </tr>
                ))}
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
