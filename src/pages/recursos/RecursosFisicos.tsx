import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { Edit, Trash2, MapPin, Calendar, Loader2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RecursoFisicoFormModal } from '@/components/recursos/RecursoFisicoFormModal';
import { MapaRecursosFisicosModal } from '@/components/recursos/MapaRecursosFisicosModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { EstoqueItem } from '@/components/recursos/EstoqueTab';

type RecursoFisicoDB = Tables<'recursos_fisicos'>;

export interface FaixaDisponibilidade {
  id: string;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: number[];
}

export interface RecursoFisico {
  id: string;
  codigoExterno: string;
  nome: string;
  custoHora: number;
  faixasDisponibilidade: FaixaDisponibilidade[];
  estoqueItens?: EstoqueItem[];
  estoqueCount?: number;
  dataCadastro: string;
  usuarioCadastro: string;
  usuarioCadastroId?: string;
}

const mapDbToRecursoFisico = (
  db: RecursoFisicoDB,
  faixas: FaixaDisponibilidade[] = [],
  estoqueItens: EstoqueItem[] = [],
  usuarioNome: string = ''
): RecursoFisico => ({
  id: db.id,
  codigoExterno: db.codigo_externo || '',
  nome: db.nome,
  custoHora: db.custo_hora || 0,
  faixasDisponibilidade: faixas,
  estoqueItens: estoqueItens,
  estoqueCount: estoqueItens.length,
  dataCadastro: db.created_at ? new Date(db.created_at).toLocaleDateString('pt-BR') : '',
  usuarioCadastro: usuarioNome,
  usuarioCadastroId: db.created_by || undefined,
});

