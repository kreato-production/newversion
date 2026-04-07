import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Receipt, Loader2, CircleDollarSign, CalendarClock } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';
import { ContaPagarFormModal } from '@/components/financeiro/ContaPagarFormModal';
import { ApiContasPagarRepository, type ContaPagar, type SaveContaPagarInput } from '@/modules/financeiro/contas-pagar.api';

const repository = new ApiContasPagarRepository();

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'numeroDocumento', label: 'Nº Doc', defaultVisible: true },
  { key: 'fornecedor', label: 'Fornecedor', required: false, defaultVisible: true },
  { key: 'descricao', label: 'Descricao', required: true },
  { key: 'dataVencimento', label: 'Vencimento', defaultVisible: true },
  { key: 'valor', label: 'Valor', defaultVisible: true },
  { key: 'statusNome', label: 'Status', defaultVisible: true },
  { key: 'dataPagamento', label: 'Dt. Pagamento', defaultVisible: false },
  { key: 'valorPago', label: 'Valor Pago', defaultVisible: false },
  { key: 'categoriaNome', label: 'Categoria', defaultVisible: false },
  { key: 'actions', label: 'Acoes', required: true },
];

const STORAGE_KEY = 'kreato_contas_pagar_table';

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-';
  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: number | null | undefined) {
  if (value == null) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function isOverdue(dataVencimento: string, dataPagamento: string) {
  if (dataPagamento) return false;
  return new Date(dataVencimento) < new Date();
}

// ─── Card view ───────────────────────────────────────────────────────────────

function ContaPagarCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ContaPagar;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const overdue = isOverdue(item.dataVencimento, item.dataPagamento);

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{item.descricao}</p>
            {item.fornecedorNome && (
              <p className="text-xs text-muted-foreground truncate">{item.fornecedorNome}</p>
            )}
          </div>
          {item.numeroDocumento && (
            <span className="text-xs font-mono text-muted-foreground shrink-0">{item.numeroDocumento}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2 text-xs text-muted-foreground flex-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground text-base">{formatCurrency(item.valor)}</span>
          {item.statusNome && (
            <Badge
              style={item.statusCor ? { backgroundColor: item.statusCor, color: '#fff' } : undefined}
              variant="secondary"
            >
              {item.statusNome}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <CalendarClock className={`h-3 w-3 ${overdue ? 'text-destructive' : ''}`} />
          <span className={overdue ? 'text-destructive font-medium' : ''}>
            Vence: {formatDate(item.dataVencimento)}
          </span>
        </div>
        {item.dataPagamento && (
          <div className="flex items-center gap-1">
            <CircleDollarSign className="h-3 w-3 text-green-500" />
            <span>Pago: {formatDate(item.dataPagamento)}</span>
          </div>
        )}
        {item.categoriaNome && <div className="truncate">{item.categoriaNome}</div>}
      </CardContent>
      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1">
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

// ─── Detail panel ─────────────────────────────────────────────────────────────

function ContaPagarDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: ContaPagar;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const field = (label: string, value: string | null | undefined) =>
    value ? (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    ) : null;

  const overdue = isOverdue(item.dataVencimento, item.dataPagamento);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-base">{item.descricao}</h3>
        {item.fornecedorNome && <p className="text-sm text-muted-foreground">{item.fornecedorNome}</p>}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold">{formatCurrency(item.valor)}</span>
        {item.statusNome && (
          <Badge
            style={item.statusCor ? { backgroundColor: item.statusCor, color: '#fff' } : undefined}
            variant="secondary"
          >
            {item.statusNome}
          </Badge>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Nº Documento', item.numeroDocumento)}
        {field('Fornecedor', item.fornecedorNome)}
        {field('Data Emissão', formatDate(item.dataEmissao))}
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Vencimento</p>
          <p className={`text-sm ${overdue ? 'text-destructive font-medium' : ''}`}>
            {formatDate(item.dataVencimento)}
            {overdue && ' (vencida)'}
          </p>
        </div>
        {field('Data Pagamento', formatDate(item.dataPagamento))}
        {item.valorPago != null && field('Valor Pago', formatCurrency(item.valorPago))}
        {field('Categoria', item.categoriaNome)}
        {field('Forma de Pagamento', item.formaPagamentoNome)}
        {field('Tipo de Documento', item.tipoDocumentoNome)}
      </div>

      {item.observacoes && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Observações</p>
            <p className="text-sm leading-relaxed">{item.observacoes}</p>
          </div>
        </>
      )}

      <Separator />

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Excluir
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const ContasPagar = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContaPagar | null>(null);
  const [items, setItems] = useState<ContaPagar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContaPagar | null>(null);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.list();
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching contas a pagar:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar contas a pagar', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleSave = async (input: SaveContaPagarInput) => {
    try {
      await repository.save(input);
      toast({ title: 'Sucesso', description: `Conta ${editingItem ? 'atualizada' : 'criada'} com sucesso` });
      setIsModalOpen(false);
      setEditingItem(null);
      await fetchItems();
    } catch (error) {
      console.error('Error saving conta a pagar:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar conta a pagar', variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await repository.remove(deletingId);
      toast({ title: 'Sucesso', description: 'Conta removida com sucesso' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchItems();
    } catch (error) {
      console.error('Error deleting conta a pagar:', error);
      toast({ title: 'Erro', description: 'Erro ao remover conta a pagar', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const term = search.toLowerCase();
    return (
      item.descricao.toLowerCase().includes(term) ||
      (item.fornecedorNome?.toLowerCase().includes(term) ?? false) ||
      (item.numeroDocumento?.toLowerCase().includes(term) ?? false) ||
      (item.statusNome?.toLowerCase().includes(term) ?? false)
    );
  });

  const columns: Column<ContaPagar & { actions?: never }>[] = [
    {
      key: 'numeroDocumento',
      label: 'Nº Doc',
      className: 'w-28',
      render: (item) => <span className="font-mono text-xs">{item.numeroDocumento || '-'}</span>,
    },
    {
      key: 'fornecedor',
      label: 'Fornecedor',
      render: (item) => <span className="text-sm">{item.fornecedorNome || '-'}</span>,
    },
    {
      key: 'descricao',
      label: 'Descricao',
      render: (item) => <span className="font-medium">{item.descricao}</span>,
    },
    {
      key: 'dataVencimento',
      label: 'Vencimento',
      className: 'w-32',
      render: (item) => {
        const overdue = isOverdue(item.dataVencimento, item.dataPagamento);
        return (
          <span className={overdue ? 'text-destructive font-medium' : ''}>
            {formatDate(item.dataVencimento)}
          </span>
        );
      },
    },
    {
      key: 'valor',
      label: 'Valor',
      className: 'w-36 text-right',
      render: (item) => <span className="font-semibold tabular-nums">{formatCurrency(item.valor)}</span>,
    },
    {
      key: 'statusNome',
      label: 'Status',
      className: 'w-36',
      render: (item) =>
        item.statusNome ? (
          <Badge
            style={item.statusCor ? { backgroundColor: item.statusCor, color: '#fff' } : undefined}
            variant="secondary"
            className="text-xs"
          >
            {item.statusNome}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'dataPagamento',
      label: 'Dt. Pagamento',
      className: 'w-32',
      render: (item) => <span>{formatDate(item.dataPagamento)}</span>,
    },
    {
      key: 'valorPago',
      label: 'Valor Pago',
      className: 'w-36 text-right',
      render: (item) => (
        <span className="tabular-nums">{item.valorPago != null ? formatCurrency(item.valorPago) : '-'}</span>
      ),
    },
    {
      key: 'categoriaNome',
      label: 'Categoria',
      render: (item) => <span className="text-muted-foreground text-xs">{item.categoriaNome || '-'}</span>,
    },
    {
      key: 'actions',
      label: 'Acoes',
      className: 'w-20 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setEditingItem(item);
              setIsModalOpen(true);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tableVisibleKeys = mode === 'list' ? visibleColumnKeys : undefined;

  return (
    <div>
      <PageHeader
        title="Contas a Pagar"
        description="Gerencie as contas e obrigações financeiras a pagar"
      />

      <ListActionBar>
        <NewButton
          tooltip="Nova Conta a Pagar"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar contas..." />
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

      <DataCard>
        {mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title="Nenhuma conta encontrada"
              description="Adicione a primeira conta a pagar."
              icon={Receipt}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Adicionar Conta"
            />
          ) : (
            <SortableTable
              data={filteredItems}
              columns={columns}
              getRowKey={(item) => item.id}
              storageKey={STORAGE_KEY}
              visibleColumnKeys={tableVisibleKeys}
            />
          )
        ) : mode === 'cards' ? (
          <CardGrid
            data={filteredItems}
            getRowKey={(item) => item.id}
            emptyTitle="Nenhuma conta encontrada"
            emptyDescription="Adicione a primeira conta a pagar."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Adicionar Conta"
            renderCard={(item) => (
              <ContaPagarCard
                item={item}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
              />
            )}
          />
        ) : (
          <MasterDetail
            data={filteredItems}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedItem(item)}
            getRowKey={(item) => item.id}
            detailTitle="Conta a Pagar"
            emptyDetailTitle="Nenhuma conta selecionada"
            emptyDetailDescription="Clique em um item da lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p
                  className={
                    isSelected ? 'text-sm font-medium truncate text-primary' : 'text-sm font-medium truncate'
                  }
                >
                  {item.descricao}
                </p>
                <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                  {item.fornecedorNome && <span className="truncate">{item.fornecedorNome}</span>}
                  <span className="shrink-0">{formatDate(item.dataVencimento)}</span>
                  <span className="shrink-0 font-medium tabular-nums">{formatCurrency(item.valor)}</span>
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <ContaPagarDetailPanel
                item={item}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
              />
            )}
          />
        )}
      </DataCard>

      <ContaPagarFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        navigation={(() => {
          const navIndex = editingItem
            ? filteredItems.findIndex((item) => item.id === editingItem.id)
            : -1;

          return navIndex >= 0
            ? {
                currentIndex: navIndex,
                total: filteredItems.length,
                onPrevious: () => setEditingItem(filteredItems[navIndex - 1]),
                onNext: () => setEditingItem(filteredItems[navIndex + 1]),
              }
            : undefined;
        })()}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta a pagar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A conta sera removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteConfirm()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContasPagar;
