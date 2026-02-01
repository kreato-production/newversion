import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Users, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PessoaFormModal } from '@/components/recursos/PessoaFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type PessoaDB = Tables<'pessoas'>;

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
  classificacaoId?: string;
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

const mapDbToPessoa = (db: PessoaDB & { classificacoes_pessoa?: { nome: string } | null }): Pessoa => ({
  id: db.id,
  codigoExterno: db.codigo_externo || '',
  nome: db.nome,
  sobrenome: db.sobrenome,
  nomeTrabalho: db.nome_trabalho || '',
  foto: db.foto_url || undefined,
  dataNascimento: db.data_nascimento || '',
  sexo: db.sexo || '',
  telefone: db.telefone || '',
  email: db.email || '',
  classificacao: db.classificacoes_pessoa?.nome || '',
  classificacaoId: db.classificacao_id || undefined,
  documento: db.documento || '',
  endereco: db.endereco || '',
  cidade: db.cidade || '',
  estado: db.estado || '',
  cep: db.cep || '',
  observacoes: db.observacoes || '',
  status: db.status || 'Ativo',
  dataCadastro: db.created_at ? new Date(db.created_at).toLocaleDateString('pt-BR') : '',
  usuarioCadastro: '',
});

const Pessoas = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pessoa | null>(null);
  const [items, setItems] = useState<Pessoa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPessoas = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pessoas')
        .select('*, classificacoes_pessoa:classificacao_id(nome)')
        .order('nome');

      if (error) throw error;
      setItems((data || []).map(mapDbToPessoa));
    } catch (error) {
      console.error('Error fetching pessoas:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar pessoas', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPessoas();
  }, []);

  const handleSave = async (data: Pessoa) => {
    try {
      const dbData: TablesInsert<'pessoas'> = {
        id: data.id || undefined,
        codigo_externo: data.codigoExterno || null,
        nome: data.nome,
        sobrenome: data.sobrenome,
        nome_trabalho: data.nomeTrabalho || null,
        foto_url: data.foto || null,
        data_nascimento: data.dataNascimento || null,
        sexo: data.sexo as 'Masculino' | 'Feminino' | 'Outro' | null,
        telefone: data.telefone || null,
        email: data.email || null,
        classificacao_id: data.classificacaoId || null,
        documento: data.documento || null,
        endereco: data.endereco || null,
        cidade: data.cidade || null,
        estado: data.estado || null,
        cep: data.cep || null,
        observacoes: data.observacoes || null,
        status: data.status as 'Ativo' | 'Inativo',
      };

      if (editingItem) {
        const { error } = await supabase
          .from('pessoas')
          .update(dbData as TablesUpdate<'pessoas'>)
          .eq('id', data.id);

        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Pessoa atualizada!' });
      } else {
        const { error } = await supabase.from('pessoas').insert(dbData);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Pessoa cadastrada!' });
      }

      await fetchPessoas();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving pessoa:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar pessoa', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta pessoa?')) {
      try {
        const { error } = await supabase.from('pessoas').delete().eq('id', id);
        if (error) throw error;
        toast({ title: 'Excluído', description: 'Pessoa removida!' });
        await fetchPessoas();
      } catch (error) {
        console.error('Error deleting pessoa:', error);
        toast({ title: 'Erro', description: 'Erro ao excluir pessoa', variant: 'destructive' });
      }
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
      />

      <ListActionBar>
        <SearchBar value={search} onChange={setSearch} />
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
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
