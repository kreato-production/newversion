import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { EquipeFormModal } from '@/components/recursos/EquipeFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, UsersRound, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';

interface Equipe {
  id: string;
  codigo: string;
  descricao: string;
  membrosCount: number;
  dataCadastro: string;
}

const Equipes = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipe | null>(null);
  const [items, setItems] = useState<Equipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEquipes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipes')
        .select('*, equipe_membros(id)')
        .order('codigo');

      if (error) throw error;
      setItems(
        (data || []).map((eq: any) => ({
          id: eq.id,
          codigo: eq.codigo,
          descricao: eq.descricao,
          membrosCount: eq.equipe_membros?.length || 0,
          dataCadastro: eq.created_at ? new Date(eq.created_at).toLocaleDateString('pt-BR') : '',
        }))
      );
    } catch (error) {
      console.error('Error fetching equipes:', error);
      toast({ title: t('common.error'), description: t('teams.loadError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipes();
  }, []);

  const handleSave = async (data: { id?: string; codigo: string; descricao: string }) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('equipes')
          .update({ codigo: data.codigo, descricao: data.descricao })
          .eq('id', editingItem.id);
        if (error) throw error;
        toast({ title: t('common.success'), description: t('teams.updated') });
      } else {
        const { error } = await supabase
          .from('equipes')
          .insert({ codigo: data.codigo, descricao: data.descricao });
        if (error) throw error;
        toast({ title: t('common.success'), description: t('teams.created') });
      }
      await fetchEquipes();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving equipe:', error);
      toast({ title: t('common.error'), description: t('teams.saveError'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirm.delete'))) {
      try {
        const { error } = await supabase.from('equipes').delete().eq('id', id);
        if (error) throw error;
        toast({ title: t('common.deleted'), description: t('teams.deleted') });
        await fetchEquipes();
      } catch (error) {
        console.error('Error deleting equipe:', error);
        toast({ title: t('common.error'), description: t('teams.deleteError'), variant: 'destructive' });
      }
    }
  };

  const handleEdit = (item: Equipe) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(
    (item) =>
      item.codigo.toLowerCase().includes(search.toLowerCase()) ||
      item.descricao.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Equipe & { actions?: never }>[] = [
    {
      key: 'codigo',
      label: t('common.code'),
      className: 'w-32',
      render: (item) => <span className="font-mono text-sm">{item.codigo}</span>,
    },
    {
      key: 'descricao',
      label: t('common.description'),
      render: (item) => (
        <div className="flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-primary" />
          <span className="font-medium">{item.descricao}</span>
        </div>
      ),
    },
    {
      key: 'membrosCount',
      label: t('teams.members'),
      className: 'w-32 text-center',
      render: (item) => (
        <span className="text-muted-foreground">{item.membrosCount}</span>
      ),
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
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

  return (
    <div>
      <PageHeader
        title={t('teams.title')}
        description={t('teams.description')}
      />

      <ListActionBar>
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
        <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" />
          {t('teams.new')}
        </Button>
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={t('common.noResults')}
            description={t('teams.empty')}
            icon={UsersRound}
            onAction={() => setIsModalOpen(true)}
            actionLabel={t('teams.new')}
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_equipes"
          />
        )}
      </DataCard>

      <EquipeFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        onRefresh={fetchEquipes}
        readOnly={!!editingItem && !canAlterar('Recursos', 'Equipes')}
      />
    </div>
  );
};

export default Equipes;
