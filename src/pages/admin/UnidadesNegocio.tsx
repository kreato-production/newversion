import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Building2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnidadeNegocioFormModal } from '@/components/admin/UnidadeNegocioFormModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UnidadeNegocioDb {
  id: string;
  codigo_externo: string | null;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  created_at: string | null;
  created_by: string | null;
}

export interface UnidadeNegocio {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  imagem?: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

const mapDbToUnidade = (db: UnidadeNegocioDb, userName: string): UnidadeNegocio => ({
  id: db.id,
  codigoExterno: db.codigo_externo || '',
  nome: db.nome,
  descricao: db.descricao || '',
  imagem: db.imagem_url || '',
  dataCadastro: db.created_at ? new Date(db.created_at).toLocaleDateString('pt-BR') : '',
  usuarioCadastro: userName,
});

const UnidadesNegocio = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UnidadeNegocio | null>(null);
  const [items, setItems] = useState<UnidadeNegocio[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('unidades_negocio')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      setItems((data || []).map((d) => mapDbToUnidade(d, user?.nome || '')));
    } catch (err) {
      console.error('Error fetching unidades_negocio:', err);
      toast({
        title: 'Erro',
        description: `Erro ao carregar dados: ${(err as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast, user?.nome]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data: UnidadeNegocio) => {
    try {
      const dbData = {
        nome: data.nome,
        descricao: data.descricao || null,
        codigo_externo: data.codigoExterno || null,
        imagem_url: data.imagem || null,
        created_by: user?.id || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('unidades_negocio')
          .update(dbData)
          .eq('id', data.id);

        if (error) throw error;
        toast({ title: t('common.success'), description: t('businessUnits.updated') });
      } else {
        const { id, ...insertData } = { id: data.id, ...dbData };
        const { error } = await supabase
          .from('unidades_negocio')
          .insert({ id: data.id, ...insertData });

        if (error) throw error;
        toast({ title: t('common.success'), description: t('businessUnits.saved') });
      }

      await fetchData();
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving unidade:', err);
      toast({
        title: 'Erro',
        description: `Erro ao salvar: ${(err as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirm.delete'))) {
      try {
        const { error } = await supabase
          .from('unidades_negocio')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({ title: t('common.success'), description: t('businessUnits.deleted') });
        await fetchData();
      } catch (err) {
        console.error('Error deleting unidade:', err);
        toast({
          title: 'Erro',
          description: `Erro ao excluir: ${(err as Error).message}`,
          variant: 'destructive',
        });
      }
    }
  };

  const handleEdit = (item: UnidadeNegocio) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<UnidadeNegocio & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: t('common.code'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'descricao',
      label: t('common.description'),
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">{item.descricao || '-'}</span>
      ),
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
      className: 'w-32',
    },
    {
      key: 'usuarioCadastro',
      label: t('common.user'),
      className: 'w-32',
    },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(item)}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('businessUnits.title')}
        description={t('businessUnits.description')}
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel={t('businessUnits.new')}
      >
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title={t('businessUnits.empty')}
            description={t('businessUnits.emptyDescription')}
            icon={Building2}
            onAction={() => setIsModalOpen(true)}
            actionLabel={t('common.add')}
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_unidades_negocio"
          />
        )}
      </DataCard>

      <UnidadeNegocioFormModal
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

export default UnidadesNegocio;