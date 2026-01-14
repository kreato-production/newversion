import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { Edit, Trash2, Users, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RecursoHumanoFormModal } from '@/components/recursos/RecursoHumanoFormModal';
import { parseISO, isWithinInterval, startOfDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SortableTable, Column } from '@/components/shared/SortableTable';

export interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  dataUrl: string;
}

export interface Ausencia {
  id: string;
  motivo: 'Férias' | 'Folga' | 'Licença Maternidade' | 'Licença Paternidade' | 'Curso Externo' | 'Viagem de Trabalho';
  dataInicio: string;
  dataFim: string;
  dias: number;
}

export interface RecursoHumano {
  id: string;
  codigoExterno: string;
  nome: string;
  sobrenome: string;
  foto?: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  email: string;
  departamento: string;
  funcao: string;
  custoHora: number;
  dataContratacao: string;
  status: 'Ativo' | 'Inativo';
  dataCadastro: string;
  usuarioCadastro: string;
  anexos?: Anexo[];
  ausencias?: Ausencia[];
}

const RecursosHumanos = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecursoHumano | null>(null);
  const [items, setItems] = useState<RecursoHumano[]>(() => {
    const stored = localStorage.getItem('kreato_recursos_humanos');
    return stored ? JSON.parse(stored) : [];
  });

  const saveToStorage = (data: RecursoHumano[]) => {
    localStorage.setItem('kreato_recursos_humanos', JSON.stringify(data));
    setItems(data);
  };

  const handleSave = (data: RecursoHumano) => {
    if (editingItem) {
      const updated = items.map((item) => (item.id === data.id ? data : item));
      saveToStorage(updated);
      toast({ title: 'Sucesso', description: 'Colaborador atualizado!' });
    } else {
      saveToStorage([...items, data]);
      toast({ title: 'Sucesso', description: 'Colaborador cadastrado!' });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este colaborador?')) {
      saveToStorage(items.filter((item) => item.id !== id));
      toast({ title: 'Excluído', description: 'Colaborador removido!' });
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.sobrenome.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase())
  );

  const hoje = useMemo(() => startOfDay(new Date()), []);

  const getAusenciaHoje = (item: RecursoHumano) => {
    if (!item.ausencias || item.ausencias.length === 0) return null;
    
    return item.ausencias.find((ausencia) => {
      const inicio = startOfDay(parseISO(ausencia.dataInicio));
      const fim = startOfDay(parseISO(ausencia.dataFim));
      return isWithinInterval(hoje, { start: inicio, end: fim });
    });
  };

  const columns: Column<RecursoHumano>[] = [
    {
      key: 'foto',
      label: '',
      className: 'w-12',
      sortable: false,
      render: (item) => {
        const ausenciaHoje = getAusenciaHoje(item);
        return (
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarImage src={item.foto} />
              <AvatarFallback className="text-xs gradient-brand text-primary-foreground">
                {item.nome.charAt(0)}{item.sobrenome.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {ausenciaHoje && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <UserX className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => {
        const ausenciaHoje = getAusenciaHoje(item);
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.nome} {item.sobrenome}</span>
            {ausenciaHoje && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                      {ausenciaHoje.motivo}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ausente hoje: {ausenciaHoje.motivo}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    {
      key: 'email',
      label: 'E-mail',
    },
    {
      key: 'departamento',
      label: 'Departamento',
      render: (item) => item.departamento || '-',
    },
    {
      key: 'funcao',
      label: 'Função',
      render: (item) => item.funcao || '-',
    },
    {
      key: 'custoHora',
      label: 'Custo/Hora',
      render: (item) => formatCurrency(item.custoHora),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'acoes',
      label: 'Ações',
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Recursos Humanos"
        description="Gerencie os colaboradores da organização"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Novo Colaborador"
      >
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhum colaborador cadastrado"
            description="Adicione colaboradores para gerenciar sua equipe."
            icon={Users}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Colaborador"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_recursos_humanos_table"
          />
        )}
      </DataCard>

      <RecursoHumanoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
      />
    </div>
  );
};

export default RecursosHumanos;
