import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, MapPin, Calendar, Loader2, Package } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { RecursoFisicoFormModal } from '@/components/recursos/RecursoFisicoFormModal';
import { MapaRecursosFisicosModal } from '@/components/recursos/MapaRecursosFisicosModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { recursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.repository.provider';
import type {
  RecursoFisico,
  RecursoFisicoInput,
} from '@/modules/recursos-fisicos/recursos-fisicos.types';

const RecursosFisicos = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Recursos Físicos');
  const podeAlterar = canAlterar('Recursos', 'Recursos Físicos');
  const podeExcluir = canExcluir('Recursos', 'Recursos Físicos');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapaOpen, setIsMapaOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecursoFisico | null>(null);
  const [items, setItems] = useState<RecursoFisico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecursosFisicos = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await recursosFisicosRepository.list());
    } catch (error) {
      console.error('Error fetching recursos fisicos:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao carregar recursos físicos: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, t, toast]);

  useEffect(() => {
    fetchRecursosFisicos();
  }, [fetchRecursosFisicos]);

  const handleSave = async (data: RecursoFisicoInput) => {
    try {
      await recursosFisicosRepository.save({
        ...data,
        tenantId: user?.tenantId ?? null,
      });
      toast({
        title: t('common.success'),
        description: editingItem ? 'Recurso físico atualizado!' : 'Recurso físico criado!',
      });
      await fetchRecursosFisicos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving recurso fisico:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao salvar: ${(error as Error).message}`,
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
      await recursosFisicosRepository.remove(id);
      toast({ title: t('common.deleted'), description: t('common.deleted') });
      await fetchRecursosFisicos();
    } catch (error) {
      console.error('Error deleting recurso fisico:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao excluir: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const formatCustoHora = (value: number) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      value,
    );

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<RecursoFisico>[] = [
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
      key: 'custoHora',
      label: t('field.costPerHour'),
      className: 'w-32',
      render: (item) => formatCustoHora(item.custoHora),
    },
    {
      key: 'estoqueCount',
      label: t('field.stock'),
      className: 'w-24',
      render: (item) => {
        const count = item.estoqueCount || 0;
        const iconColor = count > 0 ? 'text-green-500' : 'text-red-500';
        return (
          <div className="flex items-center gap-1">
            <Package className={`w-4 h-4 ${iconColor}`} />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
      className: 'w-32',
    },
    {
      key: 'usuarioCadastro',
      label: t('common.user'),
      className: 'w-40',
      render: (item) => (
        <span className="text-muted-foreground">{item.usuarioCadastro || '-'}</span>
      ),
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
            disabled={!podeAlterar}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {podeExcluir && (
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
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('physicalResources.title')}
        description={t('field.managePhysicalResources')}
      />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={t('field.newResource')}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          />
        )}
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMapaOpen(true)}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          {t('field.availabilityMap')}
        </Button>
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={t('field.noPhysicalResourceRegistered')}
            description={t('field.physicalResourcesHint')}
            icon={MapPin}
            onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            actionLabel={t('field.addPhysicalResource')}
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_recursos_fisicos_table"
          />
        )}
      </DataCard>

      <RecursoFisicoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !podeAlterar}
      />

      <MapaRecursosFisicosModal
        isOpen={isMapaOpen}
        onClose={() => setIsMapaOpen(false)}
        recursos={items}
      />
    </div>
  );
};

export default RecursosFisicos;
