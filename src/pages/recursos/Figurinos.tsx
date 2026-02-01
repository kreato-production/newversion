import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import FigurinoFormModal from '@/components/recursos/FigurinoFormModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type FigurinoDB = Tables<'figurinos'>;

export interface FigurinoImagem {
  id: string;
  url: string;
  isPrincipal: boolean;
}

export interface Figurino {
  id: string;
  codigoExterno: string;
  codigoFigurino: string;
  descricao: string;
  tipoFigurino?: string;
  tipoFigurinoId?: string;
  material?: string;
  materialId?: string;
  tamanhoPeca?: string;
  corPredominante?: string;
  corSecundaria?: string;
  imagens: FigurinoImagem[];
  dataCadastro: string;
  usuarioCadastro: string;
}

const mapDbToFigurino = (
  db: FigurinoDB & { 
    tipos_figurino?: { nome: string } | null;
    materiais?: { nome: string } | null;
  },
  imagens: FigurinoImagem[] = []
): Figurino => ({
  id: db.id,
  codigoExterno: db.codigo_externo || '',
  codigoFigurino: db.codigo_figurino,
  descricao: db.descricao,
  tipoFigurino: db.tipos_figurino?.nome,
  tipoFigurinoId: db.tipo_figurino_id || undefined,
  material: db.materiais?.nome,
  materialId: db.material_id || undefined,
  tamanhoPeca: db.tamanho_peca || undefined,
  corPredominante: db.cor_predominante || undefined,
  corSecundaria: db.cor_secundaria || undefined,
  imagens,
  dataCadastro: db.created_at ? new Date(db.created_at).toLocaleDateString('pt-BR') : '',
  usuarioCadastro: '',
});

const Figurinos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Figurino | null>(null);
  const [items, setItems] = useState<Figurino[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchFigurinos = async () => {
    setIsLoading(true);
    try {
      const { data: figurinosData, error: figurinosError } = await supabase
        .from('figurinos')
        .select('*, tipos_figurino:tipo_figurino_id(nome), materiais:material_id(nome)')
        .order('codigo_figurino');

      if (figurinosError) throw figurinosError;

      const figurinosWithImages = await Promise.all(
        (figurinosData || []).map(async (fig) => {
          const { data: imagensData } = await supabase
            .from('figurino_imagens')
            .select('*')
            .eq('figurino_id', fig.id);

          const imagens: FigurinoImagem[] = (imagensData || []).map((img) => ({
            id: img.id,
            url: img.url,
            isPrincipal: img.is_principal || false,
          }));

          return mapDbToFigurino(fig, imagens);
        })
      );

      setItems(figurinosWithImages);
    } catch (error) {
      console.error('Error fetching figurinos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar figurinos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFigurinos();
  }, []);

  const handleSave = async (figurino: Figurino) => {
    try {
      const dbData: TablesInsert<'figurinos'> = {
        id: figurino.id || undefined,
        codigo_externo: figurino.codigoExterno || null,
        codigo_figurino: figurino.codigoFigurino,
        descricao: figurino.descricao,
        tipo_figurino_id: figurino.tipoFigurinoId || null,
        material_id: figurino.materialId || null,
        tamanho_peca: figurino.tamanhoPeca || null,
        cor_predominante: figurino.corPredominante || null,
        cor_secundaria: figurino.corSecundaria || null,
      };

      let figurinoId = figurino.id;

      if (editingData) {
        const { error } = await supabase
          .from('figurinos')
          .update(dbData as TablesUpdate<'figurinos'>)
          .eq('id', figurino.id);
        if (error) throw error;
        toast({ title: 'Figurino atualizado', description: 'O figurino foi atualizado com sucesso.' });
      } else {
        const { data: inserted, error } = await supabase
          .from('figurinos')
          .insert(dbData)
          .select()
          .single();
        if (error) throw error;
        figurinoId = inserted.id;
        toast({ title: 'Figurino criado', description: 'O figurino foi criado com sucesso.' });
      }

      // Handle imagens
      if (figurino.imagens) {
        await supabase.from('figurino_imagens').delete().eq('figurino_id', figurinoId);
        if (figurino.imagens.length > 0) {
          const imagensData = figurino.imagens.map((img) => ({
            figurino_id: figurinoId,
            url: img.url,
            is_principal: img.isPrincipal,
          }));
          await supabase.from('figurino_imagens').insert(imagensData);
        }
      }

      await fetchFigurinos();
      setIsModalOpen(false);
      setEditingData(null);
    } catch (error) {
      console.error('Error saving figurino:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar figurino', variant: 'destructive' });
    }
  };

  const handleEdit = (figurino: Figurino) => {
    setEditingData(figurino);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('figurinos').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Figurino excluído', description: 'O figurino foi excluído com sucesso.' });
      await fetchFigurinos();
    } catch (error) {
      console.error('Error deleting figurino:', error);
      toast({ title: 'Erro', description: 'Erro ao excluir figurino', variant: 'destructive' });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingData(null);
  };

  const getImagemPrincipal = (figurino: Figurino): string | undefined => {
    const principal = figurino.imagens?.find(img => img.isPrincipal);
    return principal?.url || figurino.imagens?.[0]?.url;
  };

  const filteredItems = items.filter(item =>
    item.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigoFigurino?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigoExterno?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Figurino>[] = [
    {
      key: 'imagem',
      label: 'Imagem',
      sortable: false,
      render: (figurino: Figurino) => {
        const imgUrl = getImagemPrincipal(figurino);
        return imgUrl ? (
          <img src={imgUrl} alt={figurino.descricao} className="w-12 h-12 rounded object-cover" />
        ) : (
          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          </div>
        );
      }
    },
    { key: 'codigoFigurino', label: 'Código', sortable: true },
    { key: 'descricao', label: 'Descrição', sortable: true },
    { key: 'tipoFigurino', label: 'Tipo', sortable: true },
    { key: 'tamanhoPeca', label: 'Tamanho', sortable: true },
    {
      key: 'cores',
      label: 'Cores',
      sortable: false,
      render: (figurino: Figurino) => (
        <div className="flex gap-1">
          {figurino.corPredominante && (
            <div 
              className="w-6 h-6 rounded border" 
              style={{ backgroundColor: figurino.corPredominante }}
              title={`Predominante: ${figurino.corPredominante}`}
            />
          )}
          {figurino.corSecundaria && (
            <div 
              className="w-6 h-6 rounded border" 
              style={{ backgroundColor: figurino.corSecundaria }}
              title={`Secundária: ${figurino.corSecundaria}`}
            />
          )}
        </div>
      )
    },
    {
      key: 'qtdImagens',
      label: 'Imagens',
      sortable: false,
      render: (figurino: Figurino) => (
        <Badge variant="secondary">{figurino.imagens?.length || 0}</Badge>
      )
    },
    {
      key: 'actions',
      label: 'Ações',
      sortable: false,
      render: (figurino: Figurino) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(figurino)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(figurino.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Figurinos"
        description="Gerencie os figurinos disponíveis para as produções"
        onAdd={() => setIsModalOpen(true)}
        addLabel="Novo Figurino"
      />

      <ListActionBar>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar figurino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
      </ListActionBar>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems.length > 0 ? (
        <SortableTable 
          columns={columns} 
          data={filteredItems} 
          getRowKey={(item) => item.id}
          storageKey="kreato_figurinos_table"
        />
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="Nenhum figurino encontrado"
          description="Adicione um novo figurino para começar."
        />
      )}

      <FigurinoFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        data={editingData}
      />
    </div>
  );
};

export default Figurinos;
