import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { Edit, Trash2, Loader2, CalendarDays, Users } from 'lucide-react';
import {
  ListFilterPanel,
  FilterSection,
  MultiChip,
  SortChip,
  DateRangeFilter,
  uniqueChips,
  chipsSubtitle,
  sortSubtitle,
  dateRangeSubtitle,
  SORT_OPTIONS_DATA,
} from '@/components/shared/ListFilter';
import { useToast } from '@/hooks/use-toast';
import { JanelaFormModal } from '@/components/satops/JanelaFormModal';
import { JanelaResponsaveisModal } from '@/components/satops/JanelaResponsaveisModal';
import {
  ApiSatOpsRepository,
  type JanelaApiItem,
  type SateliteApiItem,
} from '@/modules/satops/satops.api.repository';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

const repository = new ApiSatOpsRepository();

// Mapa de satélites indexado por id para lookup rápido
type SateliteMap = Map<string, SateliteApiItem>;

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'sateliteNome', label: 'Satélite', defaultVisible: true },
  { key: 'dataEvento', label: 'Data do Evento', defaultVisible: true },
  { key: 'tipoEvento', label: 'Tipo', defaultVisible: true },
  { key: 'canal', label: 'Canal', defaultVisible: true },
  { key: 'aberturaPrevia', label: 'Abertura Prevista', defaultVisible: true },
  { key: 'fechoPrevisto', label: 'Fecho Previsto', defaultVisible: true },
  // Parâmetros técnicos do satélite
  { key: 'transponder', label: 'Transponder', defaultVisible: false },
  { key: 'frequenciaUplink', label: 'Freq. Uplink', defaultVisible: false },
  { key: 'polarizacao', label: 'Polarização', defaultVisible: false },
  { key: 'symbolRate', label: 'Symbol Rate', defaultVisible: false },
  { key: 'fec', label: 'FEC', defaultVisible: false },
  // Outros
  { key: 'confirmacaoNocNome', label: 'NOC', defaultVisible: false },
  { key: 'dataCadastro', label: 'Data Cadastro', defaultVisible: false },
  { key: 'actions', label: 'Ações', required: true },
];

const STORAGE_KEY = 'kreato_satops_janelas_table';

// ─── Card ─────────────────────────────────────────────────────────────────────

