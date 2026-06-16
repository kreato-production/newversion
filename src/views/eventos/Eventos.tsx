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
import { Edit, Trash2, CalendarDays, MapPin } from 'lucide-react';
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
import { EventoFormModal } from '@/components/eventos/EventoFormModal';
import {
  ApiEventosRepository,
  type Evento,
  type SaveEventoInput,
} from '@/modules/gestao-eventos/gestao-eventos.api.repository';
import {
  ApiParametrosRepository,
  type ParametroApiItem,
} from '@/modules/parametros/parametros.api.repository';

const apiRepo = new ApiEventosRepository();
const parametrosRepo = new ApiParametrosRepository();
const STORAGE_KEY = 'kreato_eventos_table';

function buildColumnConfig(t: (k: string) => string): ColumnConfig[] {
  return [
    { key: 'codigoExterno', label: t('common.code'), required: false, defaultVisible: true },
    { key: 'nome', label: 'Nome do Evento', required: true },
    { key: 'tipoEvento', label: 'Tipo de Evento', defaultVisible: true },
    { key: 'inicioEvento', label: 'Início', defaultVisible: true },
    { key: 'fimEvento', label: 'Fim', defaultVisible: false },
    { key: 'local', label: 'Local', defaultVisible: true },
    { key: 'tags', label: 'Tags', defaultVisible: true },
    { key: 'publicoEstimado', label: 'Público Est.', defaultVisible: false },
    { key: 'created_at', label: t('common.registrationDate'), defaultVisible: false },
    { key: 'actions', label: t('common.actions'), required: true },
  ];
}

function formatDatetime(iso: string | null | undefined) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function EventoCard({
  item,
  tipoNome,
  onEdit,
  onDelete,
}: {
  item: Evento;
  tipoNome: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-snug">{item.nome}</p>
          {item.codigoExterno && (
            <span className="text-xs font-mono text-primary shrink-0">{item.codigoExterno}</span>
          )}
        </div>
        {tipoNome && (
          <Badge variant="outline" className="text-xs font-normal w-fit mt-1">
            {tipoNome}
          </Badge>
        )}
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
        {item.inicioEvento && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {formatDatetime(item.inicioEvento)}
          </p>
        )}
        {item.local && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            {item.local}
          </p>
        )}
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

