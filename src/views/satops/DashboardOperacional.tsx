'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  ClipboardList,
  FileDown,
  Loader2,
  Radio,
  RefreshCw,
  Satellite,
  Search,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { IncidenciaGravacaoFormModal } from '@/components/producao/IncidenciaGravacaoFormModal';
import { JanelaResponsaveisModal } from '@/components/satops/JanelaResponsaveisModal';
import { JanelaRelatorioModal } from '@/components/satops/JanelaRelatorioModal';
import {
  ListFilterPanel,
  FilterSection,
  MultiChip,
  uniqueChips,
  chipsSubtitle,
} from '@/components/shared/ListFilter';
import { GroupingBar, type GroupOption } from '@/components/shared/GroupingBar';
import {
  ViewSwitcher,
  ColumnSelector,
  useListingView,
  type ColumnConfig,
  type ViewMode as ListingViewMode,
} from '@/components/listing';
import {
  ApiSatOpsRepository,
  type AlertaApiItem,
  type EstadoEventoApiItem,
  type JanelaApiItem,
  type SateliteApiItem,
} from '@/modules/satops/satops.api.repository';
import type { Checklist } from '@/components/satops/SateliteChecklistTab';
import { SateliteSignalGraph } from '@/components/satops/SateliteSignalGraph';

// ─── Dashboard listing config ─────────────────────────────────────────────────

const DASHBOARD_STORAGE_KEY = 'kreato_satops_dashboard';

const DASHBOARD_COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'satelite', label: 'Satélite', defaultVisible: true },
  { key: 'aberturaP', label: 'Ab. Prev.', defaultVisible: true },
  { key: 'fechoP', label: 'Fecho Prev.', defaultVisible: true },
  { key: 'delta', label: 'Δ', defaultVisible: true },
  { key: 'resp', label: 'Resp.', defaultVisible: true },
  { key: 'inc', label: 'Inc.', defaultVisible: true },
];

const DASHBOARD_GROUP_OPTIONS: GroupOption[] = [
  { key: 'estado', label: 'Estado' },
  { key: 'sateliteNome', label: 'Satélite' },
  { key: 'canal', label: 'Canal' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const satOpsRepo = new ApiSatOpsRepository();

function parseUtcDateTime(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

// Interpreta os horários armazenados como hora local (para cálculos de exibição ao utilizador)
function parseLocalDateTime(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const [y, mo, day] = date.split('-').map(Number);
  return new Date(y, mo - 1, day, h, m, 0, 0);
}

type EstadoJanela = 'Agendado' | 'Em Direto' | 'Excesso' | 'Concluído';

interface JanelaComEstado extends JanelaApiItem {
  estado: EstadoJanela;
  deltaMins: number | null;
}

function deriveEstado(janela: JanelaApiItem, nowUtc: Date): JanelaComEstado {
  // Treat "00:00" as unset — prevents accidental/browser-default values from triggering Em Direto
  const aberturaRealStr =
    janela.aberturaReal && janela.aberturaReal !== '00:00' ? janela.aberturaReal : '';
  const fechoRealStr = janela.fechoReal && janela.fechoReal !== '00:00' ? janela.fechoReal : '';
  const aberturaReal = parseUtcDateTime(janela.dataEvento, aberturaRealStr);
  const fechoReal = parseUtcDateTime(janela.dataEvento, fechoRealStr);
  const fechoPrev = parseUtcDateTime(janela.dataEvento, janela.fechoPrevisto);

  let estado: EstadoJanela = 'Agendado';
  let deltaMins: number | null = null;

  if (fechoReal) {
    estado = 'Concluído';
    if (fechoPrev) deltaMins = Math.round((fechoReal.getTime() - fechoPrev.getTime()) / 60000);
  } else if (aberturaReal) {
    if (fechoPrev && nowUtc > fechoPrev) {
      estado = 'Excesso';
      deltaMins = Math.round((nowUtc.getTime() - fechoPrev.getTime()) / 60000);
    } else {
      estado = 'Em Direto';
    }
  }

  return { ...janela, estado, deltaMins };
}

function labelEvento(janela: JanelaApiItem): string {
  return (
    (janela.tipoEvento === 'Grelha de Programas' ? janela.programaNome : janela.tituloEvento) ||
    janela.canal ||
    '—'
  );
}

function minutesToHHMM(mins: number): string {
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  const sign = mins < 0 ? '-' : '+';
  return `${sign}${h > 0 ? `${h}h ` : ''}${m}min`;
}

function totalActiveMinutes(janelas: JanelaComEstado[], nowUtc: Date): number {
  return janelas.reduce((acc, j) => {
    if (j.estado !== 'Em Direto' && j.estado !== 'Excesso') return acc;
    const start = parseUtcDateTime(j.dataEvento, j.aberturaReal);
    if (!start) return acc;
    return acc + Math.round((nowUtc.getTime() - start.getTime()) / 60000);
  }, 0);
}

function parseChecklist(raw: unknown): Checklist {
  if (!raw || !Array.isArray(raw)) return [];
  return raw as Checklist;
}

// Prioridade de estado para ordenação: Em Direto/Excesso → Agendado → Concluído
const ESTADO_PRIORITY: Record<EstadoJanela, number> = {
  'Em Direto': 0,
  Excesso: 1,
  Agendado: 2,
  Concluído: 3,
};

function sortJanelas(list: JanelaComEstado[]): JanelaComEstado[] {
  return [...list].sort((a, b) => {
    const pd = ESTADO_PRIORITY[a.estado] - ESTADO_PRIORITY[b.estado];
    if (pd !== 0) return pd;
    // dentro do mesmo estado: hora decrescente (mais recente primeiro)
    return (b.aberturaPrevia ?? '').localeCompare(a.aberturaPrevia ?? '');
  });
}

// ─── Alert evaluation ─────────────────────────────────────────────────────────

function getActiveAlertas(
  janela: JanelaComEstado,
  alertas: AlertaApiItem[],
  _nowUtc: Date,
): AlertaApiItem[] {
  if (janela.estado !== 'Em Direto' && janela.estado !== 'Excesso') return [];

  // Os horários armazenados são hora local — comparar com hora local actual
  const nowLocal = new Date();

  return alertas.filter((a) => {
    if (a.regra !== 'Antes') return false;
    const refValue = (janela as unknown as Record<string, unknown>)[a.campoReferencia] as
      | string
      | undefined;
    if (!refValue || refValue === '00:00') return false;
    const parts = refValue.split(':').map(Number);
    const h = parts[0],
      m = parts[1];
    if (isNaN(h) || isNaN(m)) return false;

    // Construir hora de referência em hora local (mesmo dia)
    const refTime = new Date(
      nowLocal.getFullYear(),
      nowLocal.getMonth(),
      nowLocal.getDate(),
      h,
      m,
      0,
      0,
    );

    const alertParts = (a.tempoParaAlerta || '00:00:00').split(':').map(Number);
    const alertMs =
      ((alertParts[0] * 60 + (alertParts[1] ?? 0)) * 60 + (alertParts[2] ?? 0)) * 1000;
    if (alertMs === 0) return false;

    // Ícone aparece quando (refTime - nowLocal) <= tempoParaAlerta
    // ou seja, nowLocal >= (refTime - alertMs)
    const alertStart = new Date(refTime.getTime() - alertMs);
    return nowLocal >= alertStart;
  });
}

// ─── Confirm action type ──────────────────────────────────────────────────────

type ConfirmField = 'aberturaReal' | 'fechoReal';

interface ConfirmAction {
  janela: JanelaApiItem;
  field: ConfirmField;
  value: string;
}

// ─── UTC clock — relógio próprio de 1 s ──────────────────────────────────────

function UtcClock({ onRefresh }: { onRefresh: () => void }) {
  const [now, setNow] = useState(() => new Date());
  const { t } = useLanguage();

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(tick);
  }, []);

  // UTC
  const utcHH = String(now.getUTCHours()).padStart(2, '0');
  const utcMM = String(now.getUTCMinutes()).padStart(2, '0');
  const utcSS = String(now.getUTCSeconds()).padStart(2, '0');

  // Local
  const localHH = String(now.getHours()).padStart(2, '0');
  const localMM = String(now.getMinutes()).padStart(2, '0');
  const localSS = String(now.getSeconds()).padStart(2, '0');

  // Abreviatura do timezone local (ex: "WEST", "CET", "BRT")
  const tzAbbr =
    Intl.DateTimeFormat('en', { timeZoneName: 'short' })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value ?? '';

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 bg-muted/60 border rounded-lg px-3 py-2">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />

        {/* UTC */}
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] leading-none mb-0.5">
            UTC
          </p>
          <p className="font-mono font-bold tabular-nums leading-none">
            <span className="text-2xl">
              {utcHH}:{utcMM}
            </span>
            <span className="text-base text-muted-foreground">:{utcSS}</span>
          </p>
        </div>

        {/* Separador */}
        <div className="w-px h-6 bg-border" />

        {/* Local */}
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] leading-none mb-0.5">
            {tzAbbr}
          </p>
          <p className="font-mono font-bold tabular-nums leading-none text-muted-foreground">
            <span className="text-2xl">
              {localHH}:{localMM}
            </span>
            <span className="text-base">:{localSS}</span>
          </p>
        </div>
      </div>

      <Button variant="outline" size="icon" onClick={onRefresh} title={t('common.refresh')}>
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Blinking live dot — três tamanhos ───────────────────────────────────────

