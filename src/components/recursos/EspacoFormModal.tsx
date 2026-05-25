'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Calendar, Settings, Loader2 } from 'lucide-react';
import type { Espaco, EspacoInput, FaixaDisponibilidade } from '@/modules/espacos/espacos.types';

interface EspacoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EspacoInput) => Promise<void>;
  data?: Espaco | null;
  readOnly?: boolean;
}

const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' },
];

export function EspacoFormModal({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
}: EspacoFormModalProps) {
  const { toast } = useToast();
  const [codigoExterno, setCodigoExterno] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [faixas, setFaixas] = useState<FaixaDisponibilidade[]>([]);
  const [activeTab, setActiveTab] = useState('geral');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCodigoExterno(data?.codigoExterno ?? '');
    setTitulo(data?.titulo ?? '');
    setDescricao(data?.descricao ?? '');
    setFaixas(data?.faixasDisponibilidade ?? []);
    setActiveTab('geral');
  }, [isOpen, data]);

  const verificarSobreposicao = (
    novaFaixa: FaixaDisponibilidade,
    todas: FaixaDisponibilidade[],
  ): boolean => {
    for (const faixa of todas) {
      if (faixa.id === novaFaixa.id) continue;
      const inicioNova = new Date(novaFaixa.dataInicio);
      const fimNova = new Date(novaFaixa.dataFim);
      const inicioExist = new Date(faixa.dataInicio);
      const fimExist = new Date(faixa.dataFim);
      if (!(inicioNova <= fimExist && fimNova >= inicioExist)) continue;
      const diasEmComum = novaFaixa.diasSemana.some((d) => faixa.diasSemana.includes(d));
      if (!diasEmComum) continue;
      const [hIni, mIni] = novaFaixa.horaInicio.split(':').map(Number);
      const [hFim, mFim] = novaFaixa.horaFim.split(':').map(Number);
      const [hIniE, mIniE] = faixa.horaInicio.split(':').map(Number);
      const [hFimE, mFimE] = faixa.horaFim.split(':').map(Number);
      if (hIni * 60 + mIni < hFimE * 60 + mFimE && hFim * 60 + mFim > hIniE * 60 + mIniE)
        return true;
    }
    return false;
  };

  const handleAddFaixa = () => {
    const nova: FaixaDisponibilidade = {
      id: crypto.randomUUID(),
      dataInicio: '',
      dataFim: '',
      horaInicio: '09:00',
      horaFim: '18:00',
      diasSemana: [1, 2, 3, 4, 5],
    };
    setFaixas((prev) => [...prev, nova]);
  };

  const handleRemoveFaixa = (id: string) => setFaixas((prev) => prev.filter((f) => f.id !== id));

  const handleFaixaChange = (
    id: string,
    field: keyof FaixaDisponibilidade,
    value: string | number[],
  ) => {
    setFaixas((prev) => prev.map((f) => (f.id !== id ? f : { ...f, [field]: value })));
  };

  const handleDiaToggle = (faixaId: string, dia: number) => {
    setFaixas((prev) =>
      prev.map((f) => {
        if (f.id !== faixaId) return f;
        return f.diasSemana.includes(dia)
          ? { ...f, diasSemana: f.diasSemana.filter((d) => d !== dia) }
          : { ...f, diasSemana: [...f.diasSemana, dia].sort((a, b) => a - b) };
      }),
    );
  };

  const validarFaixas = (): boolean => {
    for (const faixa of faixas) {
      if (!faixa.dataInicio || !faixa.dataFim) {
        toast({
          title: 'Erro de validação',
          description: 'Todas as faixas devem ter data de início e fim.',
          variant: 'destructive',
        });
        return false;
      }
      if (new Date(faixa.dataInicio) > new Date(faixa.dataFim)) {
        toast({
          title: 'Erro de validação',
          description: 'A data de início não pode ser posterior à data de fim.',
          variant: 'destructive',
        });
        return false;
      }
      if (faixa.diasSemana.length === 0) {
        toast({
          title: 'Erro de validação',
          description: 'Selecione pelo menos um dia da semana para cada faixa.',
          variant: 'destructive',
        });
        return false;
      }
      if (faixa.horaInicio >= faixa.horaFim) {
        toast({
          title: 'Erro de validação',
          description: 'O horário de início deve ser anterior ao horário de fim.',
          variant: 'destructive',
        });
        return false;
      }
      if (verificarSobreposicao(faixa, faixas)) {
        toast({
          title: 'Conflito de horários',
          description: 'Existem faixas com sobreposição de períodos.',
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!titulo.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'O título é obrigatório.',
        variant: 'destructive',
      });
      return;
    }
    if (faixas.length > 0 && !validarFaixas()) return;

    try {
      setIsSubmitting(true);
      await onSave({
        id: data?.id,
        codigoExterno: codigoExterno || null,
        titulo,
        descricao: descricao || null,
        faixasDisponibilidade: faixas,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[700px] max-w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Espaço' : 'Novo Espaço'}</DialogTitle>
          <DialogDescription>
            {data ? 'Altere os dados do espaço' : 'Preencha os dados para cadastrar o espaço.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="geral" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="disponibilidade" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Disponibilidade
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Geral ─────────────────────────────────────────── */}
          <TabsContent value="geral" className="space-y-4 mt-4">
            {data && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">ID</Label>
                  <Input value={data.id} readOnly className="bg-muted text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Usuário</Label>
                  <Input value={data.usuarioCadastro || '-'} readOnly className="bg-muted" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="codigoExterno">Código Externo</Label>
              <Input
                id="codigoExterno"
                value={codigoExterno}
                onChange={(e) => setCodigoExterno(e.target.value.slice(0, 20))}
                maxLength={20}
                placeholder="Máx. 20 caracteres"
                disabled={readOnly || isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={100}
                placeholder="Nome do espaço"
                disabled={readOnly || isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição do espaço"
                rows={3}
                disabled={readOnly || isSubmitting}
              />
            </div>
          </TabsContent>

          {/* ── Tab: Disponibilidade ────────────────────────────────── */}
          <TabsContent value="disponibilidade" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Faixas de Disponibilidade
              </Label>
              {!readOnly && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddFaixa}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Faixa
                </Button>
              )}
            </div>

            {faixas.length === 0 ? (
              <div className="text-center py-8 border rounded-lg border-dashed bg-muted/20">
                <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Nenhuma faixa de disponibilidade cadastrada.
                </p>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={handleAddFaixa}
                  >
                    Adicionar faixa
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {faixas.map((faixa, index) => (
                  <div key={faixa.id} className="border rounded-lg p-4 bg-muted/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-xs">Faixa {index + 1}</span>
                      {!readOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveFaixa(faixa.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Data Início *</Label>
                        <Input
                          type="date"
                          value={faixa.dataInicio}
                          onChange={(e) =>
                            handleFaixaChange(faixa.id, 'dataInicio', e.target.value)
                          }
                          className="h-9"
                          disabled={readOnly || isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Data Fim *</Label>
                        <Input
                          type="date"
                          value={faixa.dataFim}
                          onChange={(e) => handleFaixaChange(faixa.id, 'dataFim', e.target.value)}
                          className="h-9"
                          disabled={readOnly || isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Hora Início *</Label>
                        <Input
                          type="time"
                          value={faixa.horaInicio}
                          onChange={(e) =>
                            handleFaixaChange(faixa.id, 'horaInicio', e.target.value)
                          }
                          className="h-9"
                          disabled={readOnly || isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Hora Fim *</Label>
                        <Input
                          type="time"
                          value={faixa.horaFim}
                          onChange={(e) => handleFaixaChange(faixa.id, 'horaFim', e.target.value)}
                          className="h-9"
                          disabled={readOnly || isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Dias da Semana *</Label>
                      <div className="flex gap-3 flex-wrap">
                        {DIAS_SEMANA.map((dia) => (
                          <div key={dia.value} className="flex items-center gap-1.5">
                            <Checkbox
                              id={`${faixa.id}-dia-${dia.value}`}
                              checked={faixa.diasSemana.includes(dia.value)}
                              onCheckedChange={() => handleDiaToggle(faixa.id, dia.value)}
                              disabled={readOnly || isSubmitting}
                            />
                            <Label
                              htmlFor={`${faixa.id}-dia-${dia.value}`}
                              className="text-xs cursor-pointer"
                            >
                              {dia.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          {!readOnly && (
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !titulo.trim()}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
