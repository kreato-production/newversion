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
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Calendar, Clock, AlertCircle, Package, Settings } from 'lucide-react';
import { EstoqueTab, EstoqueItem } from './EstoqueTab';
import type { RecursoFisico, FaixaDisponibilidade } from '@/pages/recursos/RecursosFisicos';

interface RecursoFisicoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RecursoFisico) => void;
  data?: RecursoFisico | null;
}

const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export const RecursoFisicoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
}: RecursoFisicoFormModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    custoHora: 0,
  });
  const [faixas, setFaixas] = useState<FaixaDisponibilidade[]>([]);
  const [estoqueItens, setEstoqueItens] = useState<EstoqueItem[]>([]);
  const [activeTab, setActiveTab] = useState('geral');

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

  const verificarSobreposicao = (novaFaixa: FaixaDisponibilidade, faixasExistentes: FaixaDisponibilidade[]): boolean => {
    for (const faixa of faixasExistentes) {
      if (faixa.id === novaFaixa.id) continue;

      // Verificar sobreposição de datas
      const inicioNova = new Date(novaFaixa.dataInicio);
      const fimNova = new Date(novaFaixa.dataFim);
      const inicioExistente = new Date(faixa.dataInicio);
      const fimExistente = new Date(faixa.dataFim);

      const datasSeOverlap = inicioNova <= fimExistente && fimNova >= inicioExistente;
      
      if (!datasSeOverlap) continue;

      // Verificar se há dias em comum
      const diasEmComum = novaFaixa.diasSemana.some(d => faixa.diasSemana.includes(d));
      
      if (!diasEmComum) continue;

      // Verificar sobreposição de horários
      const [horaInicioNova, minInicioNova] = novaFaixa.horaInicio.split(':').map(Number);
      const [horaFimNova, minFimNova] = novaFaixa.horaFim.split(':').map(Number);
      const [horaInicioExist, minInicioExist] = faixa.horaInicio.split(':').map(Number);
      const [horaFimExist, minFimExist] = faixa.horaFim.split(':').map(Number);

      const inicioNovaMin = horaInicioNova * 60 + minInicioNova;
      const fimNovaMin = horaFimNova * 60 + minFimNova;
      const inicioExistMin = horaInicioExist * 60 + minInicioExist;
      const fimExistMin = horaFimExist * 60 + minFimExist;

      const horariosSeOverlap = inicioNovaMin < fimExistMin && fimNovaMin > inicioExistMin;

      if (horariosSeOverlap) {
        return true; // Há sobreposição
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
      diasSemana: [1, 2, 3, 4, 5], // Segunda a Sexta por padrão
    };
    setFaixas([...faixas, novaFaixa]);
  };

  const handleRemoveFaixa = (id: string) => {
    setFaixas(faixas.filter(f => f.id !== id));
  };

  const handleFaixaChange = (id: string, field: keyof FaixaDisponibilidade, value: string | number[]) => {
    setFaixas(faixas.map(f => {
      if (f.id !== id) return f;
      return { ...f, [field]: value };
    }));
  };

  const handleDiaToggle = (faixaId: string, dia: number) => {
    setFaixas(faixas.map(f => {
      if (f.id !== faixaId) return f;
      const diasAtuais = f.diasSemana;
      if (diasAtuais.includes(dia)) {
        return { ...f, diasSemana: diasAtuais.filter(d => d !== dia) };
      } else {
        return { ...f, diasSemana: [...diasAtuais, dia].sort((a, b) => a - b) };
      }
    }));
  };

  const validarFaixas = (): boolean => {
    for (const faixa of faixas) {
      if (!faixa.dataInicio || !faixa.dataFim) {
        toast({
          title: 'Erro de Validação',
          description: 'Todas as faixas devem ter data de início e fim.',
          variant: 'destructive',
        });
        return false;
      }

      if (new Date(faixa.dataInicio) > new Date(faixa.dataFim)) {
        toast({
          title: 'Erro de Validação',
          description: 'A data de início não pode ser posterior à data de fim.',
          variant: 'destructive',
        });
        return false;
      }

      if (faixa.diasSemana.length === 0) {
        toast({
          title: 'Erro de Validação',
          description: 'Selecione pelo menos um dia da semana para cada faixa.',
          variant: 'destructive',
        });
        return false;
      }

      if (faixa.horaInicio >= faixa.horaFim) {
        toast({
          title: 'Erro de Validação',
          description: 'O horário de início deve ser anterior ao horário de fim.',
          variant: 'destructive',
        });
        return false;
      }

      if (verificarSobreposicao(faixa, faixas)) {
        toast({
          title: 'Conflito de Horários',
          description: 'Existem faixas de disponibilidade com sobreposição de períodos.',
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
          title: 'Erro de Validação',
          description: 'Todos os itens de estoque devem ter um nome.',
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (faixas.length > 0 && !validarFaixas()) {
      return;
    }

    if (estoqueItens.length > 0 && !validarEstoque()) {
      return;
    }

    onSave({
      id: data?.id || crypto.randomUUID(),
      codigoExterno: formData.codigoExterno,
      nome: formData.nome,
      custoHora: formData.custoHora,
      faixasDisponibilidade: faixas,
      estoqueItens: estoqueItens,
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
      usuarioCadastroId: data?.usuarioCadastroId,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Recurso Físico' : 'Novo Recurso Físico'}</DialogTitle>
          <DialogDescription>
            Preencha os campos para {data ? 'editar' : 'cadastrar'} o recurso físico.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="geral" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="disponibilidade" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Disponibilidade
              </TabsTrigger>
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
              {/* Dados básicos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">Código Externo</Label>
                  <Input
                    id="codigoExterno"
                    value={formData.codigoExterno}
                    onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                    maxLength={10}
                    placeholder="Máx. 10 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custoHora">Custo/Hora (R$)</Label>
                  <Input
                    id="custoHora"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custoHora}
                    onChange={(e) => setFormData({ ...formData, custoHora: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  maxLength={100}
                  required
                />
              </div>
            </TabsContent>

            <TabsContent value="disponibilidade" className="space-y-4 mt-4">
              {/* Faixas de Disponibilidade */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Faixas de Disponibilidade
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddFaixa}>
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Faixa
                  </Button>
                </div>

                {faixas.length === 0 ? (
                  <div className="text-center py-6 border rounded-lg border-dashed bg-muted/20">
                    <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma faixa de disponibilidade cadastrada.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clique em "Adicionar Faixa" para definir períodos de disponibilidade.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {faixas.map((faixa, index) => (
                      <div key={faixa.id} className="border rounded-lg p-4 bg-muted/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">Faixa {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFaixa(faixa.id)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Datas */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Data Início *</Label>
                            <Input
                              type="date"
                              value={faixa.dataInicio}
                              onChange={(e) => handleFaixaChange(faixa.id, 'dataInicio', e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Data Fim *</Label>
                            <Input
                              type="date"
                              value={faixa.dataFim}
                              onChange={(e) => handleFaixaChange(faixa.id, 'dataFim', e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>

                        {/* Horários */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Hora Início *
                            </Label>
                            <Input
                              type="time"
                              value={faixa.horaInicio}
                              onChange={(e) => handleFaixaChange(faixa.id, 'horaInicio', e.target.value)}
                              className="h-9"
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
                              onChange={(e) => handleFaixaChange(faixa.id, 'horaFim', e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>

                        {/* Dias da semana */}
                        <div className="space-y-2">
                          <Label className="text-xs">Dias da Semana *</Label>
                          <div className="flex flex-wrap gap-2">
                            {DIAS_SEMANA.map((dia) => (
                              <label
                                key={dia.value}
                                className={`
                                  flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer
                                  transition-colors text-sm
                                  ${faixa.diasSemana.includes(dia.value) 
                                    ? 'bg-primary text-primary-foreground border-primary' 
                                    : 'bg-background hover:bg-muted'}
                                `}
                              >
                                <Checkbox
                                  checked={faixa.diasSemana.includes(dia.value)}
                                  onCheckedChange={() => handleDiaToggle(faixa.id, dia.value)}
                                  className="sr-only"
                                />
                                {dia.label}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Aviso de sobreposição */}
                        {verificarSobreposicao(faixa, faixas) && (
                          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded">
                            <AlertCircle className="w-4 h-4" />
                            <span>Esta faixa se sobrepõe a outra faixa existente.</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="estoque" className="mt-4">
              <EstoqueTab
                recursoFisicoId={data?.id}
                itens={estoqueItens}
                onItensChange={setEstoqueItens}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="gradient-primary hover:opacity-90">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
