'use client';

import { useEffect, useMemo, useState } from 'react';
import { GanttChart, LayoutList, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Template, TemplateAtividade } from '@/modules/templates/templates.api';
import type { TemplateAtividadeConfig } from '@/modules/gravacoes/gravacoes.api.repository';
import type { GrelhaProgramaItem } from '@/modules/producao/grelha-programacao.api';
import { ApiRecursosTecnicosRepository } from '@/modules/recursos-tecnicos/recursos-tecnicos.api.repository';
import { ApiRecursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.api.repository';
import { ApiEspacosRepository } from '@/modules/espacos/espacos.api.repository';

const tecnicosRepo = new ApiRecursosTecnicosRepository();
const fisicosRepo = new ApiRecursosFisicosRepository();
const espacosRepo = new ApiEspacosRepository();

// ── helpers ──────────────────────────────────────────────────────────────────

function parseTime(t: string): number {
  if (!t || !t.includes(':')) return -1;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return -1;
  return h * 60 + m;
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── types ─────────────────────────────────────────────────────────────────────

interface ResourceState {
  data: string;
  horaInicio: string;
  horaFim: string;
}

type StateMap = Record<string, ResourceState>;

interface GanttRow {
  key: string;
  label: string;
  etapaColor: string;
  etapaNome: string;
  atividadeNome: string;
  tipo: 'espaco' | 'tecnico' | 'equipamento';
  startMin: number;
  endMin: number;
}

function makeKey(atividadeId: string, tipo: string, idx: number) {
  return `${atividadeId}:${tipo}:${idx}`;
}

// ── Gantt view ────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
  espaco: 'Espaço',
  tecnico: 'Recurso Técnico',
  equipamento: 'Equipamento',
};

const TIPO_COLOR_OPACITY: Record<string, string> = {
  espaco: 'cc',
  tecnico: '99',
  equipamento: '77',
};

function GanttView({ rows }: { rows: GanttRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Preencha os horários na vista de lista para visualizar o Gantt.
      </p>
    );
  }

  const validRows = rows.filter((r) => r.startMin >= 0 && r.endMin > r.startMin);
  const allTimes = validRows.flatMap((r) => [r.startMin, r.endMin]);
  const rawMin = allTimes.length > 0 ? Math.min(...allTimes) : 0;
  const rawMax = allTimes.length > 0 ? Math.max(...allTimes) : 60;
  const padding = 30;
  const minTime = Math.max(0, rawMin - padding);
  const maxTime = rawMax + padding;
  const duration = maxTime - minTime;

  // tick interval: every 15, 30 or 60 min
  const tickInterval = duration <= 90 ? 15 : duration <= 240 ? 30 : 60;
  const firstTick = Math.ceil(minTime / tickInterval) * tickInterval;
  const ticks: number[] = [];
  for (let t = firstTick; t <= maxTime; t += tickInterval) ticks.push(t);

  const pct = (min: number) => `${((min - minTime) / duration) * 100}%`;
  const LEFT_COL = 148;

  // Group rows by etapa → atividade
  const groups: {
    etapaNome: string;
    etapaColor: string;
    atividades: { nome: string; rows: GanttRow[] }[];
  }[] = [];
  for (const row of rows) {
    let group = groups.find((g) => g.etapaNome === row.etapaNome);
    if (!group) {
      group = { etapaNome: row.etapaNome, etapaColor: row.etapaColor, atividades: [] };
      groups.push(group);
    }
    let ativ = group.atividades.find((a) => a.nome === row.atividadeNome);
    if (!ativ) {
      ativ = { nome: row.atividadeNome, rows: [] };
      group.atividades.push(ativ);
    }
    ativ.rows.push(row);
  }

  return (
    <div className="text-xs select-none">
      {/* Time axis header */}
      <div className="flex border-b mb-1 pb-1 sticky top-0 bg-background z-10">
        <div style={{ width: LEFT_COL, minWidth: LEFT_COL }} className="shrink-0" />
        <div className="relative flex-1 h-5">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute -translate-x-1/2 text-[10px] text-muted-foreground font-mono"
              style={{ left: pct(t) }}
            >
              {formatMinutes(t)}
            </span>
          ))}
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.etapaNome}>
            {/* Etapa label */}
            <div
              className="flex items-center gap-1.5 px-1 py-0.5 rounded mb-1"
              style={{ backgroundColor: `${group.etapaColor}22` }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: group.etapaColor }}
              />
              <span className="font-semibold text-[11px]">{group.etapaNome}</span>
            </div>

            {group.atividades.map((ativ) => (
              <div key={ativ.nome} className="mb-2 pl-2">
                <div className="text-[10px] text-muted-foreground font-medium mb-1 pl-1">
                  {ativ.nome}
                </div>
                {ativ.rows.map((row) => {
                  const hasTime = row.startMin >= 0 && row.endMin > row.startMin;
                  const barColor = `${row.etapaColor}${TIPO_COLOR_OPACITY[row.tipo] ?? 'aa'}`;
                  return (
                    <div key={row.key} className="flex items-center mb-0.5">
                      {/* Label */}
                      <div
                        style={{ width: LEFT_COL, minWidth: LEFT_COL }}
                        className="shrink-0 pr-2 flex items-center gap-1"
                      >
                        <span
                          className="text-[9px] px-1 py-0 rounded text-white leading-4"
                          style={{ backgroundColor: barColor }}
                        >
                          {TIPO_LABEL[row.tipo]?.slice(0, 3)}
                        </span>
                        <span className="truncate text-[11px]" title={row.label}>
                          {row.label}
                        </span>
                      </div>

                      {/* Track */}
                      <div className="relative flex-1 h-5 bg-muted/30 rounded">
                        {/* Grid lines */}
                        {ticks.map((t) => (
                          <div
                            key={t}
                            className="absolute top-0 bottom-0 border-l border-border/40"
                            style={{ left: pct(t) }}
                          />
                        ))}
                        {hasTime ? (
                          <div
                            className="absolute top-0.5 bottom-0.5 rounded flex items-center justify-center overflow-hidden"
                            style={{
                              left: pct(row.startMin),
                              width: `${((row.endMin - row.startMin) / duration) * 100}%`,
                              backgroundColor: barColor,
                            }}
                          >
                            {row.endMin - row.startMin >= duration * 0.12 && (
                              <span className="text-[9px] text-white font-mono px-1 truncate">
                                {formatMinutes(row.startMin)}–{formatMinutes(row.endMin)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            className="absolute top-1 bottom-1 rounded border border-dashed border-muted-foreground/40"
                            style={{ left: '0%', right: '0%' }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
  defaultDate: string;
  item?: GrelhaProgramaItem | null;
  onConfirm: (atividades: TemplateAtividadeConfig[]) => Promise<void>;
}

function formatDateBR(val: string | null | undefined): string {
  if (!val) return '—';
  const p = val.split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : val;
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5 whitespace-nowrap">
        {label}
      </span>
      <span className="text-xs font-medium truncate" title={value}>
        {value}
      </span>
    </div>
  );
}

export function GrelhaTemplateAplicarModal({
  isOpen,
  onClose,
  template,
  defaultDate,
  item,
  onConfirm,
}: Props) {
  const { toast } = useToast();
  const [stateMap, setStateMap] = useState<StateMap>({});
  const [tecnicosMap, setTecnicosMap] = useState<Map<string, string>>(new Map());
  const [fisicosMap, setFisicosMap] = useState<Map<string, string>>(new Map());
  const [espacosMap, setEspacosMap] = useState<Map<string, string>>(new Map());
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'gantt'>('form');

  useEffect(() => {
    if (!isOpen) return;
    setLoadingCatalog(true);
    Promise.all([tecnicosRepo.list(), fisicosRepo.list(), espacosRepo.list()])
      .then(([tecnicos, fisicos, espacos]) => {
        setTecnicosMap(new Map(tecnicos.map((t) => [t.id, t.nome])));
        setFisicosMap(new Map(fisicos.map((f) => [f.id, f.nome])));
        setEspacosMap(new Map(espacos.map((e) => [e.id, e.titulo])));
      })
      .catch(() =>
        toast({ title: 'Erro ao carregar catálogo de recursos', variant: 'destructive' }),
      )
      .finally(() => setLoadingCatalog(false));
  }, [isOpen, toast]);

  useEffect(() => {
    if (!isOpen || !template) return;
    const initial: StateMap = {};
    for (const etapa of template.etapas) {
      for (const ativ of etapa.atividades) {
        ativ.espacos.forEach((_, idx) => {
          initial[makeKey(ativ.id, 'espaco', idx)] = {
            data: defaultDate,
            horaInicio: ativ.horaInicio,
            horaFim: ativ.horaFim,
          };
        });
        ativ.recursosTecnicos.forEach((r, idx) => {
          initial[makeKey(ativ.id, 'tecnico', idx)] = {
            data: defaultDate,
            horaInicio: r.de || ativ.horaInicio,
            horaFim: r.ate || ativ.horaFim,
          };
        });
        ativ.equipamentos.forEach((r, idx) => {
          initial[makeKey(ativ.id, 'equipamento', idx)] = {
            data: defaultDate,
            horaInicio: r.de || ativ.horaInicio,
            horaFim: r.ate || ativ.horaFim,
          };
        });
      }
    }
    setStateMap(initial);
    setViewMode('form');
  }, [isOpen, template, defaultDate]);

  function updateField(key: string, field: keyof ResourceState, value: string) {
    setStateMap((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  // Build Gantt rows from current stateMap
  const ganttRows = useMemo<GanttRow[]>(() => {
    if (!template) return [];
    const rows: GanttRow[] = [];
    for (const etapa of template.etapas) {
      for (const ativ of etapa.atividades) {
        ativ.espacos.forEach((esp, idx) => {
          const key = makeKey(ativ.id, 'espaco', idx);
          const s = stateMap[key] ?? { data: '', horaInicio: '', horaFim: '' };
          rows.push({
            key,
            label: espacosMap.get(esp.recursoId) ?? esp.recursoId,
            etapaColor: etapa.cor,
            etapaNome: etapa.nome,
            atividadeNome: ativ.nome,
            tipo: 'espaco',
            startMin: parseTime(s.horaInicio),
            endMin: parseTime(s.horaFim),
          });
        });
        ativ.recursosTecnicos.forEach((r, idx) => {
          const key = makeKey(ativ.id, 'tecnico', idx);
          const s = stateMap[key] ?? { data: '', horaInicio: '', horaFim: '' };
          rows.push({
            key,
            label: tecnicosMap.get(r.recursoId) ?? r.recursoId,
            etapaColor: etapa.cor,
            etapaNome: etapa.nome,
            atividadeNome: ativ.nome,
            tipo: 'tecnico',
            startMin: parseTime(s.horaInicio),
            endMin: parseTime(s.horaFim),
          });
        });
        ativ.equipamentos.forEach((r, idx) => {
          const key = makeKey(ativ.id, 'equipamento', idx);
          const s = stateMap[key] ?? { data: '', horaInicio: '', horaFim: '' };
          rows.push({
            key,
            label: fisicosMap.get(r.recursoId) ?? r.recursoId,
            etapaColor: etapa.cor,
            etapaNome: etapa.nome,
            atividadeNome: ativ.nome,
            tipo: 'equipamento',
            startMin: parseTime(s.horaInicio),
            endMin: parseTime(s.horaFim),
          });
        });
      }
    }
    return rows;
  }, [template, stateMap, espacosMap, tecnicosMap, fisicosMap]);

  async function handleConfirm() {
    if (!template) return;
    setConfirming(true);
    try {
      const atividades: TemplateAtividadeConfig[] = [];
      for (const etapa of template.etapas) {
        for (const ativ of etapa.atividades) {
          if (
            ativ.espacos.length === 0 &&
            ativ.recursosTecnicos.length === 0 &&
            ativ.equipamentos.length === 0
          )
            continue;
          atividades.push({
            nome: ativ.nome,
            espacos: ativ.espacos.map((esp, idx) => {
              const s = stateMap[makeKey(ativ.id, 'espaco', idx)] ?? {
                data: '',
                horaInicio: '',
                horaFim: '',
              };
              return {
                espacoId: esp.recursoId,
                data: s.data || null,
                horaInicio: s.horaInicio || null,
                horaFim: s.horaFim || null,
              };
            }),
            recursosTecnicos: ativ.recursosTecnicos.map((r, idx) => {
              const s = stateMap[makeKey(ativ.id, 'tecnico', idx)] ?? {
                data: '',
                horaInicio: '',
                horaFim: '',
              };
              return {
                recursoId: r.recursoId,
                quantidade: r.quantidade,
                data: s.data || null,
                horaInicio: s.horaInicio || null,
                horaFim: s.horaFim || null,
              };
            }),
            equipamentos: ativ.equipamentos.map((r, idx) => {
              const s = stateMap[makeKey(ativ.id, 'equipamento', idx)] ?? {
                data: '',
                horaInicio: '',
                horaFim: '',
              };
              return {
                recursoId: r.recursoId,
                quantidade: r.quantidade,
                data: s.data || null,
                horaInicio: s.horaInicio || null,
                horaFim: s.horaFim || null,
              };
            }),
          });
        }
      }
      await onConfirm(atividades);
    } catch {
      toast({ title: 'Erro ao criar gravação', variant: 'destructive' });
    } finally {
      setConfirming(false);
    }
  }

  function renderResourceRow(
    ativ: TemplateAtividade,
    tipo: 'espaco' | 'tecnico' | 'equipamento',
    idx: number,
    nome: string,
    quantidade?: number,
  ) {
    const key = makeKey(ativ.id, tipo, idx);
    const s = stateMap[key] ?? { data: '', horaInicio: '', horaFim: '' };
    return (
      <div
        key={key}
        className="grid grid-cols-[1fr_140px_100px_100px] gap-2 items-center py-1 border-b last:border-0"
      >
        <div className="text-xs text-foreground truncate">
          {nome}
          {quantidade && quantidade > 1 && (
            <span className="ml-1 text-muted-foreground">×{quantidade}</span>
          )}
        </div>
        <Input
          type="date"
          value={s.data}
          onChange={(e) => updateField(key, 'data', e.target.value)}
          className="h-7 text-xs"
          disabled={confirming}
        />
        <Input
          type="time"
          value={s.horaInicio}
          onChange={(e) => updateField(key, 'horaInicio', e.target.value)}
          className="h-7 text-xs"
          disabled={confirming}
        />
        <Input
          type="time"
          value={s.horaFim}
          onChange={(e) => updateField(key, 'horaFim', e.target.value)}
          className="h-7 text-xs"
          disabled={confirming}
        />
      </div>
    );
  }

  const hasAnyResource = template?.etapas.some((e) =>
    e.atividades.some(
      (a) => a.espacos.length > 0 || a.recursosTecnicos.length > 0 || a.equipamentos.length > 0,
    ),
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-[900px] max-w-[96vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Planear a partir do Template</DialogTitle>
          <DialogDescription>
            Defina as datas e horários para cada recurso do template{' '}
            <strong>{template?.nome}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* View toggle + Program info strip */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Toggle buttons — topo */}
          <div className="flex items-center gap-1 ml-auto">
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'form' ? 'default' : 'ghost'}
              className="h-7 gap-1.5 text-xs"
              onClick={() => setViewMode('form')}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Lista
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'gantt' ? 'default' : 'ghost'}
              className="h-7 gap-1.5 text-xs"
              onClick={() => setViewMode('gantt')}
            >
              <GanttChart className="h-3.5 w-3.5" />
              Gantt
            </Button>
          </div>
        </div>

        {/* Program info strip — abaixo dos botões */}
        {item && (
          <div className="flex items-center gap-4 px-3 py-2 rounded-md bg-muted/50 border flex-wrap">
            <InfoField label="Programa" value={item.programa ?? item.nome} />
            {item.episodio && (
              <>
                <div className="w-px h-6 bg-border shrink-0" />
                <InfoField label="Episódio" value={item.episodio} />
              </>
            )}
            {item.codigoProducao && (
              <>
                <div className="w-px h-6 bg-border shrink-0" />
                <InfoField label="Cód. Produção" value={item.codigoProducao} />
              </>
            )}
            {item.canal && (
              <>
                <div className="w-px h-6 bg-border shrink-0" />
                <InfoField label="Canal" value={item.canal} />
              </>
            )}
            {item.dataExibicao && (
              <>
                <div className="w-px h-6 bg-border shrink-0" />
                <InfoField label="Data" value={formatDateBR(item.dataExibicao)} />
              </>
            )}
            {item.horarioInicio && (
              <>
                <div className="w-px h-6 bg-border shrink-0" />
                <InfoField label="Início" value={item.horarioInicio.slice(0, 5)} />
              </>
            )}
            {item.duracao && (
              <>
                <div className="w-px h-6 bg-border shrink-0" />
                <InfoField label="Duração" value={item.duracao} />
              </>
            )}
          </div>
        )}

        {loadingCatalog ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground flex-1">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">A carregar catálogo...</span>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 pr-1">
              {viewMode === 'form' ? (
                <div className="space-y-5 py-2">
                  {template?.etapas.map((etapa) => (
                    <div key={etapa.id}>
                      <div
                        className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-md"
                        style={{ backgroundColor: `${etapa.cor}22` }}
                      >
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: etapa.cor }}
                        />
                        <span className="text-sm font-semibold">{etapa.nome}</span>
                      </div>

                      <div className="space-y-4 pl-2">
                        {etapa.atividades.map((ativ) => {
                          const hasResources =
                            ativ.espacos.length > 0 ||
                            ativ.recursosTecnicos.length > 0 ||
                            ativ.equipamentos.length > 0;
                          return (
                            <div key={ativ.id} className="border rounded-md overflow-hidden">
                              <div className="bg-muted/40 px-3 py-2 flex items-center justify-between">
                                <span className="text-sm font-medium">{ativ.nome}</span>
                                <span className="text-xs text-muted-foreground">
                                  {ativ.horaInicio} – {ativ.horaFim}
                                </span>
                              </div>

                              {!hasResources ? (
                                <div className="px-3 py-3 text-xs text-muted-foreground">
                                  Nenhum recurso nesta atividade.
                                </div>
                              ) : (
                                <div className="px-3 py-2 space-y-3">
                                  <div className="grid grid-cols-[1fr_140px_100px_100px] gap-2 text-[10px] text-muted-foreground font-medium pb-1">
                                    <span>Recurso</span>
                                    <span>Data</span>
                                    <span>Início</span>
                                    <span>Fim</span>
                                  </div>

                                  {ativ.espacos.length > 0 && (
                                    <div>
                                      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">
                                        Espaços
                                      </Label>
                                      {ativ.espacos.map((esp, idx) =>
                                        renderResourceRow(
                                          ativ,
                                          'espaco',
                                          idx,
                                          espacosMap.get(esp.recursoId) ?? esp.recursoId,
                                        ),
                                      )}
                                    </div>
                                  )}

                                  {ativ.recursosTecnicos.length > 0 && (
                                    <div>
                                      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">
                                        Recursos Técnicos
                                      </Label>
                                      {ativ.recursosTecnicos.map((r, idx) =>
                                        renderResourceRow(
                                          ativ,
                                          'tecnico',
                                          idx,
                                          tecnicosMap.get(r.recursoId) ?? r.recursoId,
                                          r.quantidade,
                                        ),
                                      )}
                                    </div>
                                  )}

                                  {ativ.equipamentos.length > 0 && (
                                    <div>
                                      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">
                                        Equipamentos
                                      </Label>
                                      {ativ.equipamentos.map((r, idx) =>
                                        renderResourceRow(
                                          ativ,
                                          'equipamento',
                                          idx,
                                          fisicosMap.get(r.recursoId) ?? r.recursoId,
                                          r.quantidade,
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {!hasAnyResource && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Este template não possui recursos configurados nas atividades.
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  <GanttView rows={ganttRows} />
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter className="border-t pt-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={confirming}>
            Voltar
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={confirming || loadingCatalog}
            className="gradient-primary hover:opacity-90"
          >
            {confirming && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Confirmar e Criar Gravação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
