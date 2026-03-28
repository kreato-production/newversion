import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, AlertTriangle, Loader2, Filter, BarChart3, X } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { IncidenciaGravacaoFormModal } from '@/components/producao/IncidenciaGravacaoFormModal';
import { IncidenciaChartModal } from '@/components/producao/IncidenciaChartModal';
import { Badge } from '@/components/ui/badge';
import {
  ApiIncidenciasGravacaoRepository,
  type IncidenciaGravacaoApiItem,
} from '@/modules/incidencias-gravacao/incidencias-gravacao.api';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { gravacoesRepository } from '@/modules/gravacoes/gravacoes.repository.provider';

export interface IncidenciaGravacao extends IncidenciaGravacaoApiItem {
  gravacao_nome?: string;
  severidade_titulo?: string;
  severidade_cor?: string;
  impacto_titulo?: string;
  categoria_titulo?: string;
  classificacao_titulo?: string;
}

interface ParametrizacaoItem {
  id: string;
  titulo: string;
}

const incidenciasRepository = new ApiIncidenciasGravacaoRepository();
const parametrizacoesRepository = new ApiParametrizacoesRepository();

const IncidenciasGravacao = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { canAlterar, canIncluir, canExcluir } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IncidenciaGravacao | null>(null);
  const [items, setItems] = useState<IncidenciaGravacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterImpacto, setFilterImpacto] = useState('');
  const [filterSeveridade, setFilterSeveridade] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterClassificacao, setFilterClassificacao] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [impactos, setImpactos] = useState<ParametrizacaoItem[]>([]);
  const [severidades, setSeveridades] = useState<ParametrizacaoItem[]>([]);
  const [categorias, setCategorias] = useState<ParametrizacaoItem[]>([]);
  const [classificacoes, setClassificacoes] = useState<ParametrizacaoItem[]>([]);

  const permPath = ['Produção', 'Incidências de Gravação'] as const;

  const activeFilterCount = [
    filterDateFrom,
    filterDateTo,
    filterImpacto,
    filterSeveridade,
    filterCategoria,
    filterClassificacao,
  ].filter(Boolean).length;

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [s, i, c] = await Promise.all([
          parametrizacoesRepository.listSeveridadesIncidencia(),
          parametrizacoesRepository.listImpactosIncidencia(),
          parametrizacoesRepository.listCategoriasIncidencia(),
        ]);
        setSeveridades((s.data || []) as ParametrizacaoItem[]);
        setImpactos((i.data || []) as ParametrizacaoItem[]);
        setCategorias((c.data || []) as ParametrizacaoItem[]);
      } catch (error) {
        console.error('Error loading incidencia options:', error);
      }
    };

    void fetchOptions();
  }, []);

  useEffect(() => {
    if (!filterCategoria) {
      setClassificacoes([]);
      setFilterClassificacao('');
      return;
    }

    const fetchClassif = async () => {
      try {
        const response =
          await parametrizacoesRepository.listClassificacoesIncidencia(filterCategoria);
        setClassificacoes((response.data || []) as ParametrizacaoItem[]);
      } catch (error) {
        console.error('Error loading classificacoes incidencia:', error);
      }
    };

    void fetchClassif();
  }, [filterCategoria]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [incidenciasData, gravacoesData, severidadesData, impactosData, categoriasData] =
        await Promise.all([
          incidenciasRepository.list(),
          gravacoesRepository.list(),
          parametrizacoesRepository.listSeveridadesIncidencia(),
          parametrizacoesRepository.listImpactosIncidencia(),
          parametrizacoesRepository.listCategoriasIncidencia(),
        ]);

      const gravacoesById = new Map(gravacoesData.map((item) => [item.id, item]));
      const severidadesById = new Map((severidadesData.data || []).map((item) => [item.id, item]));
      const impactosById = new Map((impactosData.data || []).map((item) => [item.id, item]));
      const categoriasById = new Map((categoriasData.data || []).map((item) => [item.id, item]));

      const categoriasIds = Array.from(
        new Set(incidenciasData.map((item) => item.categoria_id).filter(Boolean)),
      ) as string[];
      const classificacoesLists = await Promise.all(
        categoriasIds.map(async (categoriaId) => ({
          categoriaId,
          response: await parametrizacoesRepository.listClassificacoesIncidencia(categoriaId),
        })),
      );
      const classificacoesById = new Map(
        classificacoesLists.flatMap(({ response }) =>
          (response.data || []).map((item) => [item.id, item] as const),
        ),
      );

      setItems(
        (incidenciasData || []).map((item) => ({
          ...item,
          gravacao_nome: item.gravacao_id
            ? gravacoesById.get(item.gravacao_id)?.nome || null
            : null,
          severidade_titulo: item.severidade_id
            ? severidadesById.get(item.severidade_id)?.titulo || null
            : null,
          severidade_cor: item.severidade_id
            ? severidadesById.get(item.severidade_id)?.cor || null
            : null,
          impacto_titulo: item.impacto_id
            ? impactosById.get(item.impacto_id)?.titulo || null
            : null,
          categoria_titulo: item.categoria_id
            ? categoriasById.get(item.categoria_id)?.titulo || null
            : null,
          classificacao_titulo: item.classificacao_id
            ? classificacoesById.get(item.classificacao_id)?.titulo || null
            : null,
        })),
      );
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm.delete'))) return;
    try {
      await incidenciasRepository.remove(id);
      toast({
        title: t('common.deleted'),
        description: `${t('incident.entity')} ${t('common.deleted').toLowerCase()}!`,
      });
      await fetchData();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    await fetchData();
    setEditingItem(null);
  };

  const clearFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterImpacto('');
    setFilterSeveridade('');
    setFilterCategoria('');
    setFilterClassificacao('');
  };

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch =
          item.titulo?.toLowerCase().includes(search.toLowerCase()) ||
          (item.codigo_externo || '').toLowerCase().includes(search.toLowerCase()) ||
          (item.gravacao_nome || '').toLowerCase().includes(search.toLowerCase());

        const matchesDateFrom =
          !filterDateFrom || (item.data_incidencia && item.data_incidencia >= filterDateFrom);
        const matchesDateTo =
          !filterDateTo || (item.data_incidencia && item.data_incidencia <= filterDateTo);

        const matchesImpacto = !filterImpacto || item.impacto_id === filterImpacto;
        const matchesSeveridade = !filterSeveridade || item.severidade_id === filterSeveridade;
        const matchesCategoria = !filterCategoria || item.categoria_id === filterCategoria;
        const matchesClassificacao =
          !filterClassificacao || item.classificacao_id === filterClassificacao;

        return (
          matchesSearch &&
          matchesDateFrom &&
          matchesDateTo &&
          matchesImpacto &&
          matchesSeveridade &&
          matchesCategoria &&
          matchesClassificacao
        );
      }),
    [
      items,
      search,
      filterDateFrom,
      filterDateTo,
      filterImpacto,
      filterSeveridade,
      filterCategoria,
      filterClassificacao,
    ],
  );

  const columns: Column<IncidenciaGravacao & { actions?: never }>[] = [
    {
      key: 'codigo_externo',
      label: t('common.externalCode'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigo_externo || '-'}</span>,
    },
    {
      key: 'titulo',
      label: t('incident.title'),
      render: (item) => <span className="font-medium">{item.titulo}</span>,
    },
    {
      key: 'gravacao_nome',
      label: t('incident.recording'),
      className: 'hidden md:table-cell',
      render: (item) => <span className="text-muted-foreground">{item.gravacao_nome || '-'}</span>,
    },
    {
      key: 'severidade_titulo',
      label: t('incident.severity'),
      className: 'hidden md:table-cell',
      render: (item) =>
        item.severidade_titulo ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: item.severidade_cor || '#888' }}
            />
            <span>{item.severidade_titulo}</span>
          </div>
        ) : (
          '-'
        ),
    },
    {
      key: 'data_incidencia',
      label: t('incident.date'),
      className: 'w-32',
      render: (item) =>
        item.data_incidencia
          ? new Date(`${item.data_incidencia}T00:00:00`).toLocaleDateString('pt-BR')
          : '-',
    },
    {
      key: 'actions',
      label: t('common.actions'),
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
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t('incident.pageTitle')} description={t('incident.pageDescription')} />
      <ListActionBar>
        {canIncluir(permPath[0], permPath[1]) && (
          <NewButton
            tooltip={`${t('common.new')} ${t('incident.entity')}`}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          />
        )}
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              {t('incident.filters')}
              {activeFilterCount > 0 && (
                <Badge
                  variant="default"
                  className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{t('incident.filters')}</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                    <X className="w-3 h-3 mr-1" />
                    {t('incident.clearFilters')}
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t('incident.period')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    placeholder={t('incident.periodFrom')}
                    className="text-xs h-8"
                  />
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    placeholder={t('incident.periodTo')}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t('incident.severity')}</Label>
                <Select
                  value={filterSeveridade}
                  onValueChange={(v) => setFilterSeveridade(v === '__all__' ? '' : v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={t('common.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t('common.all')}</SelectItem>
                    {severidades.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t('incident.impact')}</Label>
                <Select
                  value={filterImpacto}
                  onValueChange={(v) => setFilterImpacto(v === '__all__' ? '' : v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={t('common.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t('common.all')}</SelectItem>
                    {impactos.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t('incident.category')}</Label>
                <Select
                  value={filterCategoria}
                  onValueChange={(v) => {
                    setFilterCategoria(v === '__all__' ? '' : v);
                    setFilterClassificacao('');
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={t('common.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t('common.all')}</SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{t('incident.classification')}</Label>
                <Select
                  value={filterClassificacao}
                  onValueChange={(v) => setFilterClassificacao(v === '__all__' ? '' : v)}
                  disabled={!filterCategoria}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue
                      placeholder={
                        filterCategoria ? t('common.all') : t('incident.selectCategoryFirst')
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t('common.all')}</SelectItem>
                    {classificacoes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="sm" onClick={() => setIsChartOpen(true)}>
          <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
          {t('incident.chart')}
        </Button>
      </ListActionBar>
      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title={t('common.noResults')}
            description={`${t('common.add')} ${t('incident.entity').toLowerCase()}.`}
            icon={AlertTriangle}
            onAction={() => setIsModalOpen(true)}
            actionLabel={`${t('common.add')} ${t('incident.entity')}`}
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_incidencias_gravacao"
          />
        )}
      </DataCard>
      <IncidenciaGravacaoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar(permPath[0], permPath[1])}
      />
      <IncidenciaChartModal
        isOpen={isChartOpen}
        onClose={() => setIsChartOpen(false)}
        items={filteredItems}
      />
    </div>
  );
};

export default IncidenciasGravacao;
