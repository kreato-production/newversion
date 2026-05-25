import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ApiRecursosTecnicosRepository } from '@/modules/recursos-tecnicos/recursos-tecnicos.api.repository';
import { ApiRecursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.api.repository';
import type { Etapa, AlocacaoRecurso } from './EtapasTab';

interface PlanoProducaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  etapas: Etapa[];
  titulo?: string;
}

function parseMin(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatDur(minutes: number): string {
  if (minutes <= 0) return '0min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}m` : ''}` : `${m}min`;
}

const ROW_H = 34;
const LABEL_W = 176;

const tecnicosRepo = new ApiRecursosTecnicosRepository();
const fisicosRepo = new ApiRecursosFisicosRepository();

// ── Activity hint ──────────────────────────────────────────────────────────────

function ResourceRow({ alloc, nameMap }: { alloc: AlocacaoRecurso; nameMap: Map<string, string> }) {
  const nome = nameMap.get(alloc.recursoId) ?? alloc.recursoId;
  return (
    <div className="flex items-baseline justify-between gap-4 text-[11px]">
      <span className="font-medium">{nome}</span>
      <span className="text-muted-foreground whitespace-nowrap shrink-0">
        {alloc.quantidade > 1 && <span className="mr-1.5">×{alloc.quantidade}</span>}
        {alloc.de && alloc.ate ? `${alloc.de} – ${alloc.ate}` : ''}
      </span>
    </div>
  );
}

function ActivityHint({
  nome,
  horaInicio,
  horaFim,
  duracaoMinutos,
  recursosTecnicos,
  equipamentos,
  cor,
  tecnicosMap,
  fisicosMap,
  children,
}: {
  nome: string;
  horaInicio: string;
  horaFim: string;
  duracaoMinutos: number;
  recursosTecnicos: AlocacaoRecurso[];
  equipamentos: AlocacaoRecurso[];
  cor: string;
  tecnicosMap: Map<string, string>;
  fisicosMap: Map<string, string>;
  children: React.ReactNode;
}) {
  const hasResources = recursosTecnicos.length > 0 || equipamentos.length > 0;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        sideOffset={6}
        className="p-0 overflow-hidden rounded-lg shadow-lg border max-w-[280px] z-[200]"
      >
        {/* Header strip in etapa colour */}
        <div className="px-3 py-2" style={{ backgroundColor: cor }}>
          <p className="text-[12px] font-semibold text-white leading-tight">
            {nome || 'Atividade'}
          </p>
          <p className="text-[11px] text-white/80 mt-0.5">
            {horaInicio} – {horaFim}
            <span className="ml-2 opacity-70">{formatDur(duracaoMinutos)}</span>
          </p>
        </div>

        {/* Resource body */}
        {hasResources ? (
          <div className="px-3 py-2.5 space-y-2.5 bg-popover text-popover-foreground">
            {recursosTecnicos.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                  Recursos Técnicos
                </p>
                {recursosTecnicos.map((alloc) => (
                  <ResourceRow key={alloc.recursoId} alloc={alloc} nameMap={tecnicosMap} />
                ))}
              </div>
            )}
            {equipamentos.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                  Equipamentos
                </p>
                {equipamentos.map((alloc) => (
                  <ResourceRow key={alloc.recursoId} alloc={alloc} nameMap={fisicosMap} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-3 py-2 bg-popover text-popover-foreground">
            <p className="text-[11px] text-muted-foreground italic">Sem recursos associados.</p>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// ── PlanoProducaoModal ─────────────────────────────────────────────────────────

export function PlanoProducaoModal({ isOpen, onClose, etapas, titulo }: PlanoProducaoModalProps) {
  const [tecnicosMap, setTecnicosMap] = useState<Map<string, string>>(new Map());
  const [fisicosMap, setFisicosMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!isOpen) return;
    tecnicosRepo
      .list()
      .then((items) => {
        setTecnicosMap(new Map(items.map((r) => [r.id, r.nome])));
      })
      .catch(() => {});
    fisicosRepo
      .list()
      .then((items) => {
        setFisicosMap(new Map(items.map((r) => [r.id, r.nome])));
      })
      .catch(() => {});
  }, [isOpen]);

  const { startMin, endMin } = useMemo(() => {
    let s = 8 * 60;
    let e = 24 * 60;
    let hasAny = false;
    for (const etapa of etapas) {
      for (const a of etapa.atividades) {
        if (a.horaInicio && a.horaFim && a.duracaoMinutos > 0) {
          const as = parseMin(a.horaInicio);
          const ae = parseMin(a.horaFim);
          if (!hasAny) {
            s = as;
            e = ae;
            hasAny = true;
          } else {
            s = Math.min(s, as);
            e = Math.max(e, ae);
          }
        }
      }
    }
    s = Math.max(0, Math.floor(s / 60) * 60);
    e = Math.min(24 * 60, Math.ceil(e / 60) * 60);
    if (e <= s) {
      s = 8 * 60;
      e = 24 * 60;
    }
    return { startMin: s, endMin: e };
  }, [etapas]);

  const totalMin = endMin - startMin;

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = startMin / 60; i <= endMin / 60; i++) h.push(i);
    return h;
  }, [startMin, endMin]);

  const toLeftPct = (minutes: number) => ((minutes - startMin) / totalMin) * 100;
  const toWidthPct = (duration: number) => (duration / totalMin) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-w-[1800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Plano de Produção{titulo ? ` — ${titulo}` : ''}</DialogTitle>
        </DialogHeader>

        {etapas.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground py-16">
            <p>Nenhuma etapa cadastrada. Adicione etapas na aba &quot;Etapas&quot;.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* ── Time axis header ── */}
            <div
              className="flex sticky top-0 z-10 bg-background border-b"
              style={{ paddingBottom: 4 }}
            >
              <div style={{ width: LABEL_W, flexShrink: 0 }} />
              <div className="flex-1 relative" style={{ height: 28 }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${toLeftPct(h * 60)}%`, transform: 'translateX(-50%)' }}
                  >
                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                      {String(h).padStart(2, '0')}h
                    </span>
                    <div className="w-px h-2 bg-border" />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Etapa blocks ── */}
            <div>
              {etapas.map((etapa) => {
                const rows = etapa.atividades.length > 0 ? etapa.atividades : [null];
                const blockH = rows.length * ROW_H;

                return (
                  <div
                    key={etapa.id}
                    className="flex border-b border-border/40"
                    style={{ minHeight: ROW_H }}
                  >
                    {/* Left label */}
                    <div
                      className="shrink-0 flex items-start pt-1 pr-3"
                      style={{
                        width: LABEL_W,
                        borderRight: `3px solid ${etapa.cor}`,
                        minHeight: blockH,
                      }}
                    >
                      <span
                        className="text-xs font-semibold leading-tight truncate"
                        style={{ color: etapa.cor }}
                      >
                        {etapa.nome || 'Sem nome'}
                      </span>
                    </div>

                    {/* Activity rows */}
                    <div className="flex-1 flex flex-col">
                      {rows.map((a, idx) => (
                        <div
                          key={a ? a.id : 'empty'}
                          className="relative flex-1"
                          style={{
                            height: ROW_H,
                            borderTop: idx > 0 ? '1px solid var(--border)' : undefined,
                          }}
                        >
                          {/* vertical grid lines */}
                          {hours.map((h) => (
                            <div
                              key={h}
                              className="absolute top-0 bottom-0 w-px bg-border/20"
                              style={{ left: `${toLeftPct(h * 60)}%` }}
                            />
                          ))}

                          {/* activity bar */}
                          {a &&
                            (() => {
                              const aStart = parseMin(a.horaInicio);
                              const aEnd = parseMin(a.horaFim);
                              if (a.duracaoMinutos <= 0) return null;
                              const left = toLeftPct(Math.max(aStart, startMin));
                              const width = toWidthPct(
                                Math.min(aEnd, endMin) - Math.max(aStart, startMin),
                              );
                              if (width <= 0) return null;

                              return (
                                <ActivityHint
                                  nome={a.nome}
                                  horaInicio={a.horaInicio}
                                  horaFim={a.horaFim}
                                  duracaoMinutos={a.duracaoMinutos}
                                  recursosTecnicos={a.recursosTecnicos}
                                  equipamentos={a.equipamentos}
                                  cor={etapa.cor}
                                  tecnicosMap={tecnicosMap}
                                  fisicosMap={fisicosMap}
                                >
                                  <div
                                    className="absolute flex items-center justify-between gap-1 px-2 rounded text-xs font-medium text-white shadow-sm overflow-hidden cursor-default select-none"
                                    style={{
                                      left: `${left}%`,
                                      width: `${Math.max(width, 0.4)}%`,
                                      top: 4,
                                      bottom: 4,
                                      backgroundColor: etapa.cor,
                                      opacity: 0.92,
                                    }}
                                  >
                                    <span className="truncate">{a.nome}</span>
                                    <span className="shrink-0 opacity-80 text-[10px] font-normal whitespace-nowrap">
                                      {formatDur(a.duracaoMinutos)}
                                    </span>
                                  </div>
                                </ActivityHint>
                              );
                            })()}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Legend ── */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              {etapas.map((etapa) => (
                <div key={etapa.id} className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-sm shrink-0"
                    style={{ backgroundColor: etapa.cor }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {etapa.nome || 'Sem nome'}
                    {etapa.atividades.length > 0 && (
                      <span className="ml-1 text-muted-foreground/60">
                        ({etapa.atividades.length})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
