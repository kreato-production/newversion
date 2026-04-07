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
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { SeveridadeIncidenciaFormModal } from '@/components/producao/SeveridadeIncidenciaFormModal';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

export interface SeveridadeIncidencia {
  id: string;
  codigo_externo: string | null;
  titulo: string;
  descricao: string | null;
  cor: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const repository = new ApiParametrizacoesRepository();

const STORAGE_KEY = 'kreato_severidades_incidencia';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigo_externo', label: 'Código',    defaultVisible: true },
  { key: 'titulo',         label: 'Título',    required: true },
  { key: 'descricao',      label: 'Descrição', defaultVisible: true },
  { key: 'created_at',     label: 'Cadastro',  defaultVisible: false },
  { key: 'actions',        label: 'Ações',     required: true },
];

// ─── Card renderer ────────────────────────────────────────────────────────────

function SeveridadeCard({
  item,
  onEdit,
  onDelete,
}: {
  item: SeveridadeIncidencia;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0 mt-1"
            style={{ backgroundColor: item.cor || '#888888' }}
          />
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug truncate">{item.titulo}</p>
            {item.codigo_externo && (
              <p className="text-xs font-mono text-primary mt-0.5">{item.codigo_externo}</p>
            )}
          </div>
        </div>
      </CardHeader>

      {item.descricao && (
        <CardContent className="px-4 pb-3 flex-1 text-xs text-muted-foreground">
          <p className="line-clamp-3">{item.descricao}</p>
        </CardContent>
      )}

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

function SeveridadeDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: SeveridadeIncidencia;
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
        <span
          className="inline-block w-4 h-4 rounded-full shrink-0 mt-1"
          style={{ backgroundColor: item.cor || '#888888' }}
        />
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.titulo}</h3>
          {item.codigo_externo && (
            <p className="text-xs font-mono text-primary mt-0.5">{item.codigo_externo}</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Código Externo', item.codigo_externo)}
        {field(
          'Cadastro',
          item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : null,
        )}
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

const SeveridadesIncidencia = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SeveridadeIncidencia | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SeveridadeIncidencia | null>(null);
  const [items, setItems] = useState<SeveridadeIncidencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const permPath = ['Produção', 'Parametrizações', 'Severidades de Incidência'] as const;

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listSeveridadesIncidencia();
      setItems(
        response.data.map((item) => ({
          id: item.id,
          codigo_externo: item.codigo_externo || null,
          titulo: item.titulo,
          descricao: item.descricao || null,
          cor: item.cor || '#888888',
          created_by: item.created_by || null,
          created_at: item.created_at || null,
          updated_at: item.created_at || null,
        })),
      );
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await repository.removeSeveridadeIncidencia(deletingId);
      toast({
        title: t('common.deleted'),
        description: `${t('incidentSeverity.entity')} ${t('common.deleted').toLowerCase()}!`,
      });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchData();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async (data: {
    titulo: string;
    descricao?: string;
    codigo_externo?: string;
    cor?: string;
  }) => {
    try {
      await repository.saveSeveridadeIncidencia({
        ...(editingItem ? { id: editingItem.id } : {}),
        titulo: data.titulo,
        descricao: data.descricao || '',
        codigo_externo: data.codigo_externo || '',
        cor: data.cor || '#888888',
      });
      toast({
        title: t('common.success'),
        description: `${t('incidentSeverity.entity')} ${editingItem ? t('common.updated').toLowerCase() : t('common.save').toLowerCase()}!`,
      });
      await fetchData();
      setEditingItem(null);
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (item.codigo_externo || '').toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<SeveridadeIncidencia & { actions?: never }>[] = [
    {
      key: 'codigo_externo',
      label: t('common.externalCode'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigo_externo || '-'}</span>,
    },
    {
      key: 'titulo',
      label: t('incidentSeverity.title'),
      render: (item) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: item.cor || '#888888' }}
          />
          <span className="font-medium">{item.titulo}</span>
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
      key: 'created_at',
      label: t('common.registrationDate'),
      className: 'w-32',
      render: (item) =>
        item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-',
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
      <PageHeader
        title={t('incidentSeverity.pageTitle')}
        description={t('incidentSeverity.pageDescription')}
      />
      <ListActionBar>
        <NewButton
          tooltip={`${t('common.new')} ${t('incidentSeverity.entity')}`}
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
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title={t('common.noResults')}
              description={`${t('common.add')} ${t('incidentSeverity.entity').toLowerCase()}.`}
              icon={Settings}
              onAction={() => setIsModalOpen(true)}
              actionLabel={`${t('common.add')} ${t('incidentSeverity.entity')}`}
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
            emptyDescription={`${t('common.add')} ${t('incidentSeverity.entity').toLowerCase()}.`}
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel={`${t('common.add')} ${t('incidentSeverity.entity')}`}
            renderCard={(item) => (
              <SeveridadeCard
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
            detailTitle="Detalhe da Severidade"
            emptyDetailTitle="Nenhuma severidade selecionada"
            emptyDetailDescription="Clique em uma severidade na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.cor || '#888888' }}
                />
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  {item.titulo}
                </p>
              </div>
            )}
            renderDetail={(item) => (
              <SeveridadeDetailPanel
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
      <SeveridadeIncidenciaFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar(permPath[0], permPath[1], permPath[2])}
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
              {t('common.delete') || 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SeveridadesIncidencia;
