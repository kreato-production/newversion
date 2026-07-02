'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, Play, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { escalasRepository } from '@/modules/escalas/escalas.repository.provider';
import { turnosRepository } from '@/modules/turnos/turnos.repository.provider';
import { ApiRecursosHumanosRepository } from '@/modules/recursos-humanos/recursos-humanos.api.repository';
import type {
  Escala,
  EscalaInput,
  EscalaColaborador,
  EscalaColaboradorInput,
  EquipeOption,
} from '@/modules/escalas/escalas.types';
import type { Turno } from '@/modules/turnos/turnos.types';
import type { Escala as RhEscala } from '@/modules/recursos-humanos/recursos-humanos.types';

const recursosHumanosRepository = new ApiRecursosHumanosRepository();

// ─── Types ─────────────────────────────────────────────────────────────────

interface EscalaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EscalaInput) => Promise<void>;
  data?: Escala | null;
  readOnly?: boolean;
}

type Tab = 'dados' | 'escala' | 'validacao';

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay(); // 0=Sun, 6=Sat
}

function formatDateBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function parseIsoDate(iso: string): { year: number; month: number } {
  const [y, m] = iso.slice(0, 10).split('-').map(Number);
  return { year: y, month: m };
}

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAY_KEYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const;

// Generate schedule for an employee based on turno rules for a month
// Returns the position of a day within its Mon–Sun week: 1=Mon … 7=Sun
function weekDayPos(year: number, month: number, day: number): number {
  const dow = new Date(year, month - 1, day).getDay(); // 0=Sun … 6=Sat
  return dow === 0 ? 7 : dow;
}

