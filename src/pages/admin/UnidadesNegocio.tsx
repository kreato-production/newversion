import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Building2, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { UnidadeNegocioFormModal } from '@/components/admin/UnidadeNegocioFormModal';
import { useAuth } from '@/contexts/AuthContext';
import { unidadesRepository } from '@/modules/unidades/unidades.repository';
import type { UnidadeNegocio } from '@/modules/unidades/unidades.types';

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
      setItems(await unidadesRepository.list(user?.nome || ''));
    } catch (error) {
      console.error('Error fetching unidades_negocio:', error);
      toast({
        title: 'Erro',
        description: `Erro ao carregar dados: ${(error as Error).message}`,
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
      const payload = data.id ? data : { ...data, id: crypto.randomUUID() };
      await unidadesRepository.save(payload, user?.id);

      if (editingItem) {
        toast({ title: t('common.success'), description: t('businessUnits.updated') });
      } else {
        toast({ title: t('common.success'), description: t('businessUnits.saved') });
      }

      await fetchData();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving unidade:', error);
      toast({
        title: 'Erro',
        description: `Erro ao salvar: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm.delete'))) return;

    try {
      await unidadesRepository.remove(id);
      toast({ title: t('common.success'), description: t('businessUnits.deleted') });
      await fetchData();
    } catch (error) {
      console.error('Error deleting unidade:', error);
      toast({
        title: 'Erro',
        description: `Erro ao excluir: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item: UnidadeNegocio) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase()),
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
      render: (item) => <span className="text-muted-foreground max-w-xs truncate block">{item.descricao || '-'}</span>,
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
      <PageHeader title={t('businessUnits.title')} description={t('businessUnits.description')} />

      <ListActionBar>
        <NewButton
          tooltip={t('businessUnits.new')}
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
