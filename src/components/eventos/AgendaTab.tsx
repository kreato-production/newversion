'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Calendar, Check, X, Pencil, Clock } from 'lucide-react';
import type {
  AgendaDia,
  AgendaAtividade,
} from '@/modules/gestao-eventos/gestao-eventos.api.repository';

export type { AgendaDia, AgendaAtividade };

const CORES = [
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Verde', value: '#22c55e' },
  { label: 'Laranja', value: '#f97316' },
  { label: 'Roxo', value: '#a855f7' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Amarelo', value: '#eab308' },
  { label: 'Índigo', value: '#6366f1' },
  { label: 'Cinza', value: '#6b7280' },
];

const emptyAtv = { horarioInicio: '', horarioFim: '', titulo: '', descricao: '', cor: '#3b82f6' };

type EditState = { diaId: string; atvId: string } & typeof emptyAtv;

/** Calcula duração em minutos entre dois horários "HH:MM". Retorna null se inválido ou fim ≤ início. */
function duracaoMin(inicio: string, fim: string): number | null {
  if (!inicio || !fim) return null;
  const [hI, mI] = inicio.split(':').map(Number);
  const [hF, mF] = fim.split(':').map(Number);
  const diff = hF * 60 + mF - (hI * 60 + mI);
  return diff > 0 ? diff : null;
}

function fmtDuracao(min: number | null): string {
  if (min === null) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function totalDiaDuracao(atividades: AgendaAtividade[]): string {
  const total = atividades.reduce(
    (s, a) => s + (duracaoMin(a.horarioInicio, a.horarioFim) ?? 0),
    0,
  );
  return fmtDuracao(total || null);
}

interface AgendaTabProps {
  value: AgendaDia[];
  onChange: (dias: AgendaDia[]) => void;
  readOnly?: boolean;
  disabled?: boolean;
}

export function AgendaTab({ value: dias, onChange, readOnly, disabled }: AgendaTabProps) {
  const [addingDia, setAddingDia] = useState(false);
  const [newDia, setNewDia] = useState('');
  const [addingAtvDiaId, setAddingAtvDiaId] = useState<string | null>(null);
  const [newAtv, setNewAtv] = useState(emptyAtv);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [editingDiaId, setEditingDiaId] = useState<string | null>(null);
  const [editingDiaData, setEditingDiaData] = useState('');

  const totalAtividades = dias.reduce((s, d) => s + d.atividades.length, 0);
  const totalExecutadas = dias.reduce(
    (s, d) => s + d.atividades.filter((a) => a.executada).length,
    0,
  );
  const percentual =
    totalAtividades > 0 ? Math.round((totalExecutadas / totalAtividades) * 100) : 0;

  const addDia = () => {
    if (!newDia || dias.some((d) => d.data === newDia)) return;
    const sorted = [...dias, { id: crypto.randomUUID(), data: newDia, atividades: [] }].sort(
      (a, b) => a.data.localeCompare(b.data),
    );
    onChange(sorted);
    setNewDia('');
    setAddingDia(false);
  };

  const removeDia = (id: string) => onChange(dias.filter((d) => d.id !== id));

  const startEditDia = (dia: AgendaDia) => {
    setAddingDia(false);
    setAddingAtvDiaId(null);
    setEditing(null);
    setEditingDiaId(dia.id);
    setEditingDiaData(dia.data);
  };

  const cancelEditDia = () => {
    setEditingDiaId(null);
    setEditingDiaData('');
  };

  const saveEditDia = () => {
    if (!editingDiaId || !editingDiaData) return;
    if (dias.some((d) => d.id !== editingDiaId && d.data === editingDiaData)) return;
    const sorted = dias
      .map((d) => (d.id === editingDiaId ? { ...d, data: editingDiaData } : d))
      .sort((a, b) => a.data.localeCompare(b.data));
    onChange(sorted);
    cancelEditDia();
  };

  const sortAtv = (arr: AgendaAtividade[]) =>
    [...arr].sort((a, b) => (a.horarioInicio ?? '').localeCompare(b.horarioInicio ?? ''));

  const addAtividade = (diaId: string) => {
    if (!newAtv.horarioInicio || !newAtv.titulo.trim()) return;
    const novaAtv: AgendaAtividade = {
      id: crypto.randomUUID(),
      horarioInicio: newAtv.horarioInicio,
      horarioFim: newAtv.horarioFim,
      titulo: newAtv.titulo.trim(),
      descricao: newAtv.descricao.trim(),
      cor: newAtv.cor,
      executada: false,
    };
    onChange(
      dias.map((d) =>
        d.id === diaId ? { ...d, atividades: sortAtv([...d.atividades, novaAtv]) } : d,
      ),
    );
    setNewAtv(emptyAtv);
    setAddingAtvDiaId(null);
  };

  const removeAtividade = (diaId: string, atvId: string) =>
    onChange(
      dias.map((d) =>
        d.id === diaId ? { ...d, atividades: d.atividades.filter((a) => a.id !== atvId) } : d,
      ),
    );

  const toggleExecutada = (diaId: string, atvId: string) =>
    onChange(
      dias.map((d) =>
        d.id === diaId
          ? {
              ...d,
              atividades: d.atividades.map((a) =>
                a.id === atvId ? { ...a, executada: !a.executada } : a,
              ),
            }
          : d,
      ),
    );

  const startEdit = (diaId: string, atv: AgendaAtividade) => {
    setAddingAtvDiaId(null);
    setAddingDia(false);
    setEditing({
      diaId,
      atvId: atv.id,
      horarioInicio: atv.horarioInicio ?? '',
      horarioFim: atv.horarioFim ?? '',
      titulo: atv.titulo ?? '',
      descricao: atv.descricao ?? '',
      cor: atv.cor ?? '#3b82f6',
    });
  };

  const saveEdit = () => {
    if (!editing || !editing.horarioInicio || !editing.titulo.trim()) return;
    onChange(
      dias.map((d) =>
        d.id === editing.diaId
          ? {
              ...d,
              atividades: sortAtv(
                d.atividades.map((a) =>
                  a.id === editing.atvId
                    ? {
                        ...a,
                        horarioInicio: editing.horarioInicio,
                        horarioFim: editing.horarioFim,
                        titulo: editing.titulo.trim(),
                        descricao: editing.descricao.trim(),
                        cor: editing.cor,
                      }
                    : a,
                ),
              ),
            }
          : d,
      ),
    );
    setEditing(null);
  };

  const fmtData = (iso: string) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  /** Formulário compartilhado entre "adicionar" e "editar" */
  const renderForm = (
    values: typeof emptyAtv,
    setValues: (fn: (prev: typeof emptyAtv) => typeof emptyAtv) => void,
    onSave: () => void,
    onCancel: () => void,
    saveLabel: string,
    canSave: boolean,
  ) => {
    const duracao = fmtDuracao(duracaoMin(values.horarioInicio, values.horarioFim));
    return (
      <div className="rounded-md border p-3 space-y-3 bg-background">
        {/* Linha 1: Início · Fim · duração calculada */}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Início *</Label>
            <Input
              type="time"
              value={values.horarioInicio}
              onChange={(e) => setValues((p) => ({ ...p, horarioInicio: e.target.value }))}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fim</Label>
            <Input
              type="time"
              value={values.horarioFim}
              onChange={(e) => setValues((p) => ({ ...p, horarioFim: e.target.value }))}
              disabled={disabled}
            />
          </div>
          {duracao && (
            <div className="flex items-center gap-1 pb-0.5 text-xs text-muted-foreground whitespace-nowrap">
              <Clock className="h-3 w-3" />
              {duracao}
            </div>
          )}
        </div>

        {/* Linha 2: Título */}
        <div className="space-y-1">
          <Label className="text-xs">Título *</Label>
          <Input
            value={values.titulo}
            onChange={(e) => setValues((p) => ({ ...p, titulo: e.target.value }))}
            placeholder="Título da atividade"
            maxLength={100}
            disabled={disabled}
          />
        </div>

        {/* Linha 3: Descrição */}
        <div className="space-y-1">
          <Label className="text-xs">Descrição / Local</Label>
          <Input
            value={values.descricao}
            onChange={(e) => setValues((p) => ({ ...p, descricao: e.target.value }))}
            placeholder="Descrição ou local da atividade"
            maxLength={200}
            disabled={disabled}
          />
        </div>

        {/* Linha 4: Cor */}
        <div className="space-y-1.5">
          <Label className="text-xs">Cor</Label>
          <div className="flex gap-2 flex-wrap">
            {CORES.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => setValues((p) => ({ ...p, cor: c.value }))}
                className={`h-6 w-6 rounded-full border-2 transition-transform ${
                  values.cor === c.value
                    ? 'border-foreground scale-125'
                    : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={disabled}>
            Cancelar
          </Button>
          <Button type="button" size="sm" onClick={onSave} disabled={!canSave || disabled}>
            {saveLabel}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Barra de progresso */}
      {totalAtividades > 0 && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progresso do Evento</span>
            <span className="text-muted-foreground">
              {totalExecutadas}/{totalAtividades} atividades ({percentual}%)
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${percentual}%` }} />
          </div>
        </div>
      )}

      {/* Adicionar dia */}
      {!readOnly &&
        (addingDia ? (
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={newDia}
                onChange={(e) => setNewDia(e.target.value)}
                disabled={disabled}
              />
            </div>
            <Button type="button" onClick={addDia} disabled={!newDia || disabled}>
              Adicionar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddingDia(false);
                setNewDia('');
              }}
              disabled={disabled}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddingDia(true)}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Dia
          </Button>
        ))}

      {/* Estado vazio */}
      {dias.length === 0 && (
        <div className="rounded-md border h-36 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30">
          <Calendar className="h-8 w-8 opacity-30" />
          <p className="text-sm">Nenhum dia adicionado à agenda</p>
          {!readOnly && <p className="text-xs">Clique em "Adicionar Dia" para começar</p>}
        </div>
      )}

      {/* Lista de dias */}
      {dias.map((dia) => {
        const totalDia = totalDiaDuracao(dia.atividades);
        return (
          <div key={dia.id} className="rounded-lg border overflow-hidden">
            {/* Cabeçalho do dia */}
            <div className="flex items-center justify-between bg-muted/50 px-4 py-2.5 gap-2">
              {editingDiaId === dia.id ? (
                /* ── Modo edição da data ── */
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    type="date"
                    value={editingDiaData}
                    onChange={(e) => setEditingDiaData(e.target.value)}
                    disabled={disabled}
                    className="h-8 w-auto"
                    autoFocus
                  />
                  {dias.some((d) => d.id !== editingDiaId && d.data === editingDiaData) && (
                    <span className="text-xs text-destructive">Já existe um dia com esta data</span>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    className="h-8"
                    onClick={saveEditDia}
                    disabled={
                      disabled ||
                      !editingDiaData ||
                      dias.some((d) => d.id !== editingDiaId && d.data === editingDiaData)
                    }
                  >
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={cancelEditDia}
                    disabled={disabled}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-semibold text-sm capitalize">{fmtData(dia.data)}</span>
                  {dia.atividades.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({dia.atividades.filter((a) => a.executada).length}/{dia.atividades.length})
                    </span>
                  )}
                  {totalDia && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                      <Clock className="h-3 w-3" />
                      {totalDia} total
                    </span>
                  )}
                </div>
              )}
              {!readOnly && editingDiaId !== dia.id && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditDia(dia)}
                    disabled={disabled}
                    className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center"
                    title="Alterar data"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDia(dia.id)}
                    disabled={disabled}
                    className="h-7 w-7 rounded hover:bg-destructive/10 flex items-center justify-center"
                    title="Remover dia"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              )}
            </div>

            {/* Atividades */}
            <div className="divide-y">
              {dia.atividades.length === 0 &&
                addingAtvDiaId !== dia.id &&
                editing?.diaId !== dia.id && (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Nenhuma atividade neste dia
                  </p>
                )}
              {dia.atividades.map((atv) => {
                const duracao = fmtDuracao(
                  duracaoMin(atv.horarioInicio ?? '', atv.horarioFim ?? ''),
                );
                return editing?.diaId === dia.id && editing?.atvId === atv.id ? (
                  /* ── Modo edição inline ── */
                  <div key={atv.id} className="px-4 py-3 border-b bg-muted/10">
                    {renderForm(
                      {
                        horarioInicio: editing.horarioInicio ?? '',
                        horarioFim: editing.horarioFim ?? '',
                        titulo: editing.titulo ?? '',
                        descricao: editing.descricao ?? '',
                        cor: editing.cor ?? '#3b82f6',
                      },
                      (fn) =>
                        setEditing(
                          (p) =>
                            p && {
                              ...p,
                              ...fn({
                                horarioInicio: p.horarioInicio,
                                horarioFim: p.horarioFim,
                                titulo: p.titulo,
                                descricao: p.descricao,
                                cor: p.cor,
                              }),
                            },
                        ),
                      saveEdit,
                      () => setEditing(null),
                      'Salvar',
                      !!editing.horarioInicio && !!editing.titulo.trim(),
                    )}
                  </div>
                ) : (
                  /* ── Modo visualização ── */
                  <div
                    key={atv.id}
                    className={`flex items-start gap-3 px-4 py-3 ${atv.executada ? 'bg-muted/20' : ''}`}
                  >
                    {/* Indicador de cor */}
                    <div
                      className="w-1 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: atv.cor, minHeight: '24px' }}
                    />
                    {/* Horários */}
                    <div className="flex flex-col items-end w-[88px] flex-shrink-0 pt-0.5 gap-0.5">
                      <span className="text-sm font-mono font-semibold text-foreground">
                        {atv.horarioInicio || '—'}
                      </span>
                      {(atv.horarioFim ?? '') !== '' && (
                        <span className="text-xs font-mono text-muted-foreground">
                          {atv.horarioFim}
                        </span>
                      )}
                      {duracao && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          {duracao}
                        </span>
                      )}
                    </div>
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${atv.executada ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {atv.titulo}
                      </p>
                      {atv.descricao && (
                        <p
                          className={`text-xs text-muted-foreground mt-0.5 ${atv.executada ? 'line-through' : ''}`}
                        >
                          {atv.descricao}
                        </p>
                      )}
                    </div>
                    {/* Checkbox + Editar + Remover */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleExecutada(dia.id, atv.id)}
                        disabled={disabled}
                        className={`h-6 w-6 rounded border-2 flex items-center justify-center transition-colors ${
                          atv.executada
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/40 hover:border-primary'
                        } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        title={atv.executada ? 'Marcar como pendente' : 'Marcar como executada'}
                      >
                        {atv.executada && <Check className="h-3.5 w-3.5" />}
                      </button>
                      {!readOnly && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(dia.id, atv)}
                            disabled={disabled}
                            className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center"
                            title="Editar atividade"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAtividade(dia.id, atv.id)}
                            disabled={disabled}
                            className="h-6 w-6 rounded hover:bg-destructive/10 flex items-center justify-center"
                            title="Remover atividade"
                          >
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formulário de nova atividade */}
            {!readOnly && (
              <div className="px-4 pb-3 pt-1 border-t bg-muted/10">
                {addingAtvDiaId === dia.id ? (
                  <div className="mt-2">
                    {renderForm(
                      newAtv,
                      (fn) => setNewAtv((p) => fn(p)),
                      () => addAtividade(dia.id),
                      () => {
                        setAddingAtvDiaId(null);
                        setNewAtv(emptyAtv);
                      },
                      'Adicionar',
                      !!newAtv.horarioInicio && !!newAtv.titulo.trim(),
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setAddingAtvDiaId(dia.id);
                    }}
                    disabled={disabled}
                    className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Atividade
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
