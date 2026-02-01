import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Wrench, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RecursoTecnicoFormModal } from '@/components/recursos/RecursoTecnicoFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type RecursoTecnicoDB = Tables<'recursos_tecnicos'>;

export interface RecursoTecnico {
  id: string;
  codigoExterno: string;
  nome: string;
  funcaoOperador: string;
  funcaoOperadorId?: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

const mapDbToRecursoTecnico = (
  db: RecursoTecnicoDB & { funcoes?: { nome: string } | null }
): RecursoTecnico => ({
  id: db.id,
  codigoExterno: db.codigo_externo || '',
  nome: db.nome,
  funcaoOperador: db.funcoes?.nome || '',
  funcaoOperadorId: db.funcao_operador_id || undefined,
  dataCadastro: db.created_at ? new Date(db.created_at).toLocaleDateString('pt-BR') : '',
  usuarioCadastro: '',
});

const RecursosTecnicos = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecursoTecnico | null>(null);
  const [items, setItems] = useState<RecursoTecnico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecursosTecnicos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('recursos_tecnicos')
        .select('*, funcoes:funcao_operador_id(nome)')
        .order('nome');

      if (error) throw error;
      setItems((data || []).map(mapDbToRecursoTecnico));
    } catch (error) {
      console.error('Error fetching recursos tecnicos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar recursos técnicos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecursosTecnicos();
  }, []);

  const handleSave = async (data: RecursoTecnico) => {
    try {
      const dbData: TablesInsert<'recursos_tecnicos'> = {
        id: data.id || undefined,
        codigo_externo: data.codigoExterno || null,
        nome: data.nome,
        funcao_operador_id: data.funcaoOperadorId || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('recursos_tecnicos')
          .update(dbData as TablesUpdate<'recursos_tecnicos'>)
          .eq('id', data.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Recurso técnico atualizado!' });
      } else {
        const { error } = await supabase.from('recursos_tecnicos').insert(dbData);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Recurso técnico cadastrado!' });
      }

      await fetchRecursosTecnicos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving recurso tecnico:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar recurso técnico', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este recurso técnico?')) {
      try {
        const { error } = await supabase.from('recursos_tecnicos').delete().eq('id', id);
        if (error) throw error;
        toast({ title: 'Excluído', description: 'Recurso técnico removido!' });
        await fetchRecursosTecnicos();
      } catch (error) {
        console.error('Error deleting recurso tecnico:', error);
        toast({ title: 'Erro', description: 'Erro ao excluir recurso técnico', variant: 'destructive' });
      }
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<RecursoTecnico>[] = [
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
      key: 'funcaoOperador',
      label: 'Função Operador',
      render: (item) => item.funcaoOperador || '-',
    },
    {
      key: 'dataCadastro',
      label: 'Data Cadastro',
      className: 'w-32',
    },
    {
      key: 'usuarioCadastro',
      label: 'Usuário',
      className: 'w-32',
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
        title="Recursos Técnicos"
        description="Gerencie os recursos técnicos disponíveis"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Novo Recurso"
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
            title="Nenhum recurso técnico cadastrado"
            description="Adicione recursos técnicos para utilizar nas gravações."
            icon={Wrench}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Recurso"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_recursos_tecnicos_table"
          />
        )}
      </DataCard>

      <RecursoTecnicoFormModal
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

export default RecursosTecnicos;
