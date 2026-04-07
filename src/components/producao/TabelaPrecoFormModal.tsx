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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFormFieldConfig, FieldAsterisk } from '@/hooks/useFormFieldConfig';
import { TabelaPrecoRecursosTecnicosTab } from '@/components/producao/TabelaPrecoRecursosTecnicosTab';
import { TabelaPrecoRecursosFisicosTab } from '@/components/producao/TabelaPrecoRecursosFisicosTab';
import { ApiTabelasPrecoRepository } from '@/modules/tabelas-preco/tabelas-preco.api.repository';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import type {
  TabelaPrecoInput,
  TabelaPrecoItem,
  UnidadeNegocioOption,
} from '@/modules/tabelas-preco/tabelas-preco.types';

interface TabelaPrecoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  data?: TabelaPrecoItem | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

const repository = new ApiTabelasPrecoRepository();

export const TabelaPrecoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: TabelaPrecoFormModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { getAsterisk, validateRequired, showValidationError } = useFormFieldConfig('tabelaPreco');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [unidades, setUnidades] = useState<UnidadeNegocioOption[]>([]);
  const [formData, setFormData] = useState({
    codigoExterno: '',
    nome: '',
    status: 'Ativo',
    vigenciaInicio: '',
    vigenciaFim: '',
    descricao: '',
    unidadeNegocioId: '',
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void (async () => {
      try {
        const response = await repository.listOptions();
        setUnidades(response.unidades);
      } catch (error) {
        console.error('Error fetching unidades for tabela de preco:', error);
        setUnidades([]);
        toast({
          title: 'Erro',
          description: `Erro ao carregar unidades: ${(error as Error).message}`,
          variant: 'destructive',
        });
      }
    })();

    if (data) {
      setFormData({
        codigoExterno: data.codigoExterno || '',
        nome: data.nome || '',
        status: data.status || 'Ativo',
        vigenciaInicio: data.vigenciaInicio || '',
        vigenciaFim: data.vigenciaFim || '',
        descricao: data.descricao || '',
        unidadeNegocioId: data.unidadeNegocioId || '',
      });
      setSavedId(data.id);
      return;
    }

    setFormData({
      codigoExterno: '',
      nome: '',
      status: 'Ativo',
      vigenciaInicio: '',
      vigenciaFim: '',
      descricao: '',
      unidadeNegocioId: '',
    });
    setSavedId(null);
  }, [data, isOpen, toast]);

  const selectedMoeda =
    unidades.find((item) => item.id === formData.unidadeNegocioId)?.moeda || 'BRL';

  const fieldLabels: Record<string, string> = {
    codigoExterno: 'Código Externo',
    nome: 'Nome',
    unidadeNegocio: 'Unidade de Negócio',
    status: 'Status',
    vigenciaInicio: 'Vigência De',
    vigenciaFim: 'Vigência Até',
    descricao: 'Descrição',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missing = validateRequired(
      {
        codigoExterno: formData.codigoExterno,
        nome: formData.nome,
        unidadeNegocio: formData.unidadeNegocioId,
        status: formData.status,
        vigenciaInicio: formData.vigenciaInicio,
        vigenciaFim: formData.vigenciaFim,
        descricao: formData.descricao,
      },
      fieldLabels,
    );

    if (missing.length > 0) {
      showValidationError(missing);
      return;
    }

    try {
      const payload: TabelaPrecoInput = {
        id: data?.id,
        tenantId: user?.tenantId ?? null,
        codigoExterno: formData.codigoExterno,
        nome: formData.nome,
        status: formData.status,
        vigenciaInicio: formData.vigenciaInicio,
        vigenciaFim: formData.vigenciaFim,
        descricao: formData.descricao,
        unidadeNegocioId: formData.unidadeNegocioId,
      };

      const saved = await repository.save(payload);

      if (data) {
        toast({ title: 'Sucesso', description: 'Tabela de preço atualizada!' });
      } else {
        setSavedId(saved.id);
        toast({ title: 'Sucesso', description: 'Tabela de preço cadastrada!' });
      }

      await onSave();
      onClose();
    } catch (error) {
      console.error('Error saving tabela_preco:', error);
      toast({
        title: 'Erro',
        description: `Erro ao salvar tabela de preço: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const currentId = data?.id || savedId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Tabela de Preço' : 'Nova Tabela de Preço'}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {data ? 'editar' : 'cadastrar'} a tabela de preço.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoExterno">
                Código Externo <FieldAsterisk type={getAsterisk('codigoExterno')} />
              </Label>
              <Input
                id="codigoExterno"
                value={formData.codigoExterno}
                onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                maxLength={10}
                placeholder="Máx. 10 caracteres"
                disabled={readOnly}
              />
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
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unidadeNegocio">
                Unidade de Negócio <FieldAsterisk type={getAsterisk('unidadeNegocio')} />
              </Label>
              <Select
                value={formData.unidadeNegocioId}
                onValueChange={(value) => setFormData({ ...formData, unidadeNegocioId: value })}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">
                Status <FieldAsterisk type={getAsterisk('status')} />
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vigenciaInicio">
                Vigência De <FieldAsterisk type={getAsterisk('vigenciaInicio')} />
              </Label>
              <Input
                id="vigenciaInicio"
                type="date"
                value={formData.vigenciaInicio}
                onChange={(e) => setFormData({ ...formData, vigenciaInicio: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vigenciaFim">
                Vigência Até <FieldAsterisk type={getAsterisk('vigenciaFim')} />
              </Label>
              <Input
                id="vigenciaFim"
                type="date"
                value={formData.vigenciaFim}
                onChange={(e) => setFormData({ ...formData, vigenciaFim: e.target.value })}
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">
              Descrição <FieldAsterisk type={getAsterisk('descricao')} />
            </Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              placeholder="Descrição da tabela de preço..."
              disabled={readOnly}
            />
          </div>

          {data?.usuarioCadastro && (
            <div className="space-y-2">
              <Label>Usuário de Cadastro</Label>
              <Input value={data.usuarioCadastro} disabled />
            </div>
          )}

          {currentId && (
            <Tabs defaultValue="recursosTecnicos" className="w-full">
              <TabsList>
                <TabsTrigger value="recursosTecnicos">Recursos Técnicos</TabsTrigger>
                <TabsTrigger value="recursosFisicos">Recursos Físicos</TabsTrigger>
              </TabsList>
              <TabsContent value="recursosTecnicos">
                <TabelaPrecoRecursosTecnicosTab
                  tabelaPrecoId={currentId}
                  readOnly={readOnly}
                  moeda={selectedMoeda}
                />
              </TabsContent>
              <TabsContent value="recursosFisicos">
                <TabelaPrecoRecursosFisicosTab
                  tabelaPrecoId={currentId}
                  readOnly={readOnly}
                  moeda={selectedMoeda}
                />
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
            {navigation && <ModalNavigation {...navigation} />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {readOnly ? 'Fechar' : 'Cancelar'}
              </Button>
              {!readOnly && (
                <Button type="submit" className="gradient-primary hover:opacity-90">
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

export default TabelaPrecoFormModal;
