import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Wrench, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { RecursoTecnicoFormModal } from '@/components/recursos/RecursoTecnicoFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { recursosTecnicosRepository } from '@/modules/recursos-tecnicos/recursos-tecnicos.repository.provider';
import type {
  RecursoTecnico,
  RecursoTecnicoInput,
} from '@/modules/recursos-tecnicos/recursos-tecnicos.types';

const RecursosTecnicos = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Recursos Técnicos');
  const podeAlterar = canAlterar('Recursos', 'Recursos Técnicos');
  const podeExcluir = canExcluir('Recursos', 'Recursos Técnicos');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecursoTecnico | null>(null);
  const [items, setItems] = useState<RecursoTecnico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecursosTecnicos = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await recursosTecnicosRepository.list());
    } catch (error) {
      console.error('Error fetching recursos tecnicos:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao carregar recursos técnicos: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, t, toast]);

  useEffect(() => {
    fetchRecursosTecnicos();
  }, [fetchRecursosTecnicos]);

  const handleSave = async (data: RecursoTecnicoInput) => {
    try {
      await recursosTecnicosRepository.save({
        ...data,
        tenantId: user?.tenantId ?? null,
      });
      toast({
        title: t('common.success'),
        description: editingItem ? 'Recurso técnico atualizado!' : 'Recurso técnico criado!',
      });
      await fetchRecursosTecnicos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving recurso tecnico:', error);
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
      await recursosTecnicosRepository.remove(id);
      toast({ title: t('common.deleted'), description: t('common.deleted') });
      await fetchRecursosTecnicos();
    } catch (error) {
      console.error('Error deleting recurso tecnico:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao excluir: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<RecursoTecnico>[] = [
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
        title={t('technicalResources.title')}
        description={t('field.manageTechnicalResources')}
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
            onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
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
        readOnly={!!editingItem && !podeAlterar}
      />
    </div>
  );
};

export default RecursosTecnicos;
