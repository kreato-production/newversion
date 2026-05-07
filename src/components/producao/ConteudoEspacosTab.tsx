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
import { conteudosRelacionamentosApi } from '@/modules/conteudos/conteudos-relacionamentos.api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EspacoItem {
  id: string;
  espacoId: string | null;
  espacoNome: string;
  descricao: string | null;
  horaInicio: string | null;
  horaFim: string | null;
}

interface EspacoOption {
  id: string;
  titulo: string;
  descricao: string | null;
}

interface ConteudoEspacosTabProps {
  conteudoId: string;
  readOnly?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcTotal(horaInicio: string | null, horaFim: string | null): string {
  if (!horaInicio || !horaFim) return '-';
  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFim.split(':').map(Number);
  const totalMin = hF * 60 + mF - (hI * 60 + mI);
  if (totalMin <= 0) return '-';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ''}` : `${m}min`;
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
  }) => Promise<void>;
  editing?: EspacoItem | null;
  espacoOptions: EspacoOption[];
  loadingOptions: boolean;
}

function EspacoModal({
  isOpen,
  onClose,
  onSave,
  editing,
  espacoOptions,
  loadingOptions,
}: EspacoModalProps) {
  const [espacoId, setEspacoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setEspacoId(editing?.espacoId ?? '');
    setDescricao(editing?.descricao ?? '');
    setHoraInicio(editing?.horaInicio ?? '');
    setHoraFim(editing?.horaFim ?? '');
  }, [isOpen, editing]);

  const total = useMemo(
    () => calcTotal(horaInicio || null, horaFim || null),
    [horaInicio, horaFim],
  );
  const horaInvalida = !!(horaInicio && horaFim && horaInicio >= horaFim);
  const isValid = !!espacoId && !horaInvalida;

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    try {
      await onSave({
        espacoId,
        descricao: descricao.trim() || null,
        horaInicio: horaInicio || null,
        horaFim: horaFim || null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-[700px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Espaço' : 'Adicionar Espaço'}</DialogTitle>
          <DialogDescription>
            Selecione um espaço e configure os recursos associados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Row 1: Espaço + Descrição */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="espaco-select">
                Espaço <span className="text-destructive">*</span>
              </Label>
              {loadingOptions ? (
                <div className="flex items-center gap-2 h-9 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando...
                </div>
              ) : (
                <Select value={espacoId} onValueChange={setEspacoId} disabled={isSaving}>
                  <SelectTrigger id="espaco-select">
                    <SelectValue placeholder="Selecione um espaço..." />
                  </SelectTrigger>
                  <SelectContent>
                    {espacoOptions.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-muted-foreground text-center">
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

          {/* Row 2: Hora Início + Hora Fim + Total */}
          <div className="grid grid-cols-3 gap-4">
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
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>A hora de início deve ser anterior à hora de fim.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Fechar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isValid}
            className="gradient-primary hover:opacity-90"
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Salvar e Configurar Recursos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function ConteudoEspacosTab({ conteudoId, readOnly = false }: ConteudoEspacosTabProps) {
  const { toast } = useToast();

  const [items, setItems] = useState<EspacoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Options loaded once on mount — not inside the click handler
  const [espacoOptions, setEspacoOptions] = useState<EspacoOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EspacoItem | null>(null);

  // Load items linked to this content
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

  // Load available space options once — not on click
  useEffect(() => {
    setLoadingOptions(true);
    conteudosRelacionamentosApi
      .listAvailableEspacos()
      .then(setEspacoOptions)
      .catch(() => toast({ title: 'Erro ao carregar lista de espaços', variant: 'destructive' }))
      .finally(() => setLoadingOptions(false));
  }, [toast]);

  // openModal is now synchronous — no async inside
  const openModal = useCallback((item?: EspacoItem) => {
    setEditingItem(item ?? null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
  }, []);

  const handleSave = useCallback(
    async (data: {
      espacoId: string;
      descricao: string | null;
      horaInicio: string | null;
      horaFim: string | null;
    }) => {
      try {
        if (editingItem) {
          const updated = await conteudosRelacionamentosApi.updateEspaco(
            conteudoId,
            editingItem.id,
            data,
          );
          if (updated) {
            setItems((prev) =>
              prev.map((i) => (i.id === editingItem.id ? { ...i, ...updated } : i)),
            );
          }
          toast({ title: 'Espaço atualizado com sucesso!' });
        } else {
          const created = await conteudosRelacionamentosApi.addEspaco(conteudoId, data);
          setItems((prev) => [
            ...prev,
            {
              id: created.id,
              espacoId: created.espacoId,
              espacoNome: created.espacoNome,
              descricao: created.descricao,
              horaInicio: created.horaInicio,
              horaFim: created.horaFim,
            },
          ]);
          toast({ title: 'Espaço adicionado com sucesso!' });
        }
        closeModal();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao salvar espaço';
        toast({ title: msg, variant: 'destructive' });
        throw err;
      }
    },
    [editingItem, conteudoId, toast, closeModal],
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
          {/* type="button" prevents submitting the parent form */}
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
                colSpan={readOnly ? 5 : 6}
                className="text-center text-muted-foreground py-8"
              >
                Nenhum espaço adicionado.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.espacoNome || '-'}</TableCell>
                <TableCell>{item.horaInicio ?? '-'}</TableCell>
                <TableCell>{item.horaFim ?? '-'}</TableCell>
                <TableCell>{calcTotal(item.horaInicio, item.horaFim)}</TableCell>
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
                        onClick={() => handleRemove(item.id)}
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
      />
    </div>
  );
}
