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
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Truck, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { FornecedorFormModal } from '@/components/recursos/FornecedorFormModal';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { fornecedoresRepository } from '@/modules/fornecedores/fornecedores.repository.provider';
import type { Fornecedor, FornecedorInput } from '@/modules/fornecedores/fornecedores.types';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

const STORAGE_KEY = 'kreato_fornecedores_table';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno', label: 'Código',    defaultVisible: true },
  { key: 'nome',          label: 'Nome',      required: true },
  { key: 'categoria',     label: 'Categoria', defaultVisible: true },
  { key: 'email',         label: 'E-mail',    defaultVisible: true },
  { key: 'pais',          label: 'País',      defaultVisible: false },
  { key: 'acoes',         label: 'Ações',     required: true },
];

// ─── Card renderer ────────────────────────────────────────────────────────────

function FornecedorCard({
  item,
  onEdit,
  onDelete,
  podeAlterar,
  podeExcluir,
}: {
  item: Fornecedor;
  onEdit: () => void;
  onDelete: () => void;
  podeAlterar: boolean;
  podeExcluir: boolean;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-2">
          <Truck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
            {item.codigoExterno && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 space-y-1 text-xs text-muted-foreground">
        {item.categoria && <div>{item.categoria}</div>}
        {item.email && <div className="truncate">{item.email}</div>}
        {item.pais && <div>{item.pais}</div>}
      </CardContent>

      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1">
        {podeAlterar && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
        )}
        {podeExcluir && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ─── Detail panel renderer ────────────────────────────────────────────────────

function FornecedorDetailPanel({
  item,
  onEdit,
  onDelete,
  podeAlterar,
  podeExcluir,
}: {
  item: Fornecedor;
  onEdit: () => void;
  onDelete: () => void;
  podeAlterar: boolean;
  podeExcluir: boolean;
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
        <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
          {item.codigoExterno && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Categoria', item.categoria)}
        {field('País', item.pais)}
        {field('E-mail', item.email)}
      </div>

      <Separator />

      <div className="flex gap-2">
        {podeAlterar && (
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Editar
          </Button>
        )}
        {podeExcluir && (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Excluir
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const Fornecedores = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Fornecedores');
  const podeAlterar = canAlterar('Recursos', 'Fornecedores');
  const podeExcluir = canExcluir('Recursos', 'Fornecedores');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Fornecedor | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Fornecedor | null>(null);
  const [items, setItems] = useState<Fornecedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchFornecedores = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await fornecedoresRepository.list());
    } catch (error) {
      console.error('Error fetching fornecedores:', error);
      toast({
        title: t('common.error'),
        description: t('field.supplierLoadError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, t, toast]);

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  const handleSave = async (input: FornecedorInput) => {
    try {
      await fornecedoresRepository.save({
        ...input,
        tenantId: user?.tenantId ?? null,
      });
      toast({
        title: t('common.success'),
        description: editingItem ? t('field.supplierUpdated') : t('field.supplierCreated'),
      });
      await fetchFornecedores();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving fornecedor:', error);
      toast({
        title: t('common.error'),
        description: t('field.supplierSaveError'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await fornecedoresRepository.remove(deletingId);
      toast({ title: t('common.deleted'), description: t('field.supplierDeleted') });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchFornecedores();
    } catch (error) {
      console.error('Error deleting fornecedor:', error);
      toast({
        title: t('common.error'),
        description: t('field.supplierDeleteError'),
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Fornecedor>[] = [
    {
      key: 'codigoExterno',
      label: t('common.code'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'categoria',
      label: t('common.category'),
      render: (item) => item.categoria || '-',
    },
    {
      key: 'email',
      label: t('common.email'),
      render: (item) => item.email || '-',
    },
    {
      key: 'pais',
      label: t('common.country'),
      render: (item) => item.pais || '-',
    },
    {
      key: 'acoes',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            disabled={!podeAlterar}
            onClick={(event) => {
              event.stopPropagation();
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {podeExcluir && (
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation();
                setDeletingId(item.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('field.suppliers')} description={t('field.manageSuppliers')} />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={t('field.newSupplier')}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          />
        )}
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
              title={t('field.noSupplierRegistered')}
              description={t('field.suppliersHint')}
              icon={Truck}
              onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
              actionLabel={t('field.addSupplier')}
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
            emptyTitle={t('field.noSupplierRegistered')}
            emptyDescription={t('field.suppliersHint')}
            onEmptyAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            emptyActionLabel={t('field.addSupplier')}
            renderCard={(item) => (
              <FornecedorCard
                item={item}
                podeAlterar={podeAlterar}
                podeExcluir={podeExcluir}
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
            detailTitle="Detalhe do Fornecedor"
            emptyDetailTitle="Nenhum fornecedor selecionado"
            emptyDetailDescription="Clique em um fornecedor na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <Truck className="h-3.5 w-3.5 text-primary shrink-0" />
                <div>
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                    {item.nome}
                  </p>
                  {item.categoria && (
                    <p className="text-xs text-muted-foreground">{item.categoria}</p>
                  )}
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <FornecedorDetailPanel
                item={item}
                podeAlterar={podeAlterar}
                podeExcluir={podeExcluir}
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

      <FornecedorFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !podeAlterar}
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
            <AlertDialogTitle>{t('common.confirm.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
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

export default Fornecedores;
