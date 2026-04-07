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
import { DepartamentoFormModal } from '@/components/recursos/DepartamentoFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Building2, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  ApiDepartamentosRepository,
  type DepartamentoApiInput,
  type DepartamentoApiItem,
} from '@/modules/departamentos/departamentos.api.repository';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

type Departamento = DepartamentoApiItem;

const apiRepository = new ApiDepartamentosRepository();

const STORAGE_KEY = 'kreato_departamentos';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno',    label: 'Código',         defaultVisible: true },
  { key: 'nome',             label: 'Nome',           required: true },
  { key: 'descricao',        label: 'Descrição',      defaultVisible: true },
  { key: 'dataCadastro',     label: 'Data Cadastro',  defaultVisible: false },
  { key: 'usuarioCadastro',  label: 'Usuário',        defaultVisible: false },
  { key: 'actions',          label: 'Ações',          required: true },
];

// ─── Card renderer ────────────────────────────────────────────────────────────

function DepartamentoCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Departamento;
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

function DepartamentoDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: Departamento;
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
        {field('Data de Cadastro', item.dataCadastro ? new Date(item.dataCadastro).toLocaleDateString('pt-BR') : null)}
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

const Departamentos = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Departamentos');
  const podeAlterar = canAlterar('Recursos', 'Departamentos');
  const podeExcluir = canExcluir('Recursos', 'Departamentos');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Departamento | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Departamento | null>(null);
  const [items, setItems] = useState<Departamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchDepartamentos = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await apiRepository.list());
    } catch (error) {
      console.error('Error fetching departamentos:', error);
      toast({
        title: 'Erro',
        description: `Erro ao carregar departamentos: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchDepartamentos();
  }, [fetchDepartamentos]);

  const handleSave = async (data: DepartamentoApiInput) => {
    try {
      await apiRepository.save(data);
      toast({
        title: t('common.success'),
        description: editingItem
          ? `Departamento ${t('common.updated').toLowerCase()}!`
          : `Departamento salvo!`,
      });
      await fetchDepartamentos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving departamento:', error);
      toast({
        title: 'Erro',
        description: `Erro ao salvar departamento: ${(error as Error).message}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await apiRepository.remove(deletingId);
      toast({
        title: t('common.deleted'),
        description: `Departamento ${t('common.deleted').toLowerCase()}!`,
      });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchDepartamentos();
    } catch (error) {
      console.error('Error deleting departamento:', error);
      toast({
        title: 'Erro',
        description: `Erro ao excluir departamento: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Departamento>[] = [
    {
      key: 'codigoExterno',
      label: t('common.code'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="font-medium">{item.nome}</span>
        </div>
      ),
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
      render: (item) =>
        item.dataCadastro ? new Date(item.dataCadastro).toLocaleDateString('pt-BR') : '-',
    },
    {
      key: 'usuarioCadastro',
      label: t('common.user'),
      className: 'w-32',
      render: (item) => item.usuarioCadastro || '-',
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
            disabled={!podeAlterar}
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          {podeExcluir && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDeletingId(item.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Departamentos" description="Gerencie os departamentos da organizacao" />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={`${t('common.new')} Departamento`}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          />
        )}
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
              description="Adicione um departamento."
              icon={Building2}
              onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
              actionLabel="Adicionar Departamento"
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
            emptyDescription="Adicione um departamento."
            onEmptyAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            emptyActionLabel="Adicionar Departamento"
            renderCard={(item) => (
              <DepartamentoCard
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
            detailTitle="Detalhe do Departamento"
            emptyDetailTitle="Nenhum departamento selecionado"
            emptyDetailDescription="Clique em um departamento na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <div>
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                    {item.nome}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">{item.codigoExterno}</p>
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <DepartamentoDetailPanel
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

      <DepartamentoFormModal
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

export default Departamentos;
