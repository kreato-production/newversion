import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { NewButton } from '@/components/shared/NewButton';
import { Edit, Trash2, Loader2, Radio } from 'lucide-react';
import {
  ListFilterPanel,
  FilterSection,
  MultiChip,
  SortChip,
  chipsSubtitle,
  sortSubtitle,
  SORT_OPTIONS_NOME,
} from '@/components/shared/ListFilter';
import { useToast } from '@/hooks/use-toast';
import { EstadoEventoFormModal } from '@/components/satops/EstadoEventoFormModal';
import { ApiSatOpsRepository } from '@/modules/satops/satops.api.repository';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

export interface EstadoEventoItem {
  id: string;
  codigoExterno: string;
  nome: string;
  cor: string;
  traducoes?: Record<string, string> | null;
  dataCadastro: string;
  usuarioCadastro: string;
}

const repository = new ApiSatOpsRepository();

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno', label: 'Código', defaultVisible: true },
  { key: 'nome', label: 'Nome', required: true },
  { key: 'cor', label: 'Cor', defaultVisible: true },
  { key: 'dataCadastro', label: 'Data Cadastro', defaultVisible: false },
  { key: 'actions', label: 'Ações', required: true },
];

const STORAGE_KEY = 'kreato_satops_estados_evento_table';

// ─── Card ─────────────────────────────────────────────────────────────────────

