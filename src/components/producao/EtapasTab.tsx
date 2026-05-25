import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiRecursosTecnicosRepository } from '@/modules/recursos-tecnicos/recursos-tecnicos.api.repository';
import { ApiRecursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.api.repository';
import { ApiEspacosRepository } from '@/modules/espacos/espacos.api.repository';

// ── domain types ───────────────────────────────────────────────────────────────

export type AlocacaoRecurso = {
  recursoId: string;
  quantidade: number;
  de: string; // HH:MM
  ate: string; // HH:MM
};

export type Atividade = {
  id: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
  duracaoMinutos: number;
  recursosTecnicos: AlocacaoRecurso[];
  equipamentos: AlocacaoRecurso[];
  espacos: AlocacaoRecurso[];
};

export type Etapa = {
  id: string;
  nome: string;
  cor: string;
  atividades: Atividade[];
};

// ── catalog types ──────────────────────────────────────────────────────────────
type CatalogItem = { id: string; nome: string };

// ── shared repos ───────────────────────────────────────────────────────────────
const tecnicosRepo = new ApiRecursosTecnicosRepository();
const fisicosRepo = new ApiRecursosFisicosRepository();
const espacosRepo = new ApiEspacosRepository();

const PALETTE = [
  '#6366f1',
  '#3b82f6',
  '#ef4444',
  '#f97316',
  '#22c55e',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
];

function calcDuracao(horaInicio: string, horaFim: string): number {
  if (!horaInicio || !horaFim) return 0;
  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFim.split(':').map(Number);
  const diff = h2 * 60 + m2 - (h1 * 60 + m1);
  return diff > 0 ? diff : 0;
}

function formatDur(min: number) {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}m` : ''}` : `${m}min`;
}

// ── ResourceAllocationList ─────────────────────────────────────────────────────

