import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { Edit, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PessoaFormModal } from '@/components/recursos/PessoaFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';

export interface Pessoa {
  id: string;
  codigoExterno: string;
  nome: string;
  sobrenome: string;
  nomeTrabalho: string;
  foto?: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  email: string;
  classificacao: string;
  documento: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  observacoes: string;
  status: 'Ativo' | 'Inativo';
  dataCadastro: string;
  usuarioCadastro: string;
}

const Pessoas = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pessoa | null>(null);
  const [items, setItems] = useState<Pessoa[]>(() => {
    const stored = localStorage.getItem('kreato_pessoas');
    return stored ? JSON.parse(stored) : [];
  });

  const saveToStorage = (data: Pessoa[]) => {
    localStorage.setItem('kreato_pessoas', JSON.stringify(data));
    setItems(data);
  };

  const handleSave = (data: Pessoa) => {
    if (editingItem) {
      const updated = items.map((item) => (item.id === data.id ? data : item));
      saveToStorage(updated);
      toast({ title: 'Sucesso', description: 'Pessoa atualizada!' });
    } else {
      saveToStorage([...items, data]);
      toast({ title: 'Sucesso', description: 'Pessoa cadastrada!' });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir esta pessoa?')) {
      saveToStorage(items.filter((item) => item.id !== id));
      toast({ title: 'Excluído', description: 'Pessoa removida!' });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.sobrenome.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.classificacao?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Pessoa>[] = [
    {
      key: 'foto',
      label: '',
      className: 'w-12',
      sortable: false,
      render: (item) => (
        <Avatar className="w-8 h-8">
          <AvatarImage src={item.foto} />
          <AvatarFallback className="text-xs gradient-brand text-primary-foreground">
            {item.nome.charAt(0)}{item.sobrenome.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => (
        <span className="font-medium">{item.nome} {item.sobrenome}</span>
      ),
    },
    {
      key: 'email',
      label: 'E-mail',
    },
    {
      key: 'telefone',
      label: 'Telefone',
      render: (item) => item.telefone || '-',
    },
    {
      key: 'classificacao',
      label: 'Classificação',
      render: (item) => item.classificacao || '-',
    },
    {
      key: 'cidade',
      label: 'Cidade/Estado',
      render: (item) => item.cidade && item.estado ? `${item.cidade}/${item.estado}` : '-',
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
        title="Pessoas"
        description="Gerencie as pessoas cadastradas no sistema"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Nova Pessoa"
      >
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhuma pessoa cadastrada"
            description="Adicione pessoas para gerenciar seu cadastro."
            icon={Users}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Pessoa"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_pessoas_table"
          />
        )}
      </DataCard>

      <PessoaFormModal
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

export default Pessoas;
