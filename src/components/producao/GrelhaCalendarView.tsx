'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameMonth,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { GrelhaProgramaItem } from '@/modules/producao/grelha-programacao.api';

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 60; // px per hour
const DAY_START_HOUR = 6; // grid starts at 06:00
const DAY_HOURS = 24; // 24 h window (06:00 → 06:00 next day)
const PX_PER_MIN = HOUR_HEIGHT / 60;
const TOTAL_HEIGHT = DAY_HOURS * HOUR_HEIGHT;
const WEEK_START_ON = 1 as const; // Monday-first week
const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTH_WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MAX_PER_CELL = 3;

const TIME_LABELS: string[] = Array.from({ length: DAY_HOURS }, (_, i) => {
  const h = (DAY_START_HOUR + i) % 24;
  return `${String(h).padStart(2, '0')}:00`;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDurationMinutes(dur: string | null): number {
  if (!dur) return 30;
  const parts = dur.split(':');
  if (parts.length >= 2) {
    const total = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    return Math.max(total, 5);
  }
  const n = parseInt(dur);
  return isNaN(n) ? 30 : Math.max(n, 5);
}

/** Returns minutes from grid top (06:00) or null if outside the 24-h window. */
function parseStartOffsetMin(time: string | null): number | null {
  if (!time) return null;
  const parts = time.split(':');
  if (parts.length < 2) return null;
  let h = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  if (h < DAY_START_HOUR) h += 24; // early-morning (00–05) belongs to the extended window
  const offset = h * 60 + m - DAY_START_HOUR * 60;
  return offset >= 0 && offset < DAY_HOURS * 60 ? offset : null;
}

// ─── Overlap layout ───────────────────────────────────────────────────────────

type WeekEvent = { item: GrelhaProgramaItem; startMin: number; durationMin: number };
type LayoutedEvent = WeekEvent & { width: number; left: number };

function layoutEvents(events: WeekEvent[]): LayoutedEvent[] {
  if (!events.length) return [];
  const sorted = [...events].sort((a, b) => a.startMin - b.startMin);
  const columns: WeekEvent[][] = [];

  for (const ev of sorted) {
    let placed = false;
    for (const col of columns) {
      const last = col[col.length - 1];
      if (last.startMin + last.durationMin <= ev.startMin) {
        col.push(ev);
        placed = true;
        break;
      }
    }
    if (!placed) columns.push([ev]);
  }

  const result: LayoutedEvent[] = [];
  for (let ci = 0; ci < columns.length; ci++) {
    for (const ev of columns[ci]) {
      const evEnd = ev.startMin + ev.durationMin;
      const overlapping = columns.filter((col) =>
        col.some((e) => e.startMin < evEnd && e.startMin + e.durationMin > ev.startMin),
      ).length;
      result.push({ ...ev, width: 1 / overlapping, left: ci / overlapping });
    }
  }
  return result;
}

// ─── WeekEventBlock ───────────────────────────────────────────────────────────

function WeekEventBlock({
  ev,
  onItemClick,
}: {
  ev: LayoutedEvent;
  onItemClick?: (item: GrelhaProgramaItem) => void;
}) {
  const { item, startMin, durationMin, width, left } = ev;
  const topPx = startMin * PX_PER_MIN;
  const heightPx = Math.max(durationMin * PX_PER_MIN, 18);
  const bg = item.statusPlaneamentoCor ?? '#6b7280';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onItemClick?.(item)}
            className="absolute rounded overflow-hidden text-left hover:brightness-90 transition-all"
            style={{
              top: topPx,
              height: heightPx,
              left: `calc(${left * 100}% + 1px)`,
              width: `calc(${width * 100}% - 2px)`,
              backgroundColor: bg,
              zIndex: 10,
            }}
          >
            <div className="p-0.5 h-full overflow-hidden relative">
              {item.temAlteracao && (
                <AlertTriangle className="h-2.5 w-2.5 text-yellow-200 absolute top-0.5 right-0.5 shrink-0" />
              )}
              <p className="text-white text-[10px] font-medium leading-tight line-clamp-2 pr-3">
                {item.horarioInicio ? `${item.horarioInicio.slice(0, 5)} ` : ''}
                {item.nome}
              </p>
              {heightPx > 42 && item.canal && (
                <p className="text-white/70 text-[9px] mt-0.5 truncate">{item.canal}</p>
              )}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs text-xs space-y-1">
          <p className="font-semibold">{item.nome}</p>
          {item.horarioInicio && <p>Horário: {item.horarioInicio}</p>}
          {item.duracao && <p>Duração: {item.duracao}</p>}
          {item.canal && <p>Canal: {item.canal}</p>}
          {item.statusGrelha && <p>Status: {item.statusGrelha}</p>}
          {item.statusPlaneamentoNome && <p>Planeamento: {item.statusPlaneamentoNome}</p>}
          {item.temAlteracao && (
            <p className="text-yellow-400 font-medium">⚠ Alteração detectada</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── WeekView ─────────────────────────────────────────────────────────────────

function WeekView({
  weekDays,
  items,
  onItemClick,
}: {
  weekDays: Date[];
  items: GrelhaProgramaItem[];
  onItemClick?: (item: GrelhaProgramaItem) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (scrollRef.current) {
      // Scroll to 08:00 (2 hours into the grid)
      scrollRef.current.scrollTop = 2 * HOUR_HEIGHT;
    }
  }, [weekDays[0]?.toISOString()]);

  const dayEvents = useMemo(() => {
    const map = new Map<string, LayoutedEvent[]>();
    for (const day of weekDays) {
      const key = format(day, 'yyyy-MM-dd');
      const dayItems = items.filter((i) => i.dataExibicao?.slice(0, 10) === key);
      const evs: WeekEvent[] = dayItems
        .map((item) => {
          const startMin = parseStartOffsetMin(item.horarioInicio);
          if (startMin === null) return null;
          return { item, startMin, durationMin: parseDurationMinutes(item.duracao) };
        })
        .filter(Boolean) as WeekEvent[];
      map.set(key, layoutEvents(evs));
    }
    return map;
  }, [weekDays, items]);

  return (
    <div className="flex flex-col">
      {/* Sticky day header */}
      <div className="flex border-b border-border sticky top-0 bg-background z-20">
        <div className="w-12 shrink-0 border-r border-border" />
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const isToday = key === todayStr;
          return (
            <div
              key={key}
              className={cn(
                'flex-1 text-center py-2 border-r border-border last:border-r-0 min-w-0',
                isToday && 'bg-primary/5',
              )}
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {WEEKDAYS_SHORT[day.getDay() === 0 ? 6 : day.getDay() - 1]}
              </p>
              <p className={cn('text-sm font-semibold', isToday && 'text-primary')}>
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 560 }}>
        <div className="flex relative" style={{ height: TOTAL_HEIGHT }}>
          {/* Time gutter */}
          <div className="w-12 shrink-0 relative border-r border-border select-none">
            {TIME_LABELS.map((label, i) => (
              <div
                key={label}
                className="absolute w-full flex items-center justify-end pr-1 text-[10px] text-muted-foreground"
                style={{ top: i * HOUR_HEIGHT - 8, height: HOUR_HEIGHT }}
              >
                <span className="mt-0">{label}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const isToday = key === todayStr;
            const events = dayEvents.get(key) ?? [];
            return (
              <div
                key={key}
                className={cn(
                  'flex-1 relative border-r border-border last:border-r-0 min-w-0',
                  isToday && 'bg-primary/5',
                )}
              >
                {/* Hour lines */}
                {Array.from({ length: DAY_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-border/30"
                    style={{ top: i * HOUR_HEIGHT }}
                  />
                ))}
                {/* Events */}
                {events.map((ev) => (
                  <WeekEventBlock key={ev.item.id} ev={ev} onItemClick={onItemClick} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MonthView (existing logic, extracted) ────────────────────────────────────

type DayCell = { date: Date; inMonth: boolean; items: GrelhaProgramaItem[] };

function buildMonthCells(ano: number, mes: number, items: GrelhaProgramaItem[]): DayCell[] {
  const monthDate = new Date(ano, mes - 1, 1);
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 0 });
  const end = endOfMonth(monthDate);

  const byDate = new Map<string, GrelhaProgramaItem[]>();
  for (const item of items) {
    if (!item.dataExibicao) continue;
    const key = item.dataExibicao.slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(item);
  }

  const cells: DayCell[] = [];
  let cur = start;
  while (cur <= end || cells.length % 7 !== 0 || cells.length === 0) {
    cells.push({
      date: cur,
      inMonth: isSameMonth(cur, monthDate),
      items: byDate.get(format(cur, 'yyyy-MM-dd')) ?? [],
    });
    cur = addDays(cur, 1);
    if (cur > end && cells.length % 7 === 0) break;
  }
  return cells;
}

function MonthProgramBadge({ item, onClick }: { item: GrelhaProgramaItem; onClick?: () => void }) {
  const label = item.horarioInicio ? `${item.horarioInicio.slice(0, 5)} ${item.nome}` : item.nome;
  const bg = item.statusPlaneamentoCor ?? '#6b7280';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="w-full text-left truncate" onClick={onClick}>
            <Badge
              className="w-full text-xs font-normal truncate flex items-center gap-1 text-white cursor-pointer"
              style={{ backgroundColor: bg }}
            >
              {item.temAlteracao && (
                <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-yellow-200" />
              )}
              <span className="truncate">{label}</span>
            </Badge>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs text-xs space-y-1">
          <p className="font-semibold">{item.nome}</p>
          {item.horarioInicio && <p>Horário: {item.horarioInicio}</p>}
          {item.duracao && <p>Duração: {item.duracao}</p>}
          {item.canal && <p>Canal: {item.canal}</p>}
          {item.statusGrelha && <p>Status: {item.statusGrelha}</p>}
          {item.temAlteracao && (
            <p className="text-yellow-400 font-medium">⚠ Alteração detectada</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function MonthView({
  items,
  ano,
  mes,
  onItemClick,
}: {
  items: GrelhaProgramaItem[];
  ano: number;
  mes: number;
  onItemClick?: (item: GrelhaProgramaItem) => void;
}) {
  const cells = useMemo(() => buildMonthCells(ano, mes, items), [ano, mes, items]);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="grid grid-cols-7 border-l border-t border-border">
      {MONTH_WEEKDAYS.map((wd) => (
        <div
          key={wd}
          className="border-r border-b border-border bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground text-center"
        >
          {wd}
        </div>
      ))}
      {cells.map((cell, idx) => {
        const visible = cell.items.slice(0, MAX_PER_CELL);
        const overflow = cell.items.length - MAX_PER_CELL;
        const isToday = format(cell.date, 'yyyy-MM-dd') === todayStr;
        return (
          <div
            key={idx}
            className={cn(
              'border-r border-b border-border min-h-[90px] p-1 space-y-0.5',
              !cell.inMonth && 'bg-muted/20',
            )}
          >
            <p
              className={cn(
                'text-xs mb-1 w-5 h-5 flex items-center justify-center rounded-full',
                isToday
                  ? 'bg-primary text-primary-foreground font-bold'
                  : cell.inMonth
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground',
              )}
            >
              {cell.date.getDate()}
            </p>
            {visible.map((item) => (
              <MonthProgramBadge key={item.id} item={item} onClick={() => onItemClick?.(item)} />
            ))}
            {overflow > 0 && <p className="text-xs text-muted-foreground pl-1">+{overflow} mais</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

type Props = {
  items: GrelhaProgramaItem[];
  ano: number;
  mes: number;
  onItemClick?: (item: GrelhaProgramaItem) => void;
  onMonthChange?: (mes: number, ano: number) => void;
};

export function GrelhaCalendarView({ items, ano, mes, onItemClick, onMonthChange }: Props) {
  const [viewType, setViewType] = useState<'month' | 'week'>('week');
  const [currentDate, setCurrentDate] = useState(() => new Date(ano, mes - 1, 1));

  useEffect(() => {
    setCurrentDate(new Date(ano, mes - 1, 1));
  }, [ano, mes]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: WEEK_START_ON });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const navigatePrev = () => {
    if (viewType === 'week') {
      const newDate = subWeeks(currentDate, 1);
      setCurrentDate(newDate);
      if (
        newDate.getMonth() !== currentDate.getMonth() ||
        newDate.getFullYear() !== currentDate.getFullYear()
      ) {
        onMonthChange?.(newDate.getMonth() + 1, newDate.getFullYear());
      }
    } else {
      const newDate = subMonths(currentDate, 1);
      const first = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      setCurrentDate(first);
      onMonthChange?.(first.getMonth() + 1, first.getFullYear());
    }
  };

  const navigateNext = () => {
    if (viewType === 'week') {
      const newDate = addWeeks(currentDate, 1);
      setCurrentDate(newDate);
      if (
        newDate.getMonth() !== currentDate.getMonth() ||
        newDate.getFullYear() !== currentDate.getFullYear()
      ) {
        onMonthChange?.(newDate.getMonth() + 1, newDate.getFullYear());
      }
    } else {
      const newDate = addMonths(currentDate, 1);
      const first = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      setCurrentDate(first);
      onMonthChange?.(first.getMonth() + 1, first.getFullYear());
    }
  };

  const headerLabel =
    viewType === 'week'
      ? `${format(weekStart, "d 'de' MMM", { locale: ptBR })} – ${format(addDays(weekStart, 6), "d 'de' MMM yyyy", { locale: ptBR })}`
      : format(currentDate, 'MMMM yyyy', { locale: ptBR });

  return (
    <div className="w-full">
      {/* Internal navigation bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        {/* Mês / Semana toggle */}
        <div className="flex rounded-md border border-border overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setViewType('month')}
            className={cn(
              'px-3 py-1.5 font-medium transition-colors',
              viewType === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            Mês
          </button>
          <button
            type="button"
            onClick={() => setViewType('week')}
            className={cn(
              'px-3 py-1.5 font-medium border-l border-border transition-colors',
              viewType === 'week' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            Semana
          </button>
        </div>

        {/* Date label + navigation */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={navigatePrev}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium capitalize min-w-[220px] text-center select-none">
            {headerLabel}
          </span>
          <button
            type="button"
            onClick={navigateNext}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="w-28" />
      </div>

      {viewType === 'week' ? (
        <WeekView weekDays={weekDays} items={items} onItemClick={onItemClick} />
      ) : (
        <MonthView
          items={items}
          ano={currentDate.getFullYear()}
          mes={currentDate.getMonth() + 1}
          onItemClick={onItemClick}
        />
      )}
    </div>
  );
}
