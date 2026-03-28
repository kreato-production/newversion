import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Film, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { ConteudoBackendFormModal } from '@/components/producao/ConteudoBackendFormModal';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { conteudosRepository } from '@/modules/conteudos/conteudos.repository.provider';
import type { Conteudo as ConteudoItem, ConteudoInput } from '@/modules/conteudos/conteudos.types';

const Conteudo = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();

  const podeIncluir = canIncluir('ProduÃƒÂ§ÃƒÂ£o', 'ConteÃƒÂºdo');
  const podeAlterar = canAlterar('ProduÃƒÂ§ÃƒÂ£o', 'ConteÃƒÂºdo');
  const podeExcluir = canExcluir('ProduÃƒÂ§ÃƒÂ£o', 'ConteÃƒÂºdo');

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConteudoItem | null>(null);
  const [items, setItems] = useState<ConteudoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConteudos = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await conteudosRepository.list();
      setItems(
        user?.unidadeIds && user.unidadeIds.length > 0
          ? data.filter(
              (item) => !item.unidadeNegocioId || user.unidadeIds?.includes(item.unidadeNegocioId),
            )
          : data,
      );
    } catch (error) {
      console.error('Error fetching conteudos:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao carregar conteÃºdos: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, t, toast, user?.unidadeIds]);

  useEffect(() => {
    void fetchConteudos();
  }, [fetchConteudos]);

  const handleSave = async (data: ConteudoInput) => {
    try {
      await conteudosRepository.save(
        {
          ...data,
          tenantId: user?.tenantId ?? null,
        },
        user?.id,
      );

      toast({
        title: t('common.success'),
        description: editingItem ? t('field.contentUpdated') : t('field.contentCreated'),
      });

      await fetchConteudos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving conteudo:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao salvar conteÃºdo: ${(error as Error).message}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('field.confirmDeleteContent'))) {
      return;
    }

    try {
      await conteudosRepository.remove(id);
      toast({ title: t('common.deleted'), description: t('field.contentDeleted') });
      await fetchConteudos();
    } catch (error) {
      console.error('Error deleting conteudo:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao excluir conteÃºdo: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<ConteudoItem>[] = [
    {
      key: 'descricao',
      label: t('common.description'),
      render: (item) => <span className="font-medium">{item.descricao}</span>,
    },
    {
      key: 'quantidadeEpisodios',
      label: t('content.episodes'),
      className: 'w-24 text-center',
      render: (item) => <span className="font-mono">{item.quantidadeEpisodios}</span>,
    },
    {
      key: 'centroLucro',
      label: t('menu.profitCenters'),
      render: (item) => item.centroLucro || '-',
    },
    {
      key: 'anoProducao',
      label: t('content.productionYear'),
      className: 'w-20',
      render: (item) => item.anoProducao || '-',
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
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
              onClick={(event) => {
                event.stopPropagation();
                void handleDelete(item.id);
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
      <PageHeader title={t('content.title')} description={t('content.description')} />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={t('content.new')}
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
            title={t('content.empty')}
            description={t('content.emptyDescription')}
            icon={Film}
            onAction={() => setIsModalOpen(true)}
            actionLabel={t('content.new')}
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_conteudos_table"
          />
        )}
      </DataCard>

      <ConteudoBackendFormModal
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

export default Conteudo;
