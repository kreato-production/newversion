import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChecklistAtividade = {
  id: string;
  nome: string;
  concluida: boolean;
};

export type ChecklistEtapa = {
  id: string;
  nome: string;
  cor: string;
  atividades: ChecklistAtividade[];
};

export type Checklist = ChecklistEtapa[];

// ─── Component ────────────────────────────────────────────────────────────────

interface SateliteChecklistTabProps {
  checklist: Checklist;
  onChange: (checklist: Checklist) => void;
  readOnly?: boolean;
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#eab308',
];

export function SateliteChecklistTab({
  checklist,
  onChange,
  readOnly = false,
}: SateliteChecklistTabProps) {
  const [openEtapas, setOpenEtapas] = useState<Set<string>>(new Set(checklist.map((e) => e.id)));

  const toggleOpen = (id: string) => {
    setOpenEtapas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Etapas ────────────────────────────────────────────────────────────────

  const addEtapa = () => {
    const newEtapa: ChecklistEtapa = {
      id: crypto.randomUUID(),
      nome: 'Nova Etapa',
      cor: DEFAULT_COLORS[checklist.length % DEFAULT_COLORS.length],
      atividades: [],
    };
    const updated = [...checklist, newEtapa];
    onChange(updated);
    setOpenEtapas((prev) => new Set([...prev, newEtapa.id]));
  };

  const updateEtapa = (etapaId: string, patch: Partial<ChecklistEtapa>) => {
    onChange(checklist.map((e) => (e.id === etapaId ? { ...e, ...patch } : e)));
  };

  const removeEtapa = (etapaId: string) => {
    onChange(checklist.filter((e) => e.id !== etapaId));
    setOpenEtapas((prev) => {
      const next = new Set(prev);
      next.delete(etapaId);
      return next;
    });
  };

  // ── Atividades ────────────────────────────────────────────────────────────

  const addAtividade = (etapaId: string) => {
    const nova: ChecklistAtividade = {
      id: crypto.randomUUID(),
      nome: '',
      concluida: false,
    };
    onChange(
      checklist.map((e) => (e.id === etapaId ? { ...e, atividades: [...e.atividades, nova] } : e)),
    );
  };

  const updateAtividade = (
    etapaId: string,
    atividadeId: string,
    patch: Partial<ChecklistAtividade>,
  ) => {
    onChange(
      checklist.map((e) =>
        e.id === etapaId
          ? {
              ...e,
              atividades: e.atividades.map((a) => (a.id === atividadeId ? { ...a, ...patch } : a)),
            }
          : e,
      ),
    );
  };

  const removeAtividade = (etapaId: string, atividadeId: string) => {
    onChange(
      checklist.map((e) =>
        e.id === etapaId
          ? { ...e, atividades: e.atividades.filter((a) => a.id !== atividadeId) }
          : e,
      ),
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3 mt-4">
      {checklist.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma etapa definida. Clique em "Adicionar Etapa" para começar.
        </div>
      )}

      {checklist.map((etapa, etapaIdx) => {
        const isOpen = openEtapas.has(etapa.id);
        const totalAtividades = etapa.atividades.length;
        const concluidas = etapa.atividades.filter((a) => a.concluida).length;

        return (
          <div
            key={etapa.id}
            className="border rounded-lg overflow-hidden"
            style={{ borderLeftWidth: 4, borderLeftColor: etapa.cor }}
          >
            <Collapsible open={isOpen} onOpenChange={() => toggleOpen(etapa.id)}>
              {/* Header da etapa */}
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ backgroundColor: etapa.cor + '18' }}
              >
                {!readOnly && (
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                )}

                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex-1 flex items-center gap-2 text-left min-w-0"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0" style={{ color: etapa.cor }} />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: etapa.cor }} />
                    )}

                    {readOnly ? (
                      <span
                        className="text-xs font-bold uppercase tracking-wider truncate"
                        style={{ color: etapa.cor }}
                      >
                        {etapa.nome}
                      </span>
                    ) : (
                      <Input
                        value={etapa.nome}
                        onChange={(e) => updateEtapa(etapa.id, { nome: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        className="h-6 text-xs font-bold uppercase tracking-wider border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        style={{ color: etapa.cor }}
                        placeholder="Nome da etapa"
                        disabled={readOnly}
                      />
                    )}

                    <span className="text-xs text-muted-foreground shrink-0 ml-auto mr-2">
                      {concluidas}/{totalAtividades}
                    </span>
                  </button>
                </CollapsibleTrigger>

                {!readOnly && (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Mini color dots */}
                    {DEFAULT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="w-4 h-4 rounded-full border transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c,
                          borderColor: etapa.cor === c ? 'white' : 'transparent',
                          outline: etapa.cor === c ? `2px solid ${c}` : 'none',
                          outlineOffset: 1,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateEtapa(etapa.id, { cor: c });
                        }}
                      />
                    ))}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEtapa(etapa.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Atividades */}
              <CollapsibleContent>
                <div className="px-3 py-2 space-y-1.5">
                  {etapa.atividades.length === 0 && !readOnly && (
                    <p className="text-xs text-muted-foreground py-1">
                      Nenhuma atividade. Clique em "+" para adicionar.
                    </p>
                  )}

                  {etapa.atividades.map((atividade) => (
                    <div key={atividade.id} className="flex items-center gap-2 group">
                      <Checkbox
                        id={atividade.id}
                        checked={atividade.concluida}
                        onCheckedChange={(checked) =>
                          updateAtividade(etapa.id, atividade.id, {
                            concluida: checked === true,
                          })
                        }
                        style={
                          atividade.concluida
                            ? ({ '--checkbox-color': etapa.cor } as React.CSSProperties)
                            : undefined
                        }
                      />
                      {readOnly ? (
                        <label
                          htmlFor={atividade.id}
                          className={`text-sm flex-1 cursor-pointer ${
                            atividade.concluida ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {atividade.nome}
                        </label>
                      ) : (
                        <Input
                          value={atividade.nome}
                          onChange={(e) =>
                            updateAtividade(etapa.id, atividade.id, { nome: e.target.value })
                          }
                          className={`h-7 text-sm flex-1 border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${
                            atividade.concluida ? 'line-through text-muted-foreground' : ''
                          }`}
                          placeholder="Descrição da atividade..."
                          disabled={readOnly}
                        />
                      )}
                      {!readOnly && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 shrink-0"
                          onClick={() => removeAtividade(etapa.id, atividade.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {!readOnly && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground mt-1"
                      onClick={() => addAtividade(etapa.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar atividade
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        );
      })}

      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={addEtapa}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Etapa
        </Button>
      )}
    </div>
  );
}
