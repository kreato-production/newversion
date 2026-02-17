import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Wrench, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { RecursoTecnicoFormModal } from '@/components/recursos/RecursoTecnicoFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';

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
  const { t } = useLanguage();
  const { canAlterar } = usePermissions();
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
      toast({ title: t('common.error'), description: t('common.error'), variant: 'destructive' });
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
        toast({ title: t('common.success'), description: t('common.success') });
      } else {
        const { error } = await supabase.from('recursos_tecnicos').insert(dbData);
        if (error) throw error;
        toast({ title: t('common.success'), description: t('common.success') });
      }

      await fetchRecursosTecnicos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving recurso tecnico:', error);
      toast({ title: t('common.error'), description: t('common.error'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirm.delete'))) {
      try {
        const { error } = await supabase.from('recursos_tecnicos').delete().eq('id', id);
        if (error) throw error;
        toast({ title: t('common.deleted'), description: t('common.deleted') });
        await fetchRecursosTecnicos();
      } catch (error) {
        console.error('Error deleting recurso tecnico:', error);
        toast({ title: t('common.error'), description: t('common.error'), variant: 'destructive' });
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
      label: t('common.code'),
      className: 'w-24',
      render: (item) => (
        <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>
      ),
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'funcaoOperador',
      label: t('field.operatorFunction'),
      render: (item) => item.funcaoOperador || '-',
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
      key: 'acoes',
      label: t('common.actions'),
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
        title={t('technicalResources.title')}
        description={t('field.manageTechnicalResources')}
      />

      <ListActionBar>
        <NewButton tooltip={t('field.newResource')} onClick={() => { setEditingItem(null); setIsModalOpen(true); }} />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} />
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={t('field.noTechnicalResourceRegistered')}
            description={t('field.technicalResourcesHint')}
            icon={Wrench}
            onAction={() => setIsModalOpen(true)}
            actionLabel={t('field.addTechnicalResource')}
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
        readOnly={!!editingItem && !canAlterar('Recursos', 'Recursos Técnicos')}
      />
    </div>
  );
};

export default RecursosTecnicos;
