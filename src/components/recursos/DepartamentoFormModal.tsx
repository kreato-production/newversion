import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Plus, Trash2, Briefcase, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Departamento {
  id?: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  dataCadastro?: string;
  usuarioCadastro?: string;
}

interface Funcao {
  id: string;
  nome: string;
  codigo_externo?: string;
  descricao?: string;
}

interface DepartamentoFuncao {
  id: string;
  funcaoId: string;
  dataAssociacao: string;
}

interface DepartamentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Departamento) => void;
  data?: Departamento | null;
}

const emptyFormData: Departamento = {
  codigoExterno: '',
  nome: '',
  descricao: '',
};

export const DepartamentoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
}: DepartamentoFormModalProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Departamento>(emptyFormData);
  const [isAddingFuncao, setIsAddingFuncao] = useState(false);
  const [selectedFuncaoId, setSelectedFuncaoId] = useState('');
  const [funcoesAssociadas, setFuncoesAssociadas] = useState<DepartamentoFuncao[]>([]);
  const [funcoesCadastradas, setFuncoesCadastradas] = useState<Funcao[]>([]);
  const [isLoadingFuncoes, setIsLoadingFuncoes] = useState(false);

  // Carregar funções do Supabase
  const fetchFuncoes = useCallback(async () => {
    setIsLoadingFuncoes(true);
    try {
      const { data: funcoesData, error } = await supabase
        .from('funcoes')
        .select('id, nome, codigo_externo, descricao')
        .order('nome');

      if (error) throw error;
      setFuncoesCadastradas(funcoesData || []);
    } catch (err) {
      console.error('Erro ao carregar funções:', err);
    } finally {
      setIsLoadingFuncoes(false);
    }
  }, []);

  // Carregar funções associadas ao departamento
  const fetchFuncoesAssociadas = useCallback(async (departamentoId: string) => {
    try {
      const { data: associacoes, error } = await supabase
        .from('departamento_funcoes')
        .select('id, funcao_id, created_at')
        .eq('departamento_id', departamentoId);

      if (error) throw error;

      const mapped: DepartamentoFuncao[] = (associacoes || []).map((a) => ({
        id: a.id,
        funcaoId: a.funcao_id,
        dataAssociacao: a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR') : '',
      }));

      setFuncoesAssociadas(mapped);
    } catch (err) {
      console.error('Erro ao carregar funções associadas:', err);
    }
  }, []);

  // Reset form data when modal opens or data changes
  useEffect(() => {
    if (isOpen) {
      setFormData(data ? { ...data } : { ...emptyFormData });
      setIsAddingFuncao(false);
      setSelectedFuncaoId('');
      
      fetchFuncoes();
      
      if (data?.id) {
        fetchFuncoesAssociadas(data.id);
      } else {
        setFuncoesAssociadas([]);
      }
    }
  }, [isOpen, data, fetchFuncoes, fetchFuncoesAssociadas]);

  // Funções disponíveis para associar (excluindo as já associadas)
  const funcoesDisponiveis = useMemo(() => {
    const associadasIds = funcoesAssociadas.map((fa) => fa.funcaoId);
    return funcoesCadastradas.filter((f) => !associadasIds.includes(f.id));
  }, [funcoesCadastradas, funcoesAssociadas]);

  // Dados para a tabela de funções
  const dadosTabelaFuncoes = useMemo(() => {
    return funcoesAssociadas.map((fa) => {
      const funcao = funcoesCadastradas.find((f) => f.id === fa.funcaoId);
      return {
        id: fa.id,
        funcaoId: fa.funcaoId,
        nome: funcao?.nome || 'Função não encontrada',
        codigoExterno: funcao?.codigo_externo || '-',
        descricao: funcao?.descricao || '-',
        dataAssociacao: fa.dataAssociacao,
      };
    });
  }, [funcoesAssociadas, funcoesCadastradas]);

  const handleAssociarFuncao = async () => {
    if (!selectedFuncaoId) {
      toast({ title: 'Atenção', description: 'Selecione uma função para associar.', variant: 'destructive' });
      return;
    }

    if (!data?.id) {
      toast({ title: 'Atenção', description: 'Salve o departamento antes de associar funções.', variant: 'destructive' });
      return;
    }

    try {
      const { data: insertedData, error } = await supabase
        .from('departamento_funcoes')
        .insert({
          departamento_id: data.id,
          funcao_id: selectedFuncaoId,
        })
        .select()
        .single();

      if (error) throw error;

      const novaAssociacao: DepartamentoFuncao = {
        id: insertedData.id,
        funcaoId: insertedData.funcao_id,
        dataAssociacao: new Date().toLocaleDateString('pt-BR'),
      };

      setFuncoesAssociadas([...funcoesAssociadas, novaAssociacao]);
      toast({ title: 'Sucesso', description: 'Função associada com sucesso!' });
      setSelectedFuncaoId('');
      setIsAddingFuncao(false);
    } catch (err) {
      console.error('Erro ao associar função:', err);
      toast({ title: 'Erro', description: 'Erro ao associar função.', variant: 'destructive' });
    }
  };

  const handleRemoverFuncao = async (id: string) => {
    if (!data?.id) return;
    if (!confirm('Tem certeza que deseja remover esta associação?')) return;

    try {
      const { error } = await supabase
        .from('departamento_funcoes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFuncoesAssociadas(funcoesAssociadas.filter((fa) => fa.id !== id));
      toast({ title: 'Removido', description: 'Associação removida com sucesso!' });
    } catch (err) {
      console.error('Erro ao remover associação:', err);
      toast({ title: 'Erro', description: 'Erro ao remover associação.', variant: 'destructive' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({ title: 'Erro', description: 'Nome é obrigatório.', variant: 'destructive' });
      return;
    }

    onSave({
      ...formData,
      id: data?.id || crypto.randomUUID(),
      dataCadastro: data?.dataCadastro || new Date().toLocaleDateString('pt-BR'),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    onClose();
  };

  const columnsFuncoes: Column<typeof dadosTabelaFuncoes[0] & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: 'Código',
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno}</span>,
    },
    {
      key: 'nome',
      label: 'Função',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <span className="font-medium">{item.nome}</span>
        </div>
      ),
    },
    {
      key: 'descricao',
      label: 'Descrição',
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">{item.descricao}</span>
      ),
    },
    {
      key: 'dataAssociacao',
      label: 'Data Associação',
      className: 'w-32',
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-20 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => handleRemoverFuncao(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[900px] max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? 'Editar Departamento' : 'Novo Departamento'}</DialogTitle>
          <DialogDescription>
            {data ? 'Editar' : 'Cadastrar'} departamento.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoExterno">{t('common.externalCode')}</Label>
              <Input
                id="codigoExterno"
                value={formData.codigoExterno}
                onChange={(e) => setFormData({ ...formData, codigoExterno: e.target.value })}
                maxLength={10}
                placeholder={t('common.maxChars')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">{t('common.name')} <span className="text-destructive">*</span></Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                maxLength={100}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">{t('common.description')}</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </div>

          {/* Tabs - apenas visíveis ao editar */}
          {data && (
            <div className="pt-4 border-t">
              <Tabs defaultValue="funcoes" className="w-full">
                <TabsList>
                  <TabsTrigger value="funcoes" className="gap-2">
                    <Briefcase className="h-4 w-4" />
                    Funções
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="funcoes" className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Funções Associadas</h3>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAddingFuncao(true)}
                      disabled={funcoesDisponiveis.length === 0 || isLoadingFuncoes}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Associar Função
                    </Button>
                  </div>

                  {/* Formulário para adicionar função */}
                  {isAddingFuncao && (
                    <div className="flex gap-2 mb-4 p-3 border rounded-lg bg-muted/30">
                      <Select value={selectedFuncaoId} onValueChange={setSelectedFuncaoId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione uma função..." />
                        </SelectTrigger>
                        <SelectContent>
                          {funcoesDisponiveis.map((funcao) => (
                            <SelectItem key={funcao.id} value={funcao.id}>
                              {funcao.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={handleAssociarFuncao} disabled={!selectedFuncaoId}>
                        Adicionar
                      </Button>
                      <Button type="button" variant="outline" onClick={() => {
                        setIsAddingFuncao(false);
                        setSelectedFuncaoId('');
                      }}>
                        Cancelar
                      </Button>
                    </div>
                  )}

                  {isLoadingFuncoes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : dadosTabelaFuncoes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg bg-muted/20">
                      <Briefcase className="h-10 w-10 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Nenhuma função associada.</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Clique em "Associar Função" para adicionar.
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden max-h-[250px] overflow-y-auto">
                      <SortableTable
                        data={dadosTabelaFuncoes}
                        columns={columnsFuncoes}
                        getRowKey={(item) => item.id}
                        storageKey={`departamento_funcoes_${data.id}`}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="gradient-primary hover:opacity-90">
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DepartamentoFormModal;