function EventoDetail({
  item,
  tipoNome,
  onEdit,
  onDelete,
}: {
  item: Evento;
  tipoNome: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base">{item.nome}</h3>
          {item.codigoExterno && (
            <p className="text-xs font-mono text-primary mt-0.5">{item.codigoExterno}</p>
          )}
        </div>
      </div>
      {tipoNome && (
        <Badge variant="outline" className="text-xs font-normal w-fit">
          {tipoNome}
        </Badge>
      )}
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
        {item.inicioEvento && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Início</p>
            <p>{formatDatetime(item.inicioEvento)}</p>
          </div>
        )}
        {item.fimEvento && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Fim</p>
            <p>{formatDatetime(item.fimEvento)}</p>
          </div>
        )}
        {item.local && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Local</p>
            <p>{item.local}</p>
          </div>
        )}
        {item.publicoEstimado && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Público Estimado</p>
            <p>{item.publicoEstimado}</p>
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

const Eventos = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { session } = useAuth();
  const { canAlterar } = usePermissions();

  const [search, setSearch] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('');
  const [filterTipoEventoId, setFilterTipoEventoId] = useState('');
  const [tiposEvento, setTiposEvento] = useState<ParametroApiItem[]>([]);
  const [items, setItems] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Evento | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Evento | null>(null);

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
        parametrosRepo.list('kreato_tipo_evento'),
      ]);
      setItems(result.data);
      setTiposEvento(tipos);
    } catch (err) {
      toast({
        title: 'Erro',
        description: `Erro ao carregar eventos: ${(err as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEdit = (item: Evento) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };
  const openDelete = (id: string) => setDeletingId(id);

  const handleSave = async (input: SaveEventoInput) => {
    await apiRepo.save({ ...input, id: editingItem?.id });
    toast({
      title: t('common.success'),
      description: `Evento ${editingItem ? t('common.updated').toLowerCase() : 'salvo'}!`,
    });
    await fetchData();
    setEditingItem(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await apiRepo.remove(deletingId);
      toast({ title: t('common.deleted'), description: 'Evento excluído!' });
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

  const tipoNomeById = (id: string | null | undefined) =>
    tiposEvento.find((t) => t.id === id)?.nome ?? '';

  const filteredItems = (() => {
    const q = search.toLowerCase();
    let result = items.filter(
      (i) =>
        i.nome.toLowerCase().includes(q) ||
        (i.codigoExterno ?? '').toLowerCase().includes(q) ||
        (i.local ?? '').toLowerCase().includes(q) ||
        tipoNomeById(i.tipoEventoId).toLowerCase().includes(q) ||
        (i.tags ?? []).some((tag) => tag.toLowerCase().includes(q)),
    );
    if (filterTipoEventoId) result = result.filter((i) => i.tipoEventoId === filterTipoEventoId);
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

  const columns: Column<Evento & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: t('common.code'),
      className: 'w-24',
      render: (i) => <span className="font-mono text-sm">{i.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: 'Nome do Evento',
      render: (i) => <span className="font-medium">{i.nome}</span>,
    },
    {
      key: 'tipoEvento',
      label: 'Tipo de Evento',
      className: 'hidden md:table-cell w-40',
      groupable: true,
      groupValue: (i) => tipoNomeById(i.tipoEventoId) || '(Sem tipo)',
      render: (i) => {
        const nome = tipoNomeById(i.tipoEventoId);
        return nome ? (
          <Badge variant="outline" className="text-xs font-normal">
            {nome}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      key: 'inicioEvento',
      label: 'Início',
      className: 'w-36',
      groupable: true,
      groupValue: (i) => {
        if (!i.inicioEvento) return '(Sem data)';
        const d = new Date(i.inicioEvento);
        return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      },
      render: (i) => <span className="text-sm">{formatDatetime(i.inicioEvento)}</span>,
    },
    {
      key: 'fimEvento',
      label: 'Fim',
      className: 'w-36 hidden md:table-cell',
      render: (i) => <span className="text-sm">{formatDatetime(i.fimEvento)}</span>,
    },
    {
      key: 'local',
      label: 'Local',
      className: 'hidden md:table-cell',
      groupable: true,
      groupValue: (i) => i.local || '(Sem local)',
      render: (i) => (
        <span className="text-muted-foreground truncate block max-w-[180px]">{i.local || '-'}</span>
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
      key: 'publicoEstimado',
      label: 'Público Est.',
      className: 'hidden xl:table-cell w-28 text-right',
      render: (i) => <span className="text-sm">{i.publicoEstimado || '-'}</span>,
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
      <PageHeader title="Eventos" description="Gerencie os eventos cadastrados no sistema" />

      <ListActionBar>
        <NewButton
          tooltip="Novo Evento"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
        <ListFilterPanel
          activeCount={(filterSortBy ? 1 : 0) + (filterTipoEventoId ? 1 : 0)}
          resultCount={filteredItems.length}
          onClear={() => {
            setFilterSortBy('');
            setFilterTipoEventoId('');
          }}
          entityLabel="eventos"
        >
          <FilterSection
            title="Tipo de Evento"
            subtitle={tipoNomeById(filterTipoEventoId) || undefined}
            defaultOpen
          >
            <div className="flex flex-col gap-1">
              <button
                className={`text-left text-sm px-2 py-1 rounded hover:bg-muted transition-colors ${!filterTipoEventoId ? 'font-medium text-primary' : 'text-muted-foreground'}`}
                onClick={() => setFilterTipoEventoId('')}
              >
                Todos
              </button>
              {tiposEvento.map((tipo) => (
                <button
                  key={tipo.id}
                  className={`text-left text-sm px-2 py-1 rounded hover:bg-muted transition-colors ${filterTipoEventoId === tipo.id ? 'font-medium text-primary' : 'text-muted-foreground'}`}
                  onClick={() => setFilterTipoEventoId(tipo.id)}
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
              description="Adicione um novo evento."
              icon={CalendarDays}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Novo Evento"
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
            emptyDescription="Adicione um novo evento."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Novo Evento"
            renderCard={(item) => (
              <EventoCard
                item={item}
                tipoNome={tipoNomeById(item.tipoEventoId)}
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
            detailTitle="Evento"
            emptyDetailTitle="Nenhum evento selecionado"
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
              </div>
            )}
            renderDetail={(item) => (
              <EventoDetail
                item={item}
                tipoNome={tipoNomeById(item.tipoEventoId)}
                onEdit={() => openEdit(item)}
                onDelete={() => openDelete(item.id)}
              />
            )}
          />
        )}
      </DataCard>

      <EventoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar('Gestão de Eventos', 'Eventos', '-')}
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
              Esta ação não pode ser desfeita. O evento será removido permanentemente.
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

export default Eventos;
