'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Edit, Trash2, Users } from 'lucide-react';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  ListFilterPanel,
  FilterSection,
  SortChip,
  SORT_OPTIONS_NOME_DATA,
  sortSubtitle,
} from '@/components/shared/ListFilter';
import { ExpositorFormModal } from '@/components/eventos/ExpositorFormModal';
import {
  ApiExpositoresRepository,
  type Expositor,
  type SaveExpositorInput,
} from '@/modules/gestao-eventos/expositores.api.repository';
import {
  ApiParametrosRepository,
  type ParametroApiItem,
} from '@/modules/parametros/parametros.api.repository';

const apiRepo = new ApiExpositoresRepository();
const parametrosRepo = new ApiParametrosRepository();
const STORAGE_KEY = 'kreato_expositores_table';

function buildColumnConfig(t: (k: string) => string): ColumnConfig[] {
  return [
    { key: 'logo', label: 'Logo', required: false, defaultVisible: true },
    { key: 'nome', label: 'Nome', required: true },
    { key: 'tipoExpositorNome', label: 'Tipo de Expositor', defaultVisible: true },
    { key: 'tags', label: 'Tags', defaultVisible: true },
    { key: 'contato', label: 'Contato', defaultVisible: true },
    { key: 'created_at', label: t('common.registrationDate'), defaultVisible: false },
    { key: 'actions', label: t('common.actions'), required: true },
  ];
}

// ─── Logo thumbnail ────────────────────────────────────────────────────────────

