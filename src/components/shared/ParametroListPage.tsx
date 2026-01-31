import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ParametroFormModal } from '@/components/shared/ParametroFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Parametro {
  id: string;
  codigo_externo: string;
  nome: string;
  descricao: string;
  created_at: string;
  created_by: string;
}

// Legacy interface for backwards compatibility with form modal
interface ParametroLegacy {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

// Mapping from storageKey to Supabase table name
const tableMapping: Record<string, string> = {
  'kreato_cargos': 'cargos',
  'kreato_funcoes': 'funcoes',
  'kreato_servicos': 'servicos',
  'kreato_classificacao': 'classificacoes',
  'kreato_material': 'materiais',
  'kreato_tipos_gravacao': 'tipos_gravacao',
  'kreato_categoria_fornecedores': 'categorias_fornecedor',
  'kreato_tipo_figurino': 'tipos_figurino',
  'kreato_classificacao_pessoas': 'classificacoes_pessoa',
  'kreato_status_gravacao': 'status_gravacao',
  'kreato_status_tarefa': 'status_tarefa',
  'kreato_departamentos': 'departamentos',
  'kreato_perfis_acesso': 'perfis_acesso',
  'kreato_unidades_negocio': 'unidades_negocio',
};

interface ParametroListPageProps {
  title: string;
  description: string;
  entityName: string;
  storageKey: string;
}

const ParametroListPage = ({ title, description, entityName, storageKey }: ParametroListPageProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ParametroLegacy | null>(null);
  const [items, setItems] = useState<Parametro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get the Supabase table name from the storageKey mapping
  const tableName = tableMapping[storageKey];

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    if (!session || !tableName) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        throw error;
      }

      setItems(data || []);
    } catch (err) {
      console.error(`Error fetching ${tableName}:`, err);
      toast({
        title: 'Erro',
        description: `Erro ao carregar dados: ${(err as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, tableName, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Convert legacy format to database format
  const toDbFormat = (data: ParametroLegacy): Record<string, unknown> => ({
    nome: data.nome,
    descricao: data.descricao || null,
    codigo_externo: data.codigoExterno || null,
    created_by: user?.id || null,
  });

  // Convert database format to legacy format for display
  const toLegacyFormat = (data: Parametro): ParametroLegacy => ({
    id: data.id,
    codigoExterno: data.codigo_externo || '',
    nome: data.nome,
    descricao: data.descricao || '',
    dataCadastro: data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR') : '',
    usuarioCadastro: user?.nome || '',
  });

  const handleSave = async (data: ParametroLegacy) => {
    if (!tableName) return;

    try {
      if (editingItem) {
        // Update existing record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from(tableName)
          .update(toDbFormat(data))
          .eq('id', data.id);

        if (error) throw error;

        toast({ title: t('common.success'), description: `${entityName} ${t('common.updated').toLowerCase()}!` });
      } else {
        // Create new record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from(tableName)
          .insert(toDbFormat(data));

        if (error) throw error;

        toast({ title: t('common.success'), description: `${entityName} ${t('common.save').toLowerCase()}!` });
      }

      // Refresh data
      await fetchData();
      setEditingItem(null);
    } catch (err) {
      console.error(`Error saving ${tableName}:`, err);
      toast({
        title: 'Erro',
        description: `Erro ao salvar: ${(err as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!tableName) return;

    if (confirm(t('common.confirm.delete'))) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({ title: t('common.deleted'), description: `${entityName} ${t('common.deleted').toLowerCase()}!` });
        await fetchData();
      } catch (err) {
        console.error(`Error deleting ${tableName}:`, err);
        toast({
          title: 'Erro',
          description: `Erro ao excluir: ${(err as Error).message}`,
          variant: 'destructive',
        });
      }
    }
  };

  const handleEdit = (item: Parametro) => {
    setEditingItem(toLegacyFormat(item));
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome?.toLowerCase().includes(search.toLowerCase()) ||
      (item.codigo_externo || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Parametro & { actions?: never }>[] = [
    {
      key: 'codigo_externo',
      label: t('common.code'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigo_externo || '-'}</span>,
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
      key: 'created_at',
      label: t('common.registrationDate'),
      className: 'w-32',
      render: (item) => item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-',
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
        title={title}
        description={description}
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel={`${t('common.new')} ${entityName}`}
      >
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title={t('common.noResults')}
            description={`${t('common.add')} ${entityName.toLowerCase()}.`}
            icon={Settings}
            onAction={() => setIsModalOpen(true)}
            actionLabel={`${t('common.add')} ${entityName}`}
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey={storageKey}
          />
        )}
      </DataCard>

      <ParametroFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        title={entityName}
        data={editingItem}
      />
    </div>
  );
};

export default ParametroListPage;