function LiveDot({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' }[size];
  return (
    <span className={`relative flex ${dim} shrink-0`}>
      {/* anel externo — pulsa mais lentamente */}
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
      {/* núcleo com glow */}
      <span
        className={`relative inline-flex rounded-full ${dim} bg-green-500`}
        style={{ boxShadow: '0 0 8px 2px rgba(34,197,94,0.7)' }}
      />
    </span>
  );
}

// ─── Editable time cell ───────────────────────────────────────────────────────

function EditableTimeCell({
  value,
  onRequestConfirm,
  disabled,
}: {
  value: string;
  onRequestConfirm: (newValue: string) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // Track whether the user actually typed — prevents browser auto-fill (00:00) from being saved
  const userTypedRef = useRef(false);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEdit = () => {
    if (disabled) return;
    if (!value) {
      const now = new Date();
      const localTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setDraft(localTime);
      userTypedRef.current = true;
    } else {
      userTypedRef.current = false;
      setDraft(value);
    }
    setEditing(true);
  };

  const tryCommit = () => {
    setEditing(false);
    // Only commit if the user explicitly typed a new value
    if (!userTypedRef.current) return;
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onRequestConfirm(trimmed);
  };

  const cancel = () => {
    setEditing(false);
    setDraft('');
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="time"
        value={draft}
        onChange={(e) => {
          userTypedRef.current = true;
          setDraft(e.target.value);
        }}
        onBlur={tryCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') cancel();
        }}
        className="font-mono text-xs w-20 border rounded px-1 py-0.5 text-center bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      disabled={disabled}
      title={disabled ? undefined : 'Clique para editar'}
      className={`font-mono text-xs min-w-[48px] text-center rounded px-1 py-0.5 transition-colors ${
        disabled
          ? 'cursor-default text-muted-foreground'
          : 'cursor-pointer hover:bg-muted hover:text-primary'
      }`}
    >
      {value || <span className="text-muted-foreground/50">—</span>}
    </button>
  );
}

// ─── Estado badge — cor vinda dos EstadosEvento ───────────────────────────────

// Fallback colors quando o nome não corresponde a nenhum EstadoEvento configurado
const ESTADO_FALLBACK: Record<
  EstadoJanela,
  { bg: string; text: string; border: string; label: string }
> = {
  'Em Direto': { bg: '#22c55e22', text: '#16a34a', border: '#22c55e55', label: 'Em Direto' },
  Excesso: { bg: '#ef444422', text: '#dc2626', border: '#ef444455', label: 'Excesso' },
  Concluído: { bg: 'transparent', text: '#6b7280', border: '#d1d5db', label: 'Concluído' },
  Agendado: { bg: '#3b82f622', text: '#2563eb', border: '#3b82f655', label: 'Agendado' },
};

function EstadoBadge({ estado, cor }: { estado: EstadoJanela; cor?: string | null }) {
  if (cor) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
        style={{
          backgroundColor: cor + '25',
          color: cor,
          borderColor: cor + '60',
        }}
      >
        {estado}
      </span>
    );
  }

  const fb = ESTADO_FALLBACK[estado];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
      style={{ backgroundColor: fb.bg, color: fb.text, borderColor: fb.border }}
    >
      {fb.label}
    </span>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

type KpiColor = 'blue' | 'green' | 'violet' | 'amber';

const KPI_COLOR_MAP: Record<
  KpiColor,
  { card: string; iconBg: string; icon: string; value: string }
> = {
  blue: {
    card: 'border-blue-500/30 bg-blue-500/5',
    iconBg: 'bg-blue-500/10',
    icon: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
  },
  green: {
    card: 'border-green-500/30 bg-green-500/5',
    iconBg: 'bg-green-500/10',
    icon: 'text-green-600 dark:text-green-400',
    value: 'text-green-700 dark:text-green-300',
  },
  violet: {
    card: 'border-violet-500/30 bg-violet-500/5',
    iconBg: 'bg-violet-500/10',
    icon: 'text-violet-600 dark:text-violet-400',
    value: 'text-violet-700 dark:text-violet-300',
  },
  amber: {
    card: 'border-amber-500/30 bg-amber-500/5',
    iconBg: 'bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
  },
};