function LogoThumb({ logo, nome }: { logo: string | null; nome: string }) {
  if (!logo) {
    return (
      <div className="w-8 h-8 rounded border bg-muted/50 flex items-center justify-center">
        <Users className="h-4 w-4 text-muted-foreground opacity-50" />
      </div>
    );
  }
  return (
    <img
      src={logo}
      alt={`Logo ${nome}`}
      className="w-8 h-8 rounded border object-contain bg-white"
    />
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function ExpositorCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Expositor;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-3">
          <LogoThumb logo={item.logo} nome={item.nome} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
              {item.codigoExterno && (
                <span className="text-xs font-mono text-primary shrink-0">
                  {item.codigoExterno}
                </span>
              )}
            </div>
            {item.tipoExpositorNome && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.tipoExpositorNome}</p>
            )}
          </div>
        </div>
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">
                {t}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-2 flex-1 space-y-1">
        {item.contato && <p className="text-xs text-muted-foreground truncate">{item.contato}</p>}
        {item.email && <p className="text-xs text-muted-foreground truncate">{item.email}</p>}
      </CardContent>
      <CardFooter className="px-4 py-2 border-t flex items-center justify-end">
        <div className="flex gap-1">
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
        </div>
      </CardFooter>
    </Card>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function ExpositorDetail({
  item,
  onEdit,
  onDelete,
}: {
  item: Expositor;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <LogoThumb logo={item.logo} nome={item.nome} />
        <div>
          <h3 className="font-semibold text-base">{item.nome}</h3>
          {item.codigoExterno && (
            <p className="text-xs font-mono text-primary mt-0.5">{item.codigoExterno}</p>
          )}
          {item.tipoExpositorNome && (
            <p className="text-xs text-muted-foreground">{item.tipoExpositorNome}</p>
          )}
        </div>
      </div>
      {item.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">
              {t}
            </Badge>
          ))}
        </div>
      )}
      <Separator />
      <div className="space-y-2 text-sm">
        {item.descricao && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Descrição</p>
            <p>{item.descricao}</p>
          </div>
        )}
        {item.contato && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Contato</p>
            <p>{item.contato}</p>
          </div>
        )}
        {item.telefone && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Telefone</p>
            <p>{item.telefone}</p>
          </div>
        )}
        {item.email && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">E-mail</p>
            <p>{item.email}</p>
          </div>
        )}
        {item.instagram && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Instagram</p>
            <p>@{item.instagram}</p>
          </div>
        )}
        {item.facebook && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Facebook</p>
            <p>{item.facebook}</p>
          </div>
        )}
        {item.produtos?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Produtos ({item.produtos.length})</p>
            <div className="space-y-1">
              {item.produtos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs border-b pb-1 last:border-0"
                >
                  <span className="font-medium">{p.nome}</span>
                  {p.preco && <span className="text-muted-foreground">{p.preco}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {item.createdAt && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Data de Cadastro</p>
            <p>{new Date(item.createdAt).toLocaleString('pt-BR')}</p>
          </div>
        )}
        {item.createdBy && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Usuário de Cadastro</p>
            <p>{item.createdBy}</p>
          </div>
        )}
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

// ─── Main ─────────────────────────────────────────────────────────────────────

const Expositores = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { session } = useAuth();
  const { canAlterar } = usePermissions();

  const [search, setSearch] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('');
  const [filterTipoId, setFilterTipoId] = useState('');
  const [tiposExpositor, setTiposExpositor] = useState<ParametroApiItem[]>([]);
  const [items, setItems] = useState<Expositor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Expositor | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Expositor | null>(null);

  const columnConfig = buildColumnConfig(t);
  const {
    mode,
    setMode,
    visibleColumnKeys,
    toggleColumn,
    isColumnVisible,
    resetColumns,
    optionalColumns,
  } = useListingView({ storageKey: STORAGE_KEY, columns: columnConfig });

  const fetchData = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [result, tipos] = await Promise.all([
        apiRepo.list({ limit: 200 }),
        parametrosRepo.list('kreato_tipo_expositor'),
      ]);
      setItems(result.data);
      setTiposExpositor(tipos);
    } catch (err) {
      toast({
        title: 'Erro',
        description: `Erro ao carregar expositores: ${(err as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEdit = (item: Expositor) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };
  const openDelete = (id: string) => setDeletingId(id);

  const handleSave = async (input: SaveExpositorInput) => {
    await apiRepo.save({ ...input, id: editingItem?.id });
    toast({
      title: t('common.success'),
      description: `Expositor ${editingItem ? t('common.updated').toLowerCase() : 'salvo'}!`,
    });
    await fetchData();
    setEditingItem(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await apiRepo.remove(deletingId);
      toast({ title: t('common.deleted'), description: 'Expositor excluído!' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchData();
    } catch (err) {
      toast({
        title: 'Erro',
        description: `Erro ao excluir: ${(err as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const tipoNomeById = (id: string | null) => tiposExpositor.find((t) => t.id === id)?.nome ?? '';

  const filteredItems = (() => {
    const q = search.toLowerCase();
    const result = items.filter((i) => {
      if (filterTipoId && i.tipoExpositorId !== filterTipoId) return false;
      if (!q) return true;
      return (
        i.nome.toLowerCase().includes(q) ||
        (i.codigoExterno ?? '').toLowerCase().includes(q) ||
        (i.contato ?? '').toLowerCase().includes(q) ||
        (i.tipoExpositorNome ?? '').toLowerCase().includes(q) ||
        (i.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      );
    });
    if (filterSortBy === 'nome-asc')
      return [...result].sort((a, b) => a.nome.localeCompare(b.nome));
    if (filterSortBy === 'nome-desc')
      return [...result].sort((a, b) => b.nome.localeCompare(a.nome));
    if (filterSortBy === 'data-asc')
      return [...result].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
    if (filterSortBy === 'data-desc')
      return [...result].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    return result;
  })();

  const columns: Column<Expositor & { actions?: never }>[] = [
    {
      key: 'logo',
      label: 'Logo',
      className: 'w-12',
      sortable: false,
      render: (i) => <LogoThumb logo={i.logo} nome={i.nome} />,
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (i) => <span className="font-medium">{i.nome}</span>,
    },
    {
      key: 'tipoExpositorNome',
      label: 'Tipo de Expositor',
      className: 'hidden md:table-cell',
      groupable: true,
      groupValue: (i) => i.tipoExpositorNome || '(Sem tipo)',
      render: (i) => (
        <span className="text-muted-foreground text-sm">{i.tipoExpositorNome || '-'}</span>
      ),
    },
    {
      key: 'tags',
      label: 'Tags',
      className: 'hidden lg:table-cell',
      groupable: true,
      groupValue: (i) => ((i.tags ?? []).length > 0 ? (i.tags[0] ?? '(Sem tag)') : '(Sem tag)'),
      render: (i) => (
        <div className="flex flex-wrap gap-1">
          {(i.tags ?? []).slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {(i.tags ?? []).length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{i.tags.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'contato',
      label: 'Contato',
      className: 'hidden md:table-cell',
      render: (i) => <span className="text-muted-foreground text-sm">{i.contato || '-'}</span>,
    },
    {
      key: 'created_at',
      label: t('common.registrationDate'),
      className: 'w-32 hidden xl:table-cell',
      render: (i) => (i.createdAt ? new Date(i.createdAt).toLocaleDateString('pt-BR') : '-'),
    },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (i) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(i)}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => openDelete(i.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const tableVisibleKeys = mode === 'list' ? visibleColumnKeys : undefined;

  return (
    <div>
      <PageHeader
        title={t('menu.expositores')}
        description="Gerencie os expositores cadastrados no sistema"
      />

      <ListActionBar>
        <NewButton
          tooltip="Novo Expositor"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
        <ListFilterPanel
          activeCount={(filterSortBy ? 1 : 0) + (filterTipoId ? 1 : 0)}
          resultCount={filteredItems.length}
          onClear={() => {
            setFilterSortBy('');
            setFilterTipoId('');
          }}
          entityLabel="expositores"
        >
          <FilterSection
            title="Tipo de Expositor"
            subtitle={filterTipoId ? tipoNomeById(filterTipoId) : undefined}
            defaultOpen
          >
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterTipoId('')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  !filterTipoId
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                Todos
              </button>
              {tiposExpositor.map((tipo) => (
                <button
                  key={tipo.id}
                  onClick={() => setFilterTipoId(filterTipoId === tipo.id ? '' : tipo.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    filterTipoId === tipo.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {tipo.nome}
                </button>
              ))}
            </div>
          </FilterSection>
          <FilterSection
            title="Ordenar por"
            subtitle={sortSubtitle(filterSortBy, SORT_OPTIONS_NOME_DATA)}
          >
            <SortChip
              value={filterSortBy}
              onChange={setFilterSortBy}
              options={[...SORT_OPTIONS_NOME_DATA]}
            />
          </FilterSection>
        </ListFilterPanel>
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
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title={t('common.noResults')}
              description="Adicione um novo expositor."
              icon={Users}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Novo Expositor"
            />
          ) : (
            <SortableTable
              data={filteredItems}
              columns={columns}
              getRowKey={(i) => i.id}
              storageKey={STORAGE_KEY}
              visibleColumnKeys={tableVisibleKeys}
            />
          )
        ) : mode === 'cards' ? (
          <CardGrid
            data={filteredItems}
            getRowKey={(i) => i.id}
            emptyTitle={t('common.noResults')}
            emptyDescription="Adicione um novo expositor."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Novo Expositor"
            renderCard={(item) => (
              <ExpositorCard
                item={item}
                onEdit={() => openEdit(item)}
                onDelete={() => openDelete(item.id)}
              />
            )}
          />
        ) : (
          <MasterDetail
            data={filteredItems}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedItem(item)}
            getRowKey={(i) => i.id}
            detailTitle="Expositor"
            emptyDetailTitle="Nenhum expositor selecionado"
            emptyDetailDescription="Clique em um item na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  {item.nome}
                </p>
                {item.codigoExterno && (
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {item.codigoExterno}
                  </p>
                )}
                {item.tipoExpositorNome && (
                  <p className="text-xs text-muted-foreground">{item.tipoExpositorNome}</p>
                )}
              </div>
            )}
            renderDetail={(item) => (
              <ExpositorDetail
                item={item}
                onEdit={() => openEdit(item)}
                onDelete={() => openDelete(item.id)}
              />
            )}
          />
        )}
      </DataCard>

      <ExpositorFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar('Gestão de Eventos', 'Expositores', '-')}
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
              Esta ação não pode ser desfeita. O expositor será removido permanentemente.
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

export default Expositores;
