import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Funcao {
  id: string;
  nome: string;
  codigoExterno?: string;
  descricao?: string;
}

interface DepartamentoFuncao {
  id: string;
  funcaoId: string;
  dataAssociacao: string;
}

interface DepartamentoFuncoesTabProps {
  departamentoId: string;
}

const DepartamentoFuncoesTab = ({ departamentoId }: DepartamentoFuncoesTabProps) => {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFuncaoId, setSelectedFuncaoId] = useState('');

  // Carregar funções cadastradas no sistema
  const funcoesCadastradas = useMemo(() => {
    const stored = localStorage.getItem('kreato_funcoes');
    return stored ? JSON.parse(stored) : [];
  }, []);

  // Carregar funções associadas ao departamento
  const [funcoesAssociadas, setFuncoesAssociadas] = useState<DepartamentoFuncao[]>(() => {
    const stored = localStorage.getItem(`kreato_departamento_funcoes_${departamentoId}`);
    return stored ? JSON.parse(stored) : [];
  });

  const saveToStorage = (data: DepartamentoFuncao[]) => {
    localStorage.setItem(`kreato_departamento_funcoes_${departamentoId}`, JSON.stringify(data));
    setFuncoesAssociadas(data);
  };

  // Funções disponíveis para associar (excluindo as já associadas)
  const funcoesDisponiveis = useMemo(() => {
    const associadasIds = funcoesAssociadas.map((fa) => fa.funcaoId);
    return funcoesCadastradas.filter((f: Funcao) => !associadasIds.includes(f.id));
  }, [funcoesCadastradas, funcoesAssociadas]);

  // Dados para a tabela
  const dadosTabela = useMemo(() => {
    return funcoesAssociadas.map((fa) => {
      const funcao = funcoesCadastradas.find((f: Funcao) => f.id === fa.funcaoId);
      return {
        id: fa.id,
        funcaoId: fa.funcaoId,
        nome: funcao?.nome || 'Função não encontrada',
        codigoExterno: funcao?.codigoExterno || '-',
        descricao: funcao?.descricao || '-',
        dataAssociacao: fa.dataAssociacao,
      };
    });
  }, [funcoesAssociadas, funcoesCadastradas]);

  const handleAssociar = () => {
    if (!selectedFuncaoId) {
      toast({ title: 'Atenção', description: 'Selecione uma função para associar.', variant: 'destructive' });
      return;
    }

    const novaAssociacao: DepartamentoFuncao = {
      id: crypto.randomUUID(),
      funcaoId: selectedFuncaoId,
      dataAssociacao: new Date().toLocaleDateString('pt-BR'),
    };

    saveToStorage([...funcoesAssociadas, novaAssociacao]);
    toast({ title: 'Sucesso', description: 'Função associada com sucesso!' });
    setSelectedFuncaoId('');
    setIsModalOpen(false);
  };

  const handleRemover = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta associação?')) {
      saveToStorage(funcoesAssociadas.filter((fa) => fa.id !== id));
      toast({ title: 'Removido', description: 'Associação removida com sucesso!' });
    }
  };

  const columns: Column<typeof dadosTabela[0] & { actions?: never }>[] = [
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
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => handleRemover(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Funções Associadas</h3>
        <Button onClick={() => setIsModalOpen(true)} size="sm" disabled={funcoesDisponiveis.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Associar Função
        </Button>
      </div>

      {dadosTabela.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Nenhuma função associada</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Clique em "Associar Função" para adicionar funções a este departamento.
          </p>
        </div>
      ) : (
        <SortableTable
          data={dadosTabela}
          columns={columns}
          getRowKey={(item) => item.id}
          storageKey={`departamento_funcoes_${departamentoId}`}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Associar Função</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={selectedFuncaoId} onValueChange={setSelectedFuncaoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função..." />
                </SelectTrigger>
                <SelectContent>
                  {funcoesDisponiveis.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Todas as funções já estão associadas
                    </div>
                  ) : (
                    funcoesDisponiveis.map((funcao: Funcao) => (
                      <SelectItem key={funcao.id} value={funcao.id}>
                        {funcao.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAssociar} disabled={!selectedFuncaoId}>
                Associar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartamentoFuncoesTab;