function KpiCard({
  icon: Icon,
  title,
  value,
  sub,
  color,
  live,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  sub?: string;
  color: KpiColor;
  live?: boolean;
}) {
  const c = KPI_COLOR_MAP[color];
  return (
    <Card className={`flex-1 min-w-0 border ${c.card}`}>
      <CardContent className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">{title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {live && <LiveDot size="sm" />}
              <p className={`text-xl font-bold tabular-nums leading-tight ${c.value}`}>{value}</p>
            </div>
            {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`p-1.5 rounded-lg shrink-0 ${c.iconBg}`}>
            <Icon className={`h-4 w-4 ${c.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Checklist panel — editável, com auto-save ────────────────────────────────

interface ChecklistPanelProps {
  janela: JanelaApiItem | null;
  sateliteMap: Map<string, SateliteApiItem>;
  onChecklistSaved: (updated: JanelaApiItem) => void;
}

function ChecklistPanel({ janela, sateliteMap, onChecklistSaved }: ChecklistPanelProps) {
  const { toast } = useToast();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // checklist local: vem do janela.checklist ou do template do satélite
  const buildInitial = useCallback(
    (j: JanelaApiItem | null): Checklist => {
      if (!j) return [];
      if (j.checklist && Array.isArray(j.checklist) && j.checklist.length > 0)
        return j.checklist as Checklist;
      const sat = sateliteMap.get(j.sateliteId);
      return parseChecklist(sat?.checklist);
    },
    [sateliteMap],
  );

  const [checklist, setChecklist] = useState<Checklist>(() => buildInitial(janela));
  const [saving, setSaving] = useState(false);
  const [openEtapas, setOpenEtapas] = useState<Set<string>>(new Set());

  // Re-inicializa quando a janela seleccionada muda
  useEffect(() => {
    const cl = buildInitial(janela);
    setChecklist(cl);
    setOpenEtapas(new Set(cl.map((e) => e.id)));
  }, [janela?.id, buildInitial]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleEtapa = (id: string) =>
    setOpenEtapas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleCheck = (etapaId: string, atividadeId: string, concluida: boolean) => {
    if (!janela) return;

    const updated = checklist.map((e) =>
      e.id === etapaId
        ? {
            ...e,
            atividades: e.atividades.map((a) => (a.id === atividadeId ? { ...a, concluida } : a)),
          }
        : e,
    );
    setChecklist(updated);

    // Debounce: cancela save anterior e agenda novo após 400 ms
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const saved = await satOpsRepo.saveJanela({ ...janela, checklist: updated });
        onChecklistSaved(saved);
      } catch {
        toast({ title: 'Erro ao guardar checklist', variant: 'destructive' });
      } finally {
        setSaving(false);
      }
    }, 400);
  };

  const totalItems = checklist.reduce((a, e) => a + e.atividades.length, 0);
  const totalDone = checklist.reduce(
    (a, e) => a + e.atividades.filter((at) => at.concluida).length,
    0,
  );
  const sat = janela ? sateliteMap.get(janela.sateliteId) : null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="h-4 w-4 shrink-0" />
          <span className="flex-1 min-w-0">
            Checklist
            {sat && <span className="font-normal text-muted-foreground"> — {sat.nome}</span>}
          </span>
          {saving && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
          )}
          {totalItems > 0 && !saving && (
            <span className="text-xs font-normal text-muted-foreground shrink-0">
              {totalDone}/{totalItems}
            </span>
          )}
        </CardTitle>
        {totalItems > 0 && (
          <Progress value={Math.round((totalDone / totalItems) * 100)} className="h-1 mt-1" />
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-2 overflow-y-auto">
        {!janela ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Selecione uma janela para ver o checklist.
          </p>
        ) : checklist.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Sem checklist configurado para este satélite.
          </p>
        ) : (
          checklist.map((etapa) => {
            const isOpen = openEtapas.has(etapa.id);
            const done = etapa.atividades.filter((a) => a.concluida).length;
            return (
              <div
                key={etapa.id}
                className="border rounded-lg overflow-hidden"
                style={{ borderLeftWidth: 3, borderLeftColor: etapa.cor }}
              >
                <Collapsible open={isOpen} onOpenChange={() => toggleEtapa(etapa.id)}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-left"
                      style={{ backgroundColor: etapa.cor + '15' }}
                    >
                      {isOpen ? (
                        <ChevronDown
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: etapa.cor }}
                        />
                      ) : (
                        <ChevronRight
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: etapa.cor }}
                        />
                      )}
                      <span
                        className="text-xs font-bold uppercase tracking-wider flex-1 truncate"
                        style={{ color: etapa.cor }}
                      >
                        {etapa.nome}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {done}/{etapa.atividades.length}
                      </span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-3 py-2 space-y-1.5">
                      {etapa.atividades.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-1">Sem atividades.</p>
                      ) : (
                        etapa.atividades.map((a) => (
                          <div key={a.id} className="flex items-center gap-2 group">
                            <Checkbox
                              id={`ck-${a.id}`}
                              checked={a.concluida}
                              onCheckedChange={(v) => handleCheck(etapa.id, a.id, v === true)}
                            />
                            <label
                              htmlFor={`ck-${a.id}`}
                              className={`text-xs flex-1 cursor-pointer select-none ${
                                a.concluida ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              {a.nome}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ─── Live progress bar ────────────────────────────────────────────────────────

function LiveProgressBar({ janela, now }: { janela: JanelaApiItem; now: Date }) {
  // Usa hora local: os horários armazenados são hora local, não UTC
  const start = parseLocalDateTime(janela.dataEvento, janela.aberturaReal);
  const end = parseLocalDateTime(janela.dataEvento, janela.fechoPrevisto);

  // Fórmula: Fecho Previsto (hora local) − Hora local atual
  const totalMs = start && end ? end.getTime() - start.getTime() : 0;
  const remainingMs = end ? end.getTime() - now.getTime() : 0;
  const elapsedMs = totalMs > 0 ? totalMs - remainingMs : 0;

  // Barra cresce da esquerda proporcionalmente ao tempo decorrido
  const progress = totalMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100)) : 0;

  const isOver = remainingMs < 0;
  const absSecs = Math.abs(Math.floor(remainingMs / 1000));
  const displayMins = Math.floor(absSecs / 60);
  const displaySecs = absSecs % 60;

  // Verde → âmbar quando resta menos de 25% → vermelho quando excedido
  const barColor = isOver ? 'bg-red-500' : progress >= 75 ? 'bg-amber-500' : 'bg-green-500';

  const timeColor = isOver
    ? 'text-red-500'
    : progress >= 75
      ? 'text-amber-500'
      : 'text-muted-foreground';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
        <span>{janela.aberturaReal || '—'}</span>
        <span>{janela.fechoPrevisto || '—'}</span>
      </div>

      {/* pista + barra que cresce da esquerda em tempo real */}
      <div className="relative h-2.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000 ease-linear ${barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {end && (
        <p
          className={`text-[11px] text-center font-mono tabular-nums ${
            isOver ? `${timeColor} font-semibold` : timeColor
          }`}
        >
          {isOver
            ? `+${displayMins}m ${String(displaySecs).padStart(2, '0')}s em excesso`
            : absSecs === 0
              ? 'A encerrar'
              : `${displayMins}m ${String(displaySecs).padStart(2, '0')}s restantes`}
        </p>
      )}
    </div>
  );
}

