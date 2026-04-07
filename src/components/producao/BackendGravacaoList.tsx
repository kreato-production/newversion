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
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Video, Calendar, Tag, Building2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { GravacaoBackendFormModal } from './GravacaoBackendFormModal';
import { gravacoesRepository } from '@/modules/gravacoes/gravacoes.repository.provider';
import type { Gravacao, GravacaoInput } from '@/modules/gravacoes/gravacoes.types';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

// ─── Column configuration (drives both table and ColumnSelector) ──────────────

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigo',        label: 'Código',           required: true },
  { key: 'nome',          label: 'Nome',              required: true },
  { key: 'tipoConteudo',  label: 'Tipo',              defaultVisible: true },
  { key: 'classificacao', label: 'Classificação',     defaultVisible: true },
  { key: 'status',        label: 'Status',            defaultVisible: true },
  { key: 'dataPrevista',  label: 'Data Prevista',     defaultVisible: true },
  { key: 'unidadeNegocio',label: 'Unidade de Negócio',defaultVisible: false },
  { key: 'programa',      label: 'Programa',          defaultVisible: false },
  { key: 'centroLucro',   label: 'Centro de Lucro',   defaultVisible: false },
  { key: 'acoes',         label: 'Ações',             required: true },
];

const STORAGE_KEY = 'kreato_gravacoes_backend_table';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value: string | undefined | null) {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Badge variant="outline">Sem status</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

// ─── Card renderer ────────────────────────────────────────────────────────────

function GravacaoCard({
  item,
  onEdit,
  onDelete,
  podeAlterar,
  podeExcluir,
}: {
  item: Gravacao;
  onEdit: () => void;
  onDelete: () => void;
  podeAlterar: boolean;
  podeExcluir: boolean;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
            <p className="text-xs font-mono text-primary mt-0.5">{item.codigo || '-'}</p>
          </div>
          <StatusBadge status={item.status} />
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 space-y-1.5 text-xs text-muted-foreground">
        {item.tipoConteudo && (
          <div className="flex items-center gap-1.5">
            <Tag className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.tipoConteudo}</span>
          </div>
        )}
        {item.unidadeNegocio && (
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.unidadeNegocio}</span>
          </div>
        )}
        {item.dataPrevista && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>{formatDate(item.dataPrevista)}</span>
          </div>
        )}
        {item.classificacao && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground/60">Classif.:</span>
            <span className="truncate">{item.classificacao}</span>
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

function GravacaoDetailPanel({
  item,
  onEdit,
  onDelete,
  podeAlterar,
  podeExcluir,
}: {
  item: Gravacao;
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
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
          <p className="text-xs font-mono text-primary mt-0.5">{item.codigo}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <Separator />

      {/* Fields grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Código Externo', item.codigoExterno)}
        {field('Tipo de Conteúdo', item.tipoConteudo)}
        {field('Classificação', item.classificacao)}
        {field('Unidade de Negócio', item.unidadeNegocio)}
        {field('Centro de Lucro', item.centroLucro)}
        {field('Programa', item.programa)}
        {field('Data Prevista', formatDate(item.dataPrevista))}
        {item.orcamento != null &&
          field(
            'Orçamento',
            item.orcamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
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

      {/* Actions */}
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

export const BackendGravacaoList = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();

  const podeIncluir = canIncluir('Produção', 'Gravação');
  const podeAlterar = canAlterar('Produção', 'Gravação');
  const podeExcluir = canExcluir('Produção', 'Gravação');

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Gravacao | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Gravacao | null>(null);
  const [items, setItems] = useState<Gravacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, isColumnVisible, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      setItems(await gravacoesRepository.list(user?.unidadeIds));
    } catch (error) {
      toast({
        title: t('common.error'),
        description: `Erro ao carregar gravações: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast, t, user?.unidadeIds]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const openEdit = (item: Gravacao) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const openDelete = (id: string) => setDeletingId(id);

  const handleSave = async (input: GravacaoInput) => {
    try {
      await gravacoesRepository.save(input, user?.id);
      toast({
        title: t('common.success'),
        description: editingItem ? 'Gravação atualizada!' : 'Gravação criada!',
      });
      await fetchData();
      setEditingItem(null);
    } catch (error) {
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
      await gravacoesRepository.remove(deletingId);
      toast({ title: t('common.deleted'), description: 'Gravação excluída!' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchData();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: `Erro ao excluir: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigo.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Table columns ──────────────────────────────────────────────────────────

  const columns: Column<Gravacao>[] = [
    {
      key: 'codigo',
      label: 'Código',
      className: 'w-32',
      render: (item) => (
        <span className="font-mono text-sm font-medium text-primary">{item.codigo || '-'}</span>
      ),
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'tipoConteudo',
      label: t('common.type'),
      render: (item) => item.tipoConteudo || '-',
    },
    {
      key: 'classificacao',
      label: t('content.classification'),
      render: (item) => item.classificacao || '-',
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'dataPrevista',
      label: t('recordings.expectedDate'),
      className: 'w-32',
      render: (item) => formatDate(item.dataPrevista),
    },
    {
      key: 'unidadeNegocio',
      label: 'Unidade',
      className: 'hidden lg:table-cell',
      render: (item) => item.unidadeNegocio || '-',
    },
    {
      key: 'programa',
      label: 'Programa',
      className: 'hidden xl:table-cell',
      render: (item) => item.programa || '-',
    },
    {
      key: 'centroLucro',
      label: 'Centro Lucro',
      className: 'hidden xl:table-cell',
      render: (item) => item.centroLucro || '-',
    },
    {
      key: 'acoes',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          {podeAlterar && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => openEdit(item)}
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
          )}
          {podeExcluir && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => openDelete(item.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Only pass visibleColumnKeys in list mode (detail/cards don't use the table)
  const tableVisibleKeys = mode === 'list' ? visibleColumnKeys : undefined;

  // ── Shared empty/loading ───────────────────────────────────────────────────

  const loadingSkeleton = (
    <div className="p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title={t('recordings.title')}
        description="Fluxo principal de gravações migrado para a API própria."
      />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={t('recordings.new')}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          />
        )}
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
        {/* Column selector — only makes sense in list mode */}
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
              title={t('recordings.empty')}
              description="Adicione uma gravação usando o backend próprio."
              icon={Video}
              onAction={() => setIsModalOpen(true)}
              actionLabel={t('recordings.new')}
            />
          ) : (
            <SortableTable
              data={filteredItems}
              columns={columns}
              getRowKey={(item) => item.id}
              storageKey={STORAGE_KEY}
              visibleColumnKeys={tableVisibleKeys}
            />
          )
        ) : mode === 'cards' ? (
          <CardGrid
            data={filteredItems}
            getRowKey={(item) => item.id}
            emptyTitle={t('recordings.empty')}
            emptyDescription="Adicione uma gravação usando o backend próprio."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel={t('recordings.new')}
            renderCard={(item) => (
              <GravacaoCard
                item={item}
                podeAlterar={podeAlterar}
                podeExcluir={podeExcluir}
                onEdit={() => openEdit(item)}
                onDelete={() => openDelete(item.id)}
              />
            )}
          />
        ) : (
          /* detail mode */
          <MasterDetail
            data={filteredItems}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedItem(item)}
            getRowKey={(item) => item.id}
            detailTitle="Detalhe da Gravação"
            emptyDetailTitle="Nenhuma gravação selecionada"
            emptyDetailDescription="Clique em uma gravação na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  {item.nome}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-muted-foreground">{item.codigo}</span>
                  {item.status && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                      {item.status}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <GravacaoDetailPanel
                item={item}
                podeAlterar={podeAlterar}
                podeExcluir={podeExcluir}
                onEdit={() => openEdit(item)}
                onDelete={() => openDelete(item.id)}
              />
            )}
          />
        )}
      </DataCard>

      <GravacaoBackendFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !podeAlterar}
        navigation={(() => {
          const idx = editingItem ? filteredItems.findIndex((i) => i.id === editingItem.id) : -1;
          return idx >= 0
            ? {
                currentIndex: idx,
                total: filteredItems.length,
                onPrevious: () => setEditingItem(filteredItems[idx - 1]),
                onNext: () => setEditingItem(filteredItems[idx + 1]),
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