function EstadoEventoCard({
  item,
  onEdit,
  onDelete,
}: {
  item: EstadoEventoItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-full border border-border shrink-0"
            style={{ backgroundColor: item.cor || '#6b7280' }}
          />
          <div className="min-w-0 flex-1">
            <Badge style={{ backgroundColor: item.cor || '#6b7280' }} className="text-white">
              {item.nome}
            </Badge>
            {item.codigoExterno && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-muted-foreground">{item.cor || '-'}</span>
        </div>
      </CardContent>
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

// ─── Detail panel ─────────────────────────────────────────────────────────────

function EstadoEventoDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: EstadoEventoItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div
          className="h-12 w-12 rounded-full border border-border shrink-0"
          style={{ backgroundColor: item.cor || '#6b7280' }}
        />
        <div className="min-w-0 flex-1">
          <Badge style={{ backgroundColor: item.cor || '#6b7280' }} className="text-white text-sm">
            {item.nome}
          </Badge>
          {item.codigoExterno && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {item.codigoExterno && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Código Externo</p>
            <p className="font-mono">{item.codigoExterno}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Cor</p>
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded border border-border"
              style={{ backgroundColor: item.cor || '#6b7280' }}
            />
            <span className="font-mono text-xs">{item.cor}</span>
          </div>
        </div>
        {item.dataCadastro && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Data de Cadastro</p>
            <p>{new Date(item.dataCadastro).toLocaleDateString('pt-BR')}</p>
          </div>
        )}
        {item.usuarioCadastro && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Usuário de Cadastro</p>
            <p>{item.usuarioCadastro}</p>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex gap-2 flex-wrap">
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

const EstadosEvento = () => {
  const { toast } = useToast();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EstadoEventoItem | null>(null);
  const [items, setItems] = useState<EstadoEventoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<EstadoEventoItem | null>(null);

  const [filterSortBy, setFilterSortBy] = useState('');
  const [filterComCor, setFilterComCor] = useState<string[]>([]);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listEstadosEvento();
      setItems(response.data);
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar estados de evento',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleSave = async (data: EstadoEventoItem) => {
    try {
      await repository.saveEstadoEvento({
        ...(editingItem ? { id: data.id } : {}),
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        cor: data.cor,
        traducoes: data.traducoes,
      });
      toast({
        title: 'Sucesso',
        description: editingItem ? 'Estado atualizado!' : 'Estado cadastrado!',
      });
      await fetchItems();
      setEditingItem(null);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao salvar estado', variant: 'destructive' });
      throw new Error('save failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await repository.removeEstadoEvento(deletingId);
      toast({ title: 'Excluído', description: 'Estado removido com sucesso!' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchItems();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir estado', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const corOptions = [
    { value: 'com-cor', label: 'Com cor' },
    { value: 'sem-cor', label: 'Sem cor' },
  ];

  const activeFilterCount = (filterSortBy ? 1 : 0) + (filterComCor.length ? 1 : 0);
  const clearFilters = () => {
    setFilterSortBy('');
    setFilterComCor([]);
  };

  let filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    if (q && !(item.nome.toLowerCase().includes(q) || item.codigoExterno.toLowerCase().includes(q)))
      return false;
    if (filterComCor.includes('com-cor') && !filterComCor.includes('sem-cor') && !item.cor)
      return false;
    if (filterComCor.includes('sem-cor') && !filterComCor.includes('com-cor') && item.cor)
      return false;
    return true;
  });

  if (filterSortBy === 'nome-asc')
    filteredItems = [...filteredItems].sort((a, b) => a.nome.localeCompare(b.nome));
  else if (filterSortBy === 'nome-desc')
    filteredItems = [...filteredItems].sort((a, b) => b.nome.localeCompare(a.nome));

  const columns: Column<EstadoEventoItem & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: 'Código',
      className: 'w-28',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: 'Nome',
      groupable: true,
      groupValue: (item) => item.nome || '(Sem nome)',
      render: (item) => (
        <Badge style={{ backgroundColor: item.cor || '#6b7280' }} className="text-white">
          {item.nome}
        </Badge>
      ),
    },
    {
      key: 'cor',
      label: 'Cor',
      className: 'w-28',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-border"
            style={{ backgroundColor: item.cor || '#6b7280' }}
          />
          <span className="text-xs font-mono text-muted-foreground">{item.cor || '-'}</span>
        </div>
      ),
    },
    {
      key: 'dataCadastro',
      label: 'Data Cadastro',
      className: 'w-32',
      render: (item) =>
        item.dataCadastro ? new Date(item.dataCadastro).toLocaleDateString('pt-BR') : '-',
    },
    {
      key: 'actions',
      label: 'Ações',
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
        title="Estados de Evento"
        description="Gerencie os estados disponíveis para os eventos SatOps"
      />

      <ListActionBar>
        <NewButton
          tooltip="Novo Estado de Evento"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} />

        <ListFilterPanel
          activeCount={activeFilterCount}
          resultCount={filteredItems.length}
          onClear={clearFilters}
          entityLabel="estados"
        >
          <FilterSection
            title="Ordenar por"
            subtitle={sortSubtitle(filterSortBy, SORT_OPTIONS_NOME)}
            defaultOpen
          >
            <SortChip
              value={filterSortBy}
              onChange={setFilterSortBy}
              options={[...SORT_OPTIONS_NOME]}
            />
          </FilterSection>
          <FilterSection title="Cor" subtitle={chipsSubtitle(filterComCor)}>
            <MultiChip options={corOptions} selected={filterComCor} onChange={setFilterComCor} />
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
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title="Nenhum estado cadastrado"
              description="Comece adicionando estados para organizar os eventos SatOps."
              icon={Radio}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Adicionar Estado"
            />
          ) : (
            <SortableTable
              data={filteredItems}
              columns={columns}
              getRowKey={(item) => item.id}
              storageKey={STORAGE_KEY}
              visibleColumnKeys={mode === 'list' ? visibleColumnKeys : undefined}
            />
          )
        ) : mode === 'cards' ? (
          <CardGrid
            data={filteredItems}
            getRowKey={(item) => item.id}
            emptyTitle="Nenhum estado cadastrado"
            emptyDescription="Comece adicionando estados para organizar os eventos SatOps."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Adicionar Estado"
            renderCard={(item) => (
              <EstadoEventoCard
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
            detailTitle="Detalhe do Estado"
            emptyDetailTitle="Nenhum estado selecionado"
            emptyDetailDescription="Clique em um estado na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <Badge
                  style={{ backgroundColor: item.cor || '#6b7280' }}
                  className={`text-white text-xs ${isSelected ? 'ring-2 ring-offset-1' : ''}`}
                >
                  {item.nome}
                </Badge>
                {item.codigoExterno && (
                  <span className="ml-2 text-xs font-mono text-muted-foreground">
                    {item.codigoExterno}
                  </span>
                )}
              </div>
            )}
            renderDetail={(item) => (
              <EstadoEventoDetailPanel
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

      <EstadoEventoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar('SatOps', 'Parametrizacoes', 'EstadosEvento')}
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
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
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

export default EstadosEvento;