const RecursosFisicos = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapaOpen, setIsMapaOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecursoFisico | null>(null);
  const [items, setItems] = useState<RecursoFisico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecursosFisicos = async () => {
    setIsLoading(true);
    try {
      const { data: recursosData, error: recursosError } = await supabase
        .from('recursos_fisicos')
        .select('*')
        .order('nome');

      if (recursosError) throw recursosError;

      // Fetch profiles to get user names
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nome');
      
      const profilesMap = new Map<string, string>();
      (profilesData || []).forEach(p => profilesMap.set(p.id, p.nome));

      const recursosWithFaixas = await Promise.all(
        (recursosData || []).map(async (rf) => {
          // Fetch faixas
          const { data: faixasData } = await supabase
            .from('rf_faixas_disponibilidade')
            .select('*')
            .eq('recurso_fisico_id', rf.id);

          const faixas: FaixaDisponibilidade[] = (faixasData || []).map((f) => ({
            id: f.id,
            dataInicio: f.data_inicio,
            dataFim: f.data_fim,
            horaInicio: f.hora_inicio,
            horaFim: f.hora_fim,
            diasSemana: f.dias_semana || [1, 2, 3, 4, 5],
          }));

          // Fetch estoque items
          const { data: estoqueData } = await supabase
            .from('rf_estoque_itens')
            .select('*')
            .eq('recurso_fisico_id', rf.id)
            .order('numerador');

          const estoqueItens: EstoqueItem[] = (estoqueData || []).map(item => ({
            id: item.id,
            numerador: item.numerador,
            codigo: item.codigo || '',
            nome: item.nome,
            descricao: item.descricao || '',
            imagemUrl: item.imagem_url || '',
          }));

          const usuarioNome = rf.created_by ? profilesMap.get(rf.created_by) || '' : '';

          return mapDbToRecursoFisico(rf, faixas, estoqueItens, usuarioNome);
        })
      );

      setItems(recursosWithFaixas);
    } catch (error) {
      console.error('Error fetching recursos fisicos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar recursos físicos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecursosFisicos();
  }, []);

  const handleSave = async (data: RecursoFisico) => {
    try {
      // Get current user ID
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const dbData: TablesInsert<'recursos_fisicos'> = {
        id: data.id || undefined,
        codigo_externo: data.codigoExterno || null,
        nome: data.nome,
        custo_hora: data.custoHora || 0,
        created_by: editingItem ? editingItem.usuarioCadastroId : currentUser?.id,
      };

      let recursoId = data.id;

      if (editingItem) {
        const { error } = await supabase
          .from('recursos_fisicos')
          .update(dbData as TablesUpdate<'recursos_fisicos'>)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase
          .from('recursos_fisicos')
          .insert(dbData)
          .select()
          .single();
        if (error) throw error;
        recursoId = inserted.id;
      }

      // Handle faixas de disponibilidade
      if (data.faixasDisponibilidade) {
        await supabase.from('rf_faixas_disponibilidade').delete().eq('recurso_fisico_id', recursoId);
        if (data.faixasDisponibilidade.length > 0) {
          const faixasData = data.faixasDisponibilidade.map((f) => ({
            recurso_fisico_id: recursoId,
            data_inicio: f.dataInicio,
            data_fim: f.dataFim,
            hora_inicio: f.horaInicio,
            hora_fim: f.horaFim,
            dias_semana: f.diasSemana,
          }));
          await supabase.from('rf_faixas_disponibilidade').insert(faixasData);
        }
      }

      // Handle estoque items
      if (data.estoqueItens) {
        await supabase.from('rf_estoque_itens').delete().eq('recurso_fisico_id', recursoId);
        if (data.estoqueItens.length > 0) {
          const estoqueData = data.estoqueItens.map((item) => ({
            recurso_fisico_id: recursoId,
            numerador: item.numerador,
            codigo: item.codigo || null,
            nome: item.nome,
            descricao: item.descricao || null,
            imagem_url: item.imagemUrl || null,
            created_by: currentUser?.id,
          }));
          await supabase.from('rf_estoque_itens').insert(estoqueData);
        }
      }

      toast({ title: 'Sucesso', description: editingItem ? 'Recurso físico atualizado!' : 'Recurso físico cadastrado!' });
      await fetchRecursosFisicos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving recurso fisico:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar recurso físico', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este recurso físico?')) {
      try {
        const { error } = await supabase.from('recursos_fisicos').delete().eq('id', id);
        if (error) throw error;
        toast({ title: 'Excluído', description: 'Recurso físico removido!' });
        await fetchRecursosFisicos();
      } catch (error) {
        console.error('Error deleting recurso fisico:', error);
        toast({ title: 'Erro', description: 'Erro ao excluir recurso físico', variant: 'destructive' });
      }
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<RecursoFisico>[] = [
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
      key: 'custoHora',
      label: 'Custo/Hora',
      className: 'w-32',
      render: (item) => formatCurrency(item.custoHora),
    },
    {
      key: 'estoqueCount',
      label: 'Estoque',
      className: 'w-24',
      render: (item) => (
        <div className="flex items-center gap-1">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span>{item.estoqueCount || 0}</span>
        </div>
      ),
    },
    {
      key: 'dataCadastro',
      label: 'Data Cadastro',
      className: 'w-32',
    },
    {
      key: 'usuarioCadastro',
      label: 'Usuário',
      className: 'w-40',
      render: (item) => (
        <span className="text-muted-foreground">{item.usuarioCadastro || '-'}</span>
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
        title="Recursos Físicos"
        description="Gerencie os recursos físicos (espaços, estúdios, etc.)"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Novo Recurso"
      >
        <Button
          variant="outline"
          onClick={() => setIsMapaOpen(true)}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Mapa de Disponibilidade
        </Button>
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhum recurso físico cadastrado"
            description="Adicione recursos físicos como estúdios e salas."
            icon={MapPin}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Recurso"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_recursos_fisicos_table"
          />
        )}
      </DataCard>

      <RecursoFisicoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
      />

      <MapaRecursosFisicosModal
        isOpen={isMapaOpen}
        onClose={() => setIsMapaOpen(false)}
        recursos={items}
      />
    </div>
  );
};

export default RecursosFisicos;
