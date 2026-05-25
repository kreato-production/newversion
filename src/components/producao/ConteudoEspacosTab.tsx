'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currencies';
import { conteudosRelacionamentosApi } from '@/modules/conteudos/conteudos-relacionamentos.api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EspacoItem {
  id: string;
  espacoId: string | null;
  espacoNome: string;
  descricao: string | null;
  horaInicio: string | null;
  horaFim: string | null;
  data: string | null;
}

interface EspacoOption {
  id: string;
  titulo: string;
  descricao: string | null;
}

interface ResourceItem {
  id: string;
  recursoId: string;
  recursoNome: string;
  valorHora: number;
  quantidade: number;
  horaInicio: string | null;
  horaFim: string | null;
  valorTotal: number;
  descontoPercentual: number;
  valorComDesconto: number;
}

interface AvailableResource {
  recursoId: string;
  recursoNome: string;
  valorHora: number;
}

interface ConteudoEspacosTabProps {
  conteudoId: string;
  readOnly?: boolean;
  moeda?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcDuration(
  horaInicio: string | null,
  horaFim: string | null,
): { label: string; hours: number } {
  if (!horaInicio || !horaFim) return { label: '-', hours: 0 };
  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFim.split(':').map(Number);
  const totalMin = hF * 60 + mF - (hI * 60 + mI);
  if (totalMin <= 0) return { label: '-', hours: 0 };
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const label = h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
  return { label, hours: totalMin / 60 };
}

function calcResourceValues(
  item: Pick<
    ResourceItem,
    'valorHora' | 'quantidade' | 'horaInicio' | 'horaFim' | 'descontoPercentual'
  >,
) {
  const { hours } = calcDuration(item.horaInicio, item.horaFim);
  const valorTotal = item.valorHora * item.quantidade * hours;
  const valorComDesconto = valorTotal * (1 - item.descontoPercentual / 100);
  return { hours, valorTotal, valorComDesconto };
}

// ─── Resource Tab ─────────────────────────────────────────────────────────────

interface ResourceTabProps {
  conteudoId: string;
  espacoItemId: string;
  tipo: 'fisico' | 'tecnico';
  label: string;
  moeda?: string;
}

function ResourceTab({ conteudoId, espacoItemId, tipo, label, moeda = 'BRL' }: ResourceTabProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [available, setAvailable] = useState<AvailableResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecursoId, setSelectedRecursoId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Local editable state per row
  const [rowState, setRowState] = useState<
    Record<
      string,
      {
        quantidade: string;
        horaInicio: string;
        horaFim: string;
        descontoPercentual: string;
      }
    >
  >({});

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await conteudosRelacionamentosApi.listEspacoResources(
        conteudoId,
        espacoItemId,
        tipo,
      );
      setItems(data.items);
      setAvailable(data.availableResources);
      const initial: typeof rowState = {};
      for (const item of data.items) {
        initial[item.id] = {
          quantidade: String(item.quantidade),
          horaInicio: item.horaInicio ?? '',
          horaFim: item.horaFim ?? '',
          descontoPercentual: String(item.descontoPercentual),
        };
      }
      setRowState(initial);
    } catch {
      toast({ title: `Erro ao carregar ${label.toLowerCase()}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [conteudoId, espacoItemId, tipo, label, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async () => {
    if (!selectedRecursoId) return;
    const resource = available.find((r) => r.recursoId === selectedRecursoId);
    if (!resource) return;
    setIsAdding(true);
    try {
      const created = await conteudosRelacionamentosApi.addEspacoResource(
        conteudoId,
        espacoItemId,
        tipo,
        {
          recursoId: resource.recursoId,
          valorHora: resource.valorHora,
          quantidade: 1,
          horaInicio: null,
          horaFim: null,
          valorTotal: 0,
          descontoPercentual: 0,
          valorComDesconto: 0,
        },
      );
      setItems((prev) => [...prev, created as ResourceItem]);
      setAvailable((prev) => prev.filter((r) => r.recursoId !== selectedRecursoId));
      setRowState((prev) => ({
        ...prev,
        [created.id]: { quantidade: '1', horaInicio: '', horaFim: '', descontoPercentual: '0' },
      }));
      setSelectedRecursoId('');
    } catch (err) {
      toast({ title: `Erro ao adicionar: ${(err as Error).message}`, variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (item: ResourceItem) => {
    try {
      await conteudosRelacionamentosApi.removeEspacoResource(
        conteudoId,
        espacoItemId,
        item.id,
        tipo,
      );
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setAvailable((prev) =>
        [
          ...prev,
          { recursoId: item.recursoId, recursoNome: item.recursoNome, valorHora: item.valorHora },
        ].sort((a, b) => a.recursoNome.localeCompare(b.recursoNome)),
      );
      setRowState((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    } catch {
      toast({ title: 'Erro ao remover recurso', variant: 'destructive' });
    }
  };

  const saveRow = useCallback(
    async (item: ResourceItem) => {
      const rs = rowState[item.id];
      if (!rs) return;
      const quantidade = Math.max(1, parseInt(rs.quantidade, 10) || 1);
      const horaInicio = rs.horaInicio || null;
      const horaFim = rs.horaFim || null;
      const desconto = Math.min(100, Math.max(0, parseFloat(rs.descontoPercentual) || 0));
      const { valorTotal, valorComDesconto } = calcResourceValues({
        valorHora: item.valorHora,
        quantidade,
        horaInicio,
        horaFim,
        descontoPercentual: desconto,
      });
      try {
        const updated = await conteudosRelacionamentosApi.updateEspacoResource(
          conteudoId,
          espacoItemId,
          item.id,
          tipo,
          {
            quantidade,
            horaInicio,
            horaFim,
            valorTotal,
            descontoPercentual: desconto,
            valorComDesconto,
          },
        );
        if (updated) {
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? ({ ...i, ...updated } as ResourceItem) : i)),
          );
        }
      } catch {
        toast({ title: 'Erro ao atualizar recurso', variant: 'destructive' });
      }
    },
    [rowState, conteudoId, espacoItemId, tipo, toast],
  );

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const rs = rowState[item.id];
        const quantidade = parseInt(rs?.quantidade ?? '1', 10) || item.quantidade;
        const horaInicio = rs?.horaInicio ?? item.horaInicio;
        const horaFim = rs?.horaFim ?? item.horaFim;
        const desconto = parseFloat(rs?.descontoPercentual ?? '0') || item.descontoPercentual;
        const { valorTotal, valorComDesconto } = calcResourceValues({
          valorHora: item.valorHora,
          quantidade,
          horaInicio,
          horaFim,
          descontoPercentual: desconto,
        });
        return {
          valorTotal: acc.valorTotal + valorTotal,
          valorComDesconto: acc.valorComDesconto + valorComDesconto,
        };
      },
      { valorTotal: 0, valorComDesconto: 0 },
    );
  }, [items, rowState]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add row */}
      <div className="flex gap-2">
        <Select value={selectedRecursoId} onValueChange={setSelectedRecursoId}>
          <SelectTrigger className="flex-1 h-8 text-xs">
            <SelectValue placeholder={`Selecione um ${label.toLowerCase()} para adicionar...`} />
          </SelectTrigger>
          <SelectContent>
            {available.length === 0 ? (
              <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                Nenhum {label.toLowerCase()} disponível.
              </div>
            ) : (
              available.map((r) => (
                <SelectItem key={r.recursoId} value={r.recursoId} className="text-xs">
                  {r.recursoNome}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          disabled={!selectedRecursoId || isAdding}
          onClick={handleAdd}
          className="gradient-primary hover:opacity-90 shrink-0"
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Plus className="h-4 w-4 mr-1" />
          )}
          Adicionar
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs">{label}</TableHead>
              <TableHead className="text-xs text-right">Valor/Hora</TableHead>
              <TableHead className="text-xs w-16 text-center">Qtd.</TableHead>
              <TableHead className="text-xs w-28">Hora Início</TableHead>
              <TableHead className="text-xs w-28">Hora Fim</TableHead>
              <TableHead className="text-xs w-20 text-center">Total</TableHead>
              <TableHead className="text-xs w-20 text-right">Horas</TableHead>
              <TableHead className="text-xs text-right">Valor Total</TableHead>
              <TableHead className="text-xs w-24 text-center">Desconto %</TableHead>
              <TableHead className="text-xs text-right">Valor c/ Desc.</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-6">
                  Nenhum {label.toLowerCase()} adicionado.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const rs = rowState[item.id] ?? {
                  quantidade: '1',
                  horaInicio: '',
                  horaFim: '',
                  descontoPercentual: '0',
                };
                const qtd = parseInt(rs.quantidade, 10) || item.quantidade;
                const hiValue = rs.horaInicio || item.horaInicio;
                const hfValue = rs.horaFim || item.horaFim;
                const descValue = parseFloat(rs.descontoPercentual) || item.descontoPercentual;
                const { label: durationLabel, hours } = calcDuration(hiValue, hfValue);
                const { valorTotal, valorComDesconto } = calcResourceValues({
                  valorHora: item.valorHora,
                  quantidade: qtd,
                  horaInicio: hiValue,
                  horaFim: hfValue,
                  descontoPercentual: descValue,
                });

                const updateRowField = (field: string, value: string) => {
                  setRowState((prev) => ({
                    ...prev,
                    [item.id]: { ...prev[item.id], [field]: value },
                  }));
                };

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs">{item.recursoNome}</TableCell>
                    <TableCell className="text-right text-xs">
                      {formatCurrency(item.valorHora, moeda)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={1}
                        className="h-7 w-14 text-center px-1 text-xs"
                        value={rs.quantidade}
                        onChange={(e) => updateRowField('quantidade', e.target.value)}
                        onBlur={() => void saveRow(item)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        className="h-7 text-xs"
                        value={rs.horaInicio}
                        onChange={(e) => updateRowField('horaInicio', e.target.value)}
                        onBlur={() => void saveRow(item)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        className="h-7 text-xs"
                        value={rs.horaFim}
                        onChange={(e) => updateRowField('horaFim', e.target.value)}
                        onBlur={() => void saveRow(item)}
                      />
                    </TableCell>
                    <TableCell className="text-center text-xs">{durationLabel}</TableCell>
                    <TableCell className="text-right text-xs">
                      {hours > 0 ? hours.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {formatCurrency(valorTotal, moeda)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        className="h-7 w-16 text-center px-1 text-xs"
                        value={rs.descontoPercentual}
                        onChange={(e) => updateRowField('descontoPercentual', e.target.value)}
                        onBlur={() => void saveRow(item)}
                      />
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono">
                      {formatCurrency(valorComDesconto, moeda)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => void handleRemove(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          {items.length > 0 && (
            <tfoot>
              <tr className="border-t bg-muted/20">
                <td colSpan={7} className="px-4 py-2 text-xs font-semibold text-right">
                  Totais:
                </td>
                <td className="px-4 py-2 text-xs font-semibold text-right font-mono">
                  {formatCurrency(totals.valorTotal, moeda)}
                </td>
                <td />
                <td className="px-4 py-2 text-xs font-semibold text-right font-mono">
                  {formatCurrency(totals.valorComDesconto, moeda)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </Table>
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

interface EspacoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    espacoId: string;
    descricao: string | null;
    horaInicio: string | null;
    horaFim: string | null;
    data: string | null;
  }) => Promise<EspacoItem | void>;
  editing?: EspacoItem | null;
  espacoOptions: EspacoOption[];
  loadingOptions: boolean;
  conteudoId: string;
  moeda?: string;
}

function EspacoModal({
  isOpen,
  onClose,
  onSave,
  editing,
  espacoOptions,
  loadingOptions,
  conteudoId,
  moeda = 'BRL',
}: EspacoModalProps) {
  const [espacoId, setEspacoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [dataEspaco, setDataEspaco] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'equipamentos' | 'tecnicos'>('equipamentos');
  const [savedItem, setSavedItem] = useState<EspacoItem | null>(null);

  // The item being configured: if editing an existing one, use it; if just saved, use savedItem
  const activeEspacoItem = editing ?? savedItem;

  useEffect(() => {
    if (!isOpen) {
      setSavedItem(null);
      return;
    }
    setEspacoId(editing?.espacoId ?? '');
    setDescricao(editing?.descricao ?? '');
    setHoraInicio(editing?.horaInicio ?? '');
    setHoraFim(editing?.horaFim ?? '');
    setDataEspaco(editing?.data ?? '');
    setActiveTab('equipamentos');
  }, [isOpen, editing]);

  const { label: total } = calcDuration(horaInicio || null, horaFim || null);
  const horaInvalida = !!(horaInicio && horaFim && horaInicio >= horaFim);
  const isValid = !!espacoId && !horaInvalida;

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    try {
      const result = await onSave({
        espacoId,
        descricao: descricao.trim() || null,
        horaInicio: horaInicio || null,
        horaFim: horaFim || null,
        data: dataEspaco || null,
      });
      // If creating, result is the new EspacoItem — keep modal open for resource config
      if (!editing && result) {
        setSavedItem(result as EspacoItem);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const showResourceTabs = !!activeEspacoItem;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-[900px] max-w-[96vw]">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Espaço' : 'Adicionar Espaço'}</DialogTitle>
          <DialogDescription>Edite as informações do espaço e seus recursos.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Row 1: Espaço + Descrição */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="espaco-select">
                Espaço <span className="text-destructive">*</span>
              </Label>
              {loadingOptions ? (
                <div className="flex items-center gap-2 h-9 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando...
                </div>
              ) : (
                <Select
                  value={espacoId}
                  onValueChange={setEspacoId}
                  disabled={isSaving || !!activeEspacoItem}
                >
                  <SelectTrigger id="espaco-select">
                    <SelectValue placeholder="Selecione um espaço..." />
                  </SelectTrigger>
                  <SelectContent>
                    {espacoOptions.length === 0 ? (
                      <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                        Nenhum espaço cadastrado em Recursos → Espaços.
                      </div>
                    ) : (
                      espacoOptions.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.titulo}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="espaco-descricao">Descrição</Label>
              <Textarea
                id="espaco-descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Notas sobre a utilização do espaço..."
                rows={3}
                disabled={isSaving}
                className="resize-none"
              />
            </div>
          </div>

          {/* Row 2: Data + Hora Início + Hora Fim + Total */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="espaco-data">Data</Label>
              <Input
                id="espaco-data"
                type="date"
                value={dataEspaco}
                onChange={(e) => setDataEspaco(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="espaco-hora-inicio">Hora Início</Label>
              <Input
                id="espaco-hora-inicio"
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="espaco-hora-fim">Hora Fim</Label>
              <Input
                id="espaco-hora-fim"
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>Total</Label>
              <Input value={total} readOnly className="bg-muted" />
            </div>
          </div>

          {horaInvalida && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>A hora de início deve ser anterior à hora de fim.</span>
            </div>
          )}

          {/* Resource tabs */}
          {showResourceTabs ? (
            <div className="space-y-3">
              {/* Tab switcher */}
              <div className="flex border-b">
                <button
                  type="button"
                  onClick={() => setActiveTab('equipamentos')}
                  className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === 'equipamentos'
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Equipamentos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tecnicos')}
                  className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === 'tecnicos'
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Recursos Técnicos
                </button>
              </div>

              {activeTab === 'equipamentos' && (
                <ResourceTab
                  key={`fisico-${activeEspacoItem.id}`}
                  conteudoId={conteudoId}
                  espacoItemId={activeEspacoItem.id}
                  tipo="fisico"
                  label="Equipamento"
                  moeda={moeda}
                />
              )}
              {activeTab === 'tecnicos' && (
                <ResourceTab
                  key={`tecnico-${activeEspacoItem.id}`}
                  conteudoId={conteudoId}
                  espacoItemId={activeEspacoItem.id}
                  tipo="tecnico"
                  label="Recurso Técnico"
                  moeda={moeda}
                />
              )}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground text-center">
              Salve o espaço para configurar equipamentos e recursos técnicos.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Fechar
          </Button>
          {!activeEspacoItem && (
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !isValid}
              className="gradient-primary hover:opacity-90"
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Salvar
            </Button>
          )}
          {activeEspacoItem && editing && (
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !isValid}
              className="gradient-primary hover:opacity-90"
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Salvar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function ConteudoEspacosTab({
  conteudoId,
  readOnly = false,
  moeda = 'BRL',
}: ConteudoEspacosTabProps) {
  const { toast } = useToast();

  const [items, setItems] = useState<EspacoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [espacoOptions, setEspacoOptions] = useState<EspacoOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EspacoItem | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await conteudosRelacionamentosApi.listEspacos(conteudoId);
      setItems(data);
    } catch {
      toast({ title: 'Erro ao carregar espaços', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [conteudoId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setLoadingOptions(true);
    conteudosRelacionamentosApi
      .listAvailableEspacos()
      .then(setEspacoOptions)
      .catch(() => toast({ title: 'Erro ao carregar lista de espaços', variant: 'destructive' }))
      .finally(() => setLoadingOptions(false));
  }, [toast]);

  const openModal = useCallback((item?: EspacoItem) => {
    setEditingItem(item ?? null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    void load();
  }, [load]);

  const handleSave = useCallback(
    async (saveData: {
      espacoId: string;
      descricao: string | null;
      horaInicio: string | null;
      horaFim: string | null;
      data: string | null;
    }): Promise<EspacoItem | void> => {
      try {
        if (editingItem) {
          const updated = await conteudosRelacionamentosApi.updateEspaco(
            conteudoId,
            editingItem.id,
            saveData,
          );
          if (updated) {
            setItems((prev) =>
              prev.map((i) => (i.id === editingItem.id ? { ...i, ...updated } : i)),
            );
          }
          toast({ title: 'Espaço atualizado com sucesso!' });
        } else {
          const created = await conteudosRelacionamentosApi.addEspaco(conteudoId, saveData);
          const newItem: EspacoItem = {
            id: created.id,
            espacoId: created.espacoId,
            espacoNome: created.espacoNome,
            descricao: created.descricao,
            horaInicio: created.horaInicio,
            horaFim: created.horaFim,
            data: created.data,
          };
          setItems((prev) => [...prev, newItem]);
          toast({ title: 'Espaço adicionado! Configure os recursos abaixo.' });
          return newItem;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao salvar espaço';
        toast({ title: msg, variant: 'destructive' });
        throw err;
      }
    },
    [editingItem, conteudoId, toast],
  );

  const handleRemove = useCallback(
    async (id: string) => {
      try {
        await conteudosRelacionamentosApi.removeEspaco(conteudoId, id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast({ title: 'Espaço removido.' });
      } catch {
        toast({ title: 'Erro ao remover espaço', variant: 'destructive' });
      }
    },
    [conteudoId, toast],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={() => openModal()}
            className="gradient-primary hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Inserir
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Espaço</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Hora Início</TableHead>
            <TableHead>Hora Fim</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Descrição</TableHead>
            {!readOnly && <TableHead className="w-[80px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={readOnly ? 6 : 7}
                className="text-center text-muted-foreground py-8"
              >
                Nenhum espaço adicionado.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.espacoNome || '-'}</TableCell>
                <TableCell>{item.data ?? '-'}</TableCell>
                <TableCell>{item.horaInicio ?? '-'}</TableCell>
                <TableCell>{item.horaFim ?? '-'}</TableCell>
                <TableCell>{calcDuration(item.horaInicio, item.horaFim).label}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {item.descricao ?? '-'}
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openModal(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => void handleRemove(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <EspacoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        editing={editingItem}
        espacoOptions={espacoOptions}
        loadingOptions={loadingOptions}
        conteudoId={conteudoId}
        moeda={moeda}
      />
    </div>
  );
}
