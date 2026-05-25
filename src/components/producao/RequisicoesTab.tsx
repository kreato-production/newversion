'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, Link2, Package, Wrench, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ApiAlocacoesRepository,
  type OverviewAllocationRow,
} from '@/modules/alocacoes/alocacoes.api';
import { ApiGravacoesRepository } from '@/modules/gravacoes/gravacoes.api.repository';
import { gravacoesRelacionamentosApi } from '@/modules/gravacoes/gravacoes-relacionamentos.api';
import { ApiRecursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.api.repository';
import type { EstoqueItem, RecursoFisico } from '@/modules/recursos-fisicos/recursos-fisicos.types';
import { ApiRecursosHumanosRepository } from '@/modules/recursos-humanos/recursos-humanos.api.repository';
import type {
  RecursoHumano,
  RecursoHumanoOcupacao,
} from '@/modules/recursos-humanos/recursos-humanos.types';
import { ApiRecursosTecnicosRepository } from '@/modules/recursos-tecnicos/recursos-tecnicos.api.repository';
import type { RecursoTecnico } from '@/modules/recursos-tecnicos/recursos-tecnicos.types';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type RTItem = {
  gravacaoId: string;
  gravacaoNome: string;
  recursoId: string;
  recursoNome: string;
  dataPrevista: string;
  horaInicio: string;
  horaFim: string;
  tempoGravacao: string;
  anchorId: string;
  espacoNome: string;
  funcaoOperadorId?: string;
  isEspacoResource?: boolean;
  selectedRh?: { id: string; nome: string; sobrenome: string; foto?: string } | null;
  associadoHoraInicio?: string;
  associadoHoraFim?: string;
  tempoAssociado?: string;
};

type RFItem = {
  gravacaoId: string;
  gravacaoNome: string;
  recursoId: string;
  recursoNome: string;
  dataPrevista: string;
  horaInicio: string;
  horaFim: string;
  tempoGravacao: string;
  anchorId: string;
  espacoNome?: string;
  isEspacoResource?: boolean;
  selectedEstoque?: { id: string; nome: string; numerador: number; imagemUrl?: string } | null;
  associadoHoraInicio?: string;
  associadoHoraFim?: string;
  tempoAssociado?: string;
};

type Candidate = {
  id: string;
  nome: string;
  sobrenome: string;
  foto?: string;
  funcao: string;
  tempoLivre: string;
  tempoLivreMinutos: number;
};

type StockItem = {
  id: string;
  numerador: number;
  codigo: string;
  nome: string;
  imagemUrl?: string;
};

type DragItem = {
  rhId: string;
  rhNome: string;
  rhSobrenome: string;
  rhFoto?: string;
  funcaoId?: string;
  date: string;
};

interface RequisicoesTabProps {
  dateStart: string;
  dateEnd: string;
  onSaveComplete?: () => void;
}

// ─── Repositories ─────────────────────────────────────────────────────────────

const alocacoesApi = new ApiAlocacoesRepository();
const gravacoesApi = new ApiGravacoesRepository();
const recursosTecnicosApi = new ApiRecursosTecnicosRepository();
const recursosHumanosApi = new ApiRecursosHumanosRepository();
const recursosFisicosApi = new ApiRecursosFisicosRepository();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const minutos = (inicio: string, fim: string) => {
  if (!inicio || !fim) return 0;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fim.split(':').map(Number);
  return h2 * 60 + m2 - (h1 * 60 + m1);
};

const tempo = (inicio: string, fim: string) => {
  const total = minutos(inicio, fim);
  if (total <= 0) return '-';
  const horas = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${horas}h${mins}m` : `${horas}h`;
};

const iniciais = (nome: string, sobrenome: string) =>
  `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase();

const isWeekendDay = (dayStr: string): boolean => {
  const dow = new Date(`${dayStr}T12:00:00`).getDay();
  return dow === 0 || dow === 6;
};

const rhDayAvailable = (rh: RecursoHumano, dayStr: string): boolean => {
  const dow = new Date(`${dayStr}T12:00:00`).getDay();
  return (rh.escalas || []).some(
    (e) =>
      e.dataInicio <= dayStr &&
      e.dataFim >= dayStr &&
      (e.diasSemana || [1, 2, 3, 4, 5]).includes(dow),
  );
};

const rhDayOff = (rh: RecursoHumano, dayStr: string): boolean => {
  const hasAusencia = (rh.ausencias || []).some(
    (a) => a.dataInicio <= dayStr && a.dataFim >= dayStr,
  );
  if (hasAusencia) return true;
  if (!isWeekendDay(dayStr)) return false;
  return !rhDayAvailable(rh, dayStr);
};

// ─── Component ────────────────────────────────────────────────────────────────

const RequisicoesTab = ({ dateStart, dateEnd, onSaveComplete }: RequisicoesTabProps) => {
  const { t } = useLanguage();
  const [tab, setTab] = useState('tecnicos');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tecnicos, setTecnicos] = useState<RTItem[]>([]);
  const [fisicos, setFisicos] = useState<RFItem[]>([]);

  // Dialog state (Físicos tab — kept as-is)
  const [rfDialog, setRfDialog] = useState<number | null>(null);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [rfHoraInicio, setRfHoraInicio] = useState('');
  const [rfHoraFim, setRfHoraFim] = useState('');
  const [stockBusy, setStockBusy] = useState(false);

  // Drag-and-drop state (Técnicos tab)
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dragOverAnchorId, setDragOverAnchorId] = useState<string | null>(null);

  // Drag-and-drop state (Equipamentos tab)
  type StockDragItem = {
    estoqueItemId: string;
    estoqueItemNome: string;
    estoqueItemNumerador: number;
    estoqueItemImagemUrl?: string;
    recursoId: string;
    date: string;
  };
  const [stockDragItem, setStockDragItem] = useState<StockDragItem | null>(null);
  const [stockDragOverAnchorId, setStockDragOverAnchorId] = useState<string | null>(null);

  // Raw data
  const [gravacoes, setGravacoes] = useState<Map<string, { nome: string; dataPrevista: string }>>(
    new Map(),
  );
  const [recursosTecnicos, setRecursosTecnicos] = useState<Map<string, RecursoTecnico>>(new Map());
  const [recursosHumanos, setRecursosHumanos] = useState<Map<string, RecursoHumano>>(new Map());
  const [recursosFisicos, setRecursosFisicos] = useState<Map<string, RecursoFisico>>(new Map());
  const [ocupacoesRh, setOcupacoesRh] = useState<RecursoHumanoOcupacao[]>([]);

  const inRange = (date?: string) => Boolean(date && date >= dateStart && date <= dateEnd);

  // ── Days array ──────────────────────────────────────────────────────────────
  const daysArray = useMemo(() => {
    const days: string[] = [];
    const start = new Date(`${dateStart}T12:00:00`);
    const end = new Date(`${dateEnd}T12:00:00`);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(format(d, 'yyyy-MM-dd'));
    }
    return days;
  }, [dateStart, dateEnd]);

  // ── Load data ───────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const settled = await Promise.allSettled([
        alocacoesApi.listOverview(),
        gravacoesApi.list(),
        recursosTecnicosApi.list(),
        recursosHumanosApi.list(),
        recursosFisicosApi.list(),
        recursosHumanosApi.listOcupacoes(dateStart, dateEnd),
      ]);
      const names = [
        'alocacoes/overview',
        'gravacoes',
        'recursos-tecnicos',
        'recursos-humanos',
        'recursos-fisicos',
        'recursos-humanos/ocupacao',
      ];
      settled.forEach((r, i) => {
        if (r.status === 'rejected')
          console.error(`[RequisicoesTab] ${names[i]} failed:`, r.reason);
      });
      const [overviewResult, gravacoesResult, rtResult, rhResult, rfResult, ocupacoesResult] =
        settled;
      if (overviewResult.status === 'rejected') throw overviewResult.reason;
      const overview = overviewResult.value;
      const gravacoesRows = gravacoesResult.status === 'fulfilled' ? gravacoesResult.value : [];
      const rtRows = rtResult.status === 'fulfilled' ? rtResult.value : [];
      const rhRows = rhResult.status === 'fulfilled' ? rhResult.value : [];
      const rfRows = rfResult.status === 'fulfilled' ? rfResult.value : [];
      const ocupacoesRows = ocupacoesResult.status === 'fulfilled' ? ocupacoesResult.value : [];

      const gravMap = new Map(
        gravacoesRows.map((item) => [
          item.id,
          { nome: item.nome, dataPrevista: item.dataPrevista },
        ]),
      );
      const rtMap = new Map(rtRows.map((item) => [item.id, item]));
      const rhMap = new Map(rhRows.map((item) => [item.id, item]));
      const rfMap = new Map(rfRows.map((item) => [item.id, item]));

      setGravacoes(gravMap);
      setRecursosTecnicos(rtMap);
      setRecursosHumanos(rhMap);
      setRecursosFisicos(rfMap);
      setOcupacoesRh(ocupacoesRows);

      const children = new Map<string, OverviewAllocationRow[]>();
      overview.alocacoes.forEach((row) => {
        if (!row.parentRecursoId) return;
        const current = children.get(row.parentRecursoId) ?? [];
        current.push(row);
        children.set(row.parentRecursoId, current);
      });

      const nextRt: RTItem[] = [];
      const nextRf: RFItem[] = [];

      overview.alocacoes.forEach((row) => {
        if (row.parentRecursoId || row.recursoHumanoId) return;
        const gravacao = gravMap.get(row.gravacaoId);
        if (!gravacao || !inRange(gravacao.dataPrevista)) return;

        if (row.recursoTecnicoId) {
          const hasRhChild = (children.get(row.id) ?? []).some((child) =>
            Boolean(child.recursoHumanoId),
          );
          if (!hasRhChild) {
            const rt = rtMap.get(row.recursoTecnicoId);
            nextRt.push({
              gravacaoId: row.gravacaoId,
              gravacaoNome: gravacao.nome,
              recursoId: row.recursoTecnicoId,
              recursoNome: row.recursoTecnicoNome || '',
              dataPrevista: gravacao.dataPrevista,
              horaInicio: row.horaInicio?.slice(0, 5) || '',
              horaFim: row.horaFim?.slice(0, 5) || '',
              tempoGravacao: tempo(
                row.horaInicio?.slice(0, 5) || '',
                row.horaFim?.slice(0, 5) || '',
              ),
              anchorId: row.id,
              espacoNome: '',
              funcaoOperadorId: rt?.funcaoOperadorId,
            });
          }
          return;
        }

        if (row.recursoFisicoId && !row.estoqueItemId) {
          nextRf.push({
            gravacaoId: row.gravacaoId,
            gravacaoNome: gravacao.nome,
            recursoId: row.recursoFisicoId,
            recursoNome: row.recursoFisicoNome || '',
            dataPrevista: gravacao.dataPrevista,
            horaInicio: row.horaInicio?.slice(0, 5) || '',
            horaFim: row.horaFim?.slice(0, 5) || '',
            tempoGravacao: tempo(row.horaInicio?.slice(0, 5) || '', row.horaFim?.slice(0, 5) || ''),
            anchorId: row.id,
          });
        }
      });

      // Fetch espaco resources for all gravações in range (for BOTH espacoNome and espaco-sourced RT items)
      const inRangeGravacaoIds = [...gravMap.entries()]
        .filter(([, g]) => inRange(g.dataPrevista))
        .map(([id]) => id);
      const espacoMap = new Map<string, string>();
      await Promise.all(
        inRangeGravacaoIds.map(async (gid) => {
          try {
            const espacos = await gravacoesRelacionamentosApi.listEspacos(gid);
            espacoMap.set(gid, espacos.map((e) => e.espacoNome).join(', ') || '');
            const gravacao = gravMap.get(gid)!;
            await Promise.all(
              espacos.map(async (espaco) => {
                try {
                  const [{ items: rtItems }, { items: rfItems }] = await Promise.all([
                    gravacoesRelacionamentosApi.listEspacoResources(gid, espaco.id, 'tecnico'),
                    gravacoesRelacionamentosApi.listEspacoResources(gid, espaco.id, 'fisico'),
                  ]);
                  for (const item of rtItems) {
                    nextRt.push({
                      gravacaoId: gid,
                      gravacaoNome: gravacao.nome,
                      recursoId: item.recursoId,
                      recursoNome: item.recursoNome,
                      dataPrevista: gravacao.dataPrevista,
                      horaInicio: item.horaInicio?.slice(0, 5) || '',
                      horaFim: item.horaFim?.slice(0, 5) || '',
                      tempoGravacao: tempo(
                        item.horaInicio?.slice(0, 5) || '',
                        item.horaFim?.slice(0, 5) || '',
                      ),
                      anchorId: `espaco-${espaco.id}-${item.id}`,
                      espacoNome: espaco.espacoNome,
                      funcaoOperadorId: rtMap.get(item.recursoId)?.funcaoOperadorId,
                      isEspacoResource: true,
                    });
                  }
                  for (const item of rfItems) {
                    nextRf.push({
                      gravacaoId: gid,
                      gravacaoNome: gravacao.nome,
                      recursoId: item.recursoId,
                      recursoNome: item.recursoNome,
                      dataPrevista: gravacao.dataPrevista,
                      horaInicio: item.horaInicio?.slice(0, 5) || '',
                      horaFim: item.horaFim?.slice(0, 5) || '',
                      tempoGravacao: tempo(
                        item.horaInicio?.slice(0, 5) || '',
                        item.horaFim?.slice(0, 5) || '',
                      ),
                      anchorId: `espaco-${espaco.id}-${item.id}`,
                      espacoNome: espaco.espacoNome,
                      isEspacoResource: true,
                    });
                  }
                } catch {
                  // ignore per-espaco resource errors
                }
              }),
            );
          } catch {
            espacoMap.set(gid, '');
          }
        }),
      );
      // Apply espacoNome to items sourced from gravacao_recursos (not espaco resources)
      nextRt.forEach((item) => {
        if (!item.isEspacoResource) {
          item.espacoNome = espacoMap.get(item.gravacaoId) || '';
        }
      });
      nextRf.forEach((item) => {
        if (!item.isEspacoResource) {
          item.espacoNome = espacoMap.get(item.gravacaoId) || '';
        }
      });

      setTecnicos(nextRt);
      setFisicos(nextRf);
    } catch (error) {
      console.error('Error fetching requisicoes:', error);
      toast.error('Erro ao carregar requisições');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateEnd, dateStart]);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Derived: eligible RH candidates ─────────────────────────────────────────
  const rhCandidates = useMemo(() => {
    const requiredFuncaoIds = new Set(tecnicos.map((t) => t.funcaoOperadorId).filter(Boolean));
    const result: RecursoHumano[] = [];
    recursosHumanos.forEach((rh) => {
      if (rh.status !== 'Ativo') return;
      if (!rh.funcaoId || !requiredFuncaoIds.has(rh.funcaoId)) return;
      result.push(rh);
    });
    return result.sort((a, b) =>
      `${a.nome} ${a.sobrenome}`.localeCompare(`${b.nome} ${b.sobrenome}`),
    );
  }, [tecnicos, recursosHumanos]);

  // ── Ociosidade per RH ────────────────────────────────────────────────────────
  const calcOciosidade = useCallback(
    (rh: RecursoHumano): number => {
      let totalMinutes = 0;
      for (const dayStr of daysArray) {
        if (rhDayOff(rh, dayStr)) continue;
        const dow = new Date(`${dayStr}T12:00:00`).getDay();
        const escalasNoDia = (rh.escalas || []).filter(
          (e) =>
            e.dataInicio <= dayStr &&
            e.dataFim >= dayStr &&
            (e.diasSemana || [1, 2, 3, 4, 5]).includes(dow),
        );
        const minutosEscala = escalasNoDia.reduce(
          (sum, e) => sum + minutos(e.horaInicio, e.horaFim),
          0,
        );
        const minutosOcupado = ocupacoesRh
          .filter((o) => o.recursoId === rh.id && o.data === dayStr)
          .reduce((sum, o) => sum + minutos(o.horaInicio, o.horaFim), 0);
        totalMinutes += Math.max(0, minutosEscala - minutosOcupado);
      }
      return totalMinutes / 60;
    },
    [daysArray, ocupacoesRh],
  );

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const handleDragStart = (rh: RecursoHumano, date: string) => {
    setDragItem({
      rhId: rh.id,
      rhNome: rh.nome,
      rhSobrenome: rh.sobrenome,
      rhFoto: rh.foto,
      funcaoId: rh.funcaoId,
      date,
    });
  };

  const handleDrop = (index: number) => {
    if (!dragItem) return;
    const item = tecnicos[index];
    if (!item || dragItem.date !== item.dataPrevista) return;
    if (item.funcaoOperadorId && dragItem.funcaoId !== item.funcaoOperadorId) {
      toast.error('A função do recurso humano não corresponde ao recurso técnico solicitado');
      setDragItem(null);
      setDragOverAnchorId(null);
      return;
    }
    setTecnicos((current) =>
      current.map((t, i) =>
        i === index
          ? {
              ...t,
              selectedRh: {
                id: dragItem.rhId,
                nome: dragItem.rhNome,
                sobrenome: dragItem.rhSobrenome,
                foto: dragItem.rhFoto,
              },
              associadoHoraInicio: t.horaInicio,
              associadoHoraFim: t.horaFim,
              tempoAssociado: t.tempoGravacao,
            }
          : t,
      ),
    );
    setDragItem(null);
    setDragOverAnchorId(null);
  };

  // ── Físicos helpers ──────────────────────────────────────────────────────────

  const openRfDialog = (index: number) => {
    const req = fisicos[index];
    const recurso = recursosFisicos.get(req.recursoId);
    setRfDialog(index);
    setSelectedStockId(req.selectedEstoque?.id || null);
    setRfHoraInicio(req.associadoHoraInicio || req.horaInicio || '');
    setRfHoraFim(req.associadoHoraFim || req.horaFim || '');
    setStockBusy(true);
    setStockItems(
      (recurso?.estoqueItens || []).map((item) => ({
        id: item.id,
        numerador: item.numerador,
        codigo: item.codigo,
        nome: item.nome,
        imagemUrl: item.imagemUrl,
      })),
    );
    setStockBusy(false);
  };

  const confirmRf = () => {
    if (rfDialog === null || !selectedStockId || minutos(rfHoraInicio, rfHoraFim) <= 0) {
      toast.error('Preencha o horário corretamente');
      return;
    }
    const stock = stockItems.find((item) => item.id === selectedStockId);
    if (!stock) return;
    setFisicos((current) =>
      current.map((item, index) =>
        index === rfDialog
          ? {
              ...item,
              selectedEstoque: {
                id: stock.id,
                nome: stock.nome,
                numerador: stock.numerador,
                imagemUrl: stock.imagemUrl,
              },
              associadoHoraInicio: rfHoraInicio,
              associadoHoraFim: rfHoraFim,
              tempoAssociado: tempo(rfHoraInicio, rfHoraFim),
            }
          : item,
      ),
    );
    setRfDialog(null);
  };

  // ── Stock drag-and-drop handler ──────────────────────────────────────────────
  const handleStockDrop = (index: number) => {
    if (!stockDragItem) return;
    const item = fisicos[index];
    if (!item || stockDragItem.date !== item.dataPrevista) return;
    if (stockDragItem.recursoId !== item.recursoId) {
      toast.error('Este item não corresponde ao equipamento requisitado');
      setStockDragItem(null);
      setStockDragOverAnchorId(null);
      return;
    }
    setFisicos((current) =>
      current.map((f, i) =>
        i === index
          ? {
              ...f,
              selectedEstoque: {
                id: stockDragItem.estoqueItemId,
                nome: stockDragItem.estoqueItemNome,
                numerador: stockDragItem.estoqueItemNumerador,
                imagemUrl: stockDragItem.estoqueItemImagemUrl,
              },
              associadoHoraInicio: f.associadoHoraInicio || f.horaInicio,
              associadoHoraFim: f.associadoHoraFim || f.horaFim,
              tempoAssociado: f.tempoGravacao,
            }
          : f,
      ),
    );
    setStockDragItem(null);
    setStockDragOverAnchorId(null);
  };

  // ── Save all associations ────────────────────────────────────────────────────
  const associar = async () => {
    setSaving(true);
    try {
      for (const item of tecnicosAssociaveis.filter((entry) => entry.selectedRh)) {
        await alocacoesApi.addColaborador(item.gravacaoId, item.anchorId, {
          recursoHumanoId: item.selectedRh!.id,
          horaInicio: item.associadoHoraInicio || item.horaInicio || '08:00',
          horaFim: item.associadoHoraFim || item.horaFim || '18:00',
        });
      }
      for (const item of fisicosAssociaveis.filter((entry) => entry.selectedEstoque)) {
        await alocacoesApi.updateHorario(item.gravacaoId, item.anchorId, {
          horaInicio: item.associadoHoraInicio || null,
          horaFim: item.associadoHoraFim || null,
          estoqueItemId: item.selectedEstoque!.id,
        });
      }
      toast.success('Associações salvas com sucesso');
      await load();
      onSaveComplete?.();
    } catch (error) {
      console.error('Error saving associations:', error);
      toast.error('Erro ao salvar associações');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value: string) => {
    if (!value) return '-';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  };

  // Only standard alocação items can be associated (espaco resources use a different mechanism)
  const fisicosAssociaveis = fisicos.filter((item) => !item.isEspacoResource);
  const tecnicosAssociaveis = tecnicos.filter((item) => !item.isEspacoResource);

  const hasPending =
    tecnicosAssociaveis.some((item) => item.selectedRh) ||
    fisicosAssociaveis.some((item) => item.selectedEstoque);

  // Items pending association (have a match selected but not yet saved)
  const fisicosPendentes = fisicosAssociaveis.filter((item) => item.selectedEstoque);
  // Items still waiting for a match
  const fisicosNaoAssociados = fisicosAssociaveis.filter((item) => !item.selectedEstoque);

  const tecnicosPendentes = tecnicosAssociaveis.filter((item) => item.selectedRh);
  const tecnicosNaoAssociados = tecnicosAssociaveis.filter((item) => !item.selectedRh);

  // ── Column widths (shared between both table sections) ───────────────────────
  const COL_FIXED = 'w-24 min-w-[96px]';
  const COL_RECURSO = 'w-32 min-w-[128px]';
  const COL_GRAVACAO = 'w-44 min-w-[176px]';
  const COL_PERIODO = 'w-28 min-w-[112px]';
  const COL_DAY = 'w-10 min-w-[40px]';

  // ── Render Técnicos tab ──────────────────────────────────────────────────────
  const renderTecnicos = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-md border">
        <table
          className="text-xs border-collapse"
          style={{ minWidth: `${4 * 128 + daysArray.length * 40}px` }}
        >
          {/* ── REQUISIÇÕES ─────────────────────────────────────────────── */}
          <tbody>
            {/* Section header */}
            <tr>
              <td
                colSpan={4 + daysArray.length}
                className="bg-orange-500 text-white text-center font-bold py-1.5 tracking-widest text-[11px] uppercase"
              >
                Requisições
              </td>
            </tr>
            {/* Column headers */}
            <tr className="bg-muted/70 border-b">
              <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_FIXED)}>
                Espaço
              </th>
              <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_RECURSO)}>
                Recurso Técnico
              </th>
              <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_GRAVACAO)}>
                Gravação
              </th>
              <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_PERIODO)}>
                Período
              </th>
              {daysArray.map((day) => (
                <th
                  key={day}
                  className={cn(
                    'text-center py-1.5 font-semibold',
                    COL_DAY,
                    isWeekendDay(day) && 'bg-muted',
                  )}
                >
                  {format(new Date(`${day}T12:00:00`), 'd')}
                </th>
              ))}
            </tr>

            {/* Data rows */}
            {tecnicosAssociaveis.length === 0 ? (
              <tr>
                <td
                  colSpan={4 + daysArray.length}
                  className="text-center py-6 text-muted-foreground"
                >
                  Nenhum recurso técnico pendente de associação neste período.
                </td>
              </tr>
            ) : (
              tecnicosAssociaveis.map((item) => {
                const index = tecnicos.indexOf(item);
                return (
                  <tr
                    key={item.anchorId}
                    className={cn(
                      'border-b transition-colors',
                      item.selectedRh
                        ? 'bg-green-50/60 dark:bg-green-950/20 hover:bg-green-50 dark:hover:bg-green-950/30'
                        : 'hover:bg-muted/30',
                    )}
                  >
                    <td className={cn('px-2 py-1.5 border-r truncate', COL_FIXED)}>
                      {item.espacoNome || '-'}
                    </td>
                    <td className={cn('px-2 py-1.5 border-r truncate', COL_RECURSO)}>
                      {item.recursoNome}
                    </td>
                    <td className={cn('px-2 py-1.5 border-r truncate', COL_GRAVACAO)}>
                      {item.gravacaoNome}
                    </td>
                    <td className={cn('px-2 py-1.5 border-r whitespace-nowrap', COL_PERIODO)}>
                      {item.horaInicio} às {item.horaFim}
                    </td>

                    {daysArray.map((day) => {
                      const isThisDay = day === item.dataPrevista;
                      const isOver = dragOverAnchorId === item.anchorId;
                      const canDrop =
                        isThisDay &&
                        dragItem &&
                        (!item.funcaoOperadorId || dragItem.funcaoId === item.funcaoOperadorId);

                      return (
                        <td
                          key={day}
                          className={cn(
                            'text-center px-0.5 py-1 align-middle',
                            COL_DAY,
                            isWeekendDay(day) && 'bg-muted/40',
                            isOver &&
                              canDrop &&
                              'bg-primary/15 outline outline-2 -outline-offset-2 outline-primary',
                            isOver && !canDrop && isThisDay && 'bg-destructive/10',
                          )}
                          onDragOver={
                            isThisDay
                              ? (e) => {
                                  e.preventDefault();
                                  setDragOverAnchorId(item.anchorId);
                                }
                              : undefined
                          }
                          onDragLeave={isThisDay ? () => setDragOverAnchorId(null) : undefined}
                          onDrop={
                            isThisDay
                              ? (e) => {
                                  e.preventDefault();
                                  handleDrop(index);
                                }
                              : undefined
                          }
                        >
                          {isThisDay &&
                            (item.selectedRh ? (
                              <div className="flex flex-col items-center gap-0.5 relative group">
                                <Avatar className="h-7 w-7 border-2 border-primary">
                                  <AvatarImage src={item.selectedRh.foto || undefined} />
                                  <AvatarFallback className="text-[8px]">
                                    {iniciais(item.selectedRh.nome, item.selectedRh.sobrenome)}
                                  </AvatarFallback>
                                </Avatar>
                                <button
                                  type="button"
                                  className="absolute -top-1 -right-1 hidden group-hover:flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                                  onClick={() =>
                                    setTecnicos((c) =>
                                      c.map((t, i) =>
                                        i === index
                                          ? { ...t, selectedRh: null, tempoAssociado: undefined }
                                          : t,
                                      ),
                                    )
                                  }
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center justify-center rounded bg-orange-500 text-white font-semibold px-1 py-0.5 text-[9px] leading-none">
                                {item.tempoGravacao}
                              </span>
                            ))}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* ── DISPONIBILIDADE ──────────────────────────────────────────── */}
          <tbody>
            {/* Spacer */}
            <tr>
              <td colSpan={4 + daysArray.length} className="h-2 bg-background" />
            </tr>
            {/* Section header */}
            <tr>
              <td
                colSpan={4 + daysArray.length}
                className="bg-blue-500 text-white text-center font-bold py-1.5 tracking-widest text-[11px] uppercase"
              >
                Disponibilidade
              </td>
            </tr>
            {/* Column headers */}
            <tr className="bg-muted/70 border-b">
              <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_FIXED)}>
                Departamento
              </th>
              <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_RECURSO)}>
                Recurso Técnico
              </th>
              <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_GRAVACAO)}>
                Recurso Humano
              </th>
              <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_PERIODO)}>
                Ociosidade
              </th>
              {daysArray.map((day) => (
                <th
                  key={day}
                  className={cn(
                    'text-center py-1.5 font-semibold',
                    COL_DAY,
                    isWeekendDay(day) && 'bg-muted',
                  )}
                >
                  {format(new Date(`${day}T12:00:00`), 'd')}
                </th>
              ))}
            </tr>

            {/* Data rows */}
            {rhCandidates.length === 0 ? (
              <tr>
                <td
                  colSpan={4 + daysArray.length}
                  className="text-center py-6 text-muted-foreground"
                >
                  Nenhum recurso humano elegível encontrado para este período.
                </td>
              </tr>
            ) : (
              rhCandidates.map((rh) => {
                const ociosidade = calcOciosidade(rh);
                const ociosidadeLabel =
                  ociosidade < 1 ? `${Math.round(ociosidade * 60)}m` : `${Math.floor(ociosidade)}h`;

                return (
                  <tr key={rh.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className={cn('px-2 py-1 border-r truncate', COL_FIXED)}>
                      {rh.departamento || '-'}
                    </td>
                    <td className={cn('px-2 py-1 border-r truncate', COL_RECURSO)}>
                      {rh.funcao || '-'}
                    </td>
                    <td className={cn('px-2 py-1 border-r font-medium truncate', COL_GRAVACAO)}>
                      {rh.nome} {rh.sobrenome}
                    </td>
                    <td className={cn('px-2 py-1 border-r font-bold text-foreground', COL_PERIODO)}>
                      {ociosidadeLabel}
                    </td>

                    {daysArray.map((day) => {
                      const off = rhDayOff(rh, day);
                      const available = !off && rhDayAvailable(rh, day);
                      const isDraggingThis = dragItem?.rhId === rh.id && dragItem?.date === day;

                      return (
                        <td
                          key={day}
                          className={cn(
                            'text-center px-0.5 py-1 align-middle',
                            COL_DAY,
                            isWeekendDay(day) && 'bg-muted/40',
                          )}
                        >
                          {off ? (
                            <span className="inline-flex items-center justify-center text-[9px] font-semibold text-pink-700 bg-pink-100 dark:bg-pink-950/60 dark:text-pink-300 rounded px-1 py-0.5 leading-none">
                              FG
                            </span>
                          ) : available ? (
                            <div
                              draggable
                              onDragStart={() => handleDragStart(rh, day)}
                              onDragEnd={() => {
                                setDragItem(null);
                                setDragOverAnchorId(null);
                              }}
                              className={cn(
                                'cursor-grab active:cursor-grabbing inline-block',
                                isDraggingThis && 'opacity-40',
                              )}
                              title={`${rh.nome} ${rh.sobrenome} — arrastar para associar`}
                            >
                              <Avatar className="h-7 w-7 border border-border hover:border-primary transition-colors">
                                <AvatarImage src={rh.foto || undefined} />
                                <AvatarFallback className="text-[8px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {iniciais(rh.nome, rh.sobrenome)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // ── Render Equipamentos tab ──────────────────────────────────────────────────
  const renderFisicos = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    // Build estoque groups from the unique recursoIds present in pending requisitions
    const seenIds = new Set<string>();
    const estoqueGroups: Array<{
      recursoId: string;
      recursoNome: string;
      estoqueItens: EstoqueItem[];
    }> = [];
    for (const item of fisicos) {
      if (!seenIds.has(item.recursoId)) {
        seenIds.add(item.recursoId);
        const recurso = recursosFisicos.get(item.recursoId);
        estoqueGroups.push({
          recursoId: item.recursoId,
          recursoNome: item.recursoNome,
          estoqueItens: recurso?.estoqueItens ?? [],
        });
      }
    }

    return (
      <div className="overflow-x-auto rounded-md border">
        <table
          className="text-xs border-collapse"
          style={{ minWidth: `${4 * 128 + daysArray.length * 40}px` }}
        >
          {/* ── REQUISIÇÕES ─────────────────────────────────────────────── */}
          <tbody>
            <tr>
              <td
                colSpan={4 + daysArray.length}
                className="bg-orange-500 text-white text-center font-bold py-1.5 tracking-widest text-[11px] uppercase"
              >
                Requisições
              </td>
            </tr>
            <tr className="bg-muted/70 border-b">
              <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_FIXED)}>
                Espaço
              </th>
              <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_RECURSO)}>
                Equipamento
              </th>
              <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_GRAVACAO)}>
                Gravação
              </th>
              <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_PERIODO)}>
                Período
              </th>
              {daysArray.map((day) => (
                <th
                  key={day}
                  className={cn(
                    'text-center py-1.5 font-semibold',
                    COL_DAY,
                    isWeekendDay(day) && 'bg-muted',
                  )}
                >
                  {format(new Date(`${day}T12:00:00`), 'd')}
                </th>
              ))}
            </tr>

            {fisicosAssociaveis.length === 0 ? (
              <tr>
                <td
                  colSpan={4 + daysArray.length}
                  className="text-center py-6 text-muted-foreground"
                >
                  Nenhum equipamento pendente de associação neste período.
                </td>
              </tr>
            ) : (
              fisicosAssociaveis.map((item) => {
                const index = fisicos.indexOf(item);
                return (
                  <tr
                    key={item.anchorId}
                    className={cn(
                      'border-b transition-colors cursor-pointer',
                      item.selectedEstoque
                        ? 'bg-green-50/60 dark:bg-green-950/20 hover:bg-green-50 dark:hover:bg-green-950/30'
                        : 'hover:bg-muted/30',
                    )}
                    onClick={() => openRfDialog(index)}
                  >
                    <td className={cn('px-2 py-1.5 border-r truncate', COL_FIXED)}>
                      {item.espacoNome || '-'}
                    </td>
                    <td className={cn('px-2 py-1.5 border-r truncate', COL_RECURSO)}>
                      {item.recursoNome}
                    </td>
                    <td className={cn('px-2 py-1.5 border-r truncate', COL_GRAVACAO)}>
                      {item.gravacaoNome}
                    </td>
                    <td className={cn('px-2 py-1.5 border-r whitespace-nowrap', COL_PERIODO)}>
                      {item.horaInicio} às {item.horaFim}
                    </td>
                    {daysArray.map((day) => {
                      const isThisDay = day === item.dataPrevista;
                      const isOver = stockDragOverAnchorId === item.anchorId;
                      const canDrop =
                        isThisDay && stockDragItem && stockDragItem.recursoId === item.recursoId;
                      return (
                        <td
                          key={day}
                          className={cn(
                            'text-center px-0.5 py-1 align-middle',
                            COL_DAY,
                            isWeekendDay(day) && 'bg-muted/40',
                            isOver &&
                              canDrop &&
                              'bg-primary/15 outline outline-2 -outline-offset-2 outline-primary',
                            isOver && !canDrop && isThisDay && 'bg-destructive/10',
                          )}
                          onDragOver={
                            isThisDay
                              ? (e) => {
                                  e.preventDefault();
                                  setStockDragOverAnchorId(item.anchorId);
                                }
                              : undefined
                          }
                          onDragLeave={isThisDay ? () => setStockDragOverAnchorId(null) : undefined}
                          onDrop={
                            isThisDay
                              ? (e) => {
                                  e.preventDefault();
                                  handleStockDrop(index);
                                }
                              : undefined
                          }
                        >
                          {isThisDay &&
                            (item.selectedEstoque ? (
                              <div className="flex flex-col items-center gap-0.5 relative group">
                                {item.selectedEstoque.imagemUrl ? (
                                  <img
                                    src={item.selectedEstoque.imagemUrl}
                                    alt={item.selectedEstoque.nome}
                                    className="h-6 w-6 object-cover rounded border-2 border-primary"
                                  />
                                ) : (
                                  <div className="h-6 w-6 rounded border-2 border-primary bg-primary/10 flex items-center justify-center">
                                    <Package className="h-3.5 w-3.5 text-primary" />
                                  </div>
                                )}
                                <span className="text-[8px] text-primary font-semibold">
                                  #{item.selectedEstoque.numerador}
                                </span>
                                <button
                                  type="button"
                                  className="absolute -top-1 -right-1 hidden group-hover:flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFisicos((c) =>
                                      c.map((f, i) =>
                                        i === index
                                          ? {
                                              ...f,
                                              selectedEstoque: null,
                                              tempoAssociado: undefined,
                                            }
                                          : f,
                                      ),
                                    );
                                  }}
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center justify-center rounded bg-orange-500 text-white font-semibold px-1 py-0.5 text-[9px] leading-none">
                                {item.tempoGravacao}
                              </span>
                            ))}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* ── ASSOCIAÇÕES PENDENTES ────────────────────────────────────── */}
          {fisicosPendentes.length > 0 && (
            <tbody>
              <tr>
                <td colSpan={4 + daysArray.length} className="h-2 bg-background" />
              </tr>
              <tr>
                <td
                  colSpan={4 + daysArray.length}
                  className="bg-green-600 text-white text-center font-bold py-1.5 tracking-widest text-[11px] uppercase"
                >
                  Associações Prontas para Salvar ({fisicosPendentes.length})
                </td>
              </tr>
              <tr className="bg-muted/70 border-b">
                <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_FIXED)}>
                  Espaço
                </th>
                <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_RECURSO)}>
                  Equipamento
                </th>
                <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_GRAVACAO)}>
                  Gravação
                </th>
                <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_PERIODO)}>
                  Item
                </th>
                {daysArray.map((day) => (
                  <th
                    key={day}
                    className={cn(
                      'text-center py-1.5 font-semibold',
                      COL_DAY,
                      isWeekendDay(day) && 'bg-muted',
                    )}
                  >
                    {format(new Date(`${day}T12:00:00`), 'd')}
                  </th>
                ))}
              </tr>
              {fisicosPendentes.map((item) => {
                const index = fisicos.indexOf(item);
                return (
                  <tr key={item.anchorId} className="border-b bg-green-50/60 dark:bg-green-950/20">
                    <td className={cn('px-2 py-1.5 border-r truncate', COL_FIXED)}>
                      {item.espacoNome || '-'}
                    </td>
                    <td className={cn('px-2 py-1.5 border-r truncate', COL_RECURSO)}>
                      {item.recursoNome}
                    </td>
                    <td className={cn('px-2 py-1.5 border-r truncate', COL_GRAVACAO)}>
                      {item.gravacaoNome}
                    </td>
                    <td
                      className={cn(
                        'px-2 py-1.5 border-r whitespace-nowrap flex items-center gap-1',
                        COL_PERIODO,
                      )}
                    >
                      {item.selectedEstoque?.imagemUrl ? (
                        <img
                          src={item.selectedEstoque.imagemUrl}
                          alt=""
                          className="h-4 w-4 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <Package className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      )}
                      <span className="truncate text-primary font-medium">
                        #{item.selectedEstoque?.numerador} {item.selectedEstoque?.nome}
                      </span>
                      <button
                        type="button"
                        className="ml-auto flex-shrink-0 text-destructive hover:text-destructive/80"
                        title="Desfazer associação"
                        onClick={() =>
                          setFisicos((c) =>
                            c.map((f, i) =>
                              i === index
                                ? { ...f, selectedEstoque: null, tempoAssociado: undefined }
                                : f,
                            ),
                          )
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </td>
                    {daysArray.map((day) => {
                      const isThisDay = day === item.dataPrevista;
                      return (
                        <td
                          key={day}
                          className={cn(
                            'text-center px-0.5 py-1 align-middle',
                            COL_DAY,
                            isWeekendDay(day) && 'bg-muted/40',
                          )}
                        >
                          {isThisDay && (
                            <div className="inline-flex items-center justify-center rounded-full bg-green-500 h-4 w-4">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          )}

          {/* ── DISPONIBILIDADE (ESTOQUE) ────────────────────────────────── */}
          {fisicos.length > 0 && (
            <tbody>
              <tr>
                <td colSpan={4 + daysArray.length} className="h-2 bg-background" />
              </tr>
              <tr>
                <td
                  colSpan={4 + daysArray.length}
                  className="bg-blue-500 text-white text-center font-bold py-1.5 tracking-widest text-[11px] uppercase"
                >
                  Disponibilidade (Estoque)
                </td>
              </tr>
              <tr className="bg-muted/70 border-b">
                <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_FIXED)}>
                  Equipamento
                </th>
                <th className={cn('text-center px-2 py-1.5 font-semibold border-r', COL_RECURSO)}>
                  #
                </th>
                <th className={cn('text-left px-2 py-1.5 font-semibold border-r', COL_GRAVACAO)}>
                  Item
                </th>
                <th className={cn('border-r', COL_PERIODO)} />
                {daysArray.map((day) => (
                  <th
                    key={day}
                    className={cn(
                      'text-center py-1.5 font-semibold',
                      COL_DAY,
                      isWeekendDay(day) && 'bg-muted',
                    )}
                  >
                    {format(new Date(`${day}T12:00:00`), 'd')}
                  </th>
                ))}
              </tr>

              {estoqueGroups.every((g) => g.estoqueItens.length === 0) ? (
                <tr>
                  <td
                    colSpan={4 + daysArray.length}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Nenhum item de estoque encontrado para os equipamentos requisitados.
                  </td>
                </tr>
              ) : (
                estoqueGroups.flatMap((group) =>
                  group.estoqueItens.length === 0
                    ? [
                        <tr key={group.recursoId} className="border-b">
                          <td className={cn('px-2 py-1.5 border-r', COL_FIXED)}>
                            {group.recursoNome}
                          </td>
                          <td
                            colSpan={3}
                            className="text-center text-muted-foreground italic px-2 py-1.5"
                          >
                            Sem itens de estoque
                          </td>
                          {daysArray.map((day) => (
                            <td
                              key={day}
                              className={cn(
                                'text-center px-0.5 py-1',
                                COL_DAY,
                                isWeekendDay(day) && 'bg-muted/40',
                              )}
                            />
                          ))}
                        </tr>,
                      ]
                    : group.estoqueItens.map((estoqueItem, i) => (
                        <tr
                          key={estoqueItem.id}
                          className="border-b hover:bg-muted/20 transition-colors"
                        >
                          {i === 0 && (
                            <td
                              rowSpan={group.estoqueItens.length}
                              className={cn(
                                'px-2 py-1.5 border-r font-medium align-middle border-b-0',
                                COL_FIXED,
                              )}
                            >
                              {group.recursoNome}
                            </td>
                          )}
                          <td
                            className={cn(
                              'px-2 py-1.5 border-r text-center font-semibold tabular-nums',
                              COL_RECURSO,
                            )}
                          >
                            #{estoqueItem.numerador}
                          </td>
                          <td className={cn('px-2 py-1.5 border-r', COL_GRAVACAO)}>
                            <div className="flex items-center gap-1.5">
                              {estoqueItem.imagemUrl ? (
                                <img
                                  src={estoqueItem.imagemUrl}
                                  alt={estoqueItem.nome}
                                  className="h-4 w-4 object-cover rounded flex-shrink-0"
                                />
                              ) : (
                                <Package className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              )}
                              <span className="truncate">{estoqueItem.nome}</span>
                            </div>
                          </td>
                          <td className={cn('border-r', COL_PERIODO)} />
                          {daysArray.map((day) => {
                            const isDraggingThis =
                              stockDragItem?.estoqueItemId === estoqueItem.id &&
                              stockDragItem?.date === day;
                            return (
                              <td
                                key={day}
                                className={cn(
                                  'text-center px-0.5 py-1 align-middle',
                                  COL_DAY,
                                  isWeekendDay(day) && 'bg-muted/40',
                                )}
                              >
                                <div
                                  draggable
                                  onDragStart={() =>
                                    setStockDragItem({
                                      estoqueItemId: estoqueItem.id,
                                      estoqueItemNome: estoqueItem.nome,
                                      estoqueItemNumerador: estoqueItem.numerador,
                                      estoqueItemImagemUrl: estoqueItem.imagemUrl,
                                      recursoId: group.recursoId,
                                      date: day,
                                    })
                                  }
                                  onDragEnd={() => {
                                    setStockDragItem(null);
                                    setStockDragOverAnchorId(null);
                                  }}
                                  className={cn(
                                    'cursor-grab active:cursor-grabbing inline-flex items-center justify-center rounded p-0.5 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors',
                                    isDraggingThis && 'opacity-40',
                                  )}
                                  title={`${estoqueItem.nome} #${estoqueItem.numerador} — arraste para associar`}
                                >
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      )),
                )
              )}
            </tbody>
          )}
        </table>
      </div>
    );
  };

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="tecnicos" className="gap-2">
              <Wrench className="h-4 w-4" />
              Recursos Técnicos
              {tecnicosPendentes.length > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                  {tecnicosPendentes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="fisicos" className="gap-2">
              <Package className="h-4 w-4" />
              Equipamentos
              {fisicosPendentes.length > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                  {fisicosPendentes.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <Button onClick={associar} disabled={saving || !hasPending} className="gap-2">
            <Link2 className="h-4 w-4" />
            {saving
              ? 'Salvando...'
              : `Associar${hasPending ? ` (${fisicosPendentes.length + tecnicosPendentes.length})` : ''}`}
          </Button>
        </div>

        <TabsContent value="tecnicos" className="mt-3">
          {renderTecnicos()}
        </TabsContent>

        <TabsContent value="fisicos" className="mt-3">
          {renderFisicos()}
        </TabsContent>
      </Tabs>

      {/* Físicos dialog */}
      <Dialog open={rfDialog !== null} onOpenChange={(open) => !open && setRfDialog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Associar item de estoque</DialogTitle>
          </DialogHeader>
          {stockBusy ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Hora Início</label>
                  <Input
                    type="time"
                    value={rfHoraInicio}
                    onChange={(event) => setRfHoraInicio(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Hora Fim</label>
                  <Input
                    type="time"
                    value={rfHoraFim}
                    onChange={(event) => setRfHoraFim(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-[420px] overflow-auto">
                {stockItems.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-6 text-center">
                    Nenhum item de estoque encontrado para este recurso.
                  </div>
                ) : (
                  stockItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full border rounded-lg p-3 text-left transition-colors ${selectedStockId === item.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => setSelectedStockId(item.id)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">
                            #{item.numerador} — {item.nome}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.codigo || 'Sem código'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRfDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmRf} disabled={!selectedStockId}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequisicoesTab;
