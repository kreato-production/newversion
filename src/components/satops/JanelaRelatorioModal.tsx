'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Printer, CheckCircle2, XCircle, Clock, Satellite } from 'lucide-react';
import {
  ApiSatOpsRepository,
  type JanelaApiItem,
  type SateliteApiItem,
} from '@/modules/satops/satops.api.repository';
import {
  ApiIncidenciasGravacaoRepository,
  type IncidenciaGravacaoApiItem,
} from '@/modules/incidencias-gravacao/incidencias-gravacao.api';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import type { Checklist, ChecklistEtapa } from '@/components/satops/SateliteChecklistTab';

const incRepo = new ApiIncidenciasGravacaoRepository();
const paramRepo = new ApiParametrizacoesRepository();
const satRepo = new ApiSatOpsRepository();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseCl(raw: unknown): Checklist {
  if (!raw || !Array.isArray(raw)) return [];
  return raw as Checklist;
}

function diffMins(a: string, b: string): number | null {
  if (!a || !b) return null;
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  if ([ah, am, bh, bm].some(isNaN)) return null;
  return bh * 60 + bm - (ah * 60 + am);
}

function fmtMins(mins: number): string {
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  const sign = mins < 0 ? '−' : '+';
  if (h > 0) return `${sign}${h}h ${m}min`;
  return `${sign}${m}min`;
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function ptDate(d: string): string {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function evtLabel(j: JanelaApiItem) {
  return (
    (j.tipoEvento === 'Grelha de Programas' ? j.programaNome : j.tituloEvento) || j.canal || '—'
  );
}

// ─── PDF HTML builder ─────────────────────────────────────────────────────────

interface ReportData {
  janela: JanelaApiItem;
  satelite: SateliteApiItem | null;
  incidencias: IncidenciaGravacaoApiItem[];
  severidadesMap: Map<string, string>;
  impactosMap: Map<string, string>;
  categoriasMap: Map<string, string>;
}

function buildHtml(d: ReportData): string {
  const { janela, satelite, incidencias, severidadesMap, impactosMap, categoriasMap } = d;
  const checklist: Checklist = parseCl(janela.checklist ?? satelite?.checklist);

  const totalDuration = (() => {
    const m = diffMins(janela.aberturaReal, janela.fechoReal);
    return m !== null && m >= 0 ? fmtDuration(m) : '—';
  })();

  const deltaAbertura = (() => {
    const m = diffMins(janela.aberturaPrevia, janela.aberturaReal);
    return m !== null ? fmtMins(m) : '—';
  })();

  const deltaFecho = (() => {
    const m = diffMins(janela.fechoPrevisto, janela.fechoReal);
    return m !== null ? fmtMins(m) : '—';
  })();

  const totalDone = checklist.reduce(
    (a, e) => a + e.atividades.filter((v) => v.concluida).length,
    0,
  );
  const totalItems = checklist.reduce((a, e) => a + e.atividades.length, 0);

  const reportDate = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // ── Section builders ──────────────────────────────────────────────────────

  const row = (label: string, value: string, bold = false) => `
    <tr>
      <td class="label">${label}</td>
      <td class="${bold ? 'bold' : ''}">${value || '—'}</td>
    </tr>`;

  const techSection = satelite
    ? `
    <div class="section">
      <div class="section-title"><span class="dot blue"></span>Parâmetros Técnicos do Satélite</div>
      <table class="info-table">
        <colgroup><col style="width:38%"><col></colgroup>
        ${row('Satélite', satelite.nome)}
        ${row('Transponder', satelite.transponder)}
        ${row('Frequência Uplink', satelite.frequenciaUplink ? satelite.frequenciaUplink + ' MHz' : '')}
        ${row('Polarização', satelite.polarizacao)}
        ${row('Symbol Rate', satelite.symbolRate ? satelite.symbolRate + ' Msps' : '')}
        ${row('FEC', satelite.fec)}
      </table>
    </div>`
    : '';

  const responsaveisSection =
    janela.responsaveis && janela.responsaveis.length > 0
      ? `
    <div class="section">
      <div class="section-title"><span class="dot green"></span>Responsáveis (${janela.responsaveis.length})</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Recurso Técnico</th>
            <th>Disponibilidade</th>
            <th>Telefone</th>
            <th>E-mail</th>
          </tr>
        </thead>
        <tbody>
          ${janela.responsaveis
            .map(
              (r) => `
            <tr>
              <td><strong>${r.recursoHumanoNome || '—'}</strong></td>
              <td>${r.recursoTecnicoNome || '—'}</td>
              <td>${r.disponibilidade || '—'}</td>
              <td class="mono">${r.telefone || '—'}</td>
              <td>${r.email || '—'}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>`
      : '';

  const checklistSection =
    checklist.length > 0
      ? `
    <div class="section">
      <div class="section-title">
        <span class="dot purple"></span>Checklist Operacional
        <span class="badge">${totalDone}/${totalItems}</span>
      </div>
      <div class="checklist-grid">
        ${checklist
          .map(
            (e: ChecklistEtapa) => `
          <div class="checklist-group">
            <div class="group-title" style="color:${e.cor};border-left:3px solid ${e.cor};padding-left:6px">${e.nome}</div>
            ${e.atividades
              .map(
                (a) => `
              <div class="checklist-item ${a.concluida ? 'done' : 'pending'}">
                <span class="check-icon">${a.concluida ? '✓' : '○'}</span>
                <span>${a.nome}</span>
              </div>`,
              )
              .join('')}
          </div>`,
          )
          .join('')}
      </div>
    </div>`
      : '';

  const incidenciasSection = `
    <div class="section">
      <div class="section-title"><span class="dot red"></span>Incidências Registadas (${incidencias.length})</div>
      ${
        incidencias.length === 0
          ? '<p class="empty-msg">Sem incidências registadas para esta transmissão.</p>'
          : `<table class="data-table">
            <thead>
              <tr>
                <th style="width:30px">#</th>
                <th>Título</th>
                <th>Horário</th>
                <th>Duração</th>
                <th>Severidade</th>
                <th>Impacto</th>
                <th>Categoria</th>
              </tr>
            </thead>
            <tbody>
              ${incidencias
                .map(
                  (inc, i) => `
                <tr>
                  <td class="center mono">${i + 1}</td>
                  <td><strong>${inc.titulo}</strong>${inc.descricao ? `<br><span class="sub">${inc.descricao}</span>` : ''}${inc.causa_provavel ? `<br><span class="sub causa">Causa: ${inc.causa_provavel}</span>` : ''}</td>
                  <td class="mono center">${inc.horario_incidencia || '—'}</td>
                  <td class="mono center">${inc.tempo_incidencia || '—'}</td>
                  <td>${severidadesMap.get(inc.severidade_id ?? '') || '—'}</td>
                  <td>${impactosMap.get(inc.impacto_id ?? '') || '—'}</td>
                  <td>${categoriasMap.get(inc.categoria_id ?? '') || '—'}</td>
                </tr>`,
                )
                .join('')}
            </tbody>
          </table>`
      }
    </div>`;

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<title>Relatório de Transmissão — ${evtLabel(janela)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; }

  /* ── Page header ── */
  .page-header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%); color: #fff; padding: 8px 20px; display: flex; justify-content: space-between; align-items: center; }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .header-left .system-name { font-size: 8px; text-transform: uppercase; letter-spacing: 2px; opacity: .5; white-space: nowrap; }
  .header-left .report-title { font-size: 13px; font-weight: 700; letter-spacing: -.2px; white-space: nowrap; }
  .header-left .report-sub { font-size: 9px; opacity: .65; white-space: nowrap; }
  .header-right { text-align: right; }
  .header-right .ref { font-size: 8px; opacity: .55; text-transform: uppercase; letter-spacing: 1px; }
  .header-right .date-val { font-size: 10px; margin-top: 1px; opacity: .9; }
  .status-pill { display: inline-flex; align-items: center; gap: 3px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.25); border-radius: 10px; padding: 2px 7px; font-size: 9px; }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; }
  .header-divider { width: 1px; height: 24px; background: rgba(255,255,255,.2); }

  /* ── Body ── */
  .body { padding: 16px 24px 20px; }

  /* ── Event banner ── */
  .event-banner { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0f3460; border-radius: 6px; padding: 5px 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
  .event-name { font-size: 12px; font-weight: 700; color: #0f3460; }
  .event-meta { font-size: 9px; color: #64748b; margin-top: 2px; }
  .event-meta span { margin-right: 10px; }
  .time-badge { text-align: right; }
  .time-badge .time-row { font-size: 11px; font-weight: 600; color: #1a1a2e; font-family: monospace; }
  .time-badge .time-label { font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }

  /* ── Two-column grid ── */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }

  /* ── Section ── */
  .section { margin-bottom: 12px; }
  .section-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #475569; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .dot.blue   { background: #3b82f6; }
  .dot.green  { background: #22c55e; }
  .dot.purple { background: #a855f7; }
  .dot.amber  { background: #f59e0b; }
  .dot.red    { background: #ef4444; }
  .badge { background: #e2e8f0; color: #475569; border-radius: 8px; padding: 1px 7px; font-size: 9px; font-weight: 600; margin-left: auto; }

  /* ── Info table ── */
  .info-table { width: 100%; border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
  .info-table td { padding: 5px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .info-table tr:last-child td { border-bottom: none; }
  .info-table .label { color: #64748b; font-size: 10px; width: 38%; white-space: nowrap; }
  .info-table .bold { font-weight: 600; }

  /* ── Times section ── */
  .times-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
  .time-cell { padding: 7px 12px; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
  .time-cell:nth-child(2n) { border-right: none; }
  .time-cell:nth-last-child(-n+2) { border-bottom: none; }
  .time-cell .t-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 2px; }
  .time-cell .t-val { font-size: 14px; font-weight: 700; font-family: monospace; color: #1a1a2e; }
  .time-cell .t-delta { font-size: 9px; margin-top: 2px; }
  .time-cell.highlight { background: #f0fdf4; }
  .time-cell.highlight .t-val { color: #16a34a; }
  .time-cell.warn .t-val { color: #dc2626; }
  .delta-pos { color: #dc2626; }
  .delta-neg { color: #16a34a; }
  .duration-box { margin-top: 8px; background: #0f3460; color: #fff; border-radius: 6px; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; }
  .duration-box .dur-label { font-size: 9px; opacity: .7; text-transform: uppercase; letter-spacing: 1px; }
  .duration-box .dur-val { font-size: 18px; font-weight: 800; font-family: monospace; }

  /* ── Data table ── */
  .data-table { width: 100%; border-collapse: collapse; font-size: 10px; }
  .data-table th { background: #f1f5f9; color: #475569; font-size: 9px; text-transform: uppercase; letter-spacing: .8px; padding: 5px 8px; border: 1px solid #e2e8f0; text-align: left; }
  .data-table td { padding: 5px 8px; border: 1px solid #e2e8f0; vertical-align: top; }
  .data-table tbody tr:nth-child(even) td { background: #fafafa; }
  .sub { color: #64748b; font-size: 9px; display: block; margin-top: 2px; }
  .causa { color: #b45309; }
  .mono { font-family: monospace; }
  .center { text-align: center; }

  /* ── Checklist ── */
  .checklist-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .checklist-group { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 7px 9px; }
  .group-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 5px; }
  .checklist-item { display: flex; align-items: flex-start; gap: 5px; font-size: 10px; margin-bottom: 3px; }
  .check-icon { font-size: 11px; flex-shrink: 0; width: 12px; }
  .checklist-item.done { color: #1a1a2e; }
  .checklist-item.done .check-icon { color: #16a34a; font-weight: 700; }
  .checklist-item.pending { color: #94a3b8; }
  .empty-msg { color: #94a3b8; font-size: 10px; font-style: italic; padding: 8px 0; }

  /* ── Footer ── */
  .page-footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; color: #94a3b8; font-size: 9px; }

  /* ── Print ── */
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 10mm 12mm; size: A4 landscape; }
  }
</style>
</head>
<body>

<!-- PAGE HEADER -->
<div class="page-header">
  <div class="header-left">
    <div class="system-name">Kreato · SatOps</div>
    <div class="header-divider"></div>
    <div class="report-title">Relatório de Transmissão</div>
    <div class="header-divider"></div>
    <div class="report-sub">${ptDate(janela.dataEvento)}</div>
    <div class="header-divider"></div>
    <div class="status-pill"><span class="status-dot"></span> Concluído</div>
  </div>
  <div class="header-right">
    <div class="ref">Gerado em</div>
    <div class="date-val">${reportDate}${janela.canal ? ` · ${janela.canal}` : ''}</div>
  </div>
</div>

<div class="body">

  <!-- EVENT BANNER -->
  <div class="event-banner">
    <div>
      <div class="event-name">${evtLabel(janela)}</div>
      <div class="event-meta">
        ${satelite ? `<span>🛰 ${satelite.nome}</span>` : ''}
        ${janela.tipoEvento ? `<span>📡 ${janela.tipoEvento}</span>` : ''}
        ${janela.confirmacaoNocNome ? `<span>🎛 NOC: ${janela.confirmacaoNocNome}</span>` : ''}
      </div>
    </div>
    <div class="time-badge">
      <div class="time-label">Janela UTC</div>
      <div class="time-row">${janela.aberturaReal || janela.aberturaPrevia || '—'} → ${janela.fechoReal || janela.fechoPrevisto || '—'}</div>
    </div>
  </div>

  <!-- TOP GRID: TIMES + TECH -->
  <div class="two-col">

    <!-- TIMES -->
    <div>
      <div class="section">
        <div class="section-title"><span class="dot amber"></span>Tempos de Transmissão</div>
        <div class="times-grid">
          <div class="time-cell">
            <div class="t-label">Abertura Prevista</div>
            <div class="t-val">${janela.aberturaPrevia || '—'}</div>
          </div>
          <div class="time-cell ${janela.aberturaReal && janela.aberturaPrevia && diffMins(janela.aberturaPrevia, janela.aberturaReal)! > 0 ? 'warn' : 'highlight'}">
            <div class="t-label">Abertura Real</div>
            <div class="t-val">${janela.aberturaReal || '—'}</div>
            ${janela.aberturaReal && janela.aberturaPrevia ? `<div class="t-delta ${diffMins(janela.aberturaPrevia, janela.aberturaReal)! > 0 ? 'delta-pos' : 'delta-neg'}">${deltaAbertura}</div>` : ''}
          </div>
          <div class="time-cell">
            <div class="t-label">Fecho Previsto</div>
            <div class="t-val">${janela.fechoPrevisto || '—'}</div>
          </div>
          <div class="time-cell ${janela.fechoReal && janela.fechoPrevisto && diffMins(janela.fechoPrevisto, janela.fechoReal)! > 0 ? 'warn' : 'highlight'}">
            <div class="t-label">Fecho Real</div>
            <div class="t-val">${janela.fechoReal || '—'}</div>
            ${janela.fechoReal && janela.fechoPrevisto ? `<div class="t-delta ${diffMins(janela.fechoPrevisto, janela.fechoReal)! > 0 ? 'delta-pos' : 'delta-neg'}">${deltaFecho}</div>` : ''}
          </div>
        </div>
        <div class="duration-box">
          <span class="dur-label">Duração total de utilização</span>
          <span class="dur-val">${totalDuration}</span>
        </div>
      </div>
    </div>

    <!-- TECH -->
    ${satelite ? `<div>${techSection}</div>` : '<div></div>'}
  </div>

  <!-- RESPONSÁVEIS -->
  ${responsaveisSection}

  <!-- CHECKLIST -->
  ${checklistSection}

  <!-- INCIDÊNCIAS -->
  ${incidenciasSection}

  <!-- FOOTER -->
  <div class="page-footer">
    <span>Kreato SatOps — Relatório de Transmissão</span>
    <span>${evtLabel(janela)} · ${satelite?.nome ?? ''} · ${janela.dataEvento}</span>
    <span>Gerado em ${reportDate}</span>
  </div>

</div>
</body>
</html>`;
}

// ─── Modal component ──────────────────────────────────────────────────────────

interface Props {
  janela: JanelaApiItem | null;
  satelite: SateliteApiItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function JanelaRelatorioModal({ janela, satelite, isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);

  const loadData = useCallback(async () => {
    if (!janela) return;
    setLoading(true);
    try {
      const [incsByJanela, sevs, imps, cats] = await Promise.all([
        incRepo.listByJanela(janela.id),
        paramRepo.listSeveridadesIncidencia(),
        paramRepo.listImpactosIncidencia(),
        paramRepo.listCategoriasIncidencia(),
      ]);

      const filtered = incsByJanela;

      const sevMap = new Map<string, string>();
      const impMap = new Map<string, string>();
      const catMap = new Map<string, string>();
      sevs.data.forEach((x) => sevMap.set(x.id, x.titulo ?? ''));
      imps.data.forEach((x) => impMap.set(x.id, x.titulo ?? ''));
      cats.data.forEach((x) => catMap.set(x.id, x.titulo ?? ''));

      setData({
        janela,
        satelite,
        incidencias: filtered,
        severidadesMap: sevMap,
        impactosMap: impMap,
        categoriasMap: catMap,
      });
    } finally {
      setLoading(false);
    }
  }, [janela, satelite]);

  useEffect(() => {
    if (isOpen) loadData();
    else setData(null);
  }, [isOpen, loadData]);

  const handlePrint = () => {
    if (!data) return;
    setPrinting(true);
    try {
      const html = buildHtml(data);
      const win = window.open('', '_blank', 'width=1100,height=800');
      if (!win) return;
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        setPrinting(false);
      }, 600);
    } catch {
      setPrinting(false);
    }
  };

  // ── In-modal preview ────────────────────────────────────────────────────────

  const evLabel = janela ? evtLabel(janela) : '';
  const dur =
    janela && janela.aberturaReal && janela.fechoReal
      ? (() => {
          const m = diffMins(janela.aberturaReal, janela.fechoReal);
          return m !== null && m >= 0 ? fmtDuration(m) : null;
        })()
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[700px] max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Satellite className="h-4 w-4" />
            Relatório de Transmissão
          </DialogTitle>
          <DialogDescription>
            {evLabel} · {janela?.dataEvento}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Event summary */}
            <div className="bg-muted/40 border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-base">{evLabel}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {satelite?.nome}
                    {satelite?.transponder ? ` · ${satelite.transponder}` : ''}
                    {janela?.canal ? ` · ${janela.canal}` : ''}
                  </p>
                </div>
                {dur && (
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Duração
                    </p>
                    <p className="text-xl font-bold font-mono">{dur}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tempos */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Tempos UTC
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Ab. Prevista', val: janela?.aberturaPrevia },
                  { label: 'Ab. Real', val: janela?.aberturaReal },
                  { label: 'Fecho Previsto', val: janela?.fechoPrevisto },
                  { label: 'Fecho Real', val: janela?.fechoReal },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">
                      {label}
                    </p>
                    <p className="font-mono font-bold text-sm">{val || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Parâmetros técnicos */}
            {satelite && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Parâmetros Técnicos
                </p>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {[
                    ['Transponder', satelite.transponder],
                    [
                      'Freq. Uplink',
                      satelite.frequenciaUplink ? `${satelite.frequenciaUplink} MHz` : '',
                    ],
                    ['Polarização', satelite.polarizacao],
                    ['Symbol Rate', satelite.symbolRate ? `${satelite.symbolRate} Msps` : ''],
                    ['FEC', satelite.fec],
                  ].map(([k, v]) =>
                    v ? (
                      <div key={k} className="bg-muted/30 rounded p-2">
                        <p className="text-[9px] text-muted-foreground">{k}</p>
                        <p className="font-mono font-semibold">{v}</p>
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Responsáveis */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Responsáveis ({data.janela.responsaveis?.length ?? 0})
              </p>
              {!data.janela.responsaveis?.length ? (
                <p className="text-xs text-muted-foreground italic">Sem responsáveis registados.</p>
              ) : (
                <div className="space-y-1.5">
                  {data.janela.responsaveis.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 text-xs bg-muted/20 rounded px-3 py-2"
                    >
                      <span className="font-semibold w-40 truncate">{r.recursoHumanoNome}</span>
                      <span className="text-muted-foreground flex-1">{r.recursoTecnicoNome}</span>
                      <span className="text-muted-foreground">{r.disponibilidade}</span>
                      <span className="font-mono text-muted-foreground">{r.telefone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Checklist resumo */}
            {(() => {
              const cl = parseCl(data.janela.checklist ?? data.satelite?.checklist);
              if (!cl.length) return null;
              const done = cl.reduce(
                (a, e) => a + e.atividades.filter((v) => v.concluida).length,
                0,
              );
              const total = cl.reduce((a, e) => a + e.atividades.length, 0);
              return (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Checklist — {done}/{total} concluídos
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {cl.flatMap((e) =>
                      e.atividades.map((a) => (
                        <div
                          key={a.id}
                          className={`flex items-center gap-2 ${a.concluida ? '' : 'opacity-50'}`}
                        >
                          {a.concluida ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className={a.concluida ? '' : 'line-through text-muted-foreground'}>
                            {a.nome}
                          </span>
                        </div>
                      )),
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Incidências resumo */}
            <Separator />
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Incidências ({data.incidencias.length})
              </p>
              {!data.incidencias.length ? (
                <p className="text-xs text-muted-foreground italic">Sem incidências nesta data.</p>
              ) : (
                <div className="space-y-1">
                  {data.incidencias.map((inc) => (
                    <div
                      key={inc.id}
                      className="flex items-start gap-2 text-xs bg-red-500/5 border border-red-500/15 rounded px-3 py-2"
                    >
                      <Clock className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">{inc.titulo}</span>
                        {inc.horario_incidencia && (
                          <span className="text-muted-foreground ml-2 font-mono">
                            {inc.horario_incidencia}
                          </span>
                        )}
                        {inc.descricao && (
                          <p className="text-muted-foreground mt-0.5">{inc.descricao}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="shrink-0 flex justify-end gap-2 pt-3 border-t mt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
          <Button size="sm" onClick={handlePrint} disabled={!data || printing} className="gap-2">
            {printing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            {printing ? 'A gerar...' : 'Gerar PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default JanelaRelatorioModal;
