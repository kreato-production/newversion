'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2, ChevronRight, Loader2, TrendingUp, Edit } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { NewButton } from '@/components/shared/NewButton';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';
import { useToast } from '@/hooks/use-toast';
import { useRecordList } from '@/hooks/useRecordNavigation';
import { ORCAMENTO_ROUTES } from '@/modules/financeiro/orcamento.navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiUnidadesRepository } from '@/modules/unidades/unidades.api.repository';
import type { UnidadeNegocio } from '@/modules/unidades/unidades.types';
import { formatCurrency as fmtCurrency } from '@/lib/currencies';
import { ApiOrcamentoRepository, type Orcamento } from '@/modules/financeiro/orcamento.api';
import { useFormListStyle } from '@/hooks/useFormListStyle';

// ─── Constants ────────────────────────────────────────────────────────────────

const repo = new ApiOrcamentoRepository();
const unidadesRepo = new ApiUnidadesRepository();

const STORAGE_KEY = 'kreato_orcamento_table';
const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'ano', label: 'Ano', required: true, defaultVisible: true },
  { key: 'centroLucroNome', label: 'Centro de Lucro', required: true, defaultVisible: true },
  { key: 'descricao', label: 'Descrição', required: false, defaultVisible: true },
  { key: 'total', label: 'Total', required: false, defaultVisible: true },
  { key: 'actions', label: 'Ações', required: true },
];
// ─── Card component ───────────────────────────────────────────────────────────

