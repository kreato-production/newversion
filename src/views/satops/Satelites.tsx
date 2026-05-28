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
import { Edit, Trash2, Loader2, Satellite } from 'lucide-react';
import {
  ListFilterPanel,
  FilterSection,
  MultiChip,
  SortChip,
  uniqueChips,
  chipsSubtitle,
  sortSubtitle,
  SORT_OPTIONS_NOME,
} from '@/components/shared/ListFilter';
import { useToast } from '@/hooks/use-toast';
import { SateliteFormModal } from '@/components/satops/SateliteFormModal';
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

export interface SateliteItem {
  id: string;
  codigoExterno: string;
  nome: string;
  transponder: string;
  frequenciaUplink: string;
  polarizacao: string;
  symbolRate: string;
  fec: string;
  aberturaPrevirta?: string;
  fechoPrevirto?: string;
  aberturaReal?: string;
  fechoReal?: string;
  checklist?: unknown;
  traducoes?: Record<string, string> | null;
  dataCadastro: string;
  usuarioCadastro: string;
}

const repository = new ApiSatOpsRepository();

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno', label: 'Código', defaultVisible: true },
  { key: 'nome', label: 'Nome', required: true },
  { key: 'transponder', label: 'Transponder', defaultVisible: true },
  { key: 'frequenciaUplink', label: 'Freq. Uplink', defaultVisible: true },
  { key: 'polarizacao', label: 'Polarização', defaultVisible: true },
  { key: 'symbolRate', label: 'Symbol Rate', defaultVisible: false },
  { key: 'fec', label: 'FEC', defaultVisible: false },
  { key: 'dataCadastro', label: 'Data Cadastro', defaultVisible: false },
  { key: 'actions', label: 'Ações', required: true },
];

const STORAGE_KEY = 'kreato_satops_satelites_table';

// ─── Card ─────────────────────────────────────────────────────────────────────

