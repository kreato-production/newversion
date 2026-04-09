import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Plus, Trash2, Briefcase, Loader2 } from 'lucide-react';
import {
  ApiDepartamentosRepository,
  type DepartamentoFuncaoApiItem,
  type FuncaoApiItem,
} from '@/modules/departamentos/departamentos.api.repository';

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
  onSave: (data: Departamento) => Promise<void>;
  data?: Departamento | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

const emptyFormData: Departamento = {
  codigoExterno: '',
  nome: '',
  descricao: '',
};

const apiRepository = new ApiDepartamentosRepository();

function mapFuncaoFromApi(item: FuncaoApiItem): Funcao {
  return {
    id: item.id,
    nome: item.nome,
    codigo_externo: item.codigoExterno,
    descricao: item.descricao,
  };
}

function mapAssociacaoFromApi(item: DepartamentoFuncaoApiItem): DepartamentoFuncao {
  return {
    id: item.id,
    funcaoId: item.funcaoId,
    dataAssociacao: item.dataAssociacao
      ? new Date(item.dataAssociacao).toLocaleDateString('pt-BR')
      : '',
  };
}

export const DepartamentoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
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

  const fetchFuncoes = useCallback(async () => {
    setIsLoadingFuncoes(true);
    try {
      if (!data?.id) {
        setFuncoesCadastradas([]);
        setFuncoesAssociadas([]);
        return;
      }

      const response = await apiRepository.listFuncoes(data.id);
      setFuncoesCadastradas(response.cadastradas.map(mapFuncaoFromApi));
      setFuncoesAssociadas(response.associadas.map(mapAssociacaoFromApi));
    } catch (err) {
      console.error('Erro ao carregar funcoes:', err);
    } finally {
      setIsLoadingFuncoes(false);
    }
  }, [data?.id]);

  const fetchFuncoesAssociadas = useCallback(async (departamentoId: string) => {
    try {
      const response = await apiRepository.listFuncoes(departamentoId);
      setFuncoesCadastradas(response.cadastradas.map(mapFuncaoFromApi));
      setFuncoesAssociadas(response.associadas.map(mapAssociacaoFromApi));
    } catch (err) {
      console.error('Erro ao carregar funcoes associadas:', err);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setFormData(data ? { ...data } : { ...emptyFormData });
    setIsAddingFuncao(false);
    setSelectedFuncaoId('');
    void fetchFuncoes();

    if (data?.id) {
      void fetchFuncoesAssociadas(data.id);
    } else {
      setFuncoesAssociadas([]);
    }
  }, [isOpen, data, fetchFuncoes, fetchFuncoesAssociadas]);

  const funcoesDisponiveis = useMemo(() => {
    const associadasIds = funcoesAssociadas.map((item) => item.funcaoId);
    return funcoesCadastradas.filter((funcao) => !associadasIds.includes(funcao.id));
  }, [funcoesAssociadas, funcoesCadastradas]);

  const dadosTabelaFuncoes = useMemo(
    () =>
      funcoesAssociadas.map((associacao) => {
        const funcao = funcoesCadastradas.find((item) => item.id === associacao.funcaoId);
        return {
          id: associacao.id,
          funcaoId: associacao.funcaoId,
          nome: funcao?.nome || 'Funcao nao encontrada',
          codigoExterno: funcao?.codigo_externo || '-',
          descricao: funcao?.descricao || '-',
          dataAssociacao: associacao.dataAssociacao,
        };
      }),
    [funcoesAssociadas, funcoesCadastradas],
  );

  const handleAssociarFuncao = async () => {
    if (!selectedFuncaoId) {
      toast({
        title: 'Atencao',
        description: 'Selecione uma funcao para associar.',
        variant: 'destructive',
      });
      return;
    }

    if (!data?.id) {
      toast({
        title: 'Atencao',
        description: 'Salve o departamento antes de associar funcoes.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await apiRepository.addFuncao(data.id, selectedFuncaoId);
      await fetchFuncoesAssociadas(data.id);

      toast({ title: 'Sucesso', description: 'Funcao associada com sucesso!' });
      setSelectedFuncaoId('');
      setIsAddingFuncao(false);
    } catch (err) {
      console.error('Erro ao associar funcao:', err);
      toast({ title: 'Erro', description: 'Erro ao associar funcao.', variant: 'destructive' });
    }
  };

  const handleRemoverFuncao = async (id: string) => {
    if (!data?.id) return;
    if (!confirm('Tem certeza que deseja remover esta associacao?')) return;

    try {
      await apiRepository.removeFuncao(data.id, id);
      await fetchFuncoesAssociadas(data.id);

      toast({ title: 'Removido', description: 'Associacao removida com sucesso!' });
    } catch (err) {
      console.error('Erro ao remover associacao:', err);
      toast({ title: 'Erro', description: 'Erro ao remover associacao.', variant: 'destructive' });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.nome.trim()) {
      toast({ title: 'Erro', description: 'Nome e obrigatorio.', variant: 'destructive' });
      return;
    }

    await onSave({
      ...formData,
      ...(data?.id ? { id: data.id } : {}),
      ...(data?.dataCadastro ? { dataCadastro: data.dataCadastro } : {}),
      usuarioCadastro: data?.usuarioCadastro || user?.nome || 'Admin',
    });
    onClose();
  };

  const columnsFuncoes: Column<(typeof dadosTabelaFuncoes)[number] & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: 'Codigo',
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno}</span>,
    },
    {
      key: 'nome',
      label: 'Funcao',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <span className="font-medium">{item.nome}</span>
        </div>
      ),
    },
    {
      key: 'descricao',
      label: 'Descricao',
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">{item.descricao}</span>
      ),
    },
    {
      key: 'dataAssociacao',
      label: 'Data Associacao',
      className: 'w-32',
    },
    {
      key: 'actions',
      label: 'Acoes',
      className: 'w-20 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => void handleRemoverFuncao(item.id)}
            disabled={readOnly}
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
          <DialogDescription>{data ? 'Editar' : 'Cadastrar'} departamento.</DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigoExterno">{t('common.externalCode')}</Label>
              <Input
                id="codigoExterno"
                value={formData.codigoExterno}
                onChange={(event) =>
                  setFormData({ ...formData, codigoExterno: event.target.value })
                }
                maxLength={10}
                placeholder={t('common.maxChars')}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">
                {t('common.name')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(event) => setFormData({ ...formData, nome: event.target.value })}
                maxLength={100}
                required
                disabled={readOnly}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">{t('common.description')}</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(event) => setFormData({ ...formData, descricao: event.target.value })}
              rows={3}
              disabled={readOnly}
            />
          </div>

          {data && (
            <div className="pt-4 border-t">
              <Tabs defaultValue="funcoes" className="w-full">
                <TabsList>
                  <TabsTrigger value="funcoes" className="gap-2">
                    <Briefcase className="h-4 w-4" />
                    Funcoes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="funcoes" className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Funcoes Associadas</h3>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsAddingFuncao(true)}
                      disabled={readOnly || funcoesDisponiveis.length === 0 || isLoadingFuncoes}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Associar Funcao
                    </Button>
                  </div>

                  {isAddingFuncao && (
                    <div className="flex gap-2 mb-4 p-3 border rounded-lg bg-muted/30">
                      <Select value={selectedFuncaoId} onValueChange={setSelectedFuncaoId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione uma funcao..." />
                        </SelectTrigger>
                        <SelectContent>
                          {funcoesDisponiveis.map((funcao) => (
                            <SelectItem key={funcao.id} value={funcao.id}>
                              {funcao.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={() => void handleAssociarFuncao()}
                        disabled={!selectedFuncaoId}
                      >
                        Adicionar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddingFuncao(false);
                          setSelectedFuncaoId('');
                        }}
                      >
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
                      <p className="text-muted-foreground">Nenhuma funcao associada.</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Clique em "Associar Funcao" para adicionar.
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

          <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
            {navigation && <ModalNavigation {...navigation} />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {readOnly ? 'Fechar' : t('common.cancel')}
              </Button>
              {!readOnly && (
                <Button type="submit" className="gradient-primary hover:opacity-90">
                  {t('common.save')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DepartamentoFormModal;
