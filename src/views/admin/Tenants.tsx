import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Building2, Loader2, Calendar } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { ApiTenantsRepository } from '@/modules/tenants/tenants.api.repository';
import { TenantFormModal } from '@/components/admin/TenantFormModal';
import { format } from 'date-fns';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

export interface Tenant {
  id: string;
  nome: string;
  plano: 'Mensal' | 'Anual';
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
  notas: string;
  createdAt: string;
  licencaFim?: string;
}

const apiRepository = new ApiTenantsRepository();

const STORAGE_KEY = 'kreato_tenants_table';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'nome',       label: 'Nome',         required: true },
  { key: 'plano',      label: 'Plano',        defaultVisible: true },
  { key: 'licencaFim', label: 'Licença Até',  defaultVisible: true },
  { key: 'status',     label: 'Status',       defaultVisible: true },
  { key: 'acoes',      label: 'Ações',        required: true },
];

const statusVariants: Record<Tenant['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Ativo: 'default',
  Inativo: 'secondary',
  Bloqueado: 'destructive',
};

// ─── Card renderer ────────────────────────────────────────────────────────────

function TenantCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Tenant;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
          </div>
          <Badge variant={statusVariants[item.status]}>{item.status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 space-y-1.5 text-xs text-muted-foreground">
        <div>{item.plano}</div>
        {item.licencaFim && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>Até {format(new Date(item.licencaFim), 'dd/MM/yyyy')}</span>
          </div>
        )}
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

// ─── Detail panel renderer ────────────────────────────────────────────────────

function TenantDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: Tenant;
  onEdit: () => void;
  onDelete: () => void;
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
        </div>
        <Badge variant={statusVariants[item.status]}>{item.status}</Badge>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Plano', item.plano)}
        {item.licencaFim
          ? field('Licença Até', format(new Date(item.licencaFim), 'dd/MM/yyyy'))
          : null}
        {field('Criado em', item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy') : null)}
      </div>

      {item.notas && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Notas</p>
            <p className="text-sm leading-relaxed">{item.notas}</p>
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

const Tenants = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Tenant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Tenant | null>(null);
  const [items, setItems] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await apiRepository.list();
      setItems(
        data.map((item) => ({
          id: item.id,
          nome: item.nome,
          plano: item.plano,
          status: item.status,
          notas: item.notas || '',
          createdAt: item.createdAt,
          licencaFim: item.licencaFim || undefined,
        })),
      );
    } catch (err) {
      console.error('Error fetching tenants:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar tenants',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await apiRepository.remove(deletingId);
      toast({ title: 'Sucesso', description: 'Tenant excluido com sucesso' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchData();
    } catch (err) {
      console.error('Error deleting tenant:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir tenant',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter((item) =>
    item.nome.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Tenant>[] = [
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'plano',
      label: 'Plano',
      className: 'w-32',
    },
    {
      key: 'licencaFim',
      label: 'Licenca Ate',
      className: 'w-32',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {item.licencaFim ? format(new Date(item.licencaFim), 'dd/MM/yyyy') : '-'}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      className: 'w-24',
      render: (item) => <Badge variant={statusVariants[item.status]}>{item.status}</Badge>,
    },
    {
      key: 'acoes',
      label: 'Acoes',
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              setDeletingId(item.id);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Tenants" description="Gerencie as organizacoes e licencas do sistema" />

      <ListActionBar>
        <NewButton
          tooltip="Novo Tenant"
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
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title="Nenhum tenant cadastrado"
              description="Adicione organizacoes para comecar a usar o sistema."
              icon={Building2}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Adicionar Tenant"
            />
          ) : (
            <SortableTable
              data={filteredItems}
              columns={columns}
              getRowKey={(item) => item.id}
              storageKey={STORAGE_KEY}
              visibleColumnKeys={visibleColumnKeys}
            />
          )
        ) : mode === 'cards' ? (
          <CardGrid
            data={filteredItems}
            getRowKey={(item) => item.id}
            emptyTitle="Nenhum tenant cadastrado"
            emptyDescription="Adicione organizacoes para comecar a usar o sistema."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Adicionar Tenant"
            renderCard={(item) => (
              <TenantCard
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
            detailTitle="Detalhe do Tenant"
            emptyDetailTitle="Nenhum tenant selecionado"
            emptyDetailDescription="Clique em um tenant na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                    {item.nome}
                  </p>
                </div>
                <Badge variant={statusVariants[item.status]} className="text-[10px] h-4 px-1.5 shrink-0">
                  {item.status}
                </Badge>
              </div>
            )}
            renderDetail={(item) => (
              <TenantDetailPanel
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

      <TenantFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={() => void fetchData()}
        data={editingItem}
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
            <AlertDialogTitle>Confirmar exclusão do Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              ATENÇÃO: Excluir um tenant removerá todos os dados associados. Esta ação é irreversível.
            </AlertDialogDescription>
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

export default Tenants;
