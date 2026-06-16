'use client';

import { Calendar, Clock, Check, ChevronRight } from 'lucide-react';
import type {
  AgendaDia,
  AgendaAtividade,
} from '@/modules/gestao-eventos/gestao-eventos.api.repository';

const STEP_W = 172; // largura de cada card (px)
const ARROW_W = 32; // largura do conector entre cards (px)

// ── helpers ──────────────────────────────────────────────────────────
function toMin(t: string | undefined | null): number {
  if (!t) return -1;
  const [h, m] = t.split(':').map(Number);
  return isNaN(h) ? -1 : h * 60 + (m || 0);
}

function fmtDur(s: string | undefined | null, e: string | undefined | null): string {
  const sm = toMin(s),
    em = toMin(e);
  if (sm < 0 || em <= sm) return '';
  const min = em - sm;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h === 0 ? `${m}min` : m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function fmtTotalMin(min: number): string {
  if (min <= 0) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h === 0 ? `${m}min` : m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function fmtData(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// ── Card individual de cada atividade ────────────────────────────────
function StepCard({ atv, index }: { atv: AgendaAtividade; index: number }) {
  const cor = atv.cor || '#6b7280';
  const dur = fmtDur(atv.horarioInicio, atv.horarioFim);
  const done = atv.executada;

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden shadow-sm"
      style={{
        width: STEP_W,
        border: `1px solid ${cor}35`,
        opacity: done ? 0.7 : 1,
      }}
    >
      {/* Faixa colorida no topo */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: cor }}>
        {/* Número / check */}
        <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center flex-shrink-0">
          {done ? (
            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
          ) : (
            <span className="text-[11px] font-bold text-white leading-none">{index + 1}</span>
          )}
        </div>
        {/* Horário */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-[11px] font-bold font-mono leading-none truncate">
            {atv.horarioInicio || '—'}
            {atv.horarioFim ? ` → ${atv.horarioFim}` : ''}
          </p>
          {dur && <p className="text-white/75 text-[9px] mt-0.5 leading-none">{dur}</p>}
        </div>
      </div>

      {/* Corpo do card */}
      <div
        className="flex-1 p-3"
        style={{ backgroundColor: `${cor}0d` }} // ~5% opacity
      >
        <p
          className={`text-[12px] font-semibold leading-snug ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}
        >
          {atv.titulo}
        </p>
        {atv.descricao && (
          <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug line-clamp-3">
            {atv.descricao}
          </p>
        )}
        {done && <p className="text-[9px] text-emerald-600 font-semibold mt-2">✓ Concluída</p>}
      </div>
    </div>
  );
}

// ── Conector entre steps ─────────────────────────────────────────────
function Connector({ from, to }: { from: string; to: string }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 self-center"
      style={{ width: ARROW_W }}
    >
      <div className="flex items-center gap-0">
        <div
          className="h-px w-3"
          style={{ background: `linear-gradient(to right, ${from}80, ${to}80)` }}
        />
        <ChevronRight className="h-4 w-4" style={{ color: to + 'aa' }} />
      </div>
    </div>
  );
}

// ── Timeline de um dia ────────────────────────────────────────────────
function DayTimeline({ dia }: { dia: AgendaDia }) {
  const sorted = [...dia.atividades]
    .filter((a) => (a.horarioInicio ?? '') !== '')
    .sort((a, b) => (a.horarioInicio ?? '').localeCompare(b.horarioInicio ?? ''));

  if (!sorted.length) return null;

  const totalProg = sorted.reduce((s, a) => {
    const d = toMin(a.horarioFim) - toMin(a.horarioInicio);
    return s + (d > 0 ? d : 0);
  }, 0);
  const concluidas = sorted.filter((a) => a.executada).length;

  const totalW = sorted.length * STEP_W + (sorted.length - 1) * ARROW_W;

  return (
    <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
      {/* Cabeçalho do dia */}
      <div className="flex items-center gap-3 px-5 py-3 border-b bg-muted/30">
        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="font-semibold text-sm capitalize">{fmtData(dia.data)}</span>
        {totalProg > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {fmtTotalMin(totalProg)}
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {concluidas}/{sorted.length} concluídas
        </span>
      </div>

      {/* Scroll horizontal */}
      <div className="overflow-x-auto p-5">
        <div className="flex items-stretch" style={{ minWidth: totalW }}>
          {sorted.map((atv, i) => (
            <div key={atv.id} className="flex items-stretch flex-shrink-0">
              <StepCard atv={atv} index={i} />
              {i < sorted.length - 1 && (
                <Connector from={atv.cor || '#6b7280'} to={sorted[i + 1].cor || '#6b7280'} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────
interface PreviewTabProps {
  agenda: AgendaDia[];
}

export function PreviewTab({ agenda }: PreviewTabProps) {
  const diasValidos = agenda.filter((d) =>
    d.atividades.some((a) => (a.horarioInicio ?? '') !== ''),
  );

  if (!diasValidos.length) {
    return (
      <div className="rounded-md border h-44 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30">
        <Calendar className="h-9 w-9 opacity-25" />
        <p className="text-sm font-medium">Nenhuma atividade com horário definido</p>
        <p className="text-xs">Adicione atividades na aba Agenda para visualizar o planeamento</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {diasValidos.map((dia) => (
        <DayTimeline key={dia.id} dia={dia} />
      ))}
    </div>
  );
}
