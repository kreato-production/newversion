import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { DepartamentoFormModal } from '@/components/recursos/DepartamentoFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Building2, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { usePermissions } from '@/hooks/usePermissions';

type DepartamentoDB = Tables<'departamentos'>;

interface Departamento {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

const mapDbToDepartamento = (db: DepartamentoDB): Departamento => ({
  id: db.id,
  codigoExterno: db.codigo_externo || '',
  nome: db.nome,
  descricao: db.descricao || '',
  dataCadastro: db.created_at ? new Date(db.created_at).toLocaleDateString('pt-BR') : '',
  usuarioCadastro: '',
});

const Departamentos = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Departamento | null>(null);
  const [items, setItems] = useState<Departamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDepartamentos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('departamentos')
        .select('*')
        .order('nome');

      if (error) throw error;
      setItems((data || []).map(mapDbToDepartamento));
    } catch (error) {
      console.error('Error fetching departamentos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar departamentos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  const handleSave = async (data: Departamento) => {
    try {
      const dbData: TablesInsert<'departamentos'> = {
        id: data.id || undefined,
        codigo_externo: data.codigoExterno || null,
        nome: data.nome,
        descricao: data.descricao || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('departamentos')
          .update(dbData as TablesUpdate<'departamentos'>)
          .eq('id', data.id);
        if (error) throw error;
        toast({ title: t('common.success'), description: `Departamento ${t('common.updated').toLowerCase()}!` });
      } else {
        const { error } = await supabase.from('departamentos').insert(dbData);
        if (error) throw error;
        toast({ title: t('common.success'), description: `Departamento ${t('common.save').toLowerCase()}!` });
      }

      await fetchDepartamentos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving departamento:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar departamento', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirm.delete'))) {
      try {
        // Delete associated funcoes first
        await supabase.from('departamento_funcoes').delete().eq('departamento_id', id);
        
        const { error } = await supabase.from('departamentos').delete().eq('id', id);
        if (error) throw error;
        toast({ title: t('common.deleted'), description: `Departamento ${t('common.deleted').toLowerCase()}!` });
        await fetchDepartamentos();
      } catch (error) {
        console.error('Error deleting departamento:', error);
        toast({ title: 'Erro', description: 'Erro ao excluir departamento', variant: 'destructive' });
      }
    }
  };

  const handleEdit = (item: Departamento) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Departamento & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: t('common.code'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="font-medium">{item.nome}</span>
        </div>
      ),
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

  return (
    <div>
      <PageHeader
        title="Departamentos"
        description="Gerencie os departamentos da organização"
      />

      <ListActionBar>
        <NewButton tooltip={`${t('common.new')} Departamento`} onClick={() => { setEditingItem(null); setIsModalOpen(true); }} />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={t('common.noResults')}
            description="Adicione um departamento."
            icon={Building2}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Departamento"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_departamentos"
          />
        )}
      </DataCard>

      <DepartamentoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={(data) => handleSave(data as Departamento)}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar('Recursos', 'Departamentos')}
      />
    </div>
  );
};

export default Departamentos;
