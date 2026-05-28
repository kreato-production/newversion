'use client';

import { useEffect, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Radio, Satellite } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// ─── Types ────────────────────────────────────────────────────────────────────

type DataPoint = {
  t: string;
  signal: number;
  snr: number;
  cn: number;
  ber: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function utcTime(): string {
  const n = new Date();
  return `${String(n.getUTCHours()).padStart(2, '0')}:${String(n.getUTCMinutes()).padStart(2, '0')}:${String(n.getUTCSeconds()).padStart(2, '0')}`;
}

function makePoint(prev?: DataPoint): DataPoint {
  const drift = (base: number, range: number, prevVal?: number) => {
    const target = base + (Math.random() - 0.5) * range * 2;
    if (prevVal === undefined) return target;
    if (Math.random() < 0.08) return prevVal + (Math.random() - 0.5) * range * 1.8;
    return prevVal + (target - prevVal) * 0.35 + (Math.random() - 0.5) * range * 0.5;
  };
  return {
    t: utcTime(),
    signal: Math.max(-70, Math.min(-38, drift(-51, 14, prev?.signal))),
    snr: Math.max(3, Math.min(25, drift(14.5, 9, prev?.snr))),
    cn: Math.max(2, Math.min(22, drift(11.2, 7, prev?.cn))),
    ber: Math.random() < 0.15 ? parseFloat((Math.random() * 6).toFixed(2)) : 0,
  };
}

const HISTORY = 60;

function initHistory(): DataPoint[] {
  const pts: DataPoint[] = [];
  for (let i = 0; i < HISTORY; i++) pts.push(makePoint(pts[pts.length - 1]));
  return pts;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-md p-2 text-xs shadow-md">
      <p className="text-muted-foreground mb-1 font-mono">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">
          {p.name}: {p.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

// ─── Metric chip ──────────────────────────────────────────────────────────────

function MetricChip({
  label,
  value,
  unit,
  good,
  warn,
  compact = false,
}: {
  label: string;
  value: number;
  unit: string;
  good: number;
  warn: number;
  compact?: boolean;
}) {
  const isGood = value >= good;
  const isWarn = !isGood && value >= warn;
  const cls = isGood
    ? 'text-emerald-600 dark:text-emerald-400'
    : isWarn
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';
  return (
    <div
      className={`flex flex-col gap-0.5 rounded-md border bg-muted/40 ${compact ? 'px-2 py-1 min-w-[70px]' : 'px-3 py-1.5 min-w-[90px]'}`}
    >
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </span>
      <span
        className={`font-mono font-bold tabular-nums leading-none ${compact ? 'text-sm' : 'text-base'} ${cls}`}
      >
        {value.toFixed(1)}
        <span className="text-muted-foreground text-[9px] font-normal ml-0.5">{unit}</span>
      </span>
    </div>
  );
}

// ─── Main graph ───────────────────────────────────────────────────────────────

export interface SateliteSignalGraphProps {
  /** Nome do evento/janela associado a este gráfico */
  janelaNome?: string;
  /** Nome do satélite */
  sateliteNome?: string;
  /** Modo compacto quando vários gráficos aparecem lado a lado */
  compact?: boolean;
}

export function SateliteSignalGraph({
  janelaNome,
  sateliteNome,
  compact = false,
}: SateliteSignalGraphProps) {
  const [data, setData] = useState<DataPoint[]>(initHistory);
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (locked) return;
      setData((prev) => [...prev.slice(-(HISTORY - 1)), makePoint(prev[prev.length - 1])]);
    }, 1_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [locked]);

  const last = data[data.length - 1];
  const sig = last?.signal ?? 0;
  const signalStatus = sig >= -55 ? 'NOMINAL' : sig >= -63 ? 'MARGINAL' : 'CRITICAL';
  const statusCls =
    signalStatus === 'NOMINAL'
      ? 'text-emerald-600 dark:text-emerald-400'
      : signalStatus === 'MARGINAL'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  const GRID = '#475569';
  const AXIS = '#94a3b8';
  const C_SIG = '#60a5fa';
  const C_SNR = '#4ade80';
  const C_CN = '#c084fc';

  // Altura dos gráficos: menor em modo compacto
  const chartH = compact ? 70 : 90;

  return (
    <Card className="overflow-hidden min-w-0">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Radio className="h-3 w-3 text-muted-foreground shrink-0" />
          {janelaNome ? (
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-foreground truncate leading-none">
                {janelaNome}
              </p>
              {sateliteNome && (
                <p className="text-[9px] text-muted-foreground truncate leading-none mt-0.5 flex items-center gap-0.5">
                  <Satellite className="h-2.5 w-2.5 shrink-0" />
                  {sateliteNome}
                </p>
              )}
            </div>
          ) : (
            <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">
              Signal Monitor
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[9px] font-medium px-1 py-0.5 rounded border ${
              signalStatus === 'NOMINAL'
                ? 'border-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                : signalStatus === 'MARGINAL'
                  ? 'border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-red-400 text-red-600 bg-red-50 dark:bg-red-950/30'
            }`}
          >
            {signalStatus}
          </span>
          {!compact && (
            <span className="font-mono text-[10px] text-muted-foreground">{last?.t} UTC</span>
          )}
          <button
            type="button"
            onClick={() => setLocked((v) => !v)}
            className={`text-[9px] font-medium px-1.5 py-0.5 rounded border transition-colors ${
              locked
                ? 'border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950/30'
                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
            }`}
          >
            {locked ? '⏸' : '▶'}
          </button>
        </div>
      </div>

      <CardContent className={compact ? 'px-2 pt-2 pb-1.5' : 'px-4 pt-3 pb-2'}>
        {/* Metric chips */}
        <div className={`flex gap-1.5 flex-wrap ${compact ? 'mb-2' : 'mb-3'}`}>
          <MetricChip
            label="Signal"
            value={sig}
            unit="dBm"
            good={-55}
            warn={-63}
            compact={compact}
          />
          <MetricChip
            label="SNR"
            value={last?.snr ?? 0}
            unit="dB"
            good={12}
            warn={8}
            compact={compact}
          />
          {!compact && (
            <>
              <MetricChip label="C/N" value={last?.cn ?? 0} unit="dB" good={9} warn={6} />
              <div className="flex flex-col gap-0.5 px-3 py-1.5 rounded-md border bg-muted/40 min-w-[90px]">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
                  BER
                </span>
                <span
                  className={`font-mono font-bold text-base tabular-nums leading-none ${
                    (last?.ber ?? 0) === 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {(last?.ber ?? 0) === 0 ? '0.00' : (last?.ber ?? 0).toFixed(2)}
                  <span className="text-muted-foreground text-[9px] font-normal ml-0.5">×10⁻⁶</span>
                </span>
              </div>
            </>
          )}
          {compact && (
            <MetricChip label="C/N" value={last?.cn ?? 0} unit="dB" good={9} warn={6} compact />
          )}
        </div>

        {/* Signal Level chart — sempre presente */}
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 font-medium">
            Signal Level (dBm)
          </p>
          <ResponsiveContainer width="100%" height={chartH}>
            <LineChart data={data} margin={{ top: 2, right: 2, left: -26, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={GRID} vertical={false} />
              <XAxis dataKey="t" tick={false} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis
                domain={[-72, -36]}
                tick={{ fill: AXIS, fontSize: 8, fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={-55}
                stroke="#22c55e"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{ value: '-55', fill: '#22c55e', fontSize: 7, opacity: 0.7 }}
              />
              <ReferenceLine
                y={-63}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{ value: '-63', fill: '#f59e0b', fontSize: 7, opacity: 0.7 }}
              />
              <Line
                type="monotone"
                dataKey="signal"
                stroke={C_SIG}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="Signal"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* SNR / C/N chart — apenas em modo normal */}
        {!compact && (
          <div className="mt-1">
            <div className="flex items-center gap-3 mb-0.5">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
                SNR / C/N (dB)
              </p>
              <span className="flex items-center gap-1 text-[9px]" style={{ color: C_SNR }}>
                <span className="inline-block w-3 h-0.5 rounded" style={{ background: C_SNR }} />{' '}
                SNR
              </span>
              <span className="flex items-center gap-1 text-[9px]" style={{ color: C_CN }}>
                <span className="inline-block w-3 h-0.5 rounded" style={{ background: C_CN }} /> C/N
              </span>
            </div>
            <ResponsiveContainer width="100%" height={chartH}>
              <LineChart data={data} margin={{ top: 2, right: 2, left: -26, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="t"
                  tick={{ fill: AXIS, fontSize: 7, fontFamily: 'inherit' }}
                  axisLine={{ stroke: GRID }}
                  tickLine={false}
                  interval={9}
                />
                <YAxis
                  domain={[0, 28]}
                  tick={{ fill: AXIS, fontSize: 8, fontFamily: 'inherit' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={12} stroke="#4ade80" strokeDasharray="3 3" strokeOpacity={0.5} />
                <ReferenceLine y={8} stroke="#fbbf24" strokeDasharray="3 3" strokeOpacity={0.5} />
                <Line
                  type="monotone"
                  dataKey="snr"
                  stroke={C_SNR}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                  name="SNR"
                />
                <Line
                  type="monotone"
                  dataKey="cn"
                  stroke={C_CN}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                  name="C/N"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center gap-1 text-[9px] font-medium mt-1 ${statusCls}`}>
          <span>●</span>
          <span>{signalStatus}</span>
          {compact && (
            <span className="font-mono text-muted-foreground font-normal">{last?.t}</span>
          )}
          <span className="text-muted-foreground font-normal ml-auto">{data.length} amostras</span>
        </div>
      </CardContent>
    </Card>
  );
}