function generateDias(turno: Turno, year: number, month: number): Record<string, string | null> {
  const daysInMonth = getDaysInMonth(year, month);
  const dias: Record<string, string | null> = {};

  const diasTrabalhados = turno.diasTrabalhados ?? 0;
  const folgasPorSemana = turno.folgasPorSemana ?? 0;
  const folgaEspecial = turno.folgaEspecial || '';

  // ── 1. Collect Sundays and Saturdays of the month
  const sundays: number[] = [];
  const saturdays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow === 0) sundays.push(d);
    if (dow === 6) saturdays.push(d);
  }

  // ── 2. Build special-folga set from folgaEspecial
  const specialFolgas = new Set<number>();
  switch (folgaEspecial) {
    case '1_domingo_mes':
      sundays.slice(0, 1).forEach((d) => specialFolgas.add(d));
      break;
    case '2_domingos_mes':
      sundays.slice(0, 2).forEach((d) => specialFolgas.add(d));
      break;
    case '1_sabado_mes':
      saturdays.slice(0, 1).forEach((d) => specialFolgas.add(d));
      break;
    case '2_sabados_mes':
      saturdays.slice(0, 2).forEach((d) => specialFolgas.add(d));
      break;
    case '1_domingo_do_mes':
      if (sundays[0]) specialFolgas.add(sundays[0]);
      break;
    case '2_domingo_do_mes':
      if (sundays[1]) specialFolgas.add(sundays[1]);
      break;
    case '3_domingo_do_mes':
      if (sundays[2]) specialFolgas.add(sundays[2]);
      break;
    case 'ultimo_domingo_mes': {
      const s = sundays.at(-1);
      if (s) specialFolgas.add(s);
      break;
    }
    case '1_sabado_do_mes':
      if (saturdays[0]) specialFolgas.add(saturdays[0]);
      break;
    case '2_sabado_do_mes':
      if (saturdays[1]) specialFolgas.add(saturdays[1]);
      break;
    case '3_sabado_do_mes':
      if (saturdays[2]) specialFolgas.add(saturdays[2]);
      break;
    case 'ultimo_sabado_mes': {
      const s = saturdays.at(-1);
      if (s) specialFolgas.add(s);
      break;
    }
  }

  // ── 3. Rolling-folga set: for each Mon–Sun week, mark the last
  //    folgasPorSemana eligible (diasSemana=true, not special) days as FG.
  //    Used only when diasTrabalhados is not set.
  const rollingFolgas = new Set<number>();
  if (!diasTrabalhados && folgasPorSemana > 0) {
    const DOW_KEY = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const;
    // Group days by their Monday (can be ≤ 0 for days before the 1st)
    const weeks = new Map<number, number[]>();
    for (let d = 1; d <= daysInMonth; d++) {
      const monday = d - (weekDayPos(year, month, d) - 1);
      if (!weeks.has(monday)) weeks.set(monday, []);
      weeks.get(monday)!.push(d);
    }
    for (const [, days] of weeks) {
      // Eligible: in diasSemana and not a special folga — sorted Sun→Sat→…
      const eligible = days
        .filter((d) => {
          const dow = new Date(year, month - 1, d).getDay();
          return turno.diasSemana[DOW_KEY[dow]] && !specialFolgas.has(d);
        })
        .sort((a, b) => weekDayPos(year, month, b) - weekDayPos(year, month, a));
      eligible.slice(0, folgasPorSemana).forEach((d) => rollingFolgas.add(d));
    }
  }

  // ── 4. Assign each day
  const DOW_KEY = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const;

  if (diasTrabalhados > 0) {
    const naturalLastPos = Math.min(diasTrabalhados + folgasPorSemana, 7);

    // EXCLUSIVE mode: triggered when folgaEspecial specifies exactly which Sundays get
    // the weekly rest — meaning non-special weeks shift the rest to Saturday instead.
    // Applies when: folgasPorSemana=1, folgaEspecial involves Sundays, and the
    // natural last position is Sunday (diasTrabalhados + 1 = 7, i.e. diasTrabalhados=6).
    const sundayExclusive =
      folgasPorSemana === 1 && folgaEspecial.includes('domingo') && naturalLastPos === 7;

    // Pre-compute which Monday-keys have a special day (only needed in exclusive mode)
    const specialWeekKeys = new Set<number>();
    if (sundayExclusive) {
      for (const s of specialFolgas) {
        specialWeekKeys.add(s - (weekDayPos(year, month, s) - 1));
      }
    }

    for (let d = 1; d <= daysInMonth; d++) {
      if (specialFolgas.has(d)) {
        dias[String(d)] = 'FG';
        continue;
      }

      const pos = weekDayPos(year, month, d); // 1=Mon … 7=Sun

      if (sundayExclusive) {
        const weekMonday = d - (pos - 1);
        if (specialWeekKeys.has(weekMonday)) {
          // The special Sunday handles this week's rest — all other days work
          dias[String(d)] = null;
        } else {
          // Non-special week: rest falls on Saturday (one position before Sunday)
          dias[String(d)] = pos === 6 ? 'FG' : null;
        }
      } else {
        // Normal cyclic: work first diasTrabalhados days, then folgasPorSemana FG days
        dias[String(d)] = pos > diasTrabalhados && pos <= naturalLastPos ? 'FG' : null;
      }
    }
  } else {
    // Fixed weekly schedule based on diasSemana + rolling folgas
    for (let d = 1; d <= daysInMonth; d++) {
      if (specialFolgas.has(d)) {
        dias[String(d)] = 'FG';
        continue;
      }
      const dow = new Date(year, month - 1, d).getDay();
      const offByDiaSemana = !turno.diasSemana[DOW_KEY[dow]];
      dias[String(d)] = offByDiaSemana || rollingFolgas.has(d) ? 'FG' : null;
    }
  }

  return dias;
}

// ─── DayCellBadge ─────────────────────────────────────────────────────────

function DayCellBadge({
  value,
  turnoSigla,
  turnoCor,
  onClick,
  readOnly,
}: {
  value: string | null;
  turnoSigla: string;
  turnoCor: string;
  onClick: () => void;
  readOnly?: boolean;
}) {
  const isFolga = value === 'FG';

  const style = isFolga
    ? { backgroundColor: '#22c55e', color: '#fff' }
    : { backgroundColor: turnoCor || '#3B82F6', color: '#fff' };

  const label = isFolga ? 'FG' : turnoSigla || '?';

  return (
    <button
      type="button"
      onClick={readOnly ? undefined : onClick}
      disabled={readOnly}
      className="inline-flex items-center justify-center rounded text-[11px] font-bold px-1 py-0.5 min-w-[26px] transition-opacity hover:opacity-80 disabled:cursor-default"
      style={style}
      title={isFolga ? 'Folga' : turnoSigla}
    >
      {label}
    </button>
  );
}

