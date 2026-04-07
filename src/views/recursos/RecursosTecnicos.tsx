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
import { Edit, Trash2, Wrench, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { RecursoTecnicoFormModal } from '@/components/recursos/RecursoTecnicoFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { recursosTecnicosRepository } from '@/modules/recursos-tecnicos/recursos-tecnicos.repository.provider';
import type {
  RecursoTecnico,
  RecursoTecnicoInput,
} from '@/modules/recursos-tecnicos/recursos-tecnicos.types';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

const STORAGE_KEY = 'kreato_recursos_tecnicos_table';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno',   label: 'Código',           defaultVisible: true },
  { key: 'nome',            label: 'Nome',             required: true },
  { key: 'funcaoOperador',  label: 'Função Operador',  defaultVisible: true },
  { key: 'dataCadastro',    label: 'Data Cadastro',    defaultVisible: false },
  { key: 'usuarioCadastro', label: 'Usuário',          defaultVisible: false },
  { key: 'acoes',           label: 'Ações',            required: true },
];

// ─── Card renderer ────────────────────────────────────────────────────────────

function RecursoTecnicoCard({
  item,
  onEdit,
  onDelete,
  podeAlterar,
  podeExcluir,
}: {
  item: RecursoTecnico;
  onEdit: () => void;
  onDelete: () => void;
  podeAlterar: boolean;
  podeExcluir: boolean;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-2">
          <Wrench className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
          </div>
        </div>
      </CardHeader>

      {item.funcaoOperador && (
        <CardContent className="px-4 pb-3 flex-1 text-xs text-muted-foreground">
          <p className="truncate">{item.funcaoOperador}</p>
        </CardContent>
      )}

      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1 mt-auto">
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

function RecursoTecnicoDetailPanel({
  item,
  onEdit,
  onDelete,
  podeAlterar,
  podeExcluir,
}: {
  item: RecursoTecnico;
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
        <Wrench className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Função do Operador', item.funcaoOperador)}
        {field('Data de Cadastro', item.dataCadastro)}
        {field('Usuário', item.usuarioCadastro)}
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

const RecursosTecnicos = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Recursos Técnicos');
  const podeAlterar = canAlterar('Recursos', 'Recursos Técnicos');
  const podeExcluir = canExcluir('Recursos', 'Recursos Técnicos');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecursoTecnico | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RecursoTecnico | null>(null);
  const [items, setItems] = useState<RecursoTecnico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchRecursosTecnicos = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await recursosTecnicosRepository.list());
    } catch (error) {
      console.error('Error fetching recursos tecnicos:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao carregar recursos técnicos: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, t, toast]);

  useEffect(() => {
    fetchRecursosTecnicos();
  }, [fetchRecursosTecnicos]);

  const handleSave = async (data: RecursoTecnicoInput) => {
    try {
      await recursosTecnicosRepository.save({
        ...data,
        tenantId: user?.tenantId ?? null,
      });
      toast({
        title: t('common.success'),
        description: editingItem ? 'Recurso técnico atualizado!' : 'Recurso técnico criado!',
      });
      await fetchRecursosTecnicos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving recurso tecnico:', error);
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
      await recursosTecnicosRepository.remove(deletingId);
      toast({ title: t('common.deleted'), description: t('common.deleted') });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchRecursosTecnicos();
    } catch (error) {
      console.error('Error deleting recurso tecnico:', error);
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

  const columns: Column<RecursoTecnico>[] = [
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
      key: 'funcaoOperador',
      label: t('field.operatorFunction'),
      render: (item) => item.funcaoOperador || '-',
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
        title={t('technicalResources.title')}
        description={t('field.manageTechnicalResources')}
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
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title={t('field.noTechnicalResourceRegistered')}
              description={t('field.technicalResourcesHint')}
              icon={Wrench}
              onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
              actionLabel={t('field.addTechnicalResource')}
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
            emptyTitle={t('field.noTechnicalResourceRegistered')}
            emptyDescription={t('field.technicalResourcesHint')}
            onEmptyAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            emptyActionLabel={t('field.addTechnicalResource')}
            renderCard={(item) => (
              <RecursoTecnicoCard
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
            detailTitle="Detalhe do Recurso Técnico"
            emptyDetailTitle="Nenhum recurso selecionado"
            emptyDetailDescription="Clique em um recurso na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <Wrench className="h-3.5 w-3.5 text-primary shrink-0" />
                <div>
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                    {item.nome}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">{item.codigoExterno}</p>
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <RecursoTecnicoDetailPanel
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

      <RecursoTecnicoFormModal
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

export default RecursosTecnicos;