function JanelaCard({
  item,
  onEdit,
  onDelete,
  onResponsaveis,
}: {
  item: JanelaApiItem;
  onEdit: () => void;
  onDelete: () => void;
  onResponsaveis: () => void;
}) {
  const labelEvento =
    item.tipoEvento === 'Grelha de Programas' ? item.programaNome : item.tituloEvento;

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{item.sateliteNome || '—'}</p>
            {item.dataEvento && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(item.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          {item.tipoEvento && (
            <Badge variant="outline" className="text-xs shrink-0">
              {item.tipoEvento === 'Grelha de Programas' ? 'Grelha' : 'Outro'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-1 text-xs text-muted-foreground flex-1">
        {item.canal && (
          <div>
            Canal: <span className="font-medium text-foreground">{item.canal}</span>
          </div>
        )}
        {labelEvento && <div className="truncate">{labelEvento}</div>}
        {(item.aberturaPrevia || item.fechoPrevisto) && (
          <div className="font-mono">
            {item.aberturaPrevia || '??:??'} → {item.fechoPrevisto || '??:??'} UTC
          </div>
        )}
        {item.responsaveis && item.responsaveis.length > 0 && (
          <div>{item.responsaveis.length} responsável(eis)</div>
        )}
      </CardContent>
      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          title="Ver responsáveis"
          onClick={onResponsaveis}
        >
          <Users className="h-3.5 w-3.5" />
        </Button>
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

function JanelaDetailPanel({
  item,
  sateliteMap,
  onEdit,
  onDelete,
  onResponsaveis,
}: {
  item: JanelaApiItem;
  sateliteMap: SateliteMap;
  onEdit: () => void;
  onDelete: () => void;
  onResponsaveis: () => void;
}) {
  const sat = sateliteMap.get(item.sateliteId);

  const field = (label: string, value: string | undefined | null) =>
    value ? (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-base">{item.sateliteNome || '—'}</h3>
        {item.dataEvento && (
          <p className="text-xs text-muted-foreground">
            {new Date(item.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Tipo de Evento', item.tipoEvento)}
        {field('Canal', item.canal)}
        {item.tipoEvento === 'Grelha de Programas'
          ? field('Programa', item.programaNome)
          : field('Título do Evento', item.tituloEvento)}
      </div>

      {sat &&
        (sat.transponder ||
          sat.frequenciaUplink ||
          sat.polarizacao ||
          sat.symbolRate ||
          sat.fec) && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Parâmetros Técnicos do Satélite
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {field('Transponder', sat.transponder)}
                {field('Frequência Uplink (MHz)', sat.frequenciaUplink)}
                {field('Polarização', sat.polarizacao)}
                {field('Symbol Rate (Msps)', sat.symbolRate)}
                {field('FEC', sat.fec)}
              </div>
            </div>
          </>
        )}

      <Separator />

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Abertura da Janela
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {field('Abertura Prevista (UTC)', item.aberturaPrevia)}
          {field('Abertura Real (UTC)', item.aberturaReal)}
          {field('Fecho Previsto (UTC)', item.fechoPrevisto)}
          {field('Fecho Real (UTC)', item.fechoReal)}
          {field('Confirmação NOC', item.confirmacaoNocNome)}
        </div>
      </div>

      {item.responsaveis && item.responsaveis.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Responsáveis ({item.responsaveis.length})
            </p>
            <div className="space-y-1.5">
              {item.responsaveis.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{r.recursoHumanoNome || '—'}</span>
                  {r.disponibilidade && (
                    <Badge variant="secondary" className="text-xs">
                      {r.disponibilidade}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

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
        <Button size="sm" variant="outline" onClick={onResponsaveis}>
          <Users className="h-3.5 w-3.5 mr-1.5" />
          Responsáveis
        </Button>
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

const Janelas = () => {
  const { toast } = useToast();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JanelaApiItem | null>(null);
  const [items, setItems] = useState<JanelaApiItem[]>([]);
  const [sateliteMap, setSateliteMap] = useState<SateliteMap>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<JanelaApiItem | null>(null);
  const [responsaveisJanela, setResponsaveisJanela] = useState<JanelaApiItem | null>(null);

  const [filterSortBy, setFilterSortBy] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterSatelite, setFilterSatelite] = useState<string[]>([]);
  const [filterCanal, setFilterCanal] = useState<string[]>([]);
  const [filterSimulacao, setFilterSimulacao] = useState<string[]>([]);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const [janelasRes, satsRes] = await Promise.all([
        repository.listJanelas(),
        repository.listSatelites(),
      ]);
      setItems(janelasRes.data);
      setSateliteMap(new Map(satsRes.data.map((s) => [s.id, s])));
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar janelas', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleSave = async (data: JanelaApiItem) => {
    try {
      await repository.saveJanela({
        ...(editingItem ? { id: data.id } : {}),
        sateliteId: data.sateliteId,
        sateliteNome: data.sateliteNome,
        dataEvento: data.dataEvento,
        tipoEvento: data.tipoEvento,
        canal: data.canal,
        tituloEvento: data.tituloEvento,
        programaId: data.programaId,
        programaNome: data.programaNome,
        aberturaPrevia: data.aberturaPrevia,
        aberturaReal: data.aberturaReal,
        confirmacaoNocId: data.confirmacaoNocId,
        confirmacaoNocNome: data.confirmacaoNocNome,
        fechoPrevisto: data.fechoPrevisto,
        fechoReal: data.fechoReal,
        responsaveis: data.responsaveis,
        simulacao: data.simulacao,
      });
      toast({
        title: 'Sucesso',
        description: editingItem ? 'Janela atualizada!' : 'Janela cadastrada!',
      });
      await fetchItems();
      setEditingItem(null);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao salvar janela', variant: 'destructive' });
      throw new Error('save failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await repository.removeJanela(deletingId);
      toast({ title: 'Excluído', description: 'Janela removida com sucesso!' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchItems();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir janela', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const sateliteOptions = uniqueChips([...sateliteMap.values()], 'nome');
  const canalOptions = uniqueChips(items, 'canal');
  const simulacaoOptions = [
    { value: 'true', label: 'Simulação' },
    { value: 'false', label: 'Real' },
  ];

  const activeFilterCount =
    (filterSortBy ? 1 : 0) +
    (filterDateFrom || filterDateTo ? 1 : 0) +
    (filterSatelite.length ? 1 : 0) +
    (filterCanal.length ? 1 : 0) +
    (filterSimulacao.length ? 1 : 0);

  const clearFilters = () => {
    setFilterSortBy('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterSatelite([]);
    setFilterCanal([]);
    setFilterSimulacao([]);
  };

  let filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    if (
      q &&
      !(
        (item.sateliteNome || '').toLowerCase().includes(q) ||
        (item.canal || '').toLowerCase().includes(q) ||
        (item.programaNome || '').toLowerCase().includes(q) ||
        (item.tituloEvento || '').toLowerCase().includes(q) ||
        (item.dataEvento || '').includes(q)
      )
    )
      return false;
    if (filterDateFrom && item.dataEvento < filterDateFrom) return false;
    if (filterDateTo && item.dataEvento > filterDateTo) return false;
    if (filterSatelite.length && !filterSatelite.includes(item.sateliteNome || '')) return false;
    if (filterCanal.length && !filterCanal.includes(item.canal || '')) return false;
    if (filterSimulacao.length && !filterSimulacao.includes(String(item.simulacao))) return false;
    return true;
  });

  if (filterSortBy === 'data-desc')
    filteredItems = [...filteredItems].sort((a, b) => b.dataEvento.localeCompare(a.dataEvento));
  else if (filterSortBy === 'data-asc')
    filteredItems = [...filteredItems].sort((a, b) => a.dataEvento.localeCompare(b.dataEvento));

  const formatTime = (t: string) => t || '—';
  const formatDate = (d: string) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

  const getSat = (item: JanelaApiItem) => sateliteMap.get(item.sateliteId);

  const columns: Column<JanelaApiItem & { actions?: never }>[] = [
    {
      key: 'sateliteNome',
      label: 'Satélite',
      render: (item) => <span className="font-medium">{item.sateliteNome || '—'}</span>,
    },
    {
      key: 'dataEvento',
      label: 'Data do Evento',
      className: 'w-32',
      render: (item) => formatDate(item.dataEvento),
    },
    {
      key: 'tipoEvento',
      label: 'Tipo',
      className: 'w-32',
      groupable: true,
      groupValue: (item) => item.tipoEvento || '(Sem tipo)',
      render: (item) =>
        item.tipoEvento ? (
          <Badge variant="outline" className="text-xs">
            {item.tipoEvento === 'Grelha de Programas' ? 'Grelha' : 'Outro'}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'canal',
      label: 'Canal',
      className: 'w-28',
      groupable: true,
      groupValue: (item) => item.canal || '(Sem canal)',
      render: (item) =>
        item.canal ? (
          <Badge variant="secondary" className="text-xs font-mono">
            {item.canal}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'aberturaPrevia',
      label: 'Abertura Prevista',
      className: 'w-32',
      render: (item) => (
        <span className="font-mono text-sm">{formatTime(item.aberturaPrevia)}</span>
      ),
    },
    {
      key: 'fechoPrevisto',
      label: 'Fecho Previsto',
      className: 'w-28',
      render: (item) => <span className="font-mono text-sm">{formatTime(item.fechoPrevisto)}</span>,
    },
    // ── Parâmetros técnicos do satélite ─────────────────────────────────────
    {
      key: 'transponder',
      label: 'Transponder',
      className: 'w-32',
      render: (item) => {
        const v = getSat(item)?.transponder;
        return v ? (
          <span className="font-mono text-sm">{v}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: 'frequenciaUplink',
      label: 'Freq. Uplink',
      className: 'w-32',
      render: (item) => {
        const v = getSat(item)?.frequenciaUplink;
        return v ? (
          <span className="font-mono text-sm">{v} MHz</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: 'polarizacao',
      label: 'Polarização',
      className: 'w-28',
      groupable: true,
      groupValue: (item) => getSat(item)?.polarizacao || '(Sem polarização)',
      render: (item) => {
        const v = getSat(item)?.polarizacao;
        return v ? (
          <Badge variant="outline" className="font-mono text-xs">
            {v}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: 'symbolRate',
      label: 'Symbol Rate',
      className: 'w-32',
      render: (item) => {
        const v = getSat(item)?.symbolRate;
        return v ? (
          <span className="font-mono text-sm">{v} Msps</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: 'fec',
      label: 'FEC',
      className: 'w-20',
      groupable: true,
      groupValue: (item) => getSat(item)?.fec || '(Sem FEC)',
      render: (item) => {
        const v = getSat(item)?.fec;
        return v ? (
          <Badge variant="secondary" className="font-mono text-xs">
            {v}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: 'confirmacaoNocNome',
      label: 'NOC',
      className: 'w-36',
      render: (item) => item.confirmacaoNocNome || <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'dataCadastro',
      label: 'Data Cadastro',
      className: 'w-32',
      render: (item) =>
        item.dataCadastro ? new Date(item.dataCadastro).toLocaleDateString('pt-BR') : '—',
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-32 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title="Ver responsáveis"
            onClick={() => setResponsaveisJanela(item)}
          >
            <Users className="w-3.5 h-3.5" />
          </Button>
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
      <PageHeader title="Janelas" description="Gerencie as janelas de transmissão via satélite" />

      <ListActionBar>
        <NewButton
          tooltip="Nova Janela"
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
          entityLabel="janelas"
        >
          <FilterSection
            title="Ordenar por"
            subtitle={sortSubtitle(filterSortBy, SORT_OPTIONS_DATA)}
            defaultOpen
          >
            <SortChip
              value={filterSortBy}
              onChange={setFilterSortBy}
              options={[...SORT_OPTIONS_DATA]}
            />
          </FilterSection>
          <FilterSection title="Período" subtitle={dateRangeSubtitle(filterDateFrom, filterDateTo)}>
            <DateRangeFilter
              from={filterDateFrom}
              to={filterDateTo}
              onFromChange={setFilterDateFrom}
              onToChange={setFilterDateTo}
            />
          </FilterSection>
          {sateliteOptions.length > 0 && (
            <FilterSection title="Satélite" subtitle={chipsSubtitle(filterSatelite)}>
              <MultiChip
                options={sateliteOptions}
                selected={filterSatelite}
                onChange={setFilterSatelite}
              />
            </FilterSection>
          )}
          {canalOptions.length > 0 && (
            <FilterSection title="Canal" subtitle={chipsSubtitle(filterCanal)}>
              <MultiChip options={canalOptions} selected={filterCanal} onChange={setFilterCanal} />
            </FilterSection>
          )}
          <FilterSection title="Tipo" subtitle={chipsSubtitle(filterSimulacao)}>
            <MultiChip
              options={simulacaoOptions}
              selected={filterSimulacao}
              onChange={setFilterSimulacao}
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
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title="Nenhuma janela cadastrada"
              description="Comece adicionando janelas de transmissão via satélite."
              icon={CalendarDays}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Adicionar Janela"
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
            emptyTitle="Nenhuma janela cadastrada"
            emptyDescription="Comece adicionando janelas de transmissão via satélite."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Adicionar Janela"
            renderCard={(item) => (
              <JanelaCard
                item={item}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
                onResponsaveis={() => setResponsaveisJanela(item)}
              />
            )}
          />
        ) : (
          <MasterDetail
            data={filteredItems}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedItem(item)}
            getRowKey={(item) => item.id}
            detailTitle="Detalhe da Janela"
            emptyDetailTitle="Nenhuma janela selecionada"
            emptyDetailDescription="Clique em uma janela na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  {item.sateliteNome || '—'}
                </p>
                {item.dataEvento && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            )}
            renderDetail={(item) => (
              <JanelaDetailPanel
                item={item}
                sateliteMap={sateliteMap}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
                onResponsaveis={() => setResponsaveisJanela(item)}
              />
            )}
          />
        )}
      </DataCard>

      <JanelaFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar('SatOps', 'Janelas', '-')}
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

      <JanelaResponsaveisModal
        janela={responsaveisJanela}
        isOpen={responsaveisJanela !== null}
        onClose={() => setResponsaveisJanela(null)}
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

export default Janelas;
