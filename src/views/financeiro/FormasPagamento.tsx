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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings, Loader2, Star, WalletCards } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';
import { FormaPagamentoFormModal } from '@/components/financeiro/FormaPagamentoFormModal';

export interface FormaPagamentoItem {
  id: string;
  codigoExterno: string;
  titulo: string;
  descricao: string;
  cor: string;
  isPadrao: boolean;
  dataCadastro: string;
  usuarioCadastro: string;
}

const repository = new ApiParametrizacoesRepository();

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno', label: 'Codigo', required: false, defaultVisible: true },
  { key: 'titulo', label: 'Titulo', required: true },
  { key: 'cor', label: 'Cor', defaultVisible: true },
  { key: 'descricao', label: 'Descricao', defaultVisible: true },
  { key: 'isPadrao', label: 'Padrao', defaultVisible: true },
  { key: 'dataCadastro', label: 'Data Cadastro', defaultVisible: false },
  { key: 'actions', label: 'Acoes', required: true },
];

const STORAGE_KEY = 'kreato_formas_pagamento_financeiro_table';

function FormaPagamentoCard({
  item,
  onEdit,
  onDelete,
  onTogglePadrao,
}: {
  item: FormaPagamentoItem;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePadrao: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-full border border-border shrink-0"
            style={{ backgroundColor: item.cor || '#6b7280' }}
          />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">
              <Badge style={{ backgroundColor: item.cor || '#6b7280' }} className="text-white">
                {item.titulo}
              </Badge>
            </div>
            {item.codigoExterno && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
            )}
          </div>
          {item.isPadrao && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2 text-xs text-muted-foreground flex-1">
        {item.descricao && <div>{item.descricao}</div>}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-mono">
            {item.cor || '-'}
          </Badge>
          {item.isPadrao && <Badge variant="secondary">Padrao</Badge>}
        </div>
      </CardContent>
      <CardFooter className="px-4 py-2 border-t flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onTogglePadrao}>
                <Star
                  className={`h-4 w-4 ${item.isPadrao ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {item.isPadrao ? 'Forma padrao ativa' : 'Definir como forma padrao'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex gap-1">
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
        </div>
      </CardFooter>
    </Card>
  );
}

function FormaPagamentoDetailPanel({
  item,
  onEdit,
  onDelete,
  onTogglePadrao,
}: {
  item: FormaPagamentoItem;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePadrao: () => void;
}) {
  const field = (label: string, value: string | undefined | null) =>
    value ? (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div
          className="h-12 w-12 rounded-full border border-border shrink-0"
          style={{ backgroundColor: item.cor || '#6b7280' }}
        />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-base leading-snug">
            <Badge style={{ backgroundColor: item.cor || '#6b7280' }} className="text-white text-sm">
              {item.titulo}
            </Badge>
          </div>
          {item.codigoExterno && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
          )}
        </div>
        {item.isPadrao && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Codigo Externo', item.codigoExterno)}
        {field('Cor', item.cor)}
        {field(
          'Data Cadastro',
          item.dataCadastro ? new Date(item.dataCadastro).toLocaleDateString('pt-BR') : null,
        )}
      </div>

      {item.isPadrao && <Badge variant="secondary">Forma Padrao</Badge>}

      {item.descricao && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Descricao</p>
            <p className="text-sm leading-relaxed">{item.descricao}</p>
          </div>
        </>
      )}

      <Separator />

      <div className="flex gap-2 flex-wrap">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={onTogglePadrao}>
                <Star
                  className={`h-3.5 w-3.5 mr-1.5 ${item.isPadrao ? 'fill-yellow-400 text-yellow-400' : ''}`}
                />
                {item.isPadrao ? 'Remover Padrao' : 'Definir Padrao'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {item.isPadrao ? 'Forma padrao ativa' : 'Definir como forma padrao'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

const FormasPagamento = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FormaPagamentoItem | null>(null);
  const [items, setItems] = useState<FormaPagamentoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<FormaPagamentoItem | null>(null);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchFormasPagamento = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listFormasPagamento();
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching formas_pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar formas de pagamento',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchFormasPagamento();
  }, [fetchFormasPagamento]);

  const handleSave = async (data: FormaPagamentoItem) => {
    try {
      await repository.saveFormaPagamento({
        id: editingItem?.id,
        codigoExterno: data.codigoExterno,
        titulo: data.titulo,
        descricao: data.descricao,
        cor: data.cor,
        isPadrao: data.isPadrao,
      });

      toast({
        title: 'Sucesso',
        description: `Forma de pagamento ${editingItem ? 'atualizada' : 'criada'} com sucesso`,
      });

      setIsModalOpen(false);
      setEditingItem(null);
      await fetchFormasPagamento();
    } catch (error) {
      console.error('Error saving forma_pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar forma de pagamento',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      await repository.removeFormaPagamento(deletingId);
      toast({
        title: 'Sucesso',
        description: 'Forma de pagamento removida com sucesso',
      });
      if (selectedItem?.id === deletingId) {
        setSelectedItem(null);
      }
      await fetchFormasPagamento();
    } catch (error) {
      console.error('Error deleting forma_pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover forma de pagamento',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePadrao = async (id: string, value: boolean) => {
    try {
      await repository.toggleFormaPagamentoPadrao(id, value);
      toast({
        title: 'Sucesso',
        description: value ? 'Forma definida como padrao' : 'Forma padrao removida',
      });
      await fetchFormasPagamento();
    } catch (error) {
      console.error('Error toggling forma_pagamento padrao:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar forma padrao',
        variant: 'destructive',
      });
    }
  };

  const filteredItems = items.filter((item) => {
    const term = search.toLowerCase();

    return (
      item.titulo.toLowerCase().includes(term) ||
      item.codigoExterno.toLowerCase().includes(term) ||
      item.descricao.toLowerCase().includes(term)
    );
  });

  const columns: Column<FormaPagamentoItem & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: 'Codigo',
      className: 'w-28',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'titulo',
      label: 'Titulo',
      render: (item) => <span className="font-medium">{item.titulo}</span>,
    },
    {
      key: 'cor',
      label: 'Cor',
      className: 'w-36',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: item.cor }} />
          <span className="font-mono text-xs">{item.cor}</span>
        </div>
      ),
    },
    {
      key: 'descricao',
      label: 'Descricao',
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">
          {item.descricao || '-'}
        </span>
      ),
    },
    {
      key: 'isPadrao',
      label: 'Padrao',
      className: 'w-24',
      render: (item) =>
        item.isPadrao ? <Badge variant="secondary">Sim</Badge> : <span className="text-muted-foreground">Nao</span>,
    },
    {
      key: 'actions',
      label: 'Acoes',
      className: 'w-24 text-right',
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

  const tableVisibleKeys = mode === 'list' ? visibleColumnKeys : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Formas de Pagamento"
        description="Gerencie as formas de pagamento utilizadas no fluxo financeiro"
      />

      <ListActionBar>
        <NewButton
          tooltip="Nova Forma de Pagamento"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar formas de pagamento..." />
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
              title="Nenhuma forma de pagamento encontrada"
              description="Adicione a primeira forma de pagamento."
              icon={Settings}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Adicionar Forma"
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
            emptyTitle="Nenhuma forma de pagamento encontrada"
            emptyDescription="Adicione a primeira forma de pagamento."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Adicionar Forma"
            renderCard={(item) => (
              <FormaPagamentoCard
                item={item}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
                onTogglePadrao={() => void handleTogglePadrao(item.id, !item.isPadrao)}
              />
            )}
          />
        ) : (
          <MasterDetail
            data={filteredItems}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedItem(item)}
            getRowKey={(item) => item.id}
            detailTitle="Forma de Pagamento"
            emptyDetailTitle="Nenhuma forma de pagamento selecionada"
            emptyDetailDescription="Clique em um item da lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p
                  className={
                    isSelected
                      ? 'text-sm font-medium truncate text-primary'
                      : 'text-sm font-medium truncate'
                  }
                >
                  {item.titulo}
                </p>
                <div className="flex gap-2 mt-0.5">
                  {item.codigoExterno && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {item.codigoExterno}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <WalletCards className="h-3 w-3" />
                    Pagamento
                  </span>
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <FormaPagamentoDetailPanel
                item={item}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
                onTogglePadrao={() => void handleTogglePadrao(item.id, !item.isPadrao)}
              />
            )}
          />
        )}
      </DataCard>

      <FormaPagamentoFormModal
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
            <AlertDialogTitle>Excluir forma de pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A forma de pagamento sera removida permanentemente.
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

export default FormasPagamento;
