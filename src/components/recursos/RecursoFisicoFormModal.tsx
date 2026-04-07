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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Calendar, Clock, AlertCircle, Package, Settings } from 'lucide-react';
import { EstoqueTab } from './EstoqueTab';
import type {
  RecursoFisico,
  RecursoFisicoInput,
  FaixaDisponibilidade,
  EstoqueItem,
} from '@/modules/recursos-fisicos/recursos-fisicos.types';
import { useFormFieldConfig, FieldAsterisk } from '@/hooks/useFormFieldConfig';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';

interface RecursoFisicoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RecursoFisicoInput) => Promise<void>;
  data?: RecursoFisico | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
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

export const RecursoFisicoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: RecursoFisicoFormModalProps) => {
  const { isVisible } = usePermissions();
  const { toast } = useToast();
  const { getAsterisk } = useFormFieldConfig('recursoFisico');
  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    custoHora: 0,
  });
  const [faixas, setFaixas] = useState<FaixaDisponibilidade[]>([]);
  const [estoqueItens, setEstoqueItens] = useState<EstoqueItem[]>([]);
  const [activeTab, setActiveTab] = useState('geral');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        custoHora: data.custoHora,
      });
      setFaixas(data.faixasDisponibilidade || []);
      setEstoqueItens(data.estoqueItens || []);
    } else {
      setFormData({ codigoExterno: '', nome: '', custoHora: 0 });
      setFaixas([]);
      setEstoqueItens([]);
    }
    setActiveTab('geral');
  }, [data, isOpen]);

  const verificarSobreposicao = (
    novaFaixa: FaixaDisponibilidade,
    faixasExistentes: FaixaDisponibilidade[],
  ): boolean => {
    for (const faixa of faixasExistentes) {
      if (faixa.id === novaFaixa.id) continue;

      const inicioNova = new Date(novaFaixa.dataInicio);
      const fimNova = new Date(novaFaixa.dataFim);
      const inicioExistente = new Date(faixa.dataInicio);
      const fimExistente = new Date(faixa.dataFim);
      const datasSeOverlap = inicioNova <= fimExistente && fimNova >= inicioExistente;
      if (!datasSeOverlap) continue;

      const diasEmComum = novaFaixa.diasSemana.some((dia) => faixa.diasSemana.includes(dia));
      if (!diasEmComum) continue;

      const [horaInicioNova, minInicioNova] = novaFaixa.horaInicio.split(':').map(Number);
      const [horaFimNova, minFimNova] = novaFaixa.horaFim.split(':').map(Number);
      const [horaInicioExist, minInicioExist] = faixa.horaInicio.split(':').map(Number);
      const [horaFimExist, minFimExist] = faixa.horaFim.split(':').map(Number);

      const inicioNovaMin = horaInicioNova * 60 + minInicioNova;
      const fimNovaMin = horaFimNova * 60 + minFimNova;
      const inicioExistMin = horaInicioExist * 60 + minInicioExist;
      const fimExistMin = horaFimExist * 60 + minFimExist;

      if (inicioNovaMin < fimExistMin && fimNovaMin > inicioExistMin) {
        return true;
      }
    }

    return false;
  };

  const handleAddFaixa = () => {
    const novaFaixa: FaixaDisponibilidade = {
      id: crypto.randomUUID(),
      dataInicio: '',
      dataFim: '',
      horaInicio: '09:00',
      horaFim: '18:00',
      diasSemana: [1, 2, 3, 4, 5],
    };
    setFaixas([...faixas, novaFaixa]);
  };

  const handleRemoveFaixa = (id: string) => {
    setFaixas(faixas.filter((item) => item.id !== id));
  };

  const handleFaixaChange = (
    id: string,
    field: keyof FaixaDisponibilidade,
    value: string | number[],
  ) => {
    setFaixas(faixas.map((item) => (item.id !== id ? item : { ...item, [field]: value })));
  };

  const handleDiaToggle = (faixaId: string, dia: number) => {
    setFaixas(
      faixas.map((item) => {
        if (item.id !== faixaId) {
          return item;
        }

        return item.diasSemana.includes(dia)
          ? { ...item, diasSemana: item.diasSemana.filter((currentDia) => currentDia !== dia) }
          : { ...item, diasSemana: [...item.diasSemana, dia].sort((a, b) => a - b) };
      }),
    );
  };

  const validarFaixas = (): boolean => {
    for (const faixa of faixas) {
      if (!faixa.dataInicio || !faixa.dataFim) {
        toast({
          title: 'Erro de validacao',
          description: 'Todas as faixas devem ter data de inicio e fim.',
          variant: 'destructive',
        });
        return false;
      }

      if (new Date(faixa.dataInicio) > new Date(faixa.dataFim)) {
        toast({
          title: 'Erro de validacao',
          description: 'A data de inicio nao pode ser posterior a data de fim.',
          variant: 'destructive',
        });
        return false;
      }

      if (faixa.diasSemana.length === 0) {
        toast({
          title: 'Erro de validacao',
          description: 'Selecione pelo menos um dia da semana para cada faixa.',
          variant: 'destructive',
        });
        return false;
      }

      if (faixa.horaInicio >= faixa.horaFim) {
        toast({
          title: 'Erro de validacao',
          description: 'O horario de inicio deve ser anterior ao horario de fim.',
          variant: 'destructive',
        });
        return false;
      }

      if (verificarSobreposicao(faixa, faixas)) {
        toast({
          title: 'Conflito de horarios',
          description: 'Existem faixas de disponibilidade com sobreposicao de periodos.',
          variant: 'destructive',
        });
        return false;
      }
    }

    return true;
  };

  const validarEstoque = (): boolean => {
    for (const item of estoqueItens) {
      if (!item.nome.trim()) {
        toast({
          title: 'Erro de validacao',
          description: 'Todos os itens de estoque devem ter um nome.',
          variant: 'destructive',
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (faixas.length > 0 && !validarFaixas()) {
      return;
    }

    if (estoqueItens.length > 0 && !validarEstoque()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        id: data?.id,
        codigoExterno: formData.codigoExterno,
        nome: formData.nome,
        custoHora: formData.custoHora,
        faixasDisponibilidade: faixas,
        estoqueItens,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Recurso Fisico' : 'Novo Recurso Fisico'}</DialogTitle>
          <DialogDescription>
            Preencha os campos para {data ? 'editar' : 'cadastrar'} o recurso fisico.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="geral" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Geral
              </TabsTrigger>
              {isVisible('Recursos', 'Recursos Físicos', '-', 'Tabulador "Disponibilidade"') && (
                <TabsTrigger value="disponibilidade" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Disponibilidade
                </TabsTrigger>
              )}
              <TabsTrigger value="estoque" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Estoque
                {estoqueItens.length > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {estoqueItens.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">
                    Codigo Externo <FieldAsterisk type={getAsterisk('codigoExterno')} />
                  </Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                    maxLength={10}
                    placeholder="Max. 10 caracteres"
                    disabled={readOnly || isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custoHora">
                    Custo/Hora <FieldAsterisk type={getAsterisk('custoHora')} />
                  </Label>
                  <Input
                    id="custoHora"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custoHora}
                    onChange={(e) =>
                      setFormData({ ...formData, custoHora: parseFloat(e.target.value) || 0 })
                    }
                    disabled={readOnly || isSubmitting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome <FieldAsterisk type={getAsterisk('nome')} />
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  maxLength={100}
                  required
                  disabled={readOnly || isSubmitting}
                />
              </div>
            </TabsContent>

            {isVisible('Recursos', 'Recursos Físicos', '-', 'Tabulador "Disponibilidade"') && (
              <TabsContent value="disponibilidade" className="space-y-4 mt-4">
                <div className="space-y-4">
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
                    <div className="text-center py-6 border rounded-lg border-dashed bg-muted/20">
                      <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma faixa de disponibilidade cadastrada.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {faixas.map((faixa, index) => (
                        <div key={faixa.id} className="border rounded-lg p-4 bg-muted/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Faixa {index + 1}</span>
                            {!readOnly && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFaixa(faixa.id)}
                                className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Data Inicio *</Label>
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
                                onChange={(e) =>
                                  handleFaixaChange(faixa.id, 'dataFim', e.target.value)
                                }
                                className="h-9"
                                disabled={readOnly || isSubmitting}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Hora Inicio *
                              </Label>
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
                              <Label className="text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Hora Fim *
                              </Label>
                              <Input
                                type="time"
                                value={faixa.horaFim}
                                onChange={(e) =>
                                  handleFaixaChange(faixa.id, 'horaFim', e.target.value)
                                }
                                className="h-9"
                                disabled={readOnly || isSubmitting}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Dias da Semana *</Label>
                            <div className="flex flex-wrap gap-2">
                              {DIAS_SEMANA.map((dia) => (
                                <label
                                  key={dia.value}
                                  className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer
                                    transition-colors text-sm
                                    ${
                                      faixa.diasSemana.includes(dia.value)
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background hover:bg-muted'
                                    }
                                  `}
                                >
                                  <Checkbox
                                    checked={faixa.diasSemana.includes(dia.value)}
                                    onCheckedChange={() => handleDiaToggle(faixa.id, dia.value)}
                                    className="sr-only"
                                    disabled={readOnly || isSubmitting}
                                  />
                                  {dia.label}
                                </label>
                              ))}
                            </div>
                          </div>

                          {verificarSobreposicao(faixa, faixas) && (
                            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded">
                              <AlertCircle className="w-4 h-4" />
                              <span>Esta faixa se sobrepoe a outra faixa existente.</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            <TabsContent value="estoque" className="mt-4">
              <EstoqueTab
                itens={estoqueItens}
                onItensChange={setEstoqueItens}
                readOnly={readOnly || isSubmitting}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
            {navigation && <ModalNavigation {...navigation} />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {readOnly ? 'Fechar' : 'Cancelar'}
              </Button>
              {!readOnly && (
                <Button
                  type="submit"
                  className="gradient-primary hover:opacity-90"
                  disabled={isSubmitting}
                >
                  Salvar
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
