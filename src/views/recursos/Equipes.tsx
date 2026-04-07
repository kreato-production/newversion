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
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { EquipeFormModal } from '@/components/recursos/EquipeFormModal';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, UsersRound, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { equipesRepository } from '@/modules/equipes/equipes.repository.provider';
import type { Equipe, EquipeInput } from '@/modules/equipes/equipes.types';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

const STORAGE_KEY = 'kreato_equipes';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigo',       label: 'Código',    defaultVisible: true },
  { key: 'descricao',    label: 'Descrição', required: true },
  { key: 'membrosCount', label: 'Membros',   defaultVisible: true },
  { key: 'dataCadastro', label: 'Cadastro',  defaultVisible: false },
  { key: 'actions',      label: 'Ações',     required: true },
];

// ─── Card renderer ────────────────────────────────────────────────────────────

function EquipeCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Equipe;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-2">
          <UsersRound className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug truncate">{item.descricao}</p>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigo}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {item.membrosCount} {item.membrosCount === 1 ? 'membro' : 'membros'}
        </p>
      </CardHeader>

      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1 mt-auto">
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

function EquipeDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: Equipe;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const field = (label: string, value: string | number | undefined | null) =>
    value !== undefined && value !== null ? (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <UsersRound className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.descricao}</h3>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigo}</p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Membros', item.membrosCount)}
        {field('Data de Cadastro', item.dataCadastro)}
      </div>

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

const Equipes = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipe | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Equipe | null>(null);
  const [items, setItems] = useState<Equipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchEquipes = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await equipesRepository.list());
    } catch (error) {
      console.error('Error fetching equipes:', error);
      toast({
        title: t('common.error'),
        description: t('teams.loadError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void fetchEquipes();
  }, [fetchEquipes]);

  const handleSave = async (data: EquipeInput) => {
    try {
      if (editingItem) {
        await equipesRepository.update(editingItem.id, data);
        toast({ title: t('common.success'), description: t('teams.updated') });
      } else {
        await equipesRepository.create(data);
        toast({ title: t('common.success'), description: t('teams.created') });
      }

      await fetchEquipes();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving equipe:', error);
      toast({
        title: t('common.error'),
        description: t('teams.saveError'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await equipesRepository.remove(deletingId);
      toast({ title: t('common.deleted'), description: t('teams.deleted') });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchEquipes();
    } catch (error) {
      console.error('Error deleting equipe:', error);
      toast({
        title: t('common.error'),
        description: t('teams.deleteError'),
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.codigo.toLowerCase().includes(search.toLowerCase()) ||
      item.descricao.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Equipe & { actions?: never }>[] = [
    {
      key: 'codigo',
      label: t('common.code'),
      className: 'w-32',
      render: (item) => <span className="font-mono text-sm">{item.codigo}</span>,
    },
    {
      key: 'descricao',
      label: t('common.description'),
      render: (item) => (
        <div className="flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-primary" />
          <span className="font-medium">{item.descricao}</span>
        </div>
      ),
    },
    {
      key: 'membrosCount',
      label: t('teams.members'),
      className: 'w-32 text-center',
      render: (item) => <span className="text-muted-foreground">{item.membrosCount}</span>,
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
      className: 'w-32',
    },
    {
      key: 'actions',
      label: t('common.actions'),
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
      <PageHeader title={t('teams.title')} description={t('teams.description')} />

      <ListActionBar>
        <NewButton
          tooltip={t('teams.new')}
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
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
              title={t('common.noResults')}
              description={t('teams.empty')}
              icon={UsersRound}
              onAction={() => setIsModalOpen(true)}
              actionLabel={t('teams.new')}
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
            emptyTitle={t('common.noResults')}
            emptyDescription={t('teams.empty')}
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel={t('teams.new')}
            renderCard={(item) => (
              <EquipeCard
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
            detailTitle="Detalhe da Equipe"
            emptyDetailTitle="Nenhuma equipe selecionada"
            emptyDetailDescription="Clique em uma equipe na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <UsersRound className="h-3.5 w-3.5 text-primary shrink-0" />
                <div>
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                    {item.descricao}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">{item.codigo}</p>
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <EquipeDetailPanel
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

      <EquipeFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        onRefresh={fetchEquipes}
        readOnly={!!editingItem && !canAlterar('Recursos', 'Equipes')}
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

export default Equipes;