function OrcamentoCard({
  item,
  onEdit,
  onDelete,
  onDetail,
  moeda,
}: {
  item: Orcamento;
  onEdit: () => void;
  onDelete: () => void;
  onDetail: () => void;
  moeda: string;
}) {
  return (
    <Card
      className="flex flex-col hover:shadow-md transition-shadow cursor-pointer"
      onClick={onDetail}
    >
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">
              {item.centroLucroNome || item.centroLucroId}
            </p>
            {item.descricao && (
              <p className="text-xs text-muted-foreground truncate">{item.descricao}</p>
            )}
          </div>
          <Badge variant="outline" className="shrink-0 text-xs">
            {item.ano}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 flex-1">
        {item.total > 0 && (
          <p className="text-sm font-semibold tabular-nums text-foreground mb-1">
            {fmtCurrency(item.total, moeda)}
          </p>
        )}
        <span className="text-xs text-primary flex items-center gap-1">
          Ver detalhes <ChevronRight className="h-3 w-3" />
        </span>
      </CardContent>
      <CardFooter
        className="px-4 py-2 border-t flex justify-end gap-1"
        onClick={(e) => e.stopPropagation()}
      >
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

// ─── Detail panel (master-detail sidebar) ────────────────────────────────────

function OrcamentoDetailPanel({
  item,
  onEdit,
  onDelete,
  onOpenItems,
}: {
  item: Orcamento;
  onEdit: () => void;
  onDelete: () => void;
  onOpenItems: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-base">{item.centroLucroNome || item.centroLucroId}</h3>
        <Badge variant="outline" className="mt-1">
          {item.ano}
        </Badge>
      </div>
      {item.descricao && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Descrição</p>
            <p className="text-sm">{item.descricao}</p>
          </div>
        </>
      )}
      <Separator />
      <div className="flex flex-col gap-2">
        <Button size="sm" onClick={onOpenItems} className="w-full justify-start gap-2">
          <TrendingUp className="h-3.5 w-3.5" />
          Editar itens do orçamento
        </Button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit} className="flex-1 gap-1.5">
            <Edit className="h-3.5 w-3.5" /> Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

const Orcamento = () => {
  const { stripeColor } = useFormListStyle('orcamento');
  const { t } = useLanguage();
  const { toast } = useToast();

  const [list, setList] = useState<Orcamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moeda, setMoeda] = useState('BRL');

  const [search, setSearch] = useState('');
  const [filterAno, setFilterAno] = useState<string>('todos');

  const { openNew, openRecord } = useRecordList(ORCAMENTO_ROUTES);
  // Keeps the filtered order so the form page can navigate previous/next.
  const openEdit = (item: { id: string }) =>
    openRecord(
      item.id,
      filtered.map((i) => i.id),
    );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<Orcamento | null>(null);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  // Load list + currency of the business unit
  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ data }, unidades] = await Promise.all([
        repo.list({ limit: 500 }),
        unidadesRepo.list().catch((): UnidadeNegocio[] => []),
      ]);
      setList(data);
      if (unidades.length > 0 && unidades[0].moeda) setMoeda(unidades[0].moeda);
    } catch {
      toast({ title: 'Erro ao carregar orçamentos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const anosDisponiveis = useMemo(
    () => [...new Set(list.map((o) => o.ano))].sort((a, b) => b - a),
    [list],
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return list.filter((o) => {
      const matchAno = filterAno === 'todos' || String(o.ano) === filterAno;
      const matchSearch =
        !term ||
        (o.centroLucroNome ?? '').toLowerCase().includes(term) ||
        String(o.ano).includes(term) ||
        (o.descricao ?? '').toLowerCase().includes(term);
      return matchAno && matchSearch;
    });
  }, [list, search, filterAno]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await repo.remove(deletingId);
      toast({ title: 'Orçamento removido' });
      setList((prev) => prev.filter((o) => o.id !== deletingId));
      if (selectedItem?.id === deletingId) setSelectedItem(null);
    } catch {
      toast({ title: 'Erro ao remover', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  // The items are edited on the orçamento page too.
  const openDetail = (o: Orcamento) => openEdit(o);

  const columns: Column<Orcamento & { actions?: never }>[] = [
    {
      key: 'ano',
      label: 'Ano',
      className: 'w-20',
      groupable: true,
      groupValue: (item) => String(item.ano),
      render: (item) => (
        <Badge variant="outline" className="text-xs">
          {item.ano}
        </Badge>
      ),
    },
    {
      key: 'centroLucroNome',
      label: 'Centro de Lucro',
      groupable: true,
      groupValue: (item) => item.centroLucroNome || item.centroLucroId || '(Sem centro)',
      render: (item) => (
        <span className="font-medium">{item.centroLucroNome || item.centroLucroId}</span>
      ),
    },
    {
      key: 'descricao',
      label: 'Descrição',
      render: (item) => (
        <span className="text-muted-foreground text-xs">{item.descricao || '-'}</span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      className: 'text-right tabular-nums',
      render: (item) => (
        <span
          className={`text-sm font-medium tabular-nums ${item.total > 0 ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {item.total > 0 ? fmtCurrency(item.total, moeda) : '-'}
        </span>
      ),
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
            onClick={() => openDetail(item)}
            title="Ver itens"
          >
            <TrendingUp className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeletingId(item.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const tableVisibleKeys = mode === 'list' ? visibleColumnKeys : undefined;

  return (
    <div>
      <PageHeader title={t('orcamento.titulo')} description={t('orcamento.descricao')} />

      <ListActionBar>
        <NewButton tooltip={t('orcamento.novo')} onClick={openNew} />

        {/* Year filter */}
        <Select value={filterAno} onValueChange={setFilterAno}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os anos</SelectItem>
            {anosDisponiveis.map((ano) => (
              <SelectItem key={ano} value={String(ano)}>
                {ano}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar orçamentos..." />
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

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataCard>
          {mode === 'list' ? (
            filtered.length === 0 ? (
              <EmptyState
                title="Nenhum orçamento encontrado"
                description="Crie o primeiro orçamento."
                icon={TrendingUp}
                onAction={openNew}
                actionLabel={t('orcamento.novo')}
              />
            ) : (
              <SortableTable
                stripeColor={stripeColor}
                data={filtered}
                columns={columns}
                getRowKey={(item) => item.id}
                storageKey={STORAGE_KEY}
                visibleColumnKeys={tableVisibleKeys}
              />
            )
          ) : mode === 'cards' ? (
            <CardGrid
              data={filtered}
              getRowKey={(item) => item.id}
              emptyTitle="Nenhum orçamento encontrado"
              emptyDescription="Crie o primeiro orçamento."
              onEmptyAction={openNew}
              emptyActionLabel={t('orcamento.novo')}
              renderCard={(item) => (
                <OrcamentoCard
                  item={item}
                  onEdit={() => openEdit(item)}
                  onDelete={() => setDeletingId(item.id)}
                  onDetail={() => openDetail(item)}
                  moeda={moeda}
                />
              )}
            />
          ) : (
            <MasterDetail<Orcamento>
              data={filtered}
              selectedItem={selectedItem}
              onSelect={(item) => setSelectedItem(item)}
              getRowKey={(item) => item.id}
              detailTitle="Orçamento"
              emptyDetailTitle="Nenhum orçamento selecionado"
              emptyDetailDescription="Selecione um orçamento para ver os detalhes."
              renderRow={(item, isSelected) => (
                <div className={isSelected ? 'opacity-100' : ''}>
                  <p className="font-medium text-sm truncate">
                    {item.centroLucroNome || item.centroLucroId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.ano}
                    {item.descricao ? ` — ${item.descricao}` : ''}
                  </p>
                </div>
              )}
              renderDetail={(item) => (
                <OrcamentoDetailPanel
                  item={item}
                  onEdit={() => openEdit(item)}
                  onDelete={() => setDeletingId(item.id)}
                  onOpenItems={() => openDetail(item)}
                />
              )}
            />
          )}
        </DataCard>
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os itens do orçamento serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Orcamento;
