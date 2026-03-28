import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { SeveridadeIncidenciaFormModal } from '@/components/producao/SeveridadeIncidenciaFormModal';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';

export interface SeveridadeIncidencia {
  id: string;
  codigo_externo: string | null;
  titulo: string;
  descricao: string | null;
  cor: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const repository = new ApiParametrizacoesRepository();

const SeveridadesIncidencia = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SeveridadeIncidencia | null>(null);
  const [items, setItems] = useState<SeveridadeIncidencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const permPath = ['ProduÃ§Ã£o', 'ParametrizaÃ§Ãµes', 'Severidades de IncidÃªncia'] as const;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listSeveridadesIncidencia();
      setItems(
        response.data.map((item) => ({
          id: item.id,
          codigo_externo: item.codigo_externo || null,
          titulo: item.titulo,
          descricao: item.descricao || null,
          cor: item.cor || '#888888',
          created_by: item.created_by || null,
          created_at: item.created_at || null,
          updated_at: item.created_at || null,
        })),
      );
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm.delete'))) return;
    try {
      await repository.removeSeveridadeIncidencia(id);
      toast({
        title: t('common.deleted'),
        description: `${t('incidentSeverity.entity')} ${t('common.deleted').toLowerCase()}!`,
      });
      await fetchData();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleSave = async (data: {
    titulo: string;
    descricao?: string;
    codigo_externo?: string;
    cor?: string;
  }) => {
    try {
      await repository.saveSeveridadeIncidencia({
        ...(editingItem ? { id: editingItem.id } : {}),
        titulo: data.titulo,
        descricao: data.descricao || '',
        codigo_externo: data.codigo_externo || '',
        cor: data.cor || '#888888',
      });
      toast({
        title: t('common.success'),
        description: `${t('incidentSeverity.entity')} ${editingItem ? t('common.updated').toLowerCase() : t('common.save').toLowerCase()}!`,
      });
      await fetchData();
      setEditingItem(null);
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (item.codigo_externo || '').toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<SeveridadeIncidencia & { actions?: never }>[] = [
    {
      key: 'codigo_externo',
      label: t('common.externalCode'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigo_externo || '-'}</span>,
    },
    {
      key: 'titulo',
      label: t('incidentSeverity.title'),
      render: (item) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: item.cor || '#888888' }}
          />
          <span className="font-medium">{item.titulo}</span>
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
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => void handleDelete(item.id)}
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
        title={t('incidentSeverity.pageTitle')}
        description={t('incidentSeverity.pageDescription')}
      />
      <ListActionBar>
        <NewButton
          tooltip={`${t('common.new')} ${t('incidentSeverity.entity')}`}
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
            description={`${t('common.add')} ${t('incidentSeverity.entity').toLowerCase()}.`}
            icon={Settings}
            onAction={() => setIsModalOpen(true)}
            actionLabel={`${t('common.add')} ${t('incidentSeverity.entity')}`}
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_severidades_incidencia"
          />
        )}
      </DataCard>
      <SeveridadeIncidenciaFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar(permPath[0], permPath[1], permPath[2])}
      />
    </div>
  );
};

export default SeveridadesIncidencia;