function SateliteCard({
  item,
  onEdit,
  onDelete,
}: {
  item: SateliteItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{item.nome}</p>
            {item.codigoExterno && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
            )}
          </div>
          {item.polarizacao && (
            <Badge variant="outline" className="text-xs shrink-0">
              {item.polarizacao}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-1 text-xs text-muted-foreground flex-1">
        {item.transponder && (
          <div>
            Transponder: <span className="font-mono">{item.transponder}</span>
          </div>
        )}
        {item.frequenciaUplink && (
          <div>
            Uplink: <span className="font-mono">{item.frequenciaUplink} MHz</span>
          </div>
        )}
        {item.symbolRate && (
          <div>
            Symbol Rate: <span className="font-mono">{item.symbolRate} Msps</span>
          </div>
        )}
        {item.fec && (
          <div>
            FEC: <span className="font-mono">{item.fec}</span>
          </div>
        )}
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

function SateliteDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: SateliteItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const field = (label: string, value: string | undefined | null) =>
    value ? (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-mono">{value}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-base">{item.nome}</h3>
        {item.codigoExterno && (
          <p className="text-xs font-mono text-muted-foreground">{item.codigoExterno}</p>
        )}
      </div>

      <Separator />

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Parâmetros Técnicos
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {field('Transponder', item.transponder)}
          {field('Frequência Uplink (MHz)', item.frequenciaUplink)}
          {field('Polarização', item.polarizacao)}
          {field('Symbol Rate (Msps)', item.symbolRate)}
          {field('FEC', item.fec)}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {item.usuarioCadastro && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Usuário de Cadastro</p>
            <p>{item.usuarioCadastro}</p>
          </div>
        )}
        {item.dataCadastro && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Data de Cadastro</p>
            <p>{new Date(item.dataCadastro).toLocaleDateString('pt-BR')}</p>
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

const Satelites = () => {
  const { toast } = useToast();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SateliteItem | null>(null);
  const [items, setItems] = useState<SateliteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SateliteItem | null>(null);

  const [filterSortBy, setFilterSortBy] = useState('');
  const [filterPolarizacao, setFilterPolarizacao] = useState<string[]>([]);
  const [filterFec, setFilterFec] = useState<string[]>([]);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listSatelites();
      setItems(response.data);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar satélites', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleSave = async (data: SateliteItem) => {
    try {
      await repository.saveSatelite({
        ...(editingItem ? { id: data.id } : {}),
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        transponder: data.transponder,
        frequenciaUplink: data.frequenciaUplink,
        polarizacao: data.polarizacao,
        symbolRate: data.symbolRate,
        fec: data.fec,
        checklist: data.checklist,
        traducoes: data.traducoes,
      });
      toast({
        title: 'Sucesso',
        description: editingItem ? 'Satélite atualizado!' : 'Satélite cadastrado!',
      });
      await fetchItems();
      setEditingItem(null);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao salvar satélite', variant: 'destructive' });
      throw new Error('save failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await repository.removeSatelite(deletingId);
      toast({ title: 'Excluído', description: 'Satélite removido com sucesso!' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchItems();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir satélite', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const polarizacaoOptions = uniqueChips(items, 'polarizacao');
  const fecOptions = uniqueChips(items, 'fec');

  const activeFilterCount =
    (filterSortBy ? 1 : 0) + (filterPolarizacao.length ? 1 : 0) + (filterFec.length ? 1 : 0);

  const clearFilters = () => {
    setFilterSortBy('');
    setFilterPolarizacao([]);
    setFilterFec([]);
  };

  let filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    if (
      q &&
      !(
        item.nome.toLowerCase().includes(q) ||
        item.codigoExterno.toLowerCase().includes(q) ||
        item.transponder.toLowerCase().includes(q)
      )
    )
      return false;
    if (filterPolarizacao.length && !filterPolarizacao.includes(item.polarizacao)) return false;
    if (filterFec.length && !filterFec.includes(item.fec)) return false;
    return true;
  });

  if (filterSortBy === 'nome-asc')
    filteredItems = [...filteredItems].sort((a, b) => a.nome.localeCompare(b.nome));
  else if (filterSortBy === 'nome-desc')
    filteredItems = [...filteredItems].sort((a, b) => b.nome.localeCompare(a.nome));

  const columns: Column<SateliteItem & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: 'Código',
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'transponder',
      label: 'Transponder',
      className: 'w-32',
      render: (item) => <span className="font-mono text-sm">{item.transponder || '-'}</span>,
    },
    {
      key: 'frequenciaUplink',
      label: 'Freq. Uplink',
      className: 'w-32',
      render: (item) =>
        item.frequenciaUplink ? (
          <span className="font-mono text-sm">{item.frequenciaUplink} MHz</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'polarizacao',
      label: 'Polarização',
      className: 'w-28',
      groupable: true,
      groupValue: (item) => item.polarizacao || '(Sem polarização)',
      render: (item) =>
        item.polarizacao ? (
          <Badge variant="outline" className="font-mono text-xs">
            {item.polarizacao}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'symbolRate',
      label: 'Symbol Rate',
      className: 'w-32',
      render: (item) =>
        item.symbolRate ? (
          <span className="font-mono text-sm">{item.symbolRate} Msps</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'fec',
      label: 'FEC',
      className: 'w-20',
      groupable: true,
      groupValue: (item) => item.fec || '(Sem FEC)',
      render: (item) =>
        item.fec ? (
          <Badge variant="secondary" className="font-mono text-xs">
            {item.fec}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
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
        title="Satélites"
        description="Gerencie os satélites e suas janelas de transmissão"
      />

      <ListActionBar>
        <NewButton
          tooltip="Novo Satélite"
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
          entityLabel="satélites"
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
          {polarizacaoOptions.length > 0 && (
            <FilterSection title="Polarização" subtitle={chipsSubtitle(filterPolarizacao)}>
              <MultiChip
                options={polarizacaoOptions}
                selected={filterPolarizacao}
                onChange={setFilterPolarizacao}
              />
            </FilterSection>
          )}
          {fecOptions.length > 0 && (
            <FilterSection title="FEC" subtitle={chipsSubtitle(filterFec)}>
              <MultiChip options={fecOptions} selected={filterFec} onChange={setFilterFec} />
            </FilterSection>
          )}
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
              title="Nenhum satélite cadastrado"
              description="Comece adicionando satélites para configurar as transmissões."
              icon={Satellite}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Adicionar Satélite"
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
            emptyTitle="Nenhum satélite cadastrado"
            emptyDescription="Comece adicionando satélites para configurar as transmissões."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Adicionar Satélite"
            renderCard={(item) => (
              <SateliteCard
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
            detailTitle="Detalhe do Satélite"
            emptyDetailTitle="Nenhum satélite selecionado"
            emptyDetailDescription="Clique em um satélite na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  {item.nome}
                </p>
                {item.transponder && (
                  <span className="text-xs font-mono text-muted-foreground">
                    {item.transponder}
                  </span>
                )}
              </div>
            )}
            renderDetail={(item) => (
              <SateliteDetailPanel
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

      <SateliteFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar('SatOps', 'Satélites', '-')}
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

export default Satelites;
