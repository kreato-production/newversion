import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { Edit, Trash2, Film, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConteudoFormModal } from '@/components/producao/ConteudoFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type ConteudoDB = Tables<'conteudos'>;

// Helper function to generate content code (for backwards compatibility)
export const generateCodigoConteudo = (): string => {
  const currentYear = new Date().getFullYear();
  const yearSuffix = String(currentYear).slice(-2);
  const timestamp = Date.now().toString().slice(-5);
  return `CNT-${timestamp}-${yearSuffix}`;
};

export interface Conteudo {
  id: string;
  codigoExterno: string;
  descricao: string;
  quantidadeEpisodios: number;
  centroLucro: string;
  centroLucroId?: string;
  unidadeNegocio: string;
  unidadeNegocioId?: string;
  tipoConteudo: string;
  tipoConteudoId?: string;
  classificacao: string;
  classificacaoId?: string;
  anoProducao: string;
  sinopse: string;
  usuarioCadastro: string;
  dataCadastro: string;
}

const mapDbToConteudo = (
  db: ConteudoDB & {
    centros_lucro?: { nome: string } | null;
    unidades_negocio?: { nome: string } | null;
    tipos_gravacao?: { nome: string } | null;
    classificacoes?: { nome: string } | null;
  }
): Conteudo => ({
  id: db.id,
  codigoExterno: db.codigo_externo || '',
  descricao: db.descricao,
  quantidadeEpisodios: db.quantidade_episodios || 0,
  centroLucro: db.centros_lucro?.nome || '',
  centroLucroId: db.centro_lucro_id || undefined,
  unidadeNegocio: db.unidades_negocio?.nome || '',
  unidadeNegocioId: db.unidade_negocio_id || undefined,
  tipoConteudo: db.tipos_gravacao?.nome || '',
  tipoConteudoId: db.tipo_conteudo_id || undefined,
  classificacao: db.classificacoes?.nome || '',
  classificacaoId: db.classificacao_id || undefined,
  anoProducao: db.ano_producao || '',
  sinopse: db.sinopse || '',
  usuarioCadastro: '',
  dataCadastro: db.created_at ? new Date(db.created_at).toLocaleDateString('pt-BR') : '',
});

const Conteudo = () => {
  const { toast } = useToast();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  
  const podeIncluir = canIncluir('Produção', 'Conteúdo');
  const podeAlterar = canAlterar('Produção', 'Conteúdo');
  const podeExcluir = canExcluir('Produção', 'Conteúdo');
  
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Conteudo | null>(null);
  const [items, setItems] = useState<Conteudo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConteudos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conteudos')
        .select(`
          *,
          centros_lucro:centro_lucro_id(nome),
          unidades_negocio:unidade_negocio_id(nome),
          tipos_gravacao:tipo_conteudo_id(nome),
          classificacoes:classificacao_id(nome)
        `)
        .order('descricao');

      if (error) throw error;
      setItems((data || []).map(mapDbToConteudo));
    } catch (error) {
      console.error('Error fetching conteudos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar conteúdos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConteudos();
  }, []);

  const handleSave = async (data: Conteudo) => {
    try {
      const dbData: TablesInsert<'conteudos'> = {
        id: data.id || undefined,
        codigo_externo: data.codigoExterno || null,
        descricao: data.descricao,
        quantidade_episodios: data.quantidadeEpisodios || 0,
        centro_lucro_id: data.centroLucroId || null,
        unidade_negocio_id: data.unidadeNegocioId || null,
        tipo_conteudo_id: data.tipoConteudoId || null,
        classificacao_id: data.classificacaoId || null,
        ano_producao: data.anoProducao || null,
        sinopse: data.sinopse || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('conteudos')
          .update(dbData as TablesUpdate<'conteudos'>)
          .eq('id', data.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Conteúdo atualizado!' });
      } else {
        const { error } = await supabase.from('conteudos').insert(dbData);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Conteúdo cadastrado!' });
      }

      await fetchConteudos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving conteudo:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar conteúdo', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    // Check if has associated recordings with resources
    try {
      const { data: gravacoes } = await supabase
        .from('gravacoes')
        .select('id')
        .eq('conteudo_id', id);

      if (gravacoes && gravacoes.length > 0) {
        const gravacaoIds = gravacoes.map(g => g.id);
        
        const { data: recursos } = await supabase
          .from('gravacao_recursos')
          .select('id')
          .in('gravacao_id', gravacaoIds)
          .limit(1);

        const { data: terceiros } = await supabase
          .from('gravacao_terceiros')
          .select('id')
          .in('gravacao_id', gravacaoIds)
          .limit(1);

        if ((recursos && recursos.length > 0) || (terceiros && terceiros.length > 0)) {
          toast({
            title: 'Exclusão não permitida',
            description: 'Este conteúdo possui gravações com recursos, técnicos, físicos ou terceiros associados.',
            variant: 'destructive',
          });
          return;
        }
      }

      if (confirm('Deseja realmente excluir este conteúdo? Todas as gravações associadas também serão removidas.')) {
        // Delete associated gravações first
        await supabase.from('gravacoes').delete().eq('conteudo_id', id);
        
        const { error } = await supabase.from('conteudos').delete().eq('id', id);
        if (error) throw error;
        toast({ title: 'Excluído', description: 'Conteúdo e gravações associadas removidos!' });
        await fetchConteudos();
      }
    } catch (error) {
      console.error('Error deleting conteudo:', error);
      toast({ title: 'Erro', description: 'Erro ao excluir conteúdo', variant: 'destructive' });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Conteudo>[] = [
    {
      key: 'descricao',
      label: 'Descrição',
      render: (item) => <span className="font-medium">{item.descricao}</span>,
    },
    {
      key: 'quantidadeEpisodios',
      label: 'Episódios',
      className: 'w-24 text-center',
      render: (item) => (
        <span className="font-mono">{item.quantidadeEpisodios}</span>
      ),
    },
    {
      key: 'centroLucro',
      label: 'Centro de Lucro',
      render: (item) => item.centroLucro || '-',
    },
    {
      key: 'anoProducao',
      label: 'Ano',
      className: 'w-20',
      render: (item) => item.anoProducao || '-',
    },
    {
      key: 'dataCadastro',
      label: 'Data Cadastro',
      className: 'w-32',
    },
    {
      key: 'acoes',
      label: 'Ações',
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          {podeAlterar && (
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
          )}
          {podeExcluir && (
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
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Conteúdos"
        description="Gerencie os conteúdos de produção"
        onAdd={podeIncluir ? () => {
          setEditingItem(null);
          setIsModalOpen(true);
        } : undefined}
        addLabel="Novo Conteúdo"
      >
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhum conteúdo cadastrado"
            description="Comece adicionando seu primeiro conteúdo de produção."
            icon={Film}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Novo Conteúdo"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_conteudos_table"
          />
        )}
      </DataCard>

      <ConteudoFormModal
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

export default Conteudo;
