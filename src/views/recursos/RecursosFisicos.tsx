import { useState, useEffect, useCallback } from 'react';
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
import { Edit, Trash2, MapPin, Calendar, Loader2, Package } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { RecursoFisicoFormModal } from '@/components/recursos/RecursoFisicoFormModal';
import { MapaRecursosFisicosModal } from '@/components/recursos/MapaRecursosFisicosModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { recursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.repository.provider';
import type {
  RecursoFisico,
  RecursoFisicoInput,
} from '@/modules/recursos-fisicos/recursos-fisicos.types';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

const STORAGE_KEY = 'kreato_recursos_fisicos_table';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno',   label: 'Código',          defaultVisible: true },
  { key: 'nome',            label: 'Nome',             required: true },
  { key: 'custoHora',       label: 'Custo/h',          defaultVisible: true },
  { key: 'estoqueCount',    label: 'Estoque',          defaultVisible: true },
  { key: 'dataCadastro',    label: 'Cadastro',         defaultVisible: false },
  { key: 'usuarioCadastro', label: 'Usuário',          defaultVisible: false },
  { key: 'acoes',           label: 'Ações',            required: true },
];

const formatCustoHora = (value: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

// ─── Card renderer ────────────────────────────────────────────────────────────

function RecursoFisicoCard({
  item,
  podeAlterar,
  podeExcluir,
  onEdit,
  onDelete,
}: {
  item: RecursoFisico;
  podeAlterar: boolean;
  podeExcluir: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const count = item.estoqueCount || 0;
  const iconColor = count > 0 ? 'text-green-500' : 'text-red-500';

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
        </div>
        {item.codigoExterno && (
          <p className="text-xs font-mono text-muted-foreground mt-1">{item.codigoExterno}</p>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Package className={`w-3.5 h-3.5 ${iconColor}`} />
          <span>{count} em estoque</span>
        </div>
        <div>{formatCustoHora(item.custoHora)}/h</div>
      </CardContent>

      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!podeAlterar} onClick={onEdit}>
          <Edit className="h-3.5 w-3.5" />
        </Button>
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

function RecursoFisicoDetailPanel({
  item,
  podeAlterar,
  podeExcluir,
  onEdit,
  onDelete,
}: {
  item: RecursoFisico;
  podeAlterar: boolean;
  podeExcluir: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const count = item.estoqueCount || 0;
  const iconColor = count > 0 ? 'text-green-500' : 'text-red-500';
  const field = (label: string, value: string | undefined | null) =>
    value ? (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Código', item.codigoExterno)}
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Estoque</p>
          <div className="flex items-center gap-1">
            <Package className={`w-4 h-4 ${iconColor}`} />
            <span className="text-sm">{count}</span>
          </div>
        </div>
        {field('Custo/h', `${formatCustoHora(item.custoHora)}`)}
        {field('Cadastro', item.dataCadastro || null)}
        {field('Usuário', item.usuarioCadastro || null)}
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={!podeAlterar} onClick={onEdit}>
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
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

const RecursosFisicos = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Recursos Físicos');
  const podeAlterar = canAlterar('Recursos', 'Recursos Físicos');
  const podeExcluir = canExcluir('Recursos', 'Recursos Físicos');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapaOpen, setIsMapaOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecursoFisico | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RecursoFisico | null>(null);
  const [items, setItems] = useState<RecursoFisico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchRecursosFisicos = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await recursosFisicosRepository.list());
    } catch (error) {
      console.error('Error fetching recursos fisicos:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao carregar recursos físicos: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, t, toast]);

  useEffect(() => {
    void fetchRecursosFisicos();
  }, [fetchRecursosFisicos]);

  const handleSave = async (data: RecursoFisicoInput) => {
    try {
      await recursosFisicosRepository.save({
        ...data,
        tenantId: user?.tenantId ?? null,
      });
      toast({
        title: t('common.success'),
        description: editingItem ? 'Recurso físico atualizado!' : 'Recurso físico criado!',
      });
      await fetchRecursosFisicos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving recurso fisico:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao salvar: ${(error as Error).message}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await recursosFisicosRepository.remove(deletingId);
      toast({ title: t('common.deleted'), description: t('common.deleted') });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchRecursosFisicos();
    } catch (error) {
      console.error('Error deleting recurso fisico:', error);
      toast({
        title: t('common.error'),
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
      item.codigoExterno.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<RecursoFisico>[] = [
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
      key: 'custoHora',
      label: t('field.costPerHour'),
      className: 'w-32',
      render: (item) => formatCustoHora(item.custoHora),
    },
    {
      key: 'estoqueCount',
      label: t('field.stock'),
      className: 'w-24',
      render: (item) => {
        const count = item.estoqueCount || 0;
        const iconColor = count > 0 ? 'text-green-500' : 'text-red-500';
        return (
          <div className="flex items-center gap-1">
            <Package className={`w-4 h-4 ${iconColor}`} />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
      className: 'w-32',
    },
    {
      key: 'usuarioCadastro',
      label: t('common.user'),
      className: 'w-40',
      render: (item) => (
        <span className="text-muted-foreground">{item.usuarioCadastro || '-'}</span>
      ),
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
            onClick={(e) => {
              e.stopPropagation();
              setEditingItem(item);
              setIsModalOpen(true);
            }}
            disabled={!podeAlterar}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {podeExcluir && (
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
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

  return (
    <div>
      <PageHeader
        title={t('physicalResources.title')}
        description={t('field.managePhysicalResources')}
      />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={t('field.newResource')}
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMapaOpen(true)}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          {t('field.availabilityMap')}
        </Button>
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title={t('field.noPhysicalResourceRegistered')}
              description={t('field.physicalResourcesHint')}
              icon={MapPin}
              onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
              actionLabel={t('field.addPhysicalResource')}
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
            emptyTitle={t('field.noPhysicalResourceRegistered')}
            emptyDescription={t('field.physicalResourcesHint')}
            onEmptyAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            emptyActionLabel={t('field.addPhysicalResource')}
            renderCard={(item) => (
              <RecursoFisicoCard
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
            detailTitle="Detalhe do Recurso Físico"
            emptyDetailTitle="Nenhum recurso selecionado"
            emptyDetailDescription="Clique em um recurso físico na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  {item.nome}
                </p>
              </div>
            )}
            renderDetail={(item) => (
              <RecursoFisicoDetailPanel
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

      <RecursoFisicoFormModal
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

      <MapaRecursosFisicosModal
        isOpen={isMapaOpen}
        onClose={() => setIsMapaOpen(false)}
        recursos={items}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este recurso físico? Esta ação não pode ser desfeita.
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

export default RecursosFisicos;
