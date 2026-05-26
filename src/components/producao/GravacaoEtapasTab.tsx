'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  gravacoesRelacionamentosApi,
  type GravacaoEspacoItem,
  type GravacaoEspacoResourceItem,
} from '@/modules/gravacoes/gravacoes-relacionamentos.api';

// ── helpers ───────────────────────────────────────────────────────────────────

function parseTime(t: string | null): number {
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

interface GanttRow {
  key: string;
  label: string;
  color: string;
  groupLabel: string;
  atividadeLabel: string | null;
  tipo: 'espaco' | 'tecnico' | 'equipamento';
  startMin: number;
  endMin: number;
}

interface EspacoWithResources {
  espaco: GravacaoEspacoItem;
  tecnicos: GravacaoEspacoResourceItem[];
  fisicos: GravacaoEspacoResourceItem[];
}

// ── color palette ─────────────────────────────────────────────────────────────

const PALETTE = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

const TIPO_LABEL: Record<string, string> = {
  espaco: 'Espaço',
  tecnico: 'Rec. Técnico',
  equipamento: 'Equipamento',
};

const TIPO_OPACITY: Record<string, string> = {
  espaco: 'cc',
  tecnico: '99',
  equipamento: '77',
};

// ── Gantt renderer ────────────────────────────────────────────────────────────

function GanttChart({ rows }: { rows: GanttRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        Nenhum espaço com horário definido encontrado.
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

  const tickInterval = duration <= 90 ? 15 : duration <= 240 ? 30 : 60;
  const firstTick = Math.ceil(minTime / tickInterval) * tickInterval;
  const ticks: number[] = [];
  for (let t = firstTick; t <= maxTime; t += tickInterval) ticks.push(t);

  const pct = (min: number) => `${((min - minTime) / duration) * 100}%`;
  const LEFT_COL = 160;

  // Group rows by groupLabel → atividadeLabel
  type AtivGroup = { atividadeLabel: string | null; rows: GanttRow[] };
  const groups: { label: string; color: string; atividades: AtivGroup[] }[] = [];
  for (const row of rows) {
    let g = groups.find((g) => g.label === row.groupLabel);
    if (!g) {
      g = { label: row.groupLabel, color: row.color, atividades: [] };
      groups.push(g);
    }
    let a = g.atividades.find((a) => a.atividadeLabel === row.atividadeLabel);
    if (!a) {
      a = { atividadeLabel: row.atividadeLabel, rows: [] };
      g.atividades.push(a);
    }
    a.rows.push(row);
  }

  return (
    <div className="text-xs select-none">
      {/* Time axis header */}
      <div className="flex border-b mb-2 pb-1 sticky top-0 bg-background z-10">
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
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            {/* Group header */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded mb-1"
              style={{ backgroundColor: `${group.color}22` }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: group.color }}
              />
              <span className="font-semibold text-[11px]">{group.label}</span>
            </div>

            {/* Atividades within this espaço */}
            {group.atividades.map((ativ) => (
              <div key={ativ.atividadeLabel ?? '__none__'} className="pl-2 mb-2">
                {ativ.atividadeLabel && (
                  <div className="text-[10px] text-muted-foreground font-medium mb-1 pl-1">
                    {ativ.atividadeLabel}
                  </div>
                )}
                <div className="space-y-0.5">
                  {ativ.rows.map((row) => {
                    const hasTime = row.startMin >= 0 && row.endMin > row.startMin;
                    const barColor = `${row.color}${TIPO_OPACITY[row.tipo] ?? 'aa'}`;
                    return (
                      <div key={row.key} className="flex items-center">
                        {/* Label */}
                        <div
                          style={{ width: LEFT_COL, minWidth: LEFT_COL }}
                          className="shrink-0 pr-2 flex items-center gap-1"
                        >
                          <span
                            className="text-[9px] px-1 py-0 rounded text-white leading-4 shrink-0"
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
                            <div className="absolute top-1 bottom-1 left-0 right-0 rounded border border-dashed border-muted-foreground/40" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

interface Props {
  gravacaoId: string;
}

export function GravacaoEtapasTab({ gravacaoId }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EspacoWithResources[]>([]);

  useEffect(() => {
    setLoading(true);
    gravacoesRelacionamentosApi
      .listEspacos(gravacaoId)
      .then(async (espacos) => {
        const results = await Promise.all(
          espacos.map(async (espaco) => {
            const [tecnicos, fisicos] = await Promise.all([
              gravacoesRelacionamentosApi
                .listEspacoResources(gravacaoId, espaco.id, 'tecnico')
                .then((r) => r.items),
              gravacoesRelacionamentosApi
                .listEspacoResources(gravacaoId, espaco.id, 'fisico')
                .then((r) => r.items),
            ]);
            return { espaco, tecnicos, fisicos };
          }),
        );
        setData(results);
      })
      .catch(() => toast({ title: 'Erro ao carregar espaços', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [gravacaoId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">A carregar espaços...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        Nenhum espaço associado a esta gravação. Adicione espaços no tabulador "Espaços".
      </p>
    );
  }

  // Build Gantt rows
  const rows: GanttRow[] = [];
  data.forEach(({ espaco, tecnicos, fisicos }, idx) => {
    const color = PALETTE[idx % PALETTE.length];
    const atividadeLabel = espaco.descricao ?? null;

    rows.push({
      key: `espaco:${espaco.id}`,
      label: espaco.espacoNome,
      color,
      groupLabel: espaco.espacoNome,
      atividadeLabel,
      tipo: 'espaco',
      startMin: parseTime(espaco.horaInicio),
      endMin: parseTime(espaco.horaFim),
    });

    tecnicos.forEach((r) => {
      rows.push({
        key: `tecnico:${r.id}`,
        label: r.recursoNome,
        color,
        groupLabel: espaco.espacoNome,
        atividadeLabel,
        tipo: 'tecnico',
        startMin: parseTime(r.horaInicio),
        endMin: parseTime(r.horaFim),
      });
    });

    fisicos.forEach((r) => {
      rows.push({
        key: `fisico:${r.id}`,
        label: r.recursoNome,
        color,
        groupLabel: espaco.espacoNome,
        atividadeLabel,
        tipo: 'equipamento',
        startMin: parseTime(r.horaInicio),
        endMin: parseTime(r.horaFim),
      });
    });
  });

  return (
    <div className="py-2">
      <GanttChart rows={rows} />
    </div>
  );
}
