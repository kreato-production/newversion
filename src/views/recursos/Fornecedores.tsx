import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Truck, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { FornecedorFormModal } from '@/components/recursos/FornecedorFormModal';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { fornecedoresRepository } from '@/modules/fornecedores/fornecedores.repository.provider';
import type { Fornecedor, FornecedorInput } from '@/modules/fornecedores/fornecedores.types';

const Fornecedores = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Fornecedores');
  const podeAlterar = canAlterar('Recursos', 'Fornecedores');
  const podeExcluir = canExcluir('Recursos', 'Fornecedores');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Fornecedor | null>(null);
  const [items, setItems] = useState<Fornecedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchFornecedores = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await fornecedoresRepository.list());
    } catch (error) {
      console.error('Error fetching fornecedores:', error);
      toast({
        title: t('common.error'),
        description: t('field.supplierLoadError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, t, toast]);

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  const handleSave = async (input: FornecedorInput) => {
    try {
      await fornecedoresRepository.save({
        ...input,
        tenantId: user?.tenantId ?? null,
      });
      toast({
        title: t('common.success'),
        description: editingItem ? t('field.supplierUpdated') : t('field.supplierCreated'),
      });
      await fetchFornecedores();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving fornecedor:', error);
      toast({
        title: t('common.error'),
        description: t('field.supplierSaveError'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('field.confirmDeleteSupplier'))) {
      return;
    }

    try {
      await fornecedoresRepository.remove(id);
      toast({ title: t('common.deleted'), description: t('field.supplierDeleted') });
      await fetchFornecedores();
    } catch (error) {
      console.error('Error deleting fornecedor:', error);
      toast({
        title: t('common.error'),
        description: t('field.supplierDeleteError'),
        variant: 'destructive',
      });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Fornecedor>[] = [
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
      key: 'categoria',
      label: t('common.category'),
      render: (item) => item.categoria || '-',
    },
    {
      key: 'email',
      label: t('common.email'),
      render: (item) => item.email || '-',
    },
    {
      key: 'pais',
      label: t('common.country'),
      render: (item) => item.pais || '-',
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
            disabled={!podeAlterar}
            onClick={(event) => {
              event.stopPropagation();
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {podeExcluir && (
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation();
                handleDelete(item.id);
              }}
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
      <PageHeader title={t('field.suppliers')} description={t('field.manageSuppliers')} />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={t('field.newSupplier')}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          />
        )}
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
            title={t('field.noSupplierRegistered')}
            description={t('field.suppliersHint')}
            icon={Truck}
            onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            actionLabel={t('field.addSupplier')}
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_fornecedores_table"
          />
        )}
      </DataCard>

      <FornecedorFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !podeAlterar}
      />
    </div>
  );
};

export default Fornecedores;