// ─── Active janela panel ──────────────────────────────────────────────────────

function ActiveJanelaPanel({
  janela,
  liveJanelas,
  onSelectJanela,
  sateliteMap,
  nowUtc,
}: {
  janela: JanelaComEstado | null;
  liveJanelas: JanelaComEstado[];
  onSelectJanela: (id: string) => void;
  sateliteMap: Map<string, SateliteApiItem>;
  nowUtc: Date;
}) {
  const { t } = useLanguage();

  if (!janela) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Radio className="h-4 w-4" />
            {t('satops.dashboard.activeWindow')}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          <Satellite className="h-8 w-8 mx-auto mb-2 opacity-25" />
          {t('satops.dashboard.noActiveWindow')}
        </CardContent>
      </Card>
    );
  }

  const sat = sateliteMap.get(janela.sateliteId);

  return (
    <Card className="border-green-500/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <LiveDot size="md" />
          {t('satops.dashboard.activeWindow')}
        </CardTitle>
      </CardHeader>

      {/* ── Seletor de janela — visível quando há mais de uma ativa ── */}
      {liveJanelas.length > 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {liveJanelas.map((lj) => {
            const isSelected = lj.id === janela.id;
            const isExcesso = lj.estado === 'Excesso';
            return (
              <button
                key={lj.id}
                type="button"
                onClick={() => onSelectJanela(lj.id)}
                className={`text-[10px] font-medium px-2 py-1 rounded border transition-colors truncate max-w-[140px] ${
                  isSelected
                    ? isExcesso
                      ? 'bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400'
                      : 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                }`}
                title={labelEvento(lj)}
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${isExcesso ? 'bg-red-500' : 'bg-green-500'}`}
                />
                {labelEvento(lj) || lj.sateliteNome || '—'}
              </button>
            );
          })}
        </div>
      )}

      <CardContent className="space-y-3">
        <div>
          <p className="text-base font-semibold truncate">{labelEvento(janela)}</p>
          <p className="text-xs text-muted-foreground">
            {sat?.nome ?? janela.sateliteNome}
            {sat?.transponder ? ` · ${sat.transponder}` : ''}
          </p>
          {janela.canal && <p className="text-xs text-muted-foreground">{janela.canal}</p>}
        </div>

        <LiveProgressBar janela={janela} now={nowUtc} />

        {sat &&
          (sat.transponder ||
            sat.frequenciaUplink ||
            sat.polarizacao ||
            sat.symbolRate ||
            sat.fec) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {sat.transponder && (
                  <div>
                    <span className="text-muted-foreground">Transponder </span>
                    <span className="font-mono font-medium">{sat.transponder}</span>
                  </div>
                )}
                {sat.frequenciaUplink && (
                  <div>
                    <span className="text-muted-foreground">Freq. Uplink </span>
                    <span className="font-mono font-medium">{sat.frequenciaUplink}</span>
                  </div>
                )}
                {sat.polarizacao && (
                  <div>
                    <span className="text-muted-foreground">Polarização </span>
                    <span className="font-mono font-medium">{sat.polarizacao}</span>
                  </div>
                )}
                {sat.symbolRate && (
                  <div>
                    <span className="text-muted-foreground">Symbol Rate </span>
                    <span className="font-mono font-medium">{sat.symbolRate}</span>
                  </div>
                )}
                {sat.fec && (
                  <div>
                    <span className="text-muted-foreground">FEC </span>
                    <span className="font-mono font-medium">{sat.fec}</span>
                  </div>
                )}
              </div>
            </>
          )}

        {janela.confirmacaoNocNome && (
          <>
            <Separator />
            <div className="text-xs">
              <span className="text-muted-foreground">NOC </span>
              <span className="font-medium">{janela.confirmacaoNocNome}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Agenda ───────────────────────────────────────────────────────────────────

function AgendaPanel({
  janelas,
  estadosColorMap,
}: {
  janelas: JanelaComEstado[];
  estadosColorMap: Map<string, string>;
}) {
  const { t } = useLanguage();
  const sorted = [...janelas].sort((a, b) =>
    (a.aberturaPrevia ?? '').localeCompare(b.aberturaPrevia ?? ''),
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {t('satops.dashboard.todayAgenda')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t('satops.dashboard.noJanelasToday')}
          </p>
        ) : (
          <div className="divide-y">
            {sorted.map((j) => (
              <div key={j.id} className="flex items-center gap-2 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {(j.estado === 'Em Direto' || j.estado === 'Excesso') && <LiveDot size="sm" />}
                    <p className="text-xs font-medium truncate">{labelEvento(j)}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {j.aberturaPrevia || '??:??'} → {j.fechoPrevisto || '??:??'} UTC
                  </p>
                </div>
                <EstadoBadge
                  estado={j.estado}
                  cor={estadosColorMap.get(j.estado.toLowerCase()) ?? null}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardOperacional() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [janelas, setJanelas] = useState<JanelaApiItem[]>([]);
  const [sateliteMap, setSateliteMap] = useState<Map<string, SateliteApiItem>>(new Map());
  const [estadosColorMap, setEstadosColorMap] = useState<Map<string, string>>(new Map());
  const [alertas, setAlertas] = useState<AlertaApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nowUtc, setNowUtc] = useState<Date>(new Date());
  const [selectedJanelaId, setSelectedJanelaId] = useState<string | null>(null);
  const [selectedActivePanelId, setSelectedActivePanelId] = useState<string | null>(null);
  const [incidenciaJanela, setIncidenciaJanela] = useState<JanelaApiItem | null>(null);
  const [responsaveisJanela, setResponsaveisJanela] = useState<JanelaApiItem | null>(null);
  const [relatorioJanela, setRelatorioJanela] = useState<JanelaApiItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  // ── Table controls ────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterEstados, setFilterEstados] = useState<string[]>([]);
  const [filterSatelites, setFilterSatelites] = useState<string[]>([]);
  const [groupByKeys, setGroupByKeys] = useState<string[]>([]);
  const [groupCollapsedIds, setGroupCollapsedIds] = useState<Set<string>>(new Set());

  const { mode, setMode, optionalColumns, visibleColumnKeys, toggleColumn, resetColumns } =
    useListingView({
      storageKey: DASHBOARD_STORAGE_KEY,
      defaultMode: 'list',
      columns: DASHBOARD_COLUMN_CONFIG,
    });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [janelasRes, satelitesRes, estadosRes, alertasRes] = await Promise.all([
        satOpsRepo.listJanelas(),
        satOpsRepo.listSatelites(),
        satOpsRepo.listEstadosEvento(),
        satOpsRepo.listAlertas(),
      ]);

      setJanelas(janelasRes.data);
      setAlertas(alertasRes.data);

      const satMap = new Map<string, SateliteApiItem>();
      satelitesRes.data.forEach((s) => satMap.set(s.id, s));
      setSateliteMap(satMap);

      const colorMap = new Map<string, string>();
      estadosRes.data.forEach((e: EstadoEventoApiItem) => {
        if (e.nome && e.cor) colorMap.set(e.nome.toLowerCase().trim(), e.cor);
      });
      setEstadosColorMap(colorMap);
    } catch {
      toast({ title: t('satops.dashboard.loadError'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // Relógio de 1 s — garante que alertas e mudanças de estado são detetados sem lag
  useEffect(() => {
    const tick = setInterval(() => setNowUtc(new Date()), 1_000);
    return () => clearInterval(tick);
  }, []);

  // ── Confirm save ──────────────────────────────────────────────────────────────

  const handleConfirmSave = async () => {
    if (!confirmAction) return;
    setSaving(true);
    try {
      await satOpsRepo.saveJanela({
        ...confirmAction.janela,
        [confirmAction.field]: confirmAction.value,
      });
      await fetchData();
      toast({ title: t('satops.dashboard.saveSuccess') });
    } catch {
      toast({ title: t('satops.dashboard.saveError'), variant: 'destructive' });
    } finally {
      setSaving(false);
      setConfirmAction(null);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────────

  const today = nowUtc.toISOString().slice(0, 10);
  const todayJanelas = janelas.filter((j) => j.dataEvento === today);
  const todayWithEstado: JanelaComEstado[] = todayJanelas.map((j) => deriveEstado(j, nowUtc));

  const liveJanelas = todayWithEstado.filter(
    (j) => j.estado === 'Em Direto' || j.estado === 'Excesso',
  );
  // Janela activa no painel lateral: respeita a selecção do utilizador, senão usa a primeira
  const activeJanela =
    liveJanelas.find((j) => j.id === selectedActivePanelId) ?? liveJanelas[0] ?? null;
  const totalActive = totalActiveMinutes(todayWithEstado, nowUtc);

  const totalResponsaveis = new Set(
    todayJanelas.flatMap((j) => (j.responsaveis ?? []).map((r) => r.recursoHumanoId)),
  ).size;

  // Ordenação: Em Direto → Excesso → Agendado → Concluído, depois hora decrescente
  const sorted = sortJanelas(todayWithEstado);

  // ── Search + Filter ───────────────────────────────────────────────────────
  const filtered = sorted.filter((j) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !labelEvento(j).toLowerCase().includes(q) &&
        !(j.sateliteNome ?? '').toLowerCase().includes(q)
      )
        return false;
    }
    if (filterEstados.length > 0 && !filterEstados.includes(j.estado)) return false;
    if (filterSatelites.length > 0 && !filterSatelites.includes(j.sateliteNome ?? '')) return false;
    return true;
  });

  const filterActiveCount = filterEstados.length + filterSatelites.length;

  // ── Options for filter chips ──────────────────────────────────────────────
  const estadoOptions = uniqueChips(sorted, 'estado');
  const sateliteOptions = uniqueChips(sorted, 'sateliteNome');

  // ── Grouping ──────────────────────────────────────────────────────────────
  const availableGroupOptions = DASHBOARD_GROUP_OPTIONS.filter((o) => !groupByKeys.includes(o.key));
  const activeGroupOptions = groupByKeys
    .map((k) => DASHBOARD_GROUP_OPTIONS.find((o) => o.key === k)!)
    .filter(Boolean);

  type FlatRow =
    | { type: 'group'; depth: number; groupKey: string; label: string; count: number }
    | { type: 'item'; item: JanelaComEstado; idx: number };

  const flatRows: FlatRow[] = (() => {
    if (groupByKeys.length === 0)
      return filtered.map<FlatRow>((item, idx) => ({ type: 'item', item, idx }));

    const [k0, k1] = groupByKeys;
    const map0 = new Map<string, JanelaComEstado[]>();
    filtered.forEach((j) => {
      const v = String((j as unknown as Record<string, unknown>)[k0] ?? '') || '(Vazio)';
      if (!map0.has(v)) map0.set(v, []);
      map0.get(v)!.push(j);
    });

    const rows: FlatRow[] = [];
    map0.forEach((g0Items, g0Label) => {
      const g0Key = `${k0}::${g0Label}`;
      rows.push({
        type: 'group',
        depth: 0,
        groupKey: g0Key,
        label: g0Label,
        count: g0Items.length,
      });
      if (!groupCollapsedIds.has(g0Key)) {
        if (k1) {
          const map1 = new Map<string, JanelaComEstado[]>();
          g0Items.forEach((j) => {
            const v = String((j as unknown as Record<string, unknown>)[k1] ?? '') || '(Vazio)';
            if (!map1.has(v)) map1.set(v, []);
            map1.get(v)!.push(j);
          });
          map1.forEach((g1Items, g1Label) => {
            const g1Key = `${g0Key}|${k1}::${g1Label}`;
            rows.push({
              type: 'group',
              depth: 1,
              groupKey: g1Key,
              label: g1Label,
              count: g1Items.length,
            });
            if (!groupCollapsedIds.has(g1Key)) {
              g1Items.forEach((item, idx) => rows.push({ type: 'item', item, idx }));
            }
          });
        } else {
          g0Items.forEach((item, idx) => rows.push({ type: 'item', item, idx }));
        }
      }
    });
    return rows;
  })();

  // All group IDs (for collapse-all toggle)
  const allGroupIds = new Set(
    flatRows
      .filter((r): r is Extract<FlatRow, { type: 'group' }> => r.type === 'group')
      .map((r) => r.groupKey),
  );
  const allCollapsed =
    allGroupIds.size > 0 && [...allGroupIds].every((id) => groupCollapsedIds.has(id));

  // ── Column visibility helper ──────────────────────────────────────────────
  const col = (key: string) => visibleColumnKeys.includes(key);

  // Janela seleccionada — auto-seleciona a primeira ativa se ainda não houver selecção
  const selectedJanela: JanelaApiItem | null =
    janelas.find((j) => j.id === selectedJanelaId) ?? sorted[0] ?? null;

  // Callback para o ChecklistPanel actualizar a lista sem re-fetch completo
  const handleChecklistSaved = useCallback((updated: JanelaApiItem) => {
    setJanelas((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  }, []);

  // ── Confirm dialog texts ──────────────────────────────────────────────────────

  const isOpeningSignal = confirmAction?.field === 'aberturaReal';
  const confirmTitle = isOpeningSignal
    ? t('satops.dashboard.confirmOpenSignal')
    : t('satops.dashboard.confirmCloseSignal');
  const confirmDesc = (
    isOpeningSignal
      ? t('satops.dashboard.confirmOpenSignalDesc')
      : t('satops.dashboard.confirmCloseSignalDesc')
  ).replace('{time}', confirmAction?.value ?? '');

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-3 pt-0">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t('satops.dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('satops.dashboard.description')}
          </p>
        </div>
        <UtcClock onRefresh={fetchData} />
      </div>

      {/* ── KPI cards ── */}
      <div className="flex gap-2 flex-wrap">
        <KpiCard
          icon={CalendarDays}
          title={t('satops.dashboard.kpiToday')}
          value={todayJanelas.length}
          sub={today}
          color="blue"
        />
        <KpiCard
          icon={Radio}
          title={t('satops.dashboard.kpiLive')}
          value={liveJanelas.length}
          color="green"
          live={liveJanelas.length > 0}
          sub={liveJanelas.length > 0 ? t('satops.dashboard.kpiLiveSub') : undefined}
        />
        <KpiCard
          icon={Clock}
          title={t('satops.dashboard.kpiActiveTime')}
          value={
            totalActive >= 60
              ? `${Math.floor(totalActive / 60)}h ${totalActive % 60}min`
              : `${totalActive} min`
          }
          sub={t('satops.dashboard.kpiActiveTimeSub')}
          color="violet"
        />
        <KpiCard
          icon={Users}
          title={t('satops.dashboard.kpiResponsaveis')}
          value={totalResponsaveis}
          sub={t('satops.dashboard.kpiResponsaveisSub')}
          color="amber"
        />
      </div>

      {/* ── Satellite signal graphs (uma por janela com Simul. + Em Direto) ── */}
      {(() => {
        const simJanelas = liveJanelas
          .filter((j) => j.simulacao && j.estado === 'Em Direto')
          .slice(0, 4);
        if (simJanelas.length === 0) return null;
        const colsClass =
          simJanelas.length === 1
            ? 'grid-cols-1'
            : simJanelas.length === 2
              ? 'grid-cols-2'
              : simJanelas.length === 3
                ? 'grid-cols-3'
                : 'grid-cols-4';
        return (
          <div className={`grid gap-3 ${colsClass}`}>
            {simJanelas.map((j) => (
              <SateliteSignalGraph
                key={j.id}
                janelaNome={labelEvento(j)}
                sateliteNome={j.sateliteNome}
                compact={simJanelas.length > 1}
              />
            ))}
          </div>
        );
      })()}

      {/* ── Main layout ── */}
      <div className="flex gap-4 items-start flex-col lg:flex-row">
        {/* ── Janelas table ── */}
        <Card className="flex-1 min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 mb-2">
              <Satellite className="h-4 w-4" />
              {t('satops.dashboard.janelasTodayTitle')}
              {liveJanelas.length > 0 && (
                <span className="flex items-center gap-2 text-xs font-normal text-green-600 dark:text-green-400">
                  <LiveDot size="sm" />
                  {liveJanelas.length} {t('satops.dashboard.kpiLiveSub')}
                </span>
              )}
            </CardTitle>

            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar..."
                  className="pl-8 h-8 text-sm"
                />
              </div>

              <ListFilterPanel
                activeCount={filterActiveCount}
                resultCount={filtered.length}
                entityLabel="janelas"
                onClear={() => {
                  setFilterEstados([]);
                  setFilterSatelites([]);
                }}
              >
                <FilterSection title="Estado" subtitle={chipsSubtitle(filterEstados)} defaultOpen>
                  <MultiChip
                    options={estadoOptions}
                    selected={filterEstados}
                    onChange={setFilterEstados}
                  />
                </FilterSection>
                <FilterSection title="Satélite" subtitle={chipsSubtitle(filterSatelites)}>
                  <MultiChip
                    options={sateliteOptions}
                    selected={filterSatelites}
                    onChange={setFilterSatelites}
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

              <ViewSwitcher mode={mode} onModeChange={(m: ListingViewMode) => setMode(m)} />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* GroupingBar — sempre visível, gerencia agrupamento multi-nível */}
            <GroupingBar
              activeGroups={activeGroupOptions}
              availableGroups={availableGroupOptions}
              allCollapsed={allCollapsed}
              onAdd={(key) => {
                setGroupByKeys((prev) => [...prev, key]);
                setGroupCollapsedIds(new Set());
              }}
              onRemove={(key) => {
                setGroupByKeys((prev) => prev.filter((k) => k !== key));
                setGroupCollapsedIds(new Set());
              }}
              onClear={() => {
                setGroupByKeys([]);
                setGroupCollapsedIds(new Set());
              }}
              onToggleCollapseAll={() =>
                setGroupCollapsedIds((prev) =>
                  prev.size >= allGroupIds.size ? new Set() : new Set(allGroupIds),
                )
              }
            />

            {sorted.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <Satellite className="h-8 w-8 mx-auto mb-2 opacity-20" />
                {t('satops.dashboard.noJanelasToday')}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <Search className="h-6 w-6 mx-auto mb-2 opacity-30" />
                Nenhuma janela corresponde aos filtros
              </div>
            ) : mode === 'cards' ? (
              /* ── Cards view ── */
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {flatRows.map((row, ri) => {
                  if (row.type === 'group') {
                    return (
                      <div key={`grp-${ri}`} className="col-span-full">
                        <button
                          type="button"
                          onClick={() =>
                            setGroupCollapsedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(row.groupKey)) next.delete(row.groupKey);
                              else next.add(row.groupKey);
                              return next;
                            })
                          }
                          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 mt-2 hover:text-foreground"
                        >
                          <ChevronDown
                            className={`h-3 w-3 transition-transform ${groupCollapsedIds.has(row.groupKey) ? '-rotate-90' : ''}`}
                          />
                          {row.label}{' '}
                          <span className="font-normal normal-case tracking-normal">
                            ({row.count})
                          </span>
                        </button>
                      </div>
                    );
                  }
                  const j = row.item;
                  const isLive = j.estado === 'Em Direto' || j.estado === 'Excesso';
                  const isConcluido = j.estado === 'Concluído';
                  const estadoCor = estadosColorMap.get(j.estado.toLowerCase()) ?? null;
                  const activeAlertas = getActiveAlertas(j, alertas, nowUtc);
                  const isSelected = j.id === selectedJanela?.id;
                  return (
                    <div
                      key={j.id}
                      onClick={() => setSelectedJanelaId(j.id)}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${isSelected ? 'ring-1 ring-primary border-primary/40' : isLive ? 'border-green-500/40 bg-green-500/5 hover:bg-green-500/10' : 'hover:bg-muted/40'}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isLive && j.estado === 'Em Direto' && <LiveDot size="sm" />}
                          {isLive && j.estado === 'Excesso' && (
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          )}
                          {activeAlertas.length > 0 && (
                            <Bell className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />
                          )}
                          <p className="font-semibold text-sm truncate">{labelEvento(j)}</p>
                        </div>
                        <EstadoBadge estado={j.estado} cor={estadoCor} />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{j.sateliteNome || '—'}</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono">
                        <div>
                          <span className="text-muted-foreground text-[10px]">Ab. Real </span>
                          <span>{j.aberturaReal || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px]">Fecho Prev. </span>
                          <span>{j.fechoPrevisto || '—'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px]">Fecho Real </span>
                          <span>{j.fechoReal || '—'}</span>
                        </div>
                        {j.deltaMins !== null && (
                          <div>
                            <span className="text-muted-foreground text-[10px]">Δ </span>
                            <span
                              className={
                                j.deltaMins > 0
                                  ? 'text-red-600'
                                  : j.deltaMins < 0
                                    ? 'text-green-600'
                                    : ''
                              }
                            >
                              {minutesToHHMM(j.deltaMins)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-2 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          title="Responsáveis"
                          onClick={(e) => {
                            e.stopPropagation();
                            setResponsaveisJanela(j);
                          }}
                        >
                          <Users className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          title="Incidência"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIncidenciaJanela(j);
                          }}
                        >
                          <AlertTriangle className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!isConcluido}
                          className={`h-6 w-6 ${isConcluido ? 'text-blue-600' : 'text-muted-foreground/30 cursor-not-allowed'}`}
                          title={
                            isConcluido ? 'Relatório Técnico' : 'Disponível apenas quando Concluído'
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            setRelatorioJanela(j);
                          }}
                        >
                          <FileDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── Lista / Lista+Detalhe view ── */
              <div className={mode === 'detail' ? 'flex gap-0 items-start' : ''}>
                <div
                  className={`overflow-x-auto ${mode === 'detail' ? 'flex-1 min-w-0 border-r' : ''}`}
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                        <th className="px-4 py-2.5 text-left font-medium w-8">#</th>
                        <th className="px-4 py-2.5 text-left font-medium">
                          {t('satops.dashboard.colEvento')}
                        </th>
                        {col('satelite') && (
                          <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">
                            {t('satops.dashboard.colSatelite')}
                          </th>
                        )}
                        {col('aberturaP') && (
                          <th className="px-4 py-2.5 text-center font-medium font-mono whitespace-nowrap">
                            {t('satops.dashboard.colAberturaP')}
                          </th>
                        )}
                        <th className="px-4 py-2.5 text-center font-medium font-mono whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            {t('satops.dashboard.colAberturaR')}
                            <span className="text-[10px] text-primary/60">✎</span>
                          </span>
                        </th>
                        {col('fechoP') && (
                          <th className="px-4 py-2.5 text-center font-medium font-mono whitespace-nowrap hidden md:table-cell">
                            {t('satops.dashboard.colFechoP')}
                          </th>
                        )}
                        <th className="px-4 py-2.5 text-center font-medium font-mono whitespace-nowrap hidden md:table-cell">
                          <span className="inline-flex items-center gap-1">
                            {t('satops.dashboard.colFechoR')}
                            <span className="text-[10px] text-primary/60">✎</span>
                          </span>
                        </th>
                        {col('delta') && (
                          <th className="px-4 py-2.5 text-center font-medium hidden lg:table-cell">
                            Δ
                          </th>
                        )}
                        <th className="px-4 py-2.5 text-center font-medium">
                          {t('satops.dashboard.colEstado')}
                        </th>
                        {col('resp') && (
                          <th className="px-4 py-2.5 text-center font-medium w-12">
                            {t('satops.dashboard.colResponsaveis')}
                          </th>
                        )}
                        {col('inc') && (
                          <th className="px-4 py-2.5 text-center font-medium w-12">
                            {t('satops.dashboard.colIncidencias')}
                          </th>
                        )}
                        <th className="px-4 py-2.5 text-center font-medium w-12">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {flatRows.map((row, ri) => {
                        if (row.type === 'group') {
                          return (
                            <tr key={`grp-${ri}`}>
                              <td
                                colSpan={12}
                                className={`px-4 py-1.5 bg-muted/50 cursor-pointer hover:bg-muted/70 ${row.depth > 0 ? 'pl-8' : ''}`}
                                onClick={() =>
                                  setGroupCollapsedIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(row.groupKey)) next.delete(row.groupKey);
                                    else next.add(row.groupKey);
                                    return next;
                                  })
                                }
                              >
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  <ChevronRight
                                    className={`h-3 w-3 transition-transform ${!groupCollapsedIds.has(row.groupKey) ? 'rotate-90' : ''}`}
                                  />
                                  {row.label}
                                  <span className="font-normal normal-case tracking-normal opacity-60">
                                    ({row.count})
                                  </span>
                                </span>
                              </td>
                            </tr>
                          );
                        }
                        const j = row.item;
                        const isLive = j.estado === 'Em Direto' || j.estado === 'Excesso';
                        const isConcluido = j.estado === 'Concluído';
                        const estadoCor = estadosColorMap.get(j.estado.toLowerCase()) ?? null;
                        const isSelected = j.id === selectedJanela?.id;
                        const activeAlertas = getActiveAlertas(j, alertas, nowUtc);
                        return (
                          <tr
                            key={j.id}
                            onClick={() => setSelectedJanelaId(j.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-primary/8 ring-1 ring-inset ring-primary/20'
                                : isLive
                                  ? 'bg-green-500/5 hover:bg-green-500/10'
                                  : 'hover:bg-muted/40'
                            }`}
                          >
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {String(row.idx + 1).padStart(2, '0')}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isLive && j.estado === 'Em Direto' && <LiveDot size="md" />}
                                {isLive && j.estado === 'Excesso' && (
                                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                                )}
                                {activeAlertas.length > 0 && (
                                  <span
                                    title={activeAlertas
                                      .map((a) => `${a.nome} (${a.tempoParaAlerta} antes)`)
                                      .join('\n')}
                                  >
                                    <Bell className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
                                  </span>
                                )}
                                <span className="font-medium truncate max-w-[160px] block">
                                  {labelEvento(j)}
                                </span>
                              </div>
                            </td>
                            {col('satelite') && (
                              <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                                {j.sateliteNome || '—'}
                              </td>
                            )}
                            {col('aberturaP') && (
                              <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground">
                                {j.aberturaPrevia || '—'}
                              </td>
                            )}
                            <td className="px-4 py-3 text-center">
                              <EditableTimeCell
                                value={j.aberturaReal}
                                disabled={isConcluido}
                                onRequestConfirm={(val) =>
                                  setConfirmAction({ janela: j, field: 'aberturaReal', value: val })
                                }
                              />
                            </td>
                            {col('fechoP') && (
                              <td className="px-4 py-3 text-center font-mono text-xs text-muted-foreground hidden md:table-cell">
                                {j.fechoPrevisto || '—'}
                              </td>
                            )}
                            <td className="px-4 py-3 text-center hidden md:table-cell">
                              <EditableTimeCell
                                value={j.fechoReal}
                                disabled={j.estado === 'Agendado'}
                                onRequestConfirm={(val) =>
                                  setConfirmAction({ janela: j, field: 'fechoReal', value: val })
                                }
                              />
                            </td>
                            {col('delta') && (
                              <td className="px-4 py-3 text-center text-xs hidden lg:table-cell">
                                {j.deltaMins !== null ? (
                                  <span
                                    className={
                                      j.deltaMins > 0
                                        ? 'text-red-600 font-medium'
                                        : j.deltaMins < 0
                                          ? 'text-green-600 font-medium'
                                          : 'text-muted-foreground'
                                    }
                                  >
                                    {minutesToHHMM(j.deltaMins)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            )}
                            <td className="px-4 py-3 text-center">
                              <EstadoBadge estado={j.estado} cor={estadoCor} />
                            </td>
                            {col('resp') && (
                              <td className="px-4 py-3 text-center">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  title={t('satops.dashboard.viewResponsaveis')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setResponsaveisJanela(j);
                                  }}
                                >
                                  <Users className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            )}
                            {col('inc') && (
                              <td className="px-4 py-3 text-center">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  title={t('satops.dashboard.registerIncidencia')}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIncidenciaJanela(j);
                                  }}
                                >
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            )}
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                className={`h-7 w-7 transition-colors ${isConcluido ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950' : 'text-muted-foreground/30 cursor-not-allowed'}`}
                                title={
                                  isConcluido
                                    ? 'Relatório Técnico'
                                    : 'Disponível apenas quando Concluído'
                                }
                                disabled={!isConcluido}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRelatorioJanela(j);
                                }}
                              >
                                <FileDown className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Lista+Detalhe: painel de detalhe à direita */}
                {mode === 'detail' && selectedJanela && (
                  <div className="w-72 shrink-0 p-3 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Detalhe
                      </p>
                      <p className="font-semibold text-sm">{labelEvento(selectedJanela)}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedJanela.sateliteNome || '—'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                      {[
                        ['Ab. Prev.', selectedJanela.aberturaPrevia],
                        ['Ab. Real', selectedJanela.aberturaReal],
                        ['Fecho Prev.', selectedJanela.fechoPrevisto],
                        ['Fecho Real', selectedJanela.fechoReal],
                        ['Canal', selectedJanela.canal],
                        ['NOC', selectedJanela.confirmacaoNocNome],
                      ].map(([label, val]) =>
                        val ? (
                          <div key={label}>
                            <span className="text-muted-foreground">{label} </span>
                            <span className="font-mono font-medium">{val}</span>
                          </div>
                        ) : null,
                      )}
                    </div>
                    {(() => {
                      const jWithEstado = todayWithEstado.find((j) => j.id === selectedJanela.id);
                      if (!jWithEstado) return null;
                      const estadoCor =
                        estadosColorMap.get(jWithEstado.estado.toLowerCase()) ?? null;
                      return (
                        <div className="flex items-center gap-2">
                          <EstadoBadge estado={jWithEstado.estado} cor={estadoCor} />
                          {jWithEstado.deltaMins !== null && (
                            <span
                              className={`text-xs font-mono ${jWithEstado.deltaMins > 0 ? 'text-red-600' : jWithEstado.deltaMins < 0 ? 'text-green-600' : 'text-muted-foreground'}`}
                            >
                              {minutesToHHMM(jWithEstado.deltaMins)}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    {(selectedJanela.responsaveis?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Responsáveis
                        </p>
                        <div className="space-y-1">
                          {selectedJanela.responsaveis?.map((r) => (
                            <p key={r.id} className="text-xs">
                              {r.recursoHumanoNome || r.recursoTecnicoNome}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Right panel ── */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
          <ActiveJanelaPanel
            janela={activeJanela}
            liveJanelas={liveJanelas}
            onSelectJanela={setSelectedActivePanelId}
            sateliteMap={sateliteMap}
            nowUtc={nowUtc}
          />

          <ChecklistPanel
            janela={selectedJanela}
            sateliteMap={sateliteMap}
            onChecklistSaved={handleChecklistSaved}
          />

          <AgendaPanel janelas={todayWithEstado} estadosColorMap={estadosColorMap} />
        </div>
      </div>

      {/* ── Confirmation dialog ── */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open && !saving) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving} onClick={() => setConfirmAction(null)}>
              {t('common.no')}
            </AlertDialogCancel>
            <AlertDialogAction disabled={saving} onClick={handleConfirmSave}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('common.yes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Relatório PDF modal ── */}
      <JanelaRelatorioModal
        janela={relatorioJanela}
        satelite={relatorioJanela ? (sateliteMap.get(relatorioJanela.sateliteId) ?? null) : null}
        isOpen={!!relatorioJanela}
        onClose={() => setRelatorioJanela(null)}
      />

      {/* ── Responsáveis modal ── */}
      <JanelaResponsaveisModal
        janela={responsaveisJanela}
        isOpen={!!responsaveisJanela}
        onClose={() => setResponsaveisJanela(null)}
      />

      {/* ── Incidência modal ── */}
      <IncidenciaGravacaoFormModal
        isOpen={!!incidenciaJanela}
        onClose={() => setIncidenciaJanela(null)}
        onSave={async () => {
          toast({ title: t('satops.dashboard.incidenciaSaved') });
        }}
        data={
          incidenciaJanela
            ? {
                titulo: `Incidência – ${labelEvento(incidenciaJanela)} (${incidenciaJanela.sateliteNome ?? ''} ${incidenciaJanela.dataEvento ?? ''})`,
                data_incidencia: incidenciaJanela.dataEvento ?? undefined,
                horario_incidencia: incidenciaJanela.aberturaReal ?? undefined,
              }
            : undefined
        }
      />
    </div>
  );
}
