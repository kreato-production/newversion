import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Edit, Trash2, Loader2, Bell } from 'lucide-react';
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
import { AlertaFormModal, JANELA_TIME_FIELDS } from '@/components/satops/AlertaFormModal';
import { ApiSatOpsRepository, type AlertaApiItem } from '@/modules/satops/satops.api.repository';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const repository = new ApiSatOpsRepository();

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'nome', label: 'Nome', required: true },
  { key: 'tempoParaAlerta', label: 'Tempo para Alerta', defaultVisible: true },
  { key: 'regra', label: 'Regra', defaultVisible: true },
  { key: 'campoReferencia', label: 'Campo de Referência', defaultVisible: true },
  { key: 'dataCadastro', label: 'Data Cadastro', defaultVisible: false },
  { key: 'actions', label: 'Ações', required: true },
];

const STORAGE_KEY = 'kreato_satops_alertas_table';

function fieldLabel(key: string) {
  return JANELA_TIME_FIELDS.find((f) => f.key === key)?.label ?? key;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function AlertaCard({
  item,
  onEdit,
  onDelete,
}: {
  item: AlertaApiItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm leading-tight">{item.nome}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{item.tempoParaAlerta}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 flex-1 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Regra:</span>
          <Badge variant="outline" className="text-xs">
            {item.regra || '-'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Campo:</span>
          <span>{fieldLabel(item.campoReferencia)}</span>
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

function AlertaDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: AlertaApiItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Bell className="h-6 w-6 text-amber-500 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{item.nome}</p>
          <p className="text-xs font-mono text-muted-foreground">{item.tempoParaAlerta}</p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Regra</p>
          <Badge variant="outline">{item.regra || '-'}</Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Campo de Referência</p>
          <p>{fieldLabel(item.campoReferencia)}</p>
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

const Alertas = () => {
  const { toast } = useToast();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AlertaApiItem | null>(null);
  const [items, setItems] = useState<AlertaApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<AlertaApiItem | null>(null);

  const [filterSortBy, setFilterSortBy] = useState('');
  const [filterRegra, setFilterRegra] = useState<string[]>([]);
  const [filterCampo, setFilterCampo] = useState<string[]>([]);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listAlertas();
      setItems(response.data);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar alertas', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleSave = async (data: AlertaApiItem) => {
    try {
      await repository.saveAlerta({
        ...(editingItem ? { id: data.id } : {}),
        nome: data.nome,
        tempoParaAlerta: data.tempoParaAlerta,
        regra: data.regra,
        campoReferencia: data.campoReferencia,
      });
      toast({
        title: 'Sucesso',
        description: editingItem ? 'Alerta atualizado!' : 'Alerta cadastrado!',
      });
      await fetchItems();
      setEditingItem(null);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao salvar alerta', variant: 'destructive' });
      throw new Error('save failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await repository.removeAlerta(deletingId);
      toast({ title: 'Excluído', description: 'Alerta removido com sucesso!' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchItems();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir alerta', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const regraOptions = uniqueChips(items, 'regra');
  const campoOptions = items
    .map((i) => i.campoReferencia)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .map((v) => ({ value: v, label: fieldLabel(v) }));

  const activeFilterCount =
    (filterSortBy ? 1 : 0) + (filterRegra.length ? 1 : 0) + (filterCampo.length ? 1 : 0);

  const clearFilters = () => {
    setFilterSortBy('');
    setFilterRegra([]);
    setFilterCampo([]);
  };

  let filteredItems = items.filter((item) => {
    if (search && !item.nome.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRegra.length && !filterRegra.includes(item.regra)) return false;
    if (filterCampo.length && !filterCampo.includes(item.campoReferencia)) return false;
    return true;
  });

  if (filterSortBy === 'nome-asc')
    filteredItems = [...filteredItems].sort((a, b) => a.nome.localeCompare(b.nome));
  else if (filterSortBy === 'nome-desc')
    filteredItems = [...filteredItems].sort((a, b) => b.nome.localeCompare(a.nome));

  const columns: Column<AlertaApiItem & { actions?: never }>[] = [
    {
      key: 'nome',
      label: 'Nome',
      groupable: true,
      groupValue: (item) => item.nome || '(Sem nome)',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="font-medium text-sm">{item.nome}</span>
        </div>
      ),
    },
    {
      key: 'tempoParaAlerta',
      label: 'Tempo para Alerta',
      className: 'w-36',
      render: (item) => <span className="font-mono text-sm">{item.tempoParaAlerta || '-'}</span>,
    },
    {
      key: 'regra',
      label: 'Regra',
      className: 'w-24',
      render: (item) => (
        <Badge variant="outline" className="text-xs">
          {item.regra || '-'}
        </Badge>
      ),
    },
    {
      key: 'campoReferencia',
      label: 'Campo de Referência',
      className: 'w-44',
      render: (item) => <span className="text-sm">{fieldLabel(item.campoReferencia)}</span>,
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
        title="Alertas"
        description="Configure alertas automáticos para as janelas satelitais"
      />

      <ListActionBar>
        <NewButton
          tooltip="Novo Alerta"
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
          entityLabel="alertas"
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
          {regraOptions.length > 0 && (
            <FilterSection title="Regra" subtitle={chipsSubtitle(filterRegra)}>
              <MultiChip options={regraOptions} selected={filterRegra} onChange={setFilterRegra} />
            </FilterSection>
          )}
          {campoOptions.length > 0 && (
            <FilterSection title="Campo de Referência" subtitle={chipsSubtitle(filterCampo)}>
              <MultiChip options={campoOptions} selected={filterCampo} onChange={setFilterCampo} />
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
              title="Nenhum alerta cadastrado"
              description="Comece adicionando alertas para monitorizar as janelas satelitais."
              icon={Bell}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Adicionar Alerta"
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
            emptyTitle="Nenhum alerta cadastrado"
            emptyDescription="Comece adicionando alertas para monitorizar as janelas satelitais."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Adicionar Alerta"
            renderCard={(item) => (
              <AlertaCard
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
            detailTitle="Detalhe do Alerta"
            emptyDetailTitle="Nenhum alerta selecionado"
            emptyDetailDescription="Clique em um alerta na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <Bell className={`h-4 w-4 text-amber-500 ${isSelected ? 'scale-110' : ''}`} />
                <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>{item.nome}</span>
                <span className="text-xs text-muted-foreground font-mono ml-auto">
                  {item.tempoParaAlerta}
                </span>
              </div>
            )}
            renderDetail={(item) => (
              <AlertaDetailPanel
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

      <AlertaFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar('SatOps', 'Parametrizações', 'Alertas')}
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

export default Alertas;