// ─── EscalaFormModal ────────────────────────────────────────────────────────

export function EscalaFormModal({ isOpen, onClose, onSave, data, readOnly }: EscalaFormModalProps) {
  const { t } = useLanguage();

  // ── Tab state
  const [activeTab, setActiveTab] = useState<Tab>('dados');

  // ── Form state (Dados tab)
  const [titulo, setTitulo] = useState('');
  const [codigoExterno, setCodigoExterno] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [equipeId, setEquipeId] = useState('');

  // ── Options loaded from API
  const [equipes, setEquipes] = useState<EquipeOption[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);

  // ── Colaboradores state (Escala tab)
  const [colaboradores, setColaboradores] = useState<EscalaColaborador[]>([]);

  // Tracks the equipeId value at the time the modal opened, so the equipeId-change
  // effect can skip the initial sync and only fire on user-driven changes.
  const openedWithEquipeIdRef = useRef<string>('');

  // ── Loading states
  const [saving, setSaving] = useState(false);
  const [loadingColabs, setLoadingColabs] = useState(false);
  const [aplicando, setAplicando] = useState(false);

  // ── "Aplicar Escala" dialog state
  const [showAplicarDialog, setShowAplicarDialog] = useState(false);
  const [dataFimAplicar, setDataFimAplicar] = useState('');

  // ── Reset on open
  useEffect(() => {
    if (!isOpen) return;

    const initialEquipeId = data?.equipeId ?? '';
    openedWithEquipeIdRef.current = initialEquipeId;

    setActiveTab('dados');
    setTitulo(data?.titulo ?? '');
    setCodigoExterno(data?.codigoExterno ?? '');
    setDataInicio(data?.dataInicio ?? new Date().toISOString().slice(0, 10));
    setEquipeId(initialEquipeId);
    setColaboradores([]);

    // Load options
    Promise.all([escalasRepository.listEquipes(), turnosRepository.list()])
      .then(([eq, t]) => {
        setEquipes(eq);
        setTurnos(t);
      })
      .catch(() => {});

    // Load existing colaboradores if editing
    if (data?.id) {
      setLoadingColabs(true);
      escalasRepository
        .getColaboradores(data.id)
        .then(async (colabs) => {
          if (colabs.length === 0 && data.equipeId) {
            // No saved colaboradores yet — populate from the team
            const options = await escalasRepository.listColaboradoresByEquipe(data.equipeId);
            setColaboradores(
              options.map((c) => ({
                id: '',
                colaboradorId: c.id,
                colaboradorNome: c.nome,
                colaboradorFuncao: c.funcaoNome ?? '',
                turnoId: '',
                turnoNome: '',
                turnoSigla: '',
                turnoCor: '',
                dias: {},
              })),
            );
          } else {
            setColaboradores(colabs);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingColabs(false));
    }
  }, [isOpen, data?.id]);

  // ── When equipeId changes (user-driven), reload employees for that team
  useEffect(() => {
    if (!isOpen || !equipeId) return;
    // Skip the first fire caused by resetting equipeId to the value from `data`
    if (equipeId === openedWithEquipeIdRef.current) {
      openedWithEquipeIdRef.current = '';
      return;
    }

    setLoadingColabs(true);
    escalasRepository
      .listColaboradoresByEquipe(equipeId)
      .then((options) => {
        setColaboradores(
          options.map((c) => ({
            id: '',
            colaboradorId: c.id,
            colaboradorNome: c.nome,
            colaboradorFuncao: c.funcaoNome ?? '',
            turnoId: '',
            turnoNome: '',
            turnoSigla: '',
            turnoCor: '',
            dias: {},
          })),
        );
      })
      .catch(() => {})
      .finally(() => setLoadingColabs(false));
  }, [equipeId, isOpen]);

  // ── Computed month info
  const { year, month } = useMemo(() => {
    if (!dataInicio) return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
    return parseIsoDate(dataInicio);
  }, [dataInicio]);

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);

  const dayHeaders = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dow = getDayOfWeek(year, month, d);
      return { day: d, dow, label: WEEKDAY_SHORT[dow] };
    });
  }, [year, month, daysInMonth]);

  // ── Turno lookup map
  const turnoMap = useMemo(() => {
    return Object.fromEntries(turnos.map((t) => [t.id, t]));
  }, [turnos]);

  // ── Update colaborador turno
  const setColaboradorTurno = useCallback(
    (colaboradorId: string, turnoId: string) => {
      const turno = turnoMap[turnoId];
      setColaboradores((prev) =>
        prev.map((c) =>
          c.colaboradorId === colaboradorId
            ? {
                ...c,
                turnoId,
                turnoNome: turno?.nome ?? '',
                turnoSigla: turno?.sigla ?? '',
                turnoCor: turno?.cor ?? '',
              }
            : c,
        ),
      );
    },
    [turnoMap],
  );

  // ── Toggle day cell
  const toggleDay = useCallback((colaboradorId: string, day: number) => {
    setColaboradores((prev) =>
      prev.map((c) => {
        if (c.colaboradorId !== colaboradorId) return c;
        const key = String(day);
        const current = c.dias[key];
        return {
          ...c,
          dias: {
            ...c.dias,
            [key]: current === 'FG' ? null : 'FG',
          },
        };
      }),
    );
  }, []);

  // ── Gerar schedule
  const handleGerar = useCallback(() => {
    setColaboradores((prev) =>
      prev.map((c) => {
        if (!c.turnoId) return c;
        const turno = turnoMap[c.turnoId];
        if (!turno) return c;
        return { ...c, dias: generateDias(turno, year, month) };
      }),
    );
  }, [turnoMap, year, month]);

  // ── Validation data
  const validacaoData = useMemo(() => {
    const turnoCounts: Record<string, { turno: Turno; days: Record<string, number> }> = {};

    for (const colab of colaboradores) {
      if (!colab.turnoId) continue;
      const turno = turnoMap[colab.turnoId];
      if (!turno) continue;

      if (!turnoCounts[colab.turnoId]) {
        turnoCounts[colab.turnoId] = { turno, days: {} };
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const key = String(d);
        const val = colab.dias[key];
        if (val !== 'FG') {
          // Working this day
          turnoCounts[colab.turnoId].days[key] = (turnoCounts[colab.turnoId].days[key] ?? 0) + 1;
        }
      }
    }

    return Object.values(turnoCounts);
  }, [colaboradores, turnoMap, daysInMonth]);

  // ── Aplicar Escala: propagate schedule to each collaborator's RH record
  const handleAplicarEscala = useCallback(async () => {
    if (!dataFimAplicar) return;
    setAplicando(true);
    try {
      // 1. Persist colaboradores to the escala record (if it has an id)
      if (data?.id) {
        const colabInput: EscalaColaboradorInput[] = colaboradores.map((c) => ({
          colaboradorId: c.colaboradorId,
          turnoId: c.turnoId || null,
          dias: c.dias,
        }));
        await escalasRepository.saveColaboradores(data.id, colabInput);
      }

      // 2. Load all RH to get their full current data
      const allRh = await recursosHumanosRepository.list();
      const rhById = new Map(allRh.map((rh) => [rh.id, rh]));

      // 3. For each colaborador with a turno, append new escala to their RH record
      const colabsComTurno = colaboradores.filter((c) => c.turnoId);
      for (const colab of colabsComTurno) {
        const turno = turnoMap[colab.turnoId];
        if (!turno) continue;
        const rh = rhById.get(colab.colaboradorId);
        if (!rh) continue;

        // Convert WeekdayFlags → number[] (0=Sun … 6=Sat)
        const diasSemana = WEEKDAY_KEYS.map((k, i) => (turno.diasSemana[k] ? i : -1)).filter(
          (v) => v >= 0,
        );

        const novaEscala: RhEscala = {
          id: '',
          dataInicio,
          dataFim: dataFimAplicar,
          horaInicio: turno.horaInicio,
          horaFim: turno.horaFim,
          diasSemana,
        };

        await recursosHumanosRepository.save({
          ...rh,
          escalas: [...rh.escalas, novaEscala],
        });
      }

      toast.success(`Escala aplicada a ${colabsComTurno.length} colaborador(es) com sucesso.`);
      setShowAplicarDialog(false);
      setDataFimAplicar('');
    } catch {
      toast.error('Erro ao aplicar escala. Tente novamente.');
    } finally {
      setAplicando(false);
    }
  }, [colaboradores, data?.id, dataFimAplicar, dataInicio, turnoMap]);

  // ── Save
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        id: data?.id,
        titulo,
        codigoExterno: codigoExterno || undefined,
        equipeId: equipeId || null,
        dataInicio,
      });

      // Save colaboradores if escala already exists
      if (data?.id && colaboradores.length > 0) {
        const colabInput: EscalaColaboradorInput[] = colaboradores.map((c) => ({
          colaboradorId: c.colaboradorId,
          turnoId: c.turnoId || null,
          dias: c.dias,
        }));
        await escalasRepository.saveColaboradores(data.id, colabInput);
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[95vw] max-w-[1700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{data ? t('scales.edit') : t('scales.new')}</DialogTitle>
            <DialogDescription>
              {data ? t('scales.editDescription') : t('scales.newDescription')}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="escala">Escala</TabsTrigger>
              <TabsTrigger value="validacao">Validação</TabsTrigger>
            </TabsList>

            {/* ── Tab: Dados ─────────────────────────────────────────────── */}
            <TabsContent value="dados" className="mt-4 space-y-4">
              {/* Row 1: ID, Usuário, Data */}
              {data && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">ID</Label>
                    <Input value={data.numerador ?? ''} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Usuário de Cadastro</Label>
                    <Input value={data.usuarioCadastro ?? ''} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Data de Cadastro</Label>
                    <Input
                      value={data.dataCadastro ? formatDateBR(data.dataCadastro) : ''}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              )}

              {/* Row 2: Título + Código Externo */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="titulo">
                    Título <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    disabled={readOnly}
                    placeholder="Nome da escala"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">Código Externo</Label>
                  <Input
                    id="codigoExterno"
                    value={codigoExterno}
                    onChange={(e) => setCodigoExterno(e.target.value.slice(0, 10))}
                    disabled={readOnly}
                    placeholder="Máx. 10 caracteres"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Row 3: Data Início + Equipe */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Equipe</Label>
                  {readOnly ? (
                    <Input value={data?.equipeNome ?? ''} readOnly className="bg-muted" />
                  ) : (
                    <Select value={equipeId} onValueChange={setEquipeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma equipe..." />
                      </SelectTrigger>
                      <SelectContent>
                        {equipes.map((eq) => (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ── Tab: Escala ─────────────────────────────────────────────── */}
            <TabsContent value="escala" className="mt-4 space-y-3">
              {!readOnly && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGerar}
                    disabled={colaboradores.every((c) => !c.turnoId)}
                    className="gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Gerar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={colaboradores.every((c) => !c.turnoId) || aplicando}
                    onClick={() => {
                      setDataFimAplicar('');
                      setShowAplicarDialog(true);
                    }}
                    className="gap-1.5"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Aplicar Escala
                  </Button>
                </div>
              )}

              {loadingColabs ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : colaboradores.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-10">
                  {equipeId
                    ? 'Nenhum colaborador encontrado para esta equipe.'
                    : 'Selecione uma Equipe na aba Dados para ver os colaboradores.'}
                </div>
              ) : (
                <div className="overflow-x-auto rounded border">
                  <table className="text-xs min-w-max w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left px-3 py-2 font-medium sticky left-0 bg-muted/50 min-w-[140px]">
                          Nome
                        </th>
                        <th className="text-left px-3 py-2 font-medium min-w-[100px]">Função</th>
                        <th className="text-left px-3 py-2 font-medium min-w-[160px]">Turno</th>
                        {dayHeaders.map(({ day, dow, label }) => (
                          <th
                            key={day}
                            className={`text-center px-1 py-1 font-medium min-w-[32px] ${dow === 0 || dow === 6 ? 'text-orange-500' : ''}`}
                          >
                            <div className="text-[10px] text-muted-foreground">{label}</div>
                            <div>{String(day).padStart(2, '0')}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {colaboradores.map((colab) => (
                        <tr key={colab.colaboradorId} className="border-b hover:bg-muted/20">
                          <td className="px-3 py-1.5 font-medium sticky left-0 bg-background">
                            {colab.colaboradorNome}
                          </td>
                          <td className="px-3 py-1.5 text-muted-foreground">
                            {colab.colaboradorFuncao}
                          </td>
                          <td className="px-2 py-1">
                            {readOnly ? (
                              <span className="text-xs">{colab.turnoNome || '-'}</span>
                            ) : (
                              <Select
                                value={colab.turnoId || ''}
                                onValueChange={(v) => setColaboradorTurno(colab.colaboradorId, v)}
                              >
                                <SelectTrigger className="h-7 text-xs min-w-[140px]">
                                  <SelectValue placeholder="Selecionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {turnos.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                      <span className="flex items-center gap-1.5">
                                        <span
                                          className="inline-block w-2.5 h-2.5 rounded-full"
                                          style={{ backgroundColor: t.cor }}
                                        />
                                        {t.sigla ? `${t.sigla} - ` : ''}
                                        {t.nome}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                          {dayHeaders.map(({ day }) => (
                            <td key={day} className="px-1 py-1 text-center">
                              {colab.turnoId ? (
                                <DayCellBadge
                                  value={colab.dias[String(day)] ?? null}
                                  turnoSigla={colab.turnoSigla}
                                  turnoCor={colab.turnoCor}
                                  onClick={() => toggleDay(colab.colaboradorId, day)}
                                  readOnly={readOnly}
                                />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* ── Tab: Validação ─────────────────────────────────────────── */}
            <TabsContent value="validacao" className="mt-4">
              <div className="overflow-x-auto rounded border">
                {validacaoData.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-10">
                    Configure os turnos na aba Escala para visualizar a validação.
                  </div>
                ) : (
                  <table className="text-xs min-w-max w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left px-3 py-2 font-medium sticky left-0 bg-muted/50 min-w-[100px]">
                          Turno/Dia
                        </th>
                        {dayHeaders.map(({ day, dow, label }) => (
                          <th
                            key={day}
                            className={`text-center px-1 py-1 font-medium min-w-[32px] ${dow === 0 || dow === 6 ? 'text-orange-500' : ''}`}
                          >
                            <div className="text-[10px] text-muted-foreground">{label}</div>
                            <div>{String(day).padStart(2, '0')}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {validacaoData.map(({ turno, days }) => (
                        <tr key={turno.id} className="border-b hover:bg-muted/20">
                          <td className="px-3 py-2 sticky left-0 bg-background">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: turno.cor }}
                              />
                              {turno.sigla || turno.nome}
                            </span>
                          </td>
                          {dayHeaders.map(({ day, dow }) => {
                            const weekdayKey = WEEKDAY_KEYS[dow];
                            const required = turno.pessoasPorDia[weekdayKey] ?? 0;
                            const actual = days[String(day)] ?? 0;
                            const delta = actual - required;
                            const isWorkingDay = turno.diasSemana[weekdayKey];
                            if (!isWorkingDay) {
                              return (
                                <td
                                  key={day}
                                  className="text-center px-1 py-1 text-muted-foreground"
                                >
                                  -
                                </td>
                              );
                            }
                            return (
                              <td key={day} className="text-center px-1 py-1">
                                {required > 0 ? (
                                  <span
                                    className={`inline-flex items-center justify-center rounded text-[11px] font-bold px-1 py-0.5 min-w-[26px] ${
                                      delta < 0
                                        ? 'bg-destructive text-destructive-foreground'
                                        : delta === 0
                                          ? 'bg-muted text-muted-foreground'
                                          : 'bg-green-100 text-green-700'
                                    }`}
                                  >
                                    {delta >= 0 ? `+${delta}` : delta}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            {!readOnly && (
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving || !titulo.trim() || !dataInicio}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Aplicar Escala ─────────────────────────────────────── */}
      <Dialog
        open={showAplicarDialog}
        onOpenChange={(open) => !open && setShowAplicarDialog(false)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Aplicar Escala</DialogTitle>
            <DialogDescription>
              Informe a data final para aplicação da escala no mapa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="dataFimAplicar">Aplicar até:</Label>
            <div className="relative">
              <Input
                id="dataFimAplicar"
                type="date"
                value={dataFimAplicar}
                min={dataInicio}
                onChange={(e) => setDataFimAplicar(e.target.value)}
                className="pl-9"
              />
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAplicarDialog(false)}
              disabled={aplicando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAplicarEscala}
              disabled={!dataFimAplicar || aplicando}
            >
              {aplicando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
