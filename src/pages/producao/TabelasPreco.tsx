import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { TabelaPrecoFormModal } from '@/components/producao/TabelaPrecoFormModal';
import { useAuth } from '@/contexts/AuthContext';

export interface TabelaPrecoItem {
  id: string;
  codigoExterno: string;
  nome: string;
  status: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  descricao: string;
  dataCadastro: string;
  usuarioCadastro: string;
  unidadeNegocioId: string;
  unidadeNegocioNome: string;
  moeda: string;
}

const TabelasPreco = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TabelaPrecoItem | null>(null);
  const [items, setItems] = useState<TabelaPrecoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('tabelas_preco' as any)
        .select('*, unidades_negocio:unidade_negocio_id(id, nome, moeda)')
        .order('nome');

      // Filter by user's allowed unidades de negócio
      if (user?.unidadeIds && user.unidadeIds.length > 0) {
        query = query.in('unidade_negocio_id', user.unidadeIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems((data || []).map((db: any) => ({
        id: db.id,
        codigoExterno: db.codigo_externo || '',
        nome: db.nome,
        status: db.status || 'Ativo',
        vigenciaInicio: db.vigencia_inicio || '',
        vigenciaFim: db.vigencia_fim || '',
        descricao: db.descricao || '',
        dataCadastro: db.created_at ? new Date(db.created_at).toLocaleDateString('pt-BR') : '',
        usuarioCadastro: '',
        unidadeNegocioId: db.unidade_negocio_id || '',
        unidadeNegocioNome: db.unidades_negocio?.nome || '',
        moeda: db.unidades_negocio?.moeda || 'BRL',
      })));
    } catch (error) {
      console.error('Error fetching tabelas_preco:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar tabelas de preço', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    await fetchItems();
    setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir esta tabela de preço?')) {
      try {
        const { error } = await supabase.from('tabelas_preco' as any).delete().eq('id', id);
        if (error) throw error;
        toast({ title: 'Excluído', description: 'Tabela de preço removida com sucesso!' });
        await fetchItems();
      } catch (error) {
        console.error('Error deleting tabela_preco:', error);
        toast({ title: 'Erro', description: 'Erro ao excluir tabela de preço', variant: 'destructive' });
      }
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<TabelaPrecoItem & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: 'Código',
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    { key: 'nome', label: 'Nome' },
    {
      key: 'unidadeNegocioNome',
      label: 'Unidade de Negócio',
      render: (item) => item.unidadeNegocioNome || '-',
    },
    {
      key: 'status',
      label: 'Status',
      className: 'w-24',
      render: (item) => (
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'vigenciaInicio',
      label: 'Vigência De',
      className: 'w-28',
      render: (item) => item.vigenciaInicio ? new Date(item.vigenciaInicio + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
    },
    {
      key: 'vigenciaFim',
      label: 'Vigência Até',
      className: 'w-28',
      render: (item) => item.vigenciaFim ? new Date(item.vigenciaFim + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
    },
    {
      key: 'descricao',
      label: 'Descrição',
      className: 'hidden md:table-cell',
      render: (item) => <span className="text-muted-foreground max-w-xs truncate block">{item.descricao || '-'}</span>,
    },
    { key: 'dataCadastro', label: 'Data Cadastro', className: 'w-32' },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingItem(item); setIsModalOpen(true); }}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Tabelas de Preços" description="Gerencie tabelas de preços para recursos técnicos e físicos" />
      <ListActionBar>
        <NewButton tooltip="Nova Tabela" onClick={() => { setEditingItem(null); setIsModalOpen(true); }} />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} />
      </ListActionBar>
      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filteredItems.length === 0 ? (
          <EmptyState title="Nenhuma tabela de preço cadastrada" description="Comece adicionando tabelas de preços." icon={Settings} onAction={() => setIsModalOpen(true)} actionLabel="Adicionar Tabela" />
        ) : (
          <SortableTable data={filteredItems} columns={columns} getRowKey={(item) => item.id} storageKey="kreato_tabelas_preco_table" />
        )}
      </DataCard>
      <TabelaPrecoFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar('Produção', 'Parametrizações', 'Tabelas de Preços')}
      />
    </div>
  );
};

export default TabelasPreco;
