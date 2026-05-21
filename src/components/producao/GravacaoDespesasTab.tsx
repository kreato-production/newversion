import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { Plus, Trash2, Loader2, Receipt, X, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import {
  gravacoesRelacionamentosApi,
  type GravacaoDespesaItem,
  type GravacaoDespesaInput,
} from '@/modules/gravacoes/gravacoes-relacionamentos.api';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { apiRequest } from '@/lib/api/http';
import { formatCurrency } from '@/lib/currencies';

interface GravacaoDespesasTabProps {
  gravacaoId: string;
  gravacaoNome?: string;
}

type FornecedorOption = { id: string; nome: string };
type StatusOption = { id: string; titulo: string; isInicial: boolean };

const parametrizacoes = new ApiParametrizacoesRepository();

const emptyForm = (): GravacaoDespesaInput => ({
  titulo: '',
  numeroDocumento: '',
  descricao: '',
  status: '',
  tipoDocumento: '',
  categoria: '',
  dataVencimento: '',
  valor: null,
  fornecedorId: '',
  formaPagamento: '',
});

export const GravacaoDespesasTab = ({ gravacaoId, gravacaoNome }: GravacaoDespesasTabProps) => {
  const { toast } = useToast();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Produção', 'Gravação');
  const podeAlterar = canAlterar('Produção', 'Gravação');
  const podeExcluir = canExcluir('Produção', 'Gravação');

  const [items, setItems] = useState<GravacaoDespesaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<GravacaoDespesaInput>(emptyForm());
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [moeda, setMoeda] = useState('BRL');

  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<{ id: string; titulo: string }[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; titulo: string }[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<{ id: string; titulo: string }[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([]);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const [result, custos] = await Promise.all([
        gravacoesRelacionamentosApi.listDespesas(gravacaoId),
        gravacoesRelacionamentosApi.getCustos(gravacaoId),
      ]);
      setItems(result.items);
      setMoeda(custos.moeda ?? 'BRL');
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as despesas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [gravacaoId, toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const loadOptions = useCallback(() => {
    if (optionsLoaded) return;
    Promise.all([
      parametrizacoes.listStatusContasPagar(),
      parametrizacoes.listTiposDocumentosFinanceiro(),
      parametrizacoes.listCategoriasDespesa(),
      parametrizacoes.listFormasPagamento(),
      apiRequest<{ data: FornecedorOption[] }>('/fornecedores?limit=200'),
    ])
      .then(([status, tipos, cats, formas, forn]) => {
        setStatusOptions(status.data as StatusOption[]);
        setTiposDocumento(tipos.data);
        setCategorias(cats.data);
        setFormasPagamento(formas.data);
        setFornecedores(forn.data ?? []);
        setOptionsLoaded(true);
      })
      .catch(() => {});
  }, [optionsLoaded]);

  const openNew = () => {
    loadOptions();
    const initialStatus = statusOptions.find((s) => s.isInicial)?.titulo ?? '';
    setForm({ ...emptyForm(), titulo: gravacaoNome ?? '', status: initialStatus });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item: GravacaoDespesaItem) => {
    loadOptions();
    setForm({
      titulo: item.titulo,
      numeroDocumento: item.numeroDocumento || '',
      descricao: item.descricao || '',
      status: item.status || '',
      tipoDocumento: item.tipoDocumento || '',
      categoria: item.categoria || '',
      dataVencimento: item.dataVencimento || '',
      valor: item.valor || null,
      fornecedorId: item.fornecedorId || '',
      formaPagamento: item.formaPagamento || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'O título é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: GravacaoDespesaInput = {
        ...form,
        numeroDocumento: form.numeroDocumento || null,
        descricao: form.descricao || null,
        status: form.status || null,
        tipoDocumento: form.tipoDocumento || null,
        categoria: form.categoria || null,
        dataVencimento: form.dataVencimento || null,
        fornecedorId: form.fornecedorId || null,
        formaPagamento: form.formaPagamento || null,
      };

      if (editingId) {
        const updated = await gravacoesRelacionamentosApi.updateDespesa(
          gravacaoId,
          editingId,
          payload,
        );
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
        toast({ title: 'Sucesso', description: 'Despesa atualizada com sucesso.' });
      } else {
        const item = await gravacoesRelacionamentosApi.addDespesa(gravacaoId, payload);
        setItems((prev) => [item, ...prev]);
        toast({ title: 'Sucesso', description: 'Despesa adicionada com sucesso.' });
      }
      setShowForm(false);
      setEditingId(null);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a despesa.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await gravacoesRelacionamentosApi.removeDespesa(gravacaoId, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast({ title: 'Removido', description: 'Despesa removida.' });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a despesa.',
        variant: 'destructive',
      });
    }
  };

  const totalValor = items.reduce((acc, i) => acc + i.valor, 0);

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {items.length} despesa(s) — Total:{' '}
          <span className="font-semibold text-foreground">{formatCurrency(totalValor, moeda)}</span>
        </div>
        {podeIncluir && !showForm && (
          <Button size="sm" onClick={openNew} className="gradient-primary hover:opacity-90">
            <Plus className="h-4 w-4 mr-1" />
            Nova Despesa
          </Button>
        )}
      </div>

      {/* Formulário inline */}
      {showForm && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{editingId ? 'Editar Despesa' : 'Nova Despesa'}</p>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={closeForm}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Linha 1: Título | Nº Documento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Despesa - 2026001 - Nome do Conteúdo"
              />
            </div>
            <div className="space-y-2">
              <Label>Nº Documento</Label>
              <Input
                value={form.numeroDocumento ?? ''}
                onChange={(e) => setForm({ ...form, numeroDocumento: e.target.value })}
              />
            </div>
          </div>

          {/* Linha 2: Descrição */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={form.descricao ?? ''}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={2}
            />
          </div>

          {/* Linha 3: Status | Tipo de Documento | Categoria */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <SearchableSelect
                options={statusOptions.map((s) => ({ value: s.titulo, label: s.titulo }))}
                value={form.status ?? ''}
                onValueChange={(v) => setForm({ ...form, status: v })}
                placeholder="Selecionar"
                searchPlaceholder="Pesquisar status..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <SearchableSelect
                options={tiposDocumento.map((t) => ({ value: t.titulo, label: t.titulo }))}
                value={form.tipoDocumento ?? ''}
                onValueChange={(v) => setForm({ ...form, tipoDocumento: v })}
                placeholder="Selecionar"
                searchPlaceholder="Pesquisar tipo..."
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <SearchableSelect
                options={categorias.map((c) => ({ value: c.titulo, label: c.titulo }))}
                value={form.categoria ?? ''}
                onValueChange={(v) => setForm({ ...form, categoria: v })}
                placeholder="Selecionar"
                searchPlaceholder="Pesquisar categoria..."
              />
            </div>
          </div>

          {/* Linha 4: Data de Vencimento | Valor | Fornecedor */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={form.dataVencimento ?? ''}
                onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor ({moeda})</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {moeda === 'BRL' ? 'R$' : moeda}
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-9"
                  value={form.valor ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, valor: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <SearchableSelect
                options={fornecedores.map((f) => ({ value: f.id, label: f.nome }))}
                value={form.fornecedorId ?? ''}
                onValueChange={(v) => setForm({ ...form, fornecedorId: v })}
                placeholder="Selecionar"
                searchPlaceholder="Pesquisar fornecedor..."
              />
            </div>
          </div>

          {/* Linha 5: Forma de Pagamento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <SearchableSelect
                options={formasPagamento.map((f) => ({ value: f.titulo, label: f.titulo }))}
                value={form.formaPagamento ?? ''}
                onValueChange={(v) => setForm({ ...form, formaPagamento: v })}
                placeholder="Selecionar"
                searchPlaceholder="Pesquisar forma..."
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeForm} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              className="gradient-primary hover:opacity-90"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
          <Receipt className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhuma despesa registrada</p>
          <p className="text-xs mt-1">Clique em "Nova Despesa" para adicionar.</p>
        </div>
      ) : items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Nº Documento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.titulo}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.numeroDocumento || '-'}
                </TableCell>
                <TableCell>{item.status || '-'}</TableCell>
                <TableCell>{item.categoria || '-'}</TableCell>
                <TableCell>
                  {item.dataVencimento
                    ? new Date(`${item.dataVencimento}T00:00:00`).toLocaleDateString('pt-BR')
                    : '-'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.valor, moeda)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {podeAlterar && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEdit(item)}
                        disabled={showForm}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {podeExcluir && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemove(item.id)}
                        disabled={showForm}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  );
};
