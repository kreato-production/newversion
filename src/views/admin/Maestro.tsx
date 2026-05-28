'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
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
import { Edit, Trash2, Zap, Loader2, Play } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  type ColumnConfig,
} from '@/components/listing';
import { MaestroFormModal } from '@/components/admin/MaestroFormModal';
import { ExecResultDialog, type ExecResultPayload } from '@/components/admin/ExecResultDialog';
import {
  MaestroFilterPanel,
  type MaestroFilters,
  EMPTY_MAESTRO_FILTERS,
  countMaestroActiveFilters,
} from '@/components/admin/MaestroFilterPanel';
import {
  ApiMaestroRepository,
  type Maestro,
  type SaveMaestroInput,
} from '@/modules/maestro/maestro.api';

// ─── Constants ────────────────────────────────────────────────────────────────

const repository = new ApiMaestroRepository();
const STORAGE_KEY = 'kreato_maestro_table';

const ESQUEMA_LABEL: Record<string, string> = {
  '1-vez': '1 Vez',
  diario: 'Diário',
  semanal: 'Semanal',
};

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'nome', label: 'Nome', required: true },
  { key: 'tipo', label: 'Tipo', defaultVisible: true },
  { key: 'esquema', label: 'Esquema', defaultVisible: true },
  { key: 'ultimaExecucao', label: 'Última Execução', defaultVisible: true },
  { key: 'proximaExecucao', label: 'Próxima Execução', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'acoes', label: 'Ações', required: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeProximaExecucao(item: Maestro): Date | null {
  if (!item.esquemaTipo || !item.esquemaHoraInicio || item.status !== 'Ativo') return null;

  const [hh, mm] = item.esquemaHoraInicio.split(':').map(Number);
  if (isNaN(hh) || isNaN(mm)) return null;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const candidateToday = new Date(todayMidnight);
  candidateToday.setHours(hh, mm, 0, 0);

  if (item.esquemaTipo === '1-vez') {
    if (!item.esquemaDataInicio) {
      if (item.ultimaExecucao) return null;
      return candidateToday > now ? candidateToday : null;
    }
    if (item.ultimaExecucao) {
      const [sy, sm, sd] = item.esquemaDataInicio.split('-').map(Number);
      if (new Date(item.ultimaExecucao) >= new Date(sy, sm - 1, sd)) return null;
    }
    const [y, m, d] = item.esquemaDataInicio.split('-').map(Number);
    const scheduled = new Date(y, m - 1, d, hh, mm, 0, 0);
    return scheduled > now ? scheduled : null;
  }

  if (item.esquemaTipo === 'diario') {
    const interval = item.esquemaDias ?? 1;
    const start = item.esquemaDataInicio
      ? (() => {
          const [y, m, d] = item.esquemaDataInicio!.split('-').map(Number);
          return new Date(y, m - 1, d);
        })()
      : todayMidnight;
    const diffDays = Math.round((todayMidnight.getTime() - start.getTime()) / 86_400_000);
    const rem = diffDays < 0 ? 0 : diffDays % interval;
    const daysUntil = diffDays < 0 ? -diffDays : rem === 0 ? 0 : interval - rem;
    const next = new Date(todayMidnight.getTime() + daysUntil * 86_400_000);
    next.setHours(hh, mm, 0, 0);
    if (next <= now) next.setTime(next.getTime() + interval * 86_400_000);
    return next;
  }

  if (item.esquemaTipo === 'semanal') {
    const days = item.esquemaDiasSemana ?? [];
    if (days.length === 0) return null;
    const currentDay = todayMidnight.getDay();
    let minDiff = 8;
    for (const day of days) {
      let diff = day - currentDay;
      if (diff < 0) diff += 7;
      if (diff === 0 && candidateToday <= now) diff = 7;
      if (diff < minDiff) minDiff = diff;
    }
    const next = new Date(todayMidnight.getTime() + minDiff * 86_400_000);
    next.setHours(hh, mm, 0, 0);
    return next;
  }

  return null;
}

function formatDateTime(d: Date | string | null): string {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

const MaestroView = () => {
  const { toast } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<MaestroFilters>(EMPTY_MAESTRO_FILTERS);
  const [items, setItems] = useState<Maestro[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Maestro | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [execResult, setExecResult] = useState<ExecResultPayload | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);

  const {
    mode,
    setMode,
    visibleColumnKeys,
    toggleColumn,
    isColumnVisible,
    resetColumns,
    optionalColumns,
  } = useListingView({ storageKey: STORAGE_KEY, defaultMode: 'list', columns: COLUMN_CONFIG });

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await repository.list();
      setItems(res.data);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const handleSave = async (data: SaveMaestroInput) => {
    try {
      await repository.save(data);
      toast({
        title: 'Sucesso',
        description: editingItem ? 'Tarefa actualizada!' : 'Tarefa criada!',
      });
      await fetchData();
      setEditingItem(null);
    } catch (err) {
      toast({
        title: 'Erro',
        description: `Erro ao salvar: ${(err as Error).message}`,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleExecute = async (id: string) => {
    setExecutingId(id);
    try {
      const res = await repository.execute(id);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ultimaExecucao: res.maestro.ultimaExecucao } : i)),
      );
      const payload: ExecResultPayload = {
        resultado: res.resultado,
        erro: res.erro,
        ultimaExecucao: res.maestro.ultimaExecucao,
        sincronizados: res.sincronizados,
      };
      setExecResult(payload);
      setIsResultOpen(true);
    } catch (err) {
      toast({
        title: 'Erro',
        description: `Erro ao executar: ${(err as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setExecutingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await repository.remove(deletingId);
      toast({ title: 'Excluído', description: 'Tarefa removida!' });
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

  // ── Filtering ──────────────────────────────────────────────────────────────

  const moduloOptions = useMemo(
    () => [...new Set(items.map((i) => i.modulo).filter(Boolean) as string[])].sort(),
    [items],
  );

  const filteredItems = useMemo(() => {
    let result = items;
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (i) =>
          i.nome.toLowerCase().includes(q) ||
          (i.codigoExterno ?? '').toLowerCase().includes(q) ||
          (i.tipo ?? '').toLowerCase().includes(q),
      );
    }
    if (filters.status.length) result = result.filter((i) => filters.status.includes(i.status));
    if (filters.esquemaTipo.length)
      result = result.filter((i) => i.esquemaTipo && filters.esquemaTipo.includes(i.esquemaTipo));
    if (filters.modulo.length)
      result = result.filter((i) => i.modulo && filters.modulo.includes(i.modulo));
    return result;
  }, [items, search, filters]);

  const activeFilterCount = countMaestroActiveFilters(filters);

  // ── Table columns ──────────────────────────────────────────────────────────

  const columns = useMemo(
    (): Column<Maestro>[] => [
      ...(isColumnVisible('nome')
        ? [
            {
              key: 'nome' as keyof Maestro,
              label: 'Nome',
              render: (item: Maestro) => (
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.cor ?? '#6366f1' }}
                    />
                    <span className="font-medium text-sm truncate">{item.nome}</span>
                    {item.codigoExterno && (
                      <span className="text-xs text-muted-foreground font-mono shrink-0">
                        [{item.codigoExterno}]
                      </span>
                    )}
                  </div>
                  {item.descricao && (
                    <p className="text-xs text-muted-foreground truncate pl-4">{item.descricao}</p>
                  )}
                </div>
              ),
            },
          ]
        : []),
      ...(isColumnVisible('tipo')
        ? [
            {
              key: 'tipo' as keyof Maestro,
              label: 'Tipo',
              className: 'w-44',
              groupable: true,
              groupValue: (item: Maestro) => item.tipo || '(Sem tipo)',
              render: (item: Maestro) => (
                <span className="text-xs text-muted-foreground">{item.tipo}</span>
              ),
            },
          ]
        : []),
      ...(isColumnVisible('esquema')
        ? [
            {
              key: 'esquemaTipo' as keyof Maestro,
              label: 'Esquema',
              className: 'w-28',
              render: (item: Maestro) =>
                item.esquemaTipo ? (
                  <Badge variant="outline" className="text-xs">
                    {ESQUEMA_LABEL[item.esquemaTipo] ?? item.esquemaTipo}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                ),
            },
          ]
        : []),
      ...(isColumnVisible('ultimaExecucao')
        ? [
            {
              key: 'ultimaExecucao' as keyof Maestro,
              label: 'Última Execução',
              className: 'w-36',
              render: (item: Maestro) => (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {item.ultimaExecucao ? formatDateTime(item.ultimaExecucao) : '—'}
                </span>
              ),
            },
          ]
        : []),
      ...(isColumnVisible('proximaExecucao')
        ? [
            {
              key: 'proximaExecucao' as keyof Maestro,
              label: 'Próxima Execução',
              className: 'w-36',
              sortable: false,
              render: (item: Maestro) => {
                const next = computeProximaExecucao(item);
                if (!next) return <span className="text-xs text-muted-foreground">—</span>;
                const isToday = next.toDateString() === new Date().toDateString();
                return (
                  <span
                    className={`text-xs tabular-nums ${isToday ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                  >
                    {formatDateTime(next)}
                  </span>
                );
              },
            },
          ]
        : []),
      ...(isColumnVisible('status')
        ? [
            {
              key: 'status' as keyof Maestro,
              label: 'Status',
              className: 'w-20',
              groupable: true,
              render: (item: Maestro) => (
                <Badge
                  variant={item.status === 'Ativo' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {item.status}
                </Badge>
              ),
            },
          ]
        : []),
      ...(isColumnVisible('acoes')
        ? [
            {
              key: 'acoes' as keyof Maestro,
              label: 'Ações',
              className: 'w-28',
              sortable: false,
              render: (item: Maestro) => (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 disabled:text-muted-foreground"
                    title={
                      item.status === 'Inativo'
                        ? 'Tarefa inativa não pode ser executada'
                        : 'Executar agora'
                    }
                    disabled={executingId === item.id || item.status === 'Inativo'}
                    onClick={() => void handleExecute(item.id)}
                  >
                    {executingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
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
          ]
        : []),
    ],
    [isColumnVisible, executingId],
  );

  // ── Loading skeleton ───────────────────────────────────────────────────────

  const loadingSkeleton = (
    <div className="p-4 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title="Maestro" description="Gerencie as tarefas automatizadas do sistema" />

      <ListActionBar>
        <NewButton
          tooltip="Nova tarefa"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder="Pesquisar tarefa..." />
        <MaestroFilterPanel
          filters={filters}
          onChange={setFilters}
          resultCount={filteredItems.length}
          moduloOptions={moduloOptions}
        />
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
        ) : filteredItems.length === 0 && !activeFilterCount && !search ? (
          <EmptyState
            title="Nenhuma tarefa automática cadastrada"
            description="Adicione tarefas automáticas para integrar com outros sistemas."
            icon={Zap}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar tarefa"
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhum resultado encontrado"
            description="Tente ajustar os filtros ou termos de pesquisa."
            icon={Zap}
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey={STORAGE_KEY}
          />
        )}
      </DataCard>

      {/* Form modal */}
      <MaestroFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        onExecute={async (id) => {
          const res = await repository.execute(id);
          setItems((prev) =>
            prev.map((i) =>
              i.id === id ? { ...i, ultimaExecucao: res.maestro.ultimaExecucao } : i,
            ),
          );
          const payload: ExecResultPayload = {
            resultado: res.resultado,
            erro: res.erro,
            ultimaExecucao: res.maestro.ultimaExecucao,
          };
          setExecResult(payload);
          setIsResultOpen(true);
          return payload;
        }}
        data={editingItem}
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

      {/* Execution result dialog */}
      <ExecResultDialog
        isOpen={isResultOpen}
        onClose={() => setIsResultOpen(false)}
        result={execResult}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acção não pode ser desfeita. A tarefa será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteConfirm()}
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

export default MaestroView;
