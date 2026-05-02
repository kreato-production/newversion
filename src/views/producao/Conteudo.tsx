import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Film, Tag, Calendar } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ConteudoBackendFormModal } from '@/components/producao/ConteudoBackendFormModal';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { conteudosRepository } from '@/modules/conteudos/conteudos.repository.provider';
import type { Conteudo as ConteudoItem, ConteudoInput } from '@/modules/conteudos/conteudos.types';
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
  { key: 'descricao', label: 'Descrição', required: true },
  { key: 'quantidadeEpisodios', label: 'Episódios', defaultVisible: true },
  { key: 'centroLucro', label: 'Centro de Lucro', defaultVisible: true },
  { key: 'anoProducao', label: 'Ano de Produção', defaultVisible: true },
  { key: 'dataCadastro', label: 'Data Cadastro', defaultVisible: true },
  { key: 'acoes', label: 'Ações', required: true },
];

const STORAGE_KEY = 'kreato_conteudos_table';

// ─── Card renderer ────────────────────────────────────────────────────────────

function ConteudoCard({
  item,
  onEdit,
  onDelete,
  podeAlterar,
  podeExcluir,
}: {
  item: ConteudoItem;
  onEdit: () => void;
  onDelete: () => void;
  podeAlterar: boolean;
  podeExcluir: boolean;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="min-w-0">
          <p className="font-medium text-sm leading-snug truncate">{item.descricao}</p>
          {item.codigoExterno && (
            <p className="text-xs font-mono text-primary mt-0.5">{item.codigoExterno}</p>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 space-y-1.5 text-xs text-muted-foreground">
        {item.centroLucro && (
          <div className="flex items-center gap-1.5">
            <Tag className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.centroLucro}</span>
          </div>
        )}
        {item.anoProducao && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{item.anoProducao}</span>
          </div>
        )}
        {item.quantidadeEpisodios != null && (
          <div className="flex items-center gap-1.5">
            <Film className="h-3 w-3 shrink-0" />
            <span>{item.quantidadeEpisodios} episódio(s)</span>
          </div>
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

function ConteudoDetailPanel({
  item,
  onEdit,
  onDelete,
  podeAlterar,
  podeExcluir,
}: {
  item: ConteudoItem;
  onEdit: () => void;
  onDelete: () => void;
  podeAlterar: boolean;
  podeExcluir: boolean;
}) {
  const field = (label: string, value: string | number | undefined | null) =>
    value != null && value !== '' ? (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-base leading-snug">{item.descricao}</h3>
        {item.codigoExterno && (
          <p className="text-xs font-mono text-primary mt-0.5">{item.codigoExterno}</p>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Episódios', item.quantidadeEpisodios)}
        {field('Centro de Lucro', item.centroLucro)}
        {field('Ano de Produção', item.anoProducao)}
        {field('Data de Cadastro', item.dataCadastro)}
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

const Conteudo = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();

  const podeIncluir = canIncluir('ProduÃƒÂ§ÃƒÂ£o', 'ConteÃƒÂºdo');
  const podeAlterar = canAlterar('ProduÃƒÂ§ÃƒÂ£o', 'ConteÃƒÂºdo');
  const podeExcluir = canExcluir('ProduÃƒÂ§ÃƒÂ£o', 'ConteÃƒÂºdo');

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConteudoItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ConteudoItem | null>(null);
  const [items, setItems] = useState<ConteudoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchConteudos = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await conteudosRepository.list();
      setItems(data);
    } catch (error) {
      console.error('Error fetching conteudos:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao carregar conteÃºdos: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, t, toast]);

  useEffect(() => {
    void fetchConteudos();
  }, [fetchConteudos]);

  const handleSave = async (data: ConteudoInput) => {
    try {
      await conteudosRepository.save(
        {
          ...data,
          tenantId: user?.tenantId ?? null,
        },
        user?.id,
      );

      toast({
        title: t('common.success'),
        description: editingItem ? t('field.contentUpdated') : t('field.contentCreated'),
      });

      await fetchConteudos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving conteudo:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao salvar conteÃºdo: ${(error as Error).message}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await conteudosRepository.remove(deletingId);
      toast({ title: t('common.deleted'), description: t('field.contentDeleted') });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchConteudos();
    } catch (error) {
      console.error('Error deleting conteudo:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao excluir conteÃºdo: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<ConteudoItem>[] = [
    {
      key: 'descricao',
      label: t('common.description'),
      render: (item) => <span className="font-medium">{item.descricao}</span>,
    },
    {
      key: 'quantidadeEpisodios',
      label: t('content.episodes'),
      className: 'w-24 text-center',
      render: (item) => <span className="font-mono">{item.quantidadeEpisodios}</span>,
    },
    {
      key: 'centroLucro',
      label: t('menu.profitCenters'),
      render: (item) => item.centroLucro || '-',
    },
    {
      key: 'anoProducao',
      label: t('content.productionYear'),
      className: 'w-20',
      render: (item) => item.anoProducao || '-',
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
      className: 'w-32',
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
              onClick={(event) => {
                event.stopPropagation();
                setDeletingId(item.id);
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
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
      <PageHeader title={t('content.title')} description={t('content.description')} />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={t('content.new')}
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
          loadingSkeleton
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title={t('content.empty')}
              description={t('content.emptyDescription')}
              icon={Film}
              onAction={() => setIsModalOpen(true)}
              actionLabel={t('content.new')}
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
            emptyTitle={t('content.empty')}
            emptyDescription={t('content.emptyDescription')}
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel={t('content.new')}
            renderCard={(item) => (
              <ConteudoCard
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
            detailTitle="Detalhe do Conteúdo"
            emptyDetailTitle="Nenhum conteúdo selecionado"
            emptyDetailDescription="Clique em um conteúdo na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  {item.descricao}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.codigoExterno || item.anoProducao || '-'}
                </p>
              </div>
            )}
            renderDetail={(item) => (
              <ConteudoDetailPanel
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

      <ConteudoBackendFormModal
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

export default Conteudo;
