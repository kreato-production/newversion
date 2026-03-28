import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { DepartamentoFormModal } from '@/components/recursos/DepartamentoFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Building2, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  ApiDepartamentosRepository,
  type DepartamentoApiInput,
  type DepartamentoApiItem,
} from '@/modules/departamentos/departamentos.api.repository';

type Departamento = DepartamentoApiItem;

const apiRepository = new ApiDepartamentosRepository();

const Departamentos = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Departamentos');
  const podeAlterar = canAlterar('Recursos', 'Departamentos');
  const podeExcluir = canExcluir('Recursos', 'Departamentos');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Departamento | null>(null);
  const [items, setItems] = useState<Departamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDepartamentos = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await apiRepository.list());
    } catch (error) {
      console.error('Error fetching departamentos:', error);
      toast({
        title: 'Erro',
        description: `Erro ao carregar departamentos: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchDepartamentos();
  }, [fetchDepartamentos]);

  const handleSave = async (data: DepartamentoApiInput) => {
    try {
      await apiRepository.save(data);
      toast({
        title: t('common.success'),
        description: editingItem
          ? `Departamento ${t('common.updated').toLowerCase()}!`
          : `Departamento salvo!`,
      });
      await fetchDepartamentos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving departamento:', error);
      toast({
        title: 'Erro',
        description: `Erro ao salvar departamento: ${(error as Error).message}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm.delete'))) {
      return;
    }

    try {
      await apiRepository.remove(id);
      toast({
        title: t('common.deleted'),
        description: `Departamento ${t('common.deleted').toLowerCase()}!`,
      });
      await fetchDepartamentos();
    } catch (error) {
      console.error('Error deleting departamento:', error);
      toast({
        title: 'Erro',
        description: `Erro ao excluir departamento: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Departamento>[] = [
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
        <span className="text-muted-foreground max-w-xs truncate block">
          {item.descricao || '-'}
        </span>
      ),
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
      className: 'w-32',
      render: (item) =>
        item.dataCadastro ? new Date(item.dataCadastro).toLocaleDateString('pt-BR') : '-',
    },
    {
      key: 'usuarioCadastro',
      label: t('common.user'),
      className: 'w-32',
      render: (item) => item.usuarioCadastro || '-',
    },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setEditingItem(item);
              setIsModalOpen(true);
            }}
            disabled={!podeAlterar}
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          {podeExcluir && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => void handleDelete(item.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Departamentos" description="Gerencie os departamentos da organizacao" />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={`${t('common.new')} Departamento`}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          />
        )}
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
            onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
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
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !podeAlterar}
      />
    </div>
  );
};

export default Departamentos;
