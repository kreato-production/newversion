import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, FolderOpen, Building2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { ProgramaFormModal } from '@/components/producao/ProgramaFormModal';
import { programasRepository } from '@/modules/programas/programas.repository.provider';
import type { Programa, ProgramaInput } from '@/modules/programas/programas.types';
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
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

// ─── Column configuration ─────────────────────────────────────────────────────

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno',   label: 'Código',            required: true },
  { key: 'nome',            label: 'Nome',              required: true },
  { key: 'unidadeNegocio',  label: 'Unidade de Negócio', defaultVisible: true },
  { key: 'descricao',       label: 'Descrição',         defaultVisible: true },
  { key: 'dataCadastro',    label: 'Data Cadastro',     defaultVisible: true },
  { key: 'acoes',           label: 'Ações',             required: true },
];

const STORAGE_KEY = 'kreato_programas_table';

// ─── Card renderer ────────────────────────────────────────────────────────────

function ProgramaCard({
  item,
  onEdit,
  onDelete,
  podeAlterar,
  podeExcluir,
}: {
  item: Programa;
  onEdit: () => void;
  onDelete: () => void;
  podeAlterar: boolean;
  podeExcluir: boolean;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="min-w-0">
          <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
          <p className="text-xs font-mono text-primary mt-0.5">{item.codigoExterno || '-'}</p>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 space-y-1.5 text-xs text-muted-foreground">
        {item.unidadeNegocio && (
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.unidadeNegocio}</span>
          </div>
        )}
        {item.descricao && (
          <p className="line-clamp-2 text-muted-foreground">{item.descricao}</p>
        )}
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

function ProgramaDetailPanel({
  item,
  onEdit,
  onDelete,
  podeAlterar,
  podeExcluir,
}: {
  item: Programa;
  onEdit: () => void;
  onDelete: () => void;
  podeAlterar: boolean;
  podeExcluir: boolean;
}) {
  const field = (label: string, value: string | number | undefined | null) =>
    value ? (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
        <p className="text-xs font-mono text-primary mt-0.5">{item.codigoExterno || '-'}</p>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Unidade de Negócio', item.unidadeNegocio)}
        {field('Data de Cadastro', item.dataCadastro)}
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

const Programas = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();

  const podeIncluir = canIncluir('Produção', 'Programas');
  const podeAlterar = canAlterar('Produção', 'Programas');
  const podeExcluir = canExcluir('Produção', 'Programas');

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Programa | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Programa | null>(null);
  const [items, setItems] = useState<Programa[]>([]);
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
      setItems(await programasRepository.list());
    } catch (err) {
      console.error('Error fetching programas:', err);
      toast({
        title: t('common.error'),
        description: `Erro ao carregar programas: ${(err as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data: ProgramaInput) => {
    try {
      await programasRepository.save(
        {
          ...data,
          tenantId: user?.tenantId ?? null,
        },
        user?.id,
      );
      toast({
        title: t('common.success'),
        description: editingItem ? 'Programa atualizado!' : 'Programa criado!',
      });
      await fetchData();
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving programa:', err);
      toast({
        title: t('common.error'),
        description: `Erro ao salvar: ${(err as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await programasRepository.remove(deletingId);
      toast({ title: t('common.deleted'), description: 'Programa excluído!' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchData();
    } catch (err) {
      console.error('Error deleting programa:', err);
      toast({
        title: t('common.error'),
        description: `Erro ao excluir: ${(err as Error).message}`,
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

  const columns: Column<Programa>[] = [
    {
      key: 'codigoExterno',
      label: t('common.externalCode'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'unidadeNegocio',
      label: t('recordings.businessUnit') || 'Unidade de Negócio',
      render: (item) => item.unidadeNegocio || '-',
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
    { key: 'dataCadastro', label: t('common.registrationDate'), className: 'w-32' },
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
            className="h-7 w-7"
            onClick={() => {
              setEditingItem(item);
              setIsModalOpen(true);
            }}
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

  const loadingSkeleton = (
    <div className="p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader title="Programas" description="Gerencie os programas de produção" />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip="Novo Programa"
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
          loadingSkeleton
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title={t('common.noResults')}
              description="Adicione um programa."
              icon={FolderOpen}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Novo Programa"
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
            emptyDescription="Adicione um programa."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Novo Programa"
            renderCard={(item) => (
              <ProgramaCard
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
            detailTitle="Detalhe do Programa"
            emptyDetailTitle="Nenhum programa selecionado"
            emptyDetailDescription="Clique em um programa na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  {item.nome}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.codigoExterno || '-'}
                </p>
              </div>
            )}
            renderDetail={(item) => (
              <ProgramaDetailPanel
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

      <ProgramaFormModal
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
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
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

export default Programas;
