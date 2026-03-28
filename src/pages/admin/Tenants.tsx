import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Building2, Loader2, Calendar } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { ApiTenantsRepository } from '@/modules/tenants/tenants.api.repository';
import { TenantFormModal } from '@/components/admin/TenantFormModal';
import { format } from 'date-fns';

export interface Tenant {
  id: string;
  nome: string;
  plano: 'Mensal' | 'Anual';
  status: 'Ativo' | 'Inativo' | 'Bloqueado';
  notas: string;
  createdAt: string;
  licencaFim?: string;
}

const apiRepository = new ApiTenantsRepository();

const Tenants = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Tenant | null>(null);
  const [items, setItems] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const data = await apiRepository.list();
      setItems(
        data.map((item) => ({
          id: item.id,
          nome: item.nome,
          plano: item.plano,
          status: item.status,
          notas: item.notas || '',
          createdAt: item.createdAt,
          licencaFim: item.licencaFim || undefined,
        })),
      );
    } catch (err) {
      console.error('Error fetching tenants:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar tenants',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'ATENCAO: Excluir um tenant removera todos os dados associados. Esta acao e irreversivel. Deseja continuar?',
      )
    ) {
      return;
    }

    try {
      await apiRepository.remove(id);

      toast({ title: 'Sucesso', description: 'Tenant excluido com sucesso' });
      void fetchData();
    } catch (err) {
      console.error('Error deleting tenant:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir tenant',
        variant: 'destructive',
      });
    }
  };

  const filteredItems = items.filter((item) =>
    item.nome.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Tenant>[] = [
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'plano',
      label: 'Plano',
      className: 'w-32',
    },
    {
      key: 'licencaFim',
      label: 'Licenca Ate',
      className: 'w-32',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {item.licencaFim ? format(new Date(item.licencaFim), 'dd/MM/yyyy') : '-'}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      className: 'w-24',
      render: (item) => {
        const variants: Record<
          Tenant['status'],
          'default' | 'secondary' | 'destructive' | 'outline'
        > = {
          Ativo: 'default',
          Inativo: 'secondary',
          Bloqueado: 'destructive',
        };

        return <Badge variant={variants[item.status]}>{item.status}</Badge>;
      },
    },
    {
      key: 'acoes',
      label: 'Acoes',
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              void handleDelete(item.id);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
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
      <PageHeader title="Tenants" description="Gerencie as organizacoes e licencas do sistema" />

      <ListActionBar>
        <NewButton
          tooltip="Novo Tenant"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} />
      </ListActionBar>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhum tenant cadastrado"
            description="Adicione organizacoes para comecar a usar o sistema."
            icon={Building2}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Tenant"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_tenants_table"
          />
        )}
      </DataCard>

      <TenantFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={() => void fetchData()}
        data={editingItem}
      />
    </div>
  );
};

export default Tenants;
