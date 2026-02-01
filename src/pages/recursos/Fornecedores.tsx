import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Truck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FornecedorFormModal } from '@/components/recursos/FornecedorFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type FornecedorDB = Tables<'fornecedores'>;

export interface Fornecedor {
  id: string;
  codigoExterno: string;
  nome: string;
  categoria: string;
  categoriaId?: string;
  email: string;
  pais: string;
  identificacaoFiscal: string;
  descricao: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

const mapDbToFornecedor = (
  db: FornecedorDB & { categorias_fornecedor?: { nome: string } | null }
): Fornecedor => ({
  id: db.id,
  codigoExterno: db.codigo_externo || '',
  nome: db.nome,
  categoria: db.categorias_fornecedor?.nome || '',
  categoriaId: db.categoria_id || undefined,
  email: db.email || '',
  pais: db.pais || '',
  identificacaoFiscal: db.identificacao_fiscal || '',
  descricao: db.descricao || '',
  dataCadastro: db.created_at ? new Date(db.created_at).toLocaleDateString('pt-BR') : '',
  usuarioCadastro: '',
});

const Fornecedores = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Fornecedor | null>(null);
  const [items, setItems] = useState<Fornecedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFornecedores = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*, categorias_fornecedor:categoria_id(nome)')
        .order('nome');

      if (error) throw error;
      setItems((data || []).map(mapDbToFornecedor));
    } catch (error) {
      console.error('Error fetching fornecedores:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar fornecedores', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, []);

  const handleSave = async (data: Fornecedor) => {
    try {
      const dbData: TablesInsert<'fornecedores'> = {
        id: data.id || undefined,
        codigo_externo: data.codigoExterno || null,
        nome: data.nome,
        categoria_id: data.categoriaId || null,
        email: data.email || null,
        pais: data.pais || null,
        identificacao_fiscal: data.identificacaoFiscal || null,
        descricao: data.descricao || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('fornecedores')
          .update(dbData as TablesUpdate<'fornecedores'>)
          .eq('id', data.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Fornecedor atualizado!' });
      } else {
        const { error } = await supabase.from('fornecedores').insert(dbData);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Fornecedor cadastrado!' });
      }

      await fetchFornecedores();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving fornecedor:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar fornecedor', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este fornecedor?')) {
      try {
        const { error } = await supabase.from('fornecedores').delete().eq('id', id);
        if (error) throw error;
        toast({ title: 'Excluído', description: 'Fornecedor removido!' });
        await fetchFornecedores();
      } catch (error) {
        console.error('Error deleting fornecedor:', error);
        toast({ title: 'Erro', description: 'Erro ao excluir fornecedor', variant: 'destructive' });
      }
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Fornecedor>[] = [
    {
      key: 'codigoExterno',
      label: 'Código',
      className: 'w-24',
      render: (item) => (
        <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>
      ),
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'categoria',
      label: 'Categoria',
      render: (item) => item.categoria || '-',
    },
    {
      key: 'email',
      label: 'E-mail',
    },
    {
      key: 'pais',
      label: 'País',
      render: (item) => item.pais || '-',
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
        title="Fornecedores"
        description="Gerencie os fornecedores de serviços"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Novo Fornecedor"
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
            title="Nenhum fornecedor cadastrado"
            description="Adicione fornecedores para gerenciar parcerias."
            icon={Truck}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Fornecedor"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_fornecedores_table"
          />
        )}
      </DataCard>

      <FornecedorFormModal
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

export default Fornecedores;
