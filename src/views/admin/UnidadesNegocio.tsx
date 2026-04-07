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
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Building2, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnidadeNegocioFormModal } from '@/components/admin/UnidadeNegocioFormModal';
import { useAuth } from '@/contexts/AuthContext';
import { unidadesRepository } from '@/modules/unidades/unidades.repository.provider';
import type { UnidadeNegocio } from '@/modules/unidades/unidades.types';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

const STORAGE_KEY = 'kreato_unidades_negocio';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno',   label: 'Código',         defaultVisible: true },
  { key: 'nome',            label: 'Nome',           required: true },
  { key: 'descricao',       label: 'Descrição',      defaultVisible: true },
  { key: 'dataCadastro',    label: 'Data Cadastro',  defaultVisible: false },
  { key: 'usuarioCadastro', label: 'Usuário',        defaultVisible: false },
  { key: 'actions',         label: 'Ações',          required: true },
];

// ─── Card renderer ────────────────────────────────────────────────────────────

function UnidadeCard({
  item,
  onEdit,
  onDelete,
}: {
  item: UnidadeNegocio;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-2">
          <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
            {item.codigoExterno && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
            )}
          </div>
        </div>
      </CardHeader>

      {item.descricao && (
        <CardContent className="px-4 pb-3 flex-1 text-xs text-muted-foreground">
          <p className="line-clamp-3">{item.descricao}</p>
        </CardContent>
      )}

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

function UnidadeDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: UnidadeNegocio;
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
      <div className="flex items-start gap-3">
        <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
          {item.codigoExterno && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Data de Cadastro', item.dataCadastro)}
        {field('Usuário', item.usuarioCadastro)}
      </div>

      {item.descricao && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Descrição</p>
            <p className="text-sm leading-relaxed">{item.descricao}</p>
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

const UnidadesNegocio = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UnidadeNegocio | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<UnidadeNegocio | null>(null);
  const [items, setItems] = useState<UnidadeNegocio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchData = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await unidadesRepository.list(user?.nome || ''));
    } catch (error) {
      console.error('Error fetching unidades_negocio:', error);
      toast({
        title: 'Erro',
        description: `Erro ao carregar dados: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast, user?.nome]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data: UnidadeNegocio) => {
    try {
      await unidadesRepository.save(data, user?.id);

      if (editingItem) {
        toast({ title: t('common.success'), description: t('businessUnits.updated') });
      } else {
        toast({ title: t('common.success'), description: t('businessUnits.saved') });
      }

      await fetchData();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving unidade:', error);
      toast({
        title: 'Erro',
        description: `Erro ao salvar: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await unidadesRepository.remove(deletingId);
      toast({ title: t('common.success'), description: t('businessUnits.deleted') });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchData();
    } catch (error) {
      console.error('Error deleting unidade:', error);
      toast({
        title: 'Erro',
        description: `Erro ao excluir: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<UnidadeNegocio & { actions?: never }>[] = [
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
      key: 'descricao',
      label: t('common.description'),
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">
          {item.descricao || '-'}
        </span>
      ),
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
      className: 'w-32',
    },
    {
      key: 'usuarioCadastro',
      label: t('common.user'),
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
      <PageHeader title={t('businessUnits.title')} description={t('businessUnits.description')} />

      <ListActionBar>
        <NewButton
          tooltip={t('businessUnits.new')}
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
              title={t('businessUnits.empty')}
              description={t('businessUnits.emptyDescription')}
              icon={Building2}
              onAction={() => setIsModalOpen(true)}
              actionLabel={t('common.add')}
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
            emptyTitle={t('businessUnits.empty')}
            emptyDescription={t('businessUnits.emptyDescription')}
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel={t('common.add')}
            renderCard={(item) => (
              <UnidadeCard
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
            detailTitle="Detalhe da Unidade"
            emptyDetailTitle="Nenhuma unidade selecionada"
            emptyDetailDescription="Clique em uma unidade na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <div>
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                    {item.nome}
                  </p>
                  {item.codigoExterno && (
                    <p className="text-xs font-mono text-muted-foreground">{item.codigoExterno}</p>
                  )}
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <UnidadeDetailPanel
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

      <UnidadeNegocioFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
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

export default UnidadesNegocio;