function ResourceAllocationList({
  options,
  allocations,
  onAdd,
  onRemove,
  loading,
  color,
  defaultDe,
  defaultAte,
}: {
  options: CatalogItem[];
  allocations: AlocacaoRecurso[];
  onAdd: (alloc: AlocacaoRecurso) => void;
  onRemove: (recursoId: string) => void;
  loading: boolean;
  color: string;
  defaultDe: string;
  defaultAte: string;
}) {
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [de, setDe] = useState(defaultDe);
  const [ate, setAte] = useState(defaultAte);

  const allocatedIds = new Set(allocations.map((a) => a.recursoId));
  const available = options.filter(
    (o) => !allocatedIds.has(o.id) && o.nome.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdding = () => {
    setAdding(true);
    setSearch('');
    setSelectedId('');
    setQuantidade(1);
    setDe(defaultDe);
    setAte(defaultAte);
  };

  const handleAdd = () => {
    if (!selectedId) return;
    onAdd({ recursoId: selectedId, quantidade, de, ate });
    setAdding(false);
    setSearch('');
    setSelectedId('');
  };

  const handleCancel = () => {
    setAdding(false);
    setSearch('');
    setSelectedId('');
  };

  return (
    <div className="space-y-2">
      {/* Current allocations */}
      {allocations.length > 0 && (
        <div className="rounded border divide-y text-xs">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-1 bg-muted/30 text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            <span>Recurso</span>
            <span className="text-right">Qtd</span>
            <span>De</span>
            <span>Até</span>
          </div>
          {allocations.map((alloc) => {
            const item = options.find((o) => o.id === alloc.recursoId);
            return (
              <div
                key={alloc.recursoId}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 px-3 py-1.5"
              >
                <span className="truncate font-medium">{item?.nome ?? alloc.recursoId}</span>
                <span className="text-muted-foreground text-xs text-right">
                  {alloc.quantidade}×
                </span>
                <span className="text-muted-foreground text-xs whitespace-nowrap">{alloc.de}</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {alloc.ate}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-destructive hover:text-destructive shrink-0"
                    onClick={() => onRemove(alloc.recursoId)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline add form */}
      {adding ? (
        <div className="border rounded p-3 space-y-2.5 bg-muted/10">
          {/* Resource picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Selecionar recurso
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="h-7 pl-8 text-xs"
                autoFocus
              />
            </div>
            <div className="max-h-36 overflow-y-auto rounded border divide-y bg-background">
              {loading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-7 w-full" />)
              ) : available.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground py-3">
                  {options.length === 0 ? 'Nenhum registo disponível.' : 'Sem opções.'}
                </p>
              ) : (
                available.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors ${
                      selectedId === o.id ? 'bg-muted font-medium' : ''
                    }`}
                    onClick={() => setSelectedId(o.id)}
                  >
                    {o.nome}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Quantidade + period */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block">
                Quantidade
              </label>
              <Input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                className="h-7 text-xs text-center"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block">
                De
              </label>
              <Input
                type="time"
                value={de}
                onChange={(e) => setDe(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block">
                Até
              </label>
              <Input
                type="time"
                value={ate}
                onChange={(e) => setAte(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs text-white"
              disabled={!selectedId}
              onClick={handleAdd}
              style={{ backgroundColor: selectedId ? color : undefined }}
            >
              <Plus className="h-3 w-3 mr-1" /> Adicionar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={openAdding}
        >
          <Plus className="h-3 w-3 mr-1" /> Adicionar
        </Button>
      )}
    </div>
  );
}

// ── EtapasTab ──────────────────────────────────────────────────────────────────

export interface EtapasTabProps {
  etapas: Etapa[];
  onChange: (etapas: Etapa[]) => void;
  readOnly?: boolean;
}

export function EtapasTab({ etapas, onChange, readOnly = false }: EtapasTabProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingAtvId, setEditingAtvId] = useState<string | null>(null);

  // catalog
  const [tecnicosOptions, setTecnicosOptions] = useState<CatalogItem[]>([]);
  const [fisicosOptions, setFisicosOptions] = useState<CatalogItem[]>([]);
  const [espacosOptions, setEspacosOptions] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingCatalog(true);
    Promise.all([tecnicosRepo.list(), fisicosRepo.list(), espacosRepo.list()])
      .then(([tecnicos, fisicos, espacos]) => {
        if (cancelled) return;
        setTecnicosOptions(tecnicos.map((t) => ({ id: t.id, nome: t.nome })));
        setFisicosOptions(fisicos.map((f) => ({ id: f.id, nome: f.nome })));
        setEspacosOptions(espacos.map((e) => ({ id: e.id, nome: e.titulo })));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tecnicosMap = new Map(tecnicosOptions.map((t) => [t.id, t.nome]));
  const fisicosMap = new Map(fisicosOptions.map((f) => [f.id, f.nome]));
  const espacosMap = new Map(espacosOptions.map((e) => [e.id, e.nome]));

  // ── etapa helpers ──────────────────────────────────────────────────────────

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addEtapa = () => {
    const e: Etapa = {
      id: crypto.randomUUID(),
      nome: `Etapa ${etapas.length + 1}`,
      cor: PALETTE[etapas.length % PALETTE.length],
      atividades: [],
    };
    onChange([...etapas, e]);
    setExpanded((prev) => new Set([...prev, e.id]));
  };

  const removeEtapa = (id: string) => onChange(etapas.filter((e) => e.id !== id));

  const updateEtapa = (id: string, patch: Partial<Etapa>) =>
    onChange(etapas.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  // ── atividade helpers ──────────────────────────────────────────────────────

  const addAtividade = (etapaId: string) => {
    const a: Atividade = {
      id: crypto.randomUUID(),
      nome: '',
      horaInicio: '08:00',
      horaFim: '09:00',
      duracaoMinutos: 60,
      recursosTecnicos: [],
      equipamentos: [],
      espacos: [],
    };
    onChange(
      etapas.map((e) => (e.id === etapaId ? { ...e, atividades: [...e.atividades, a] } : e)),
    );
    setEditingAtvId(a.id);
  };

  const removeAtividade = (etapaId: string, aId: string) => {
    if (editingAtvId === aId) setEditingAtvId(null);
    onChange(
      etapas.map((e) =>
        e.id === etapaId ? { ...e, atividades: e.atividades.filter((a) => a.id !== aId) } : e,
      ),
    );
  };

  const updateAtividade = (etapaId: string, aId: string, patch: Partial<Atividade>) =>
    onChange(
      etapas.map((e) =>
        e.id === etapaId
          ? {
              ...e,
              atividades: e.atividades.map((a) => {
                if (a.id !== aId) return a;
                const updated = { ...a, ...patch };
                updated.duracaoMinutos = calcDuracao(updated.horaInicio, updated.horaFim);
                return updated;
              }),
            }
          : e,
      ),
    );

  const addAllocation = (
    etapaId: string,
    aId: string,
    field: 'recursosTecnicos' | 'equipamentos' | 'espacos',
    alloc: AlocacaoRecurso,
  ) => {
    const etapa = etapas.find((e) => e.id === etapaId);
    const ativ = etapa?.atividades.find((a) => a.id === aId);
    if (!ativ) return;
    updateAtividade(etapaId, aId, { [field]: [...ativ[field], alloc] });
  };

  const removeAllocation = (
    etapaId: string,
    aId: string,
    field: 'recursosTecnicos' | 'equipamentos' | 'espacos',
    recursoId: string,
  ) => {
    const etapa = etapas.find((e) => e.id === etapaId);
    const ativ = etapa?.atividades.find((a) => a.id === aId);
    if (!ativ) return;
    updateAtividade(etapaId, aId, {
      [field]: ativ[field].filter((x) => x.recursoId !== recursoId),
    });
  };

  // ── render ─────────────────────────────────────────────────────────────────

  if (etapas.length === 0 && readOnly) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        <p>Nenhuma etapa cadastrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {etapas.map((etapa) => (
        <div
          key={etapa.id}
          className="border rounded-lg overflow-hidden"
          style={{ borderLeftColor: etapa.cor, borderLeftWidth: 4 }}
        >
          {/* ── Etapa header ── */}
          <div
            className="flex items-center gap-3 px-3 py-2 bg-muted/30 cursor-pointer select-none"
            onClick={() => toggleExpand(etapa.id)}
          >
            <input
              type="color"
              value={etapa.cor}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => !readOnly && updateEtapa(etapa.id, { cor: e.target.value })}
              disabled={readOnly}
              className="w-6 h-6 rounded-full cursor-pointer border border-border p-0 bg-transparent shrink-0"
              title="Cor da etapa"
            />
            <Input
              value={etapa.nome}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateEtapa(etapa.id, { nome: e.target.value })}
              disabled={readOnly}
              placeholder="Nome da etapa"
              className="flex-1 h-7 text-xs font-medium"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {etapa.atividades.length} atividade(s)
            </span>
            {expanded.has(etapa.id) ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEtapa(etapa.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* ── Activity list ── */}
          {expanded.has(etapa.id) && (
            <div>
              {etapa.atividades.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4 text-xs">Atividade</TableHead>
                      <TableHead className="w-24 text-center text-xs">Início</TableHead>
                      <TableHead className="w-24 text-center text-xs">Fim</TableHead>
                      <TableHead className="w-20 text-center text-xs">Duração</TableHead>
                      <TableHead className="w-20 text-right pr-3" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {etapa.atividades.map((atividade) => {
                      const isEditing = editingAtvId === atividade.id;
                      const totalRec =
                        atividade.recursosTecnicos.length +
                        atividade.equipamentos.length +
                        atividade.espacos.length;

                      return (
                        <React.Fragment key={atividade.id}>
                          {/* ── Activity row ── */}
                          <TableRow className={isEditing ? 'bg-muted/40' : ''}>
                            <TableCell className="pl-4 py-2">
                              {isEditing ? (
                                <Input
                                  value={atividade.nome}
                                  onChange={(e) =>
                                    updateAtividade(etapa.id, atividade.id, {
                                      nome: e.target.value,
                                    })
                                  }
                                  placeholder="Nome da atividade"
                                  className="h-7 text-xs"
                                  autoFocus
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs font-medium ${atividade.nome ? '' : 'text-muted-foreground italic'}`}
                                  >
                                    {atividade.nome || 'Sem nome'}
                                  </span>
                                  {totalRec > 0 && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] h-4 px-1"
                                      style={{ borderColor: etapa.cor, color: etapa.cor }}
                                    >
                                      {totalRec} recurso(s)
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center py-2">
                              {isEditing ? (
                                <Input
                                  type="time"
                                  value={atividade.horaInicio}
                                  onChange={(e) =>
                                    updateAtividade(etapa.id, atividade.id, {
                                      horaInicio: e.target.value,
                                    })
                                  }
                                  className="h-7 text-xs text-center w-24 mx-auto"
                                />
                              ) : (
                                <span className="text-xs">{atividade.horaInicio || '—'}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center py-2">
                              {isEditing ? (
                                <Input
                                  type="time"
                                  value={atividade.horaFim}
                                  onChange={(e) =>
                                    updateAtividade(etapa.id, atividade.id, {
                                      horaFim: e.target.value,
                                    })
                                  }
                                  className="h-7 text-xs text-center w-24 mx-auto"
                                />
                              ) : (
                                <span className="text-xs">{atividade.horaFim || '—'}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center py-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDur(atividade.duracaoMinutos)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right pr-3 py-2">
                              {!readOnly && (
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setEditingAtvId(isEditing ? null : atividade.id)}
                                    title={isEditing ? 'Concluir' : 'Editar'}
                                  >
                                    {isEditing ? (
                                      <Check className="h-3.5 w-3.5 text-primary" />
                                    ) : (
                                      <Pencil className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => removeAtividade(etapa.id, atividade.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>

                          {/* ── Resource panel ── */}
                          {isEditing && (
                            <TableRow
                              key={`${atividade.id}-resources`}
                              className="hover:bg-transparent bg-muted/10"
                            >
                              <TableCell colSpan={5} className="px-4 pb-4 pt-1">
                                <Tabs defaultValue="tecnicos">
                                  <TabsList className="h-8 mb-3">
                                    <TabsTrigger value="tecnicos" className="text-xs h-7 gap-1.5">
                                      Recursos Técnicos
                                      {atividade.recursosTecnicos.length > 0 && (
                                        <Badge
                                          className="h-4 min-w-4 px-1 text-[10px]"
                                          style={{ backgroundColor: etapa.cor }}
                                        >
                                          {atividade.recursosTecnicos.length}
                                        </Badge>
                                      )}
                                    </TabsTrigger>
                                    <TabsTrigger
                                      value="equipamentos"
                                      className="text-xs h-7 gap-1.5"
                                    >
                                      Equipamento
                                      {atividade.equipamentos.length > 0 && (
                                        <Badge
                                          className="h-4 min-w-4 px-1 text-[10px]"
                                          style={{ backgroundColor: etapa.cor }}
                                        >
                                          {atividade.equipamentos.length}
                                        </Badge>
                                      )}
                                    </TabsTrigger>
                                    <TabsTrigger value="espacos" className="text-xs h-7 gap-1.5">
                                      Espaços
                                      {atividade.espacos.length > 0 && (
                                        <Badge
                                          className="h-4 min-w-4 px-1 text-[10px]"
                                          style={{ backgroundColor: etapa.cor }}
                                        >
                                          {atividade.espacos.length}
                                        </Badge>
                                      )}
                                    </TabsTrigger>
                                  </TabsList>

                                  <TabsContent value="tecnicos" className="mt-0">
                                    <ResourceAllocationList
                                      options={tecnicosOptions}
                                      allocations={atividade.recursosTecnicos}
                                      onAdd={(alloc) =>
                                        addAllocation(
                                          etapa.id,
                                          atividade.id,
                                          'recursosTecnicos',
                                          alloc,
                                        )
                                      }
                                      onRemove={(recursoId) =>
                                        removeAllocation(
                                          etapa.id,
                                          atividade.id,
                                          'recursosTecnicos',
                                          recursoId,
                                        )
                                      }
                                      loading={loadingCatalog}
                                      color={etapa.cor}
                                      defaultDe={atividade.horaInicio}
                                      defaultAte={atividade.horaFim}
                                    />
                                  </TabsContent>

                                  <TabsContent value="equipamentos" className="mt-0">
                                    <ResourceAllocationList
                                      options={fisicosOptions}
                                      allocations={atividade.equipamentos}
                                      onAdd={(alloc) =>
                                        addAllocation(etapa.id, atividade.id, 'equipamentos', alloc)
                                      }
                                      onRemove={(recursoId) =>
                                        removeAllocation(
                                          etapa.id,
                                          atividade.id,
                                          'equipamentos',
                                          recursoId,
                                        )
                                      }
                                      loading={loadingCatalog}
                                      color={etapa.cor}
                                      defaultDe={atividade.horaInicio}
                                      defaultAte={atividade.horaFim}
                                    />
                                  </TabsContent>

                                  <TabsContent value="espacos" className="mt-0">
                                    <ResourceAllocationList
                                      options={espacosOptions}
                                      allocations={atividade.espacos}
                                      onAdd={(alloc) =>
                                        addAllocation(etapa.id, atividade.id, 'espacos', alloc)
                                      }
                                      onRemove={(recursoId) =>
                                        removeAllocation(
                                          etapa.id,
                                          atividade.id,
                                          'espacos',
                                          recursoId,
                                        )
                                      }
                                      loading={loadingCatalog}
                                      color={etapa.cor}
                                      defaultDe={atividade.horaInicio}
                                      defaultAte={atividade.horaFim}
                                    />
                                  </TabsContent>
                                </Tabs>

                                {/* Summary of selected resources */}
                                {(atividade.recursosTecnicos.length > 0 ||
                                  atividade.equipamentos.length > 0 ||
                                  atividade.espacos.length > 0) && (
                                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-1">
                                    {atividade.recursosTecnicos.map((alloc) => (
                                      <Badge
                                        key={alloc.recursoId}
                                        variant="secondary"
                                        className="text-xs gap-1"
                                      >
                                        {tecnicosMap.get(alloc.recursoId) ?? alloc.recursoId}
                                        {alloc.quantidade > 1 && (
                                          <span className="opacity-70">×{alloc.quantidade}</span>
                                        )}
                                      </Badge>
                                    ))}
                                    {atividade.equipamentos.map((alloc) => (
                                      <Badge
                                        key={alloc.recursoId}
                                        variant="outline"
                                        className="text-xs gap-1"
                                      >
                                        {fisicosMap.get(alloc.recursoId) ?? alloc.recursoId}
                                        {alloc.quantidade > 1 && (
                                          <span className="opacity-70">×{alloc.quantidade}</span>
                                        )}
                                      </Badge>
                                    ))}
                                    {atividade.espacos.map((alloc) => (
                                      <Badge
                                        key={alloc.recursoId}
                                        variant="outline"
                                        className="text-xs gap-1 border-dashed"
                                      >
                                        {espacosMap.get(alloc.recursoId) ?? alloc.recursoId}
                                        {alloc.quantidade > 1 && (
                                          <span className="opacity-70">×{alloc.quantidade}</span>
                                        )}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {etapa.atividades.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Nenhuma atividade. Clique em &quot;Adicionar Atividade&quot;.
                </p>
              )}

              {!readOnly && (
                <div className="px-3 pb-3 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addAtividade(etapa.id)}
                    className="w-full text-xs h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Atividade
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {!readOnly && (
        <Button type="button" variant="outline" size="sm" onClick={addEtapa} className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Adicionar Etapa
        </Button>
      )}
    </div>
  );
}
