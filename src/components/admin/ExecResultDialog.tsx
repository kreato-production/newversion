'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

// ─── Shared type (re-exported so parent can use it) ───────────────────────────

export type ExecResultPayload = {
  resultado: { status: number; body: string } | null;
  erro: string | null;
  ultimaExecucao: string | null;
  sincronizados?: number | null;
};

// ─── Body parsing ─────────────────────────────────────────────────────────────

type ParsedArray = {
  type: 'array';
  rows: Record<string, unknown>[];
  total: number;
  columns: string[];
};
type ParsedObject = { type: 'object'; data: Record<string, unknown> };
type ParsedRaw = { type: 'raw'; text: string; lang: 'xml' | 'text' };

type ParsedBody = ParsedArray | ParsedObject | ParsedRaw;

function parseBody(body: string): ParsedBody {
  const trimmed = body.trim();

  try {
    const parsed: unknown = JSON.parse(trimmed);

    // Detect array (direct or nested under a data-like key)
    let arr: unknown[] | null = null;
    if (Array.isArray(parsed)) {
      arr = parsed;
    } else if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      const dataKey = Object.keys(obj).find((k) => Array.isArray(obj[k]));
      if (dataKey) arr = obj[dataKey] as unknown[];
    }

    if (arr !== null) {
      const rows = arr
        .slice(0, 10)
        .map((item) =>
          item && typeof item === 'object' ? (item as Record<string, unknown>) : { valor: item },
        );
      // Show ALL columns (no slice limit) so we can see every field name
      const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
      return { type: 'array', rows, total: arr.length, columns };
    }

    if (parsed && typeof parsed === 'object') {
      return { type: 'object', data: parsed as Record<string, unknown> };
    }

    return { type: 'raw', text: String(parsed), lang: 'text' };
  } catch {
    if (trimmed.startsWith('<')) return { type: 'raw', text: trimmed, lang: 'xml' };
    return { type: 'raw', text: trimmed, lang: 'text' };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HttpBadge({ status }: { status: number }) {
  const isOk = status >= 200 && status < 300;
  const isErr = status >= 400;
  return (
    <Badge
      className={`font-mono text-xs ${isOk ? 'bg-green-600 hover:bg-green-600' : isErr ? 'bg-destructive hover:bg-destructive' : ''}`}
    >
      HTTP {status}
    </Badge>
  );
}

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="text-muted-foreground italic text-[10px]">—</span>;
  if (typeof value === 'boolean')
    return <span className={value ? 'text-green-600' : 'text-rose-500'}>{String(value)}</span>;
  if (typeof value === 'object')
    return (
      <span className="text-muted-foreground font-mono text-[10px]">
        {JSON.stringify(value).slice(0, 50)}
      </span>
    );
  const str = String(value);
  return (
    <span title={str.length > 60 ? str : undefined}>
      {str.length > 60 ? str.slice(0, 60) + '…' : str}
    </span>
  );
}

// ─── Array table ──────────────────────────────────────────────────────────────

function ArrayTable({ parsed }: { parsed: ParsedArray }) {
  const [showRaw, setShowRaw] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {parsed.total > 10
            ? `Exibindo 10 de ${parsed.total} registros`
            : `${parsed.total} registro${parsed.total === 1 ? '' : 's'} encontrado${parsed.total === 1 ? '' : 's'}`}
          <span className="ml-2 text-muted-foreground/60">· {parsed.columns.length} campo(s)</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            className="text-[10px] text-muted-foreground hover:text-foreground underline"
          >
            {showRaw ? 'Ocultar JSON' : 'Ver 1.º registo (JSON)'}
          </button>
          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
        </div>
      </div>
      {showRaw && parsed.rows[0] && (
        <pre className="text-[10px] font-mono bg-muted/40 border rounded p-2 overflow-auto max-h-48 whitespace-pre-wrap break-all leading-relaxed">
          {JSON.stringify(parsed.rows[0], null, 2)}
        </pre>
      )}
      <div className="border rounded-md overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b bg-muted/60">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-10 shrink-0">
                #
              </th>
              {parsed.columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.rows.map((row, i) => (
              <tr key={i} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 text-muted-foreground text-[10px] font-mono">{i + 1}</td>
                {parsed.columns.map((col) => (
                  <td key={col} className="px-3 py-2 max-w-[200px] truncate">
                    <CellValue value={row[col]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Object key-value table ───────────────────────────────────────────────────

function ObjectTable({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Objeto retornado — {entries.length} campo{entries.length === 1 ? '' : 's'}
      </p>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-xs">
          <tbody>
            {entries.map(([key, value]) => (
              <tr key={key} className="border-b last:border-b-0 hover:bg-muted/20">
                <td className="px-3 py-2 font-medium text-muted-foreground bg-muted/30 whitespace-nowrap w-48 align-top">
                  {key}
                </td>
                <td className="px-3 py-2 font-mono break-all">
                  <CellValue value={value} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

interface ExecResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  result: ExecResultPayload | null;
}

export function ExecResultDialog({ isOpen, onClose, result }: ExecResultDialogProps) {
  if (!result) return null;

  const { resultado, erro, ultimaExecucao, sincronizados } = result;
  const parsed = resultado?.body?.trim() ? parseBody(resultado.body) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span>Resultado da Execução</span>
            {resultado && <HttpBadge status={resultado.status} />}
            {ultimaExecucao && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground font-normal">
                <Clock className="w-3 h-3" />
                {new Date(ultimaExecucao).toLocaleString('pt-BR')}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-1">
          {/* ── Sync da Grelha ── */}
          {sincronizados != null && (
            <div
              className={`rounded-md border p-3 flex items-center gap-3 ${sincronizados > 0 ? 'border-blue-400/50 bg-blue-500/5' : 'border-yellow-400/50 bg-yellow-500/5'}`}
            >
              <RefreshCw
                className={`w-4 h-4 shrink-0 ${sincronizados > 0 ? 'text-blue-600' : 'text-yellow-600'}`}
              />
              <p className="text-sm">
                {sincronizados > 0 ? (
                  <>
                    <span className="font-medium">{sincronizados} programa(s)</span> sincronizados
                    na Grelha de Programação.
                  </>
                ) : (
                  <span className="text-yellow-700">
                    Sync da Grelha executado, mas nenhum programa foi importado. Verifique o formato
                    da resposta da API nos logs do servidor.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* ── Erro ── */}
          {erro && (
            <div className="rounded-md border border-destructive/50 bg-destructive/5 p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Erro na execução</p>
                <p className="text-xs text-muted-foreground font-mono">{erro}</p>
              </div>
            </div>
          )}

          {/* ── Sucesso sem corpo ── */}
          {!erro && !parsed && (
            <div className="rounded-md border border-green-500/40 bg-green-500/5 p-4 flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-sm">Tarefa executada com sucesso. Sem corpo de resposta.</p>
            </div>
          )}

          {/* ── Array de registros → tabela ── */}
          {parsed?.type === 'array' && <ArrayTable parsed={parsed} />}

          {/* ── Objeto único → key-value ── */}
          {parsed?.type === 'object' && <ObjectTable data={parsed.data} />}

          {/* ── Texto / XML bruto ── */}
          {parsed?.type === 'raw' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {parsed.lang === 'xml' ? 'Resposta XML' : 'Resposta em texto simples'}
              </p>
              <pre className="text-xs font-mono bg-muted/30 rounded-md border p-3 overflow-auto max-h-96 whitespace-pre-wrap break-all leading-relaxed">
                {parsed.text}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-2 border-t">
          <Button onClick={onClose} className="text-xs">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
