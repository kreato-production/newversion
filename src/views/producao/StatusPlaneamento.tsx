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
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings, Loader2, Star } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { StatusPlaneamentoFormModal } from '@/components/producao/StatusPlaneamentoFormModal';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  type ColumnConfig,
} from '@/components/listing';

export interface StatusPlaneamentoItem {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  cor: string;
  isInicial: boolean;
  dataCadastro: string;
  usuarioCadastro: string;
}

const repository = new ApiParametrizacoesRepository();

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno', label: 'Código', required: false, defaultVisible: true },
  { key: 'nome', label: 'Nome', required: true },
  { key: 'cor', label: 'Cor', defaultVisible: true },
  { key: 'descricao', label: 'Descrição', defaultVisible: true },
  { key: 'isInicial', label: 'Inicial', defaultVisible: true },
  { key: 'actions', label: 'Ações', required: true },
];

const STORAGE_KEY = 'kreato_status_planeamento_table';

const StatusPlaneamento = () => {
  const { toast } = useToast();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StatusPlaneamentoItem | null>(null);
  const [items, setItems] = useState<StatusPlaneamentoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listStatusPlaneamento();
      setItems(response.data as StatusPlaneamentoItem[]);
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar status de planeamento',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleSave = async (data: StatusPlaneamentoItem) => {
    try {
      await repository.saveStatusPlaneamento({
        ...(editingItem ? { id: data.id } : {}),
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        descricao: data.descricao,
        cor: data.cor,
        isInicial: data.isInicial,
      });
      toast({
        title: 'Sucesso',
        description: editingItem ? 'Status atualizado!' : 'Status cadastrado!',
      });
      await fetchItems();
      setEditingItem(null);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao salvar status', variant: 'destructive' });
      throw new Error('Erro ao salvar status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await repository.removeStatusPlaneamento(deletingId);
      toast({ title: 'Excluído', description: 'Status removido com sucesso!' });
      await fetchItems();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir status', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleInicial = async (id: string, value: boolean) => {
    try {
      await repository.toggleStatusPlaneamentoInicial(id, value);
      toast({
        title: 'Sucesso',
        description: value ? 'Status definido como inicial' : 'Status inicial removido',
      });
      await fetchItems();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      (item.codigoExterno || '').toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<StatusPlaneamentoItem & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: 'Codigo',
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => (
        <Badge style={{ backgroundColor: item.cor || '#6b7280' }} className="text-white">
          {item.nome}
        </Badge>
      ),
    },
    {
      key: 'cor',
      label: 'Cor',
      className: 'w-24',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-border"
            style={{ backgroundColor: item.cor || '#6b7280' }}
          />
          <span className="text-xs font-mono text-muted-foreground">{item.cor || '-'}</span>
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
      key: 'isInicial',
      label: 'Inicial',
      className: 'w-20 text-center',
      sortable: false,
      render: (item) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleToggleInicial(item.id, !item.isInicial);
                }}
              >
                <Star
                  className={`h-4 w-4 ${item.isInicial ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {item.isInicial ? 'Status inicial ativo' : 'Definir como status inicial'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
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
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeletingId(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Status de Planeamento"
        description="Gerencie os status de planeamento para a grelha de programação"
      />

      <ListActionBar>
        <NewButton
          tooltip="Novo Status"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} />
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhum status cadastrado"
            description="Comece adicionando status de planeamento."
            icon={Settings}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Status"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey={STORAGE_KEY}
            visibleColumnKeys={mode === 'list' ? visibleColumnKeys : undefined}
          />
        )}
      </DataCard>

      <StatusPlaneamentoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar('Producao', 'Parametrizacoes', 'Status Planeamento')}
        navigation={(() => {
          const navIndex = editingItem
            ? filteredItems.findIndex((i) => i.id === editingItem.id)
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
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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

export default StatusPlaneamento;
