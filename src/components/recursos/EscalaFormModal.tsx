'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Loader2, Sparkles, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { escalasRepository } from '@/modules/escalas/escalas.repository.provider';
import { turnosRepository } from '@/modules/turnos/turnos.repository.provider';
import type {
  Escala,
  EscalaInput,
  EscalaColaborador,
  EscalaColaboradorInput,
  FuncaoOption,
} from '@/modules/escalas/escalas.types';
import type { Turno } from '@/modules/turnos/turnos.types';

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
function generateDias(turno: Turno, year: number, month: number): Record<string, string | null> {
  const daysInMonth = getDaysInMonth(year, month);
  const dias: Record<string, string | null> = {};

  // Parse folgaEspecial to determine special Sundays/Saturdays
  const folgaEspecial = turno.folgaEspecial || '';
  const sundayFolgas = new Set<number>(); // day-of-month numbers that are special folgas

  if (folgaEspecial.includes('domingos') || folgaEspecial.includes('domingo')) {
    // Collect all Sundays in the month
    const sundays: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      if (getDayOfWeek(year, month, d) === 0) sundays.push(d);
    }
    if (folgaEspecial === '2_domingos_mes') {
      sundays.slice(0, 2).forEach((d) => sundayFolgas.add(d));
    } else if (folgaEspecial === '1_domingo_mes') {
      sundays.slice(0, 1).forEach((d) => sundayFolgas.add(d));
    } else if (folgaEspecial === '1_domingo_do_mes') {
      if (sundays[0]) sundayFolgas.add(sundays[0]);
    } else if (folgaEspecial === '2_domingo_do_mes') {
      if (sundays[1]) sundayFolgas.add(sundays[1]);
    } else if (folgaEspecial === '3_domingo_do_mes') {
      if (sundays[2]) sundayFolgas.add(sundays[2]);
    } else if (folgaEspecial === 'ultimo_domingo_mes') {
      if (sundays.at(-1)) sundayFolgas.add(sundays.at(-1)!);
    }
  }

  // folgasPorSemana determines how many days off per week (cycling)
  // Build per-week folga counters
  let weekFolgaCount = 0;
  let currentWeek = -1;

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = getDayOfWeek(year, month, d); // 0=Sun
    const weekdayKey = WEEKDAY_KEYS[dow];
    const isWorkingDay = turno.diasSemana[weekdayKey];
    const isSpecialFolga = sundayFolgas.has(d);

    // Calculate ISO week number for tracking folgas per week
    const date = new Date(year, month - 1, d);
    const weekNum = Math.floor((d + getDayOfWeek(year, month, 1) - 1) / 7);

    if (weekNum !== currentWeek) {
      currentWeek = weekNum;
      weekFolgaCount = 0;
    }

    if (isSpecialFolga) {
      dias[String(d)] = 'FG';
    } else if (!isWorkingDay) {
      dias[String(d)] = 'FG';
    } else if (turno.folgasPorSemana > 0 && weekFolgaCount < turno.folgasPorSemana && dow === 0) {
      // Give folga on Sundays if folgasPorSemana allows
      dias[String(d)] = 'FG';
      weekFolgaCount++;
    } else {
      dias[String(d)] = null; // working day (shows turno sigla)
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
  const [grupoFuncaoId, setGrupoFuncaoId] = useState('');

  // ── Options loaded from API
  const [funcoes, setFuncoes] = useState<FuncaoOption[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);

  // ── Colaboradores state (Escala tab)
  const [colaboradores, setColaboradores] = useState<EscalaColaborador[]>([]);

  // ── Loading states
  const [saving, setSaving] = useState(false);
  const [loadingColabs, setLoadingColabs] = useState(false);

  // ── Reset on open
  useEffect(() => {
    if (!isOpen) return;

    setActiveTab('dados');
    setTitulo(data?.titulo ?? '');
    setCodigoExterno(data?.codigoExterno ?? '');
    setDataInicio(data?.dataInicio ?? new Date().toISOString().slice(0, 10));
    setGrupoFuncaoId(data?.grupoFuncaoId ?? '');
    setColaboradores([]);

    // Load options
    Promise.all([escalasRepository.listFuncoes(), turnosRepository.list()])
      .then(([f, t]) => {
        setFuncoes(f);
        setTurnos(t);
      })
      .catch(() => {});

    // Load existing colaboradores if editing
    if (data?.id) {
      setLoadingColabs(true);
      escalasRepository
        .getColaboradores(data.id)
        .then(setColaboradores)
        .catch(() => {})
        .finally(() => setLoadingColabs(false));
    }
  }, [isOpen, data?.id]);

  // ── When grupoFuncaoId changes and it's a new escala, load employees for that function
  useEffect(() => {
    if (!isOpen || !grupoFuncaoId || data?.id) return;

    setLoadingColabs(true);
    escalasRepository
      .listColaboradoresByFuncao(grupoFuncaoId)
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
  }, [grupoFuncaoId, isOpen, data?.id]);

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

  // ── Save
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        id: data?.id,
        titulo,
        codigoExterno: codigoExterno || undefined,
        grupoFuncaoId: grupoFuncaoId || null,
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[1100px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
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

            {/* Row 3: Data Início + Grupo de Função */}
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
                <Label>Grupo de Função</Label>
                {readOnly ? (
                  <Input value={data?.grupoFuncaoNome ?? ''} readOnly className="bg-muted" />
                ) : (
                  <Select value={grupoFuncaoId} onValueChange={setGrupoFuncaoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma função..." />
                    </SelectTrigger>
                    <SelectContent>
                      {funcoes.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome}
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
                <Button type="button" size="sm" onClick={handleGerar} className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Gerar
                </Button>
                {data?.id && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!data?.id) return;
                      setSaving(true);
                      try {
                        const colabInput: EscalaColaboradorInput[] = colaboradores.map((c) => ({
                          colaboradorId: c.colaboradorId,
                          turnoId: c.turnoId || null,
                          dias: c.dias,
                        }));
                        await escalasRepository.saveColaboradores(data.id, colabInput);
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="gap-1.5"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Aplicar Escala
                  </Button>
                )}
              </div>
            )}

            {loadingColabs ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : colaboradores.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-10">
                {grupoFuncaoId
                  ? 'Nenhum colaborador encontrado para esta função.'
                  : 'Selecione um Grupo de Função na aba Dados para ver os colaboradores.'}
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
                <div className="text-sm text-muted-foreground text-center py-10">
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
                              <td key={day} className="text-center px-1 py-1 text-muted-foreground">
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
  );
}
