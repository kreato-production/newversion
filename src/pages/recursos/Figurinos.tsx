import { useCallback, useEffect, useState } from 'react';
import { Search, Edit, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import FigurinoFormModal from '@/components/recursos/FigurinoFormModal';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { figurinosRepository } from '@/modules/figurinos/figurinos.repository.provider';
import type { Figurino, FigurinoInput } from '@/modules/figurinos/figurinos.types';

const Figurinos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Figurino | null>(null);
  const [items, setItems] = useState<Figurino[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Figurinos');
  const podeAlterar = canAlterar('Recursos', 'Figurinos');
  const podeExcluir = canExcluir('Recursos', 'Figurinos');

  const fetchFigurinos = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await figurinosRepository.list());
    } catch (error) {
      console.error('Error fetching figurinos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar figurinos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    void fetchFigurinos();
  }, [fetchFigurinos]);

  const handleSave = async (figurino: FigurinoInput) => {
    try {
      await figurinosRepository.save({
        ...figurino,
        tenantId: user?.tenantId ?? null,
      });
      toast({
        title: editingData ? 'Figurino atualizado' : 'Figurino criado',
        description: editingData
          ? 'O figurino foi atualizado com sucesso.'
          : 'O figurino foi criado com sucesso.',
      });
      await fetchFigurinos();
      setIsModalOpen(false);
      setEditingData(null);
    } catch (error) {
      console.error('Error saving figurino:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar figurino', variant: 'destructive' });
      throw error;
    }
  };

  const handleEdit = (figurino: Figurino) => {
    setEditingData(figurino);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await figurinosRepository.remove(id);
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
    const principal = figurino.imagens?.find((img) => img.isPrincipal);
    return principal?.url || figurino.imagens?.[0]?.url;
  };

  const filteredItems = items.filter(
    (item) =>
      item.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigoFigurino?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const columns: Column<Figurino>[] = [
    {
      key: 'imagem',
      label: 'Imagem',
      sortable: false,
      render: (figurino) => {
        const imgUrl = getImagemPrincipal(figurino);
        return imgUrl ? (
          <img src={imgUrl} alt={figurino.descricao} className="w-12 h-12 rounded object-cover" />
        ) : (
          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          </div>
        );
      },
    },
    { key: 'codigoFigurino', label: 'Código', sortable: true },
    { key: 'descricao', label: 'Descrição', sortable: true },
    { key: 'tipoFigurino', label: 'Tipo', sortable: true },
    { key: 'tamanhoPeca', label: 'Tamanho', sortable: true },
    {
      key: 'cores',
      label: 'Cores',
      sortable: false,
      render: (figurino) => (
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
      ),
    },
    {
      key: 'qtdImagens',
      label: 'Imagens',
      sortable: false,
      render: (figurino) => <Badge variant="secondary">{figurino.imagens?.length || 0}</Badge>,
    },
    {
      key: 'actions',
      label: 'Ações',
      sortable: false,
      render: (figurino) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(figurino)}
            disabled={!podeAlterar}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {podeExcluir && (
            <Button variant="ghost" size="icon" onClick={() => handleDelete(figurino.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Figurinos"
        description="Gerencie os figurinos disponíveis para as produções"
      />

      <ListActionBar>
        {podeIncluir && <NewButton tooltip="Novo Figurino" onClick={() => setIsModalOpen(true)} />}
        <div className="flex-1" />
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
        readOnly={!!editingData && !podeAlterar}
      />
    </div>
  );
};

export default Figurinos;
