import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { ParametroFormModal } from '@/components/shared/ParametroFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ApiParametrosRepository } from '@/modules/parametros/parametros.api.repository';

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

interface ParametroListPageProps {
  title: string;
  description: string;
  entityName: string;
  storageKey: string;
  /** Permission path: [modulo, subModulo1, subModulo2?] */
  permissionPath?: [string, string, string?];
}

const apiRepository = new ApiParametrosRepository();

const ParametroListPage = ({
  title,
  description,
  entityName,
  storageKey,
  permissionPath,
}: ParametroListPageProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ParametroLegacy | null>(null);
  const [items, setItems] = useState<Parametro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiRepository.list(storageKey);
      setItems(data || []);
    } catch (err) {
      console.error(`Error fetching ${storageKey}:`, err);
      toast({
        title: 'Erro',
        description: `Erro ao carregar dados: ${(err as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, storageKey, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    try {
      await apiRepository.save(storageKey, {
        id: editingItem ? data.id : undefined,
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        descricao: data.descricao,
      });

      toast({
        title: t('common.success'),
        description: `${entityName} ${editingItem ? t('common.updated').toLowerCase() : t('common.save').toLowerCase()}!`,
      });

      await fetchData();
      setEditingItem(null);
    } catch (err: unknown) {
      console.error(`Error saving ${storageKey}:`, err);
      const isDuplicate = (err as Record<string, unknown>)?.code === '23505';
      toast({
        title: 'Erro',
        description: isDuplicate
          ? `Já existe um(a) ${entityName} com este nome. Utilize um nome diferente.`
          : `Erro ao salvar: ${(err as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirm.delete'))) {
      try {
        await apiRepository.remove(storageKey, id);

        toast({
          title: t('common.deleted'),
          description: `${entityName} ${t('common.deleted').toLowerCase()}!`,
        });
        await fetchData();
      } catch (err) {
        console.error(`Error deleting ${storageKey}:`, err);
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
      (item.codigo_externo || '').toLowerCase().includes(search.toLowerCase()),
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
        <span className="text-muted-foreground max-w-xs truncate block">
          {item.descricao || '-'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: t('common.registrationDate'),
      className: 'w-32',
      render: (item) =>
        item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-',
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
      <PageHeader title={title} description={description} />

      <ListActionBar>
        <NewButton
          tooltip={`${t('common.new')} ${entityName}`}
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </ListActionBar>

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
        readOnly={
          !!editingItem && permissionPath
            ? !canAlterar(permissionPath[0], permissionPath[1], permissionPath[2] || '-')
            : false
        }
      />
    </div>
  );
};

export default ParametroListPage;
