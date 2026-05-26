'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageHeader, DataCard, SearchBar } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, CheckCheck, CalendarCheck, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ApiGrelhaProgramacaoRepository,
  type GrelhaProgramaItem,
} from '@/modules/producao/grelha-programacao.api';
import {
  ApiParametrizacoesRepository,
  type StatusPlaneamentoApiItem,
} from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { GrelhaCalendarView } from '@/components/producao/GrelhaCalendarView';
import {
  GrelhaFilterPanel,
  type GrelhaFilters,
  EMPTY_GRELHA_FILTERS,
  countGrelhaActiveFilters,
} from '@/components/producao/GrelhaFilterPanel';
import { GrelhaPlanearModal } from '@/components/producao/GrelhaPlanearModal';
import { GravacaoBackendFormModal } from '@/components/producao/GravacaoBackendFormModal';
import { ApiGravacoesRepository } from '@/modules/gravacoes/gravacoes.api.repository';
import type { Gravacao } from '@/modules/gravacoes/gravacoes.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

// ─── Constants ────────────────────────────────────────────────────────────────

const repository = new ApiGrelhaProgramacaoRepository();
const parametrizacoesRepo = new ApiParametrizacoesRepository();
const gravacoesRepo = new ApiGravacoesRepository();

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const STORAGE_KEY = 'kreato_grelha_programacao';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'temAlteracao', label: 'Alerta', required: true },
  { key: 'serie', label: 'Série', defaultVisible: false },
  { key: 'idPrograma', label: 'Id Programa', defaultVisible: false },
  { key: 'programa', label: 'Programa', defaultVisible: false },
  { key: 'tipoRequisicao', label: 'Tipo Req.', defaultVisible: false },
  { key: 'genero', label: 'Género', defaultVisible: false },
  { key: 'codigoProducao', label: 'Cód. Produção', defaultVisible: false },
  { key: 'tipoAquisicao', label: 'Aquisição', defaultVisible: false },
  { key: 'nome', label: 'Nome', required: true },
  { key: 'tipoPrograma', label: 'Tipo Programa', defaultVisible: false },
  { key: 'categoria', label: 'Categoria', defaultVisible: false },
  { key: 'canal', label: 'Canal', defaultVisible: true },
  { key: 'semana', label: 'Semana', defaultVisible: false },
  { key: 'tipoExibicao', label: 'Tipo Exibição', defaultVisible: false },
  { key: 'episodio', label: 'Episódio', defaultVisible: false },
  { key: 'dataExibicao', label: 'Data', required: true },
  { key: 'horarioInicio', label: 'Hora Início', defaultVisible: true },
  { key: 'duracao', label: 'Duração', defaultVisible: true },
  { key: 'statusGrelha', label: 'Status Grelha', defaultVisible: true },
  { key: 'statusPlaneamento', label: 'Planeamento', defaultVisible: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(val: string | null): string {
  if (!val) return '-';
  const p = val.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : val;
}

function unique(arr: (string | null | undefined)[]): string[] {
  return [...new Set(arr.filter(Boolean))] as string[];
}

// ─── StatusPlaneamentoBadge ───────────────────────────────────────────────────

function StatusPlaneamentoBadge({
  item,
  statuses,
  onUpdate,
}: {
  item: GrelhaProgramaItem;
  statuses: StatusPlaneamentoApiItem[];
  onUpdate: (statusId: string | null) => void;
}) {
  return (
    <Select
      value={item.statusPlaneamentoId ?? '__none__'}
      onValueChange={(v) => onUpdate(v === '__none__' ? null : v)}
    >
      <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 w-36 focus:ring-0">
        <SelectValue>
          {item.statusPlaneamentoNome ? (
            <Badge
              className="text-xs text-white"
              style={{ backgroundColor: item.statusPlaneamentoCor ?? '#6b7280' }}
            >
              {item.statusPlaneamentoNome}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">Sem status</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">
          <span className="text-muted-foreground">Sem status</span>
        </SelectItem>
        {statuses.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.cor }} />
              {s.nome}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── AlteracaoBadge ───────────────────────────────────────────────────────────

function AlteracaoBadge({ item, onConfirm }: { item: GrelhaProgramaItem; onConfirm: () => void }) {
  if (!item.temAlteracao) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            className="text-yellow-500 hover:text-yellow-600"
          >
            <AlertTriangle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs space-y-1">
          <p className="font-semibold text-yellow-500">Alteração detectada</p>
          {item.prevDataExibicao && item.prevDataExibicao !== item.dataExibicao && (
            <p>
              Data: {formatDate(item.prevDataExibicao)} → {formatDate(item.dataExibicao)}
            </p>
          )}
          {item.prevHorarioInicio && item.prevHorarioInicio !== item.horarioInicio && (
            <p>
              Horário: {item.prevHorarioInicio} → {item.horarioInicio}
            </p>
          )}
          {item.prevDuracao && item.prevDuracao !== item.duracao && (
            <p>
              Duração: {item.prevDuracao} → {item.duracao}
            </p>
          )}
          {item.prevEpisodio && item.prevEpisodio !== item.episodio && (
            <p>
              Episódio: {item.prevEpisodio} → {item.episodio ?? '-'}
            </p>
          )}
          <p className="text-muted-foreground">Clique para confirmar</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Card view ────────────────────────────────────────────────────────────────

function GrelhaProgramaCard({
  item,
  statuses,
  onOpen,
  onUpdateStatus,
  onConfirmAlteracao,
}: {
  item: GrelhaProgramaItem;
  statuses: StatusPlaneamentoApiItem[];
  onOpen: () => void;
  onUpdateStatus: (statusId: string | null) => void;
  onConfirmAlteracao: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={onOpen} className="text-left min-w-0 flex-1">
            <p className="font-medium text-sm leading-snug line-clamp-2 hover:underline">
              {item.nome}
            </p>
            {item.serie && <p className="text-xs text-muted-foreground mt-0.5">{item.serie}</p>}
          </button>
          {item.temAlteracao && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfirmAlteracao();
              }}
              className="text-yellow-500 hover:text-yellow-600 shrink-0"
            >
              <AlertTriangle className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {item.dataExibicao && <span>{formatDate(item.dataExibicao)}</span>}
          {item.horarioInicio && <span>{item.horarioInicio}</span>}
          {item.duracao && <span>{item.duracao}</span>}
          {item.canal && <span className="font-medium text-foreground">{item.canal}</span>}
        </div>
        {item.statusGrelha && (
          <span className="text-xs text-muted-foreground">{item.statusGrelha}</span>
        )}
        <StatusPlaneamentoBadge item={item} statuses={statuses} onUpdate={onUpdateStatus} />
      </CardContent>
    </Card>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function GrelhaDetailPanel({
  item,
  statuses,
  onUpdateStatus,
  onConfirmAlteracao,
}: {
  item: GrelhaProgramaItem;
  statuses: StatusPlaneamentoApiItem[];
  onUpdateStatus: (statusId: string | null) => void;
  onConfirmAlteracao: () => void;
}) {
  const field = (label: string, value: string | null | undefined) =>
    value ? (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
          {item.serie && <p className="text-xs text-muted-foreground mt-0.5">{item.serie}</p>}
        </div>
        {item.temAlteracao && (
          <button
            type="button"
            onClick={onConfirmAlteracao}
            className="text-yellow-500 hover:text-yellow-600 shrink-0"
          >
            <AlertTriangle className="h-4 w-4" />
          </button>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Data', formatDate(item.dataExibicao))}
        {field('Hora Início', item.horarioInicio)}
        {field('Duração', item.duracao)}
        {field('Canal', item.canal)}
        {field('Série', item.serie)}
        {field('Programa', item.programa)}
        {field('Género', item.genero)}
        {field('Tipo Exibição', item.tipoExibicao)}
        {field('Tipo Aquisição', item.tipoAquisicao)}
        {field('Episódio', item.episodio)}
        {field('Categoria', item.categoria)}
        {field('Semana', item.semana)}
        {field('Status Grelha', item.statusGrelha)}
        {field('Cód. Produção', item.codigoProducao)}
        {field('Id Programa', item.idPrograma)}
      </div>

      {item.temAlteracao && (
        <>
          <Separator />
          <div className="rounded-md border border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-3 text-xs space-y-1">
            <p className="font-semibold text-yellow-600 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Alteração detectada
            </p>
            {item.prevDataExibicao && item.prevDataExibicao !== item.dataExibicao && (
              <p>
                Data:{' '}
                <span className="line-through text-muted-foreground">
                  {formatDate(item.prevDataExibicao)}
                </span>{' '}
                → {formatDate(item.dataExibicao)}
              </p>
            )}
            {item.prevHorarioInicio && item.prevHorarioInicio !== item.horarioInicio && (
              <p>
                Horário:{' '}
                <span className="line-through text-muted-foreground">{item.prevHorarioInicio}</span>{' '}
                → {item.horarioInicio}
              </p>
            )}
            {item.prevDuracao && item.prevDuracao !== item.duracao && (
              <p>
                Duração:{' '}
                <span className="line-through text-muted-foreground">{item.prevDuracao}</span> →{' '}
                {item.duracao}
              </p>
            )}
            {item.prevEpisodio && item.prevEpisodio !== item.episodio && (
              <p>
                Episódio:{' '}
                <span className="line-through text-muted-foreground">{item.prevEpisodio}</span> →{' '}
                {item.episodio ?? '-'}
              </p>
            )}
          </div>
        </>
      )}

      <Separator />

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Status de Planeamento</p>
        <StatusPlaneamentoBadge item={item} statuses={statuses} onUpdate={onUpdateStatus} />
      </div>

      {item.temAlteracao && (
        <Button size="sm" variant="outline" onClick={onConfirmAlteracao}>
          <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
          Confirmar alteração
        </Button>
      )}
    </div>
  );
}

// ─── Detail dialog (for list/cards click) ────────────────────────────────────

function ItemDetailDialog({
  item,
  statuses,
  onClose,
  onUpdateStatus,
  onConfirmAlteracao,
}: {
  item: GrelhaProgramaItem | null;
  statuses: StatusPlaneamentoApiItem[];
  onClose: () => void;
  onUpdateStatus: (id: string, statusId: string | null) => void;
  onConfirmAlteracao: (id: string) => void;
}) {
  if (!item) return null;
  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.temAlteracao && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
            {item.nome}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {item.serie && (
            <div>
              <p className="text-xs text-muted-foreground">Série</p>
              <p>{item.serie}</p>
            </div>
          )}
          {item.programa && (
            <div>
              <p className="text-xs text-muted-foreground">Programa</p>
              <p>{item.programa}</p>
            </div>
          )}
          {item.dataExibicao && (
            <div>
              <p className="text-xs text-muted-foreground">Data</p>
              <p>{formatDate(item.dataExibicao)}</p>
            </div>
          )}
          {item.horarioInicio && (
            <div>
              <p className="text-xs text-muted-foreground">Horário</p>
              <p>{item.horarioInicio}</p>
            </div>
          )}
          {item.canal && (
            <div>
              <p className="text-xs text-muted-foreground">Canal</p>
              <p>{item.canal}</p>
            </div>
          )}
          {item.duracao && (
            <div>
              <p className="text-xs text-muted-foreground">Duração</p>
              <p>{item.duracao}</p>
            </div>
          )}
          {item.tipoPrograma && (
            <div>
              <p className="text-xs text-muted-foreground">Tipo</p>
              <p>{item.tipoPrograma}</p>
            </div>
          )}
          {item.genero && (
            <div>
              <p className="text-xs text-muted-foreground">Género</p>
              <p>{item.genero}</p>
            </div>
          )}
          {item.tipoAquisicao && (
            <div>
              <p className="text-xs text-muted-foreground">Aquisição</p>
              <p>{item.tipoAquisicao}</p>
            </div>
          )}
          {item.tipoExibicao && (
            <div>
              <p className="text-xs text-muted-foreground">Exibição</p>
              <p>{item.tipoExibicao}</p>
            </div>
          )}
          {item.episodio && (
            <div>
              <p className="text-xs text-muted-foreground">Episódio</p>
              <p>{item.episodio}</p>
            </div>
          )}
          {item.categoria && (
            <div>
              <p className="text-xs text-muted-foreground">Categoria</p>
              <p>{item.categoria}</p>
            </div>
          )}
          {item.codigoProducao && (
            <div>
              <p className="text-xs text-muted-foreground">Cód. Produção</p>
              <p>{item.codigoProducao}</p>
            </div>
          )}
          {item.statusGrelha && (
            <div>
              <p className="text-xs text-muted-foreground">Status Grelha</p>
              <p>{item.statusGrelha}</p>
            </div>
          )}
          {item.temAlteracao && (
            <div className="col-span-2 rounded-md border border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-3 text-xs space-y-1">
              <p className="font-semibold text-yellow-600 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Alteração detectada
              </p>
              {item.prevDataExibicao && item.prevDataExibicao !== item.dataExibicao && (
                <p>
                  Data:{' '}
                  <span className="line-through text-muted-foreground">
                    {formatDate(item.prevDataExibicao)}
                  </span>{' '}
                  → {formatDate(item.dataExibicao)}
                </p>
              )}
              {item.prevHorarioInicio && item.prevHorarioInicio !== item.horarioInicio && (
                <p>
                  Horário:{' '}
                  <span className="line-through text-muted-foreground">
                    {item.prevHorarioInicio}
                  </span>{' '}
                  → {item.horarioInicio}
                </p>
              )}
              {item.prevDuracao && item.prevDuracao !== item.duracao && (
                <p>
                  Duração:{' '}
                  <span className="line-through text-muted-foreground">{item.prevDuracao}</span> →{' '}
                  {item.duracao}
                </p>
              )}
              {item.prevEpisodio && item.prevEpisodio !== item.episodio && (
                <p>
                  Episódio:{' '}
                  <span className="line-through text-muted-foreground">{item.prevEpisodio}</span> →{' '}
                  {item.episodio ?? '-'}
                </p>
              )}
            </div>
          )}
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Status de Planeamento</p>
            <StatusPlaneamentoBadge
              item={item}
              statuses={statuses}
              onUpdate={(sid) => onUpdateStatus(item.id, sid)}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          {item.temAlteracao && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onConfirmAlteracao(item.id);
                onClose();
              }}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              Confirmar alteração
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const GrelhaProgramacao = () => {
  const { toast } = useToast();
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<GrelhaFilters>(EMPTY_GRELHA_FILTERS);
  const [items, setItems] = useState<GrelhaProgramaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statuses, setStatuses] = useState<StatusPlaneamentoApiItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GrelhaProgramaItem | null>(null);
  const [confirmingAlteracaoId, setConfirmingAlteracaoId] = useState<string | null>(null);
  const [planeandoItem, setPlaneandoItem] = useState<GrelhaProgramaItem | null>(null);
  const [viewGravacaoId, setViewGravacaoId] = useState<string | null>(null);
  const [viewGravacao, setViewGravacao] = useState<Gravacao | null>(null);

  const {
    mode,
    setMode,
    visibleColumnKeys,
    isColumnVisible,
    toggleColumn,
    resetColumns,
    optionalColumns,
  } = useListingView({ storageKey: STORAGE_KEY, defaultMode: 'list', columns: COLUMN_CONFIG });

  // ── Derived option lists from loaded data ──────────────────────────────────

  const uniqueCanais = useMemo(() => unique(items.map((i) => i.canal)).sort(), [items]);
  const statusGrelhaOptions = useMemo(
    () => unique(items.map((i) => i.statusGrelha)).sort(),
    [items],
  );
  const tipoExibicaoOptions = useMemo(
    () => unique(items.map((i) => i.tipoExibicao)).sort(),
    [items],
  );
  const tipoAquisicaoOptions = useMemo(
    () => unique(items.map((i) => i.tipoAquisicao)).sort(),
    [items],
  );
  const semanaOptions = useMemo(
    () => unique(items.map((i) => i.semana)).sort((a, b) => Number(a) - Number(b)),
    [items],
  );

  // ── Filtered + sorted items ────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    let result = items;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.nome?.toLowerCase().includes(q) ||
          i.programa?.toLowerCase().includes(q) ||
          i.serie?.toLowerCase().includes(q),
      );
    }

    // Panel filters
    if (filters.canal.length)
      result = result.filter((i) => i.canal && filters.canal.includes(i.canal));
    if (filters.statusGrelha.length)
      result = result.filter(
        (i) => i.statusGrelha && filters.statusGrelha.includes(i.statusGrelha),
      );
    if (filters.statusPlaneamentoId.length)
      result = result.filter(
        (i) => i.statusPlaneamentoId && filters.statusPlaneamentoId.includes(i.statusPlaneamentoId),
      );
    if (filters.tipoExibicao.length)
      result = result.filter(
        (i) => i.tipoExibicao && filters.tipoExibicao.includes(i.tipoExibicao),
      );
    if (filters.tipoAquisicao.length)
      result = result.filter(
        (i) => i.tipoAquisicao && filters.tipoAquisicao.includes(i.tipoAquisicao),
      );
    if (filters.semana.length)
      result = result.filter((i) => i.semana && filters.semana.includes(i.semana));
    if (filters.dataFrom)
      result = result.filter((i) => i.dataExibicao && i.dataExibicao >= filters.dataFrom);
    if (filters.dataTo)
      result = result.filter((i) => i.dataExibicao && i.dataExibicao <= filters.dataTo);

    // Sort
    if (filters.sortBy === 'data-desc')
      result = [...result].sort((a, b) =>
        (b.dataExibicao ?? '').localeCompare(a.dataExibicao ?? ''),
      );
    else if (filters.sortBy === 'nome-asc')
      result = [...result].sort((a, b) => a.nome.localeCompare(b.nome));
    else if (filters.sortBy === 'nome-desc')
      result = [...result].sort((a, b) => b.nome.localeCompare(a.nome));
    else if (filters.sortBy === 'hora-asc')
      result = [...result].sort((a, b) =>
        (a.horarioInicio ?? '').localeCompare(b.horarioInicio ?? ''),
      );
    else if (filters.sortBy === 'hora-desc')
      result = [...result].sort((a, b) =>
        (b.horarioInicio ?? '').localeCompare(a.horarioInicio ?? ''),
      );
    else
      result = [...result].sort(
        (a, b) =>
          (a.dataExibicao ?? '').localeCompare(b.dataExibicao ?? '') ||
          (a.horarioInicio ?? '').localeCompare(b.horarioInicio ?? ''),
      );

    return result;
  }, [items, search, filters]);

  const activeFilterCount = countGrelhaActiveFilters(filters);
  const totalAlteracoes = items.filter((i) => i.temAlteracao).length;

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await repository.list({ mes, ano, limit: 500 });
      setItems(res.data);
      setTotal(res.total);
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar grelha de programação',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [mes, ano, toast]);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await parametrizacoesRepo.listStatusPlaneamento();
      setStatuses(res.data as StatusPlaneamentoApiItem[]);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);
  useEffect(() => {
    void fetchStatuses();
  }, [fetchStatuses]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const handleUpdateStatus = async (id: string, statusId: string | null) => {
    try {
      const updated = await repository.updateStatusPlaneamento(id, statusId);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      if (selectedItem?.id === id) setSelectedItem(updated);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  const handleConfirmAlteracao = async (id: string) => {
    try {
      await repository.marcarAlteracaoVista(id);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, temAlteracao: false } : i)));
      toast({ title: 'Confirmado', description: 'Alteração marcada como vista.' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao confirmar alteração', variant: 'destructive' });
    }
  };

  // ── Table columns ──────────────────────────────────────────────────────────

  type Col = Column<GrelhaProgramaItem & { actions?: never }>;

  const textCol = (key: keyof GrelhaProgramaItem, label: string, className?: string): Col => ({
    key,
    label,
    className,
    render: (item) => <>{(item[key] as string) ?? '-'}</>,
  });

  const columns: Col[] = [
    {
      key: 'temAlteracao',
      label: '',
      className: 'w-8',
      sortable: false,
      render: (item) => (
        <AlteracaoBadge item={item} onConfirm={() => setConfirmingAlteracaoId(item.id)} />
      ),
    },
    ...(isColumnVisible('serie') ? [textCol('serie', 'Série', 'w-36')] : []),
    ...(isColumnVisible('idPrograma') ? [textCol('idPrograma', 'Id Programa', 'w-28')] : []),
    ...(isColumnVisible('programa') ? [textCol('programa', 'Programa', 'w-40')] : []),
    ...(isColumnVisible('tipoRequisicao') ? [textCol('tipoRequisicao', 'Tipo Req.', 'w-32')] : []),
    ...(isColumnVisible('genero') ? [textCol('genero', 'Género', 'w-28')] : []),
    ...(isColumnVisible('codigoProducao')
      ? [textCol('codigoProducao', 'Cód. Produção', 'w-32')]
      : []),
    ...(isColumnVisible('tipoAquisicao') ? [textCol('tipoAquisicao', 'Aquisição', 'w-28')] : []),
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => (
        <button type="button" className="text-left" onClick={() => setSelectedItem(item)}>
          <span className="font-medium hover:underline">{item.nome}</span>
          {item.serie && <p className="text-xs text-muted-foreground mt-0.5">{item.serie}</p>}
        </button>
      ),
    },
    ...(isColumnVisible('tipoPrograma') ? [textCol('tipoPrograma', 'Tipo Programa', 'w-32')] : []),
    ...(isColumnVisible('categoria') ? [textCol('categoria', 'Categoria', 'w-32')] : []),
    ...(isColumnVisible('canal') ? [textCol('canal', 'Canal', 'w-24')] : []),
    ...(isColumnVisible('semana') ? [textCol('semana', 'Semana', 'w-20')] : []),
    ...(isColumnVisible('tipoExibicao') ? [textCol('tipoExibicao', 'Tipo Exibição', 'w-28')] : []),
    ...(isColumnVisible('episodio') ? [textCol('episodio', 'Episódio', 'w-24')] : []),
    {
      key: 'dataExibicao',
      label: 'Data',
      className: 'w-28',
      render: (item) => <span className="tabular-nums">{formatDate(item.dataExibicao)}</span>,
    },
    ...(isColumnVisible('horarioInicio')
      ? [
          {
            key: 'horarioInicio' as keyof GrelhaProgramaItem,
            label: 'Hora Início',
            className: 'w-24',
            render: (item: GrelhaProgramaItem) => (
              <span className="tabular-nums">{item.horarioInicio?.slice(0, 5) ?? '-'}</span>
            ),
          } as Col,
        ]
      : []),
    ...(isColumnVisible('duracao')
      ? [
          {
            key: 'duracao' as keyof GrelhaProgramaItem,
            label: 'Duração',
            className: 'w-20',
            render: (item: GrelhaProgramaItem) => <>{item.duracao ?? '-'}</>,
          } as Col,
        ]
      : []),
    ...(isColumnVisible('statusGrelha')
      ? [
          {
            key: 'statusGrelha' as keyof GrelhaProgramaItem,
            label: 'Status Grelha',
            className: 'w-32',
            render: (item: GrelhaProgramaItem) => <>{item.statusGrelha ?? '-'}</>,
          } as Col,
        ]
      : []),
    ...(isColumnVisible('statusPlaneamento')
      ? [
          {
            key: 'statusPlaneamento',
            label: 'Planeamento',
            className: 'w-40',
            sortable: false,
            render: (item: GrelhaProgramaItem) => (
              <StatusPlaneamentoBadge
                item={item}
                statuses={statuses}
                onUpdate={(sid) => void handleUpdateStatus(item.id, sid)}
              />
            ),
          } as Col,
        ]
      : []),
    {
      key: 'planear' as keyof GrelhaProgramaItem,
      label: '',
      className: 'w-12',
      sortable: false,
      render: (item: GrelhaProgramaItem) => (
        <div className="flex items-center justify-center">
          {item.gravacaoId ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewGravacaoId(item.gravacaoId);
                      void gravacoesRepo.getById(item.gravacaoId!).then((g) => {
                        if (g) setViewGravacao(g);
                      });
                    }}
                  >
                    <Video className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">{item.gravacaoNome ?? 'Ver gravação'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlaneandoItem(item);
                    }}
                  >
                    <CalendarCheck className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Planear gravação</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
    } as Col,
  ];

  // ── Loading skeleton ───────────────────────────────────────────────────────

  const loadingSkeleton = (
    <div className="p-4 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );

  // ── Empty state ────────────────────────────────────────────────────────────

  const emptyContent = (
    <div className="text-center py-12 text-muted-foreground text-sm">
      <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p>
        Nenhum programa encontrado para {MESES[mes - 1]} {ano}
      </p>
      <p className="text-xs mt-1">
        Execute uma tarefa Maestro com módulo "Grelha de Programação" para importar programas.
      </p>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Grelha de Programação"
        description={`${total} programa(s) · ${MESES[mes - 1]} ${ano}`}
      />

      <ListActionBar>
        {/* Alerts badge */}
        {totalAlteracoes > 0 && (
          <Badge variant="outline" className="text-yellow-600 border-yellow-400 gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            {totalAlteracoes} alteraç{totalAlteracoes === 1 ? 'ão' : 'ões'}
          </Badge>
        )}

        <div className="flex-1" />

        <SearchBar value={search} onChange={setSearch} placeholder="Pesquisar programa..." />

        <GrelhaFilterPanel
          filters={filters}
          onChange={setFilters}
          resultCount={filteredItems.length}
          canalOptions={uniqueCanais}
          statusGrelhaOptions={statusGrelhaOptions}
          tipoExibicaoOptions={tipoExibicaoOptions}
          tipoAquisicaoOptions={tipoAquisicaoOptions}
          semanaOptions={semanaOptions}
          statusPlaneamentos={statuses}
        />

        {mode === 'list' && (
          <ColumnSelector
            columns={optionalColumns}
            visibleColumnKeys={visibleColumnKeys}
            onToggle={toggleColumn}
            onReset={resetColumns}
          />
        )}

        <ViewSwitcher mode={mode} onModeChange={setMode} showCalendar />
      </ListActionBar>

      <DataCard>
        {mode === 'calendar' ? (
          // Never unmount the calendar during loading — it would reset currentDate state.
          // Items update transparently when the parent re-fetches after month navigation.
          <GrelhaCalendarView
            items={filteredItems}
            ano={ano}
            mes={mes}
            isLoading={isLoading}
            onItemClick={(item) => setSelectedItem(item)}
            onMonthChange={(m, a) => {
              setMes(m);
              setAno(a);
            }}
          />
        ) : isLoading ? (
          loadingSkeleton
        ) : filteredItems.length === 0 ? (
          emptyContent
        ) : mode === 'list' ? (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey={STORAGE_KEY}
          />
        ) : mode === 'cards' ? (
          <CardGrid
            data={filteredItems}
            getRowKey={(item) => item.id}
            cols={3}
            renderCard={(item) => (
              <GrelhaProgramaCard
                item={item}
                statuses={statuses}
                onOpen={() => setSelectedItem(item)}
                onUpdateStatus={(sid) => void handleUpdateStatus(item.id, sid)}
                onConfirmAlteracao={() => setConfirmingAlteracaoId(item.id)}
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
            detailTitle="Detalhe do Programa"
            emptyDetailTitle="Nenhum programa selecionado"
            emptyDetailDescription="Clique num programa da lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  {item.nome}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDate(item.dataExibicao)}
                  </span>
                  {item.horarioInicio && (
                    <span className="text-xs text-muted-foreground">
                      {item.horarioInicio.slice(0, 5)}
                    </span>
                  )}
                  {item.canal && <span className="text-xs font-medium truncate">{item.canal}</span>}
                  {item.temAlteracao && (
                    <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0" />
                  )}
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <GrelhaDetailPanel
                item={item}
                statuses={statuses}
                onUpdateStatus={(sid) => void handleUpdateStatus(item.id, sid)}
                onConfirmAlteracao={() => void handleConfirmAlteracao(item.id)}
              />
            )}
          />
        )}
      </DataCard>

      <ItemDetailDialog
        item={selectedItem}
        statuses={statuses}
        onClose={() => setSelectedItem(null)}
        onUpdateStatus={handleUpdateStatus}
        onConfirmAlteracao={handleConfirmAlteracao}
      />

      <AlertDialog
        open={!!confirmingAlteracaoId}
        onOpenChange={(open) => !open && setConfirmingAlteracaoId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar esta alteração como vista? As datas anteriores serão descartadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmingAlteracaoId) void handleConfirmAlteracao(confirmingAlteracaoId);
                setConfirmingAlteracaoId(null);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GrelhaPlanearModal
        item={planeandoItem}
        onClose={() => setPlaneandoItem(null)}
        onSuccess={() => void fetchItems()}
      />

      {viewGravacaoId && (
        <GravacaoBackendFormModal
          isOpen={!!viewGravacaoId}
          data={viewGravacao}
          onClose={() => {
            setViewGravacaoId(null);
            setViewGravacao(null);
          }}
          onSave={async () => {
            setViewGravacaoId(null);
            setViewGravacao(null);
          }}
        />
      )}
    </div>
  );
};

export default GrelhaProgramacao;
