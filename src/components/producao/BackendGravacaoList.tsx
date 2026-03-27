import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Video, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { GravacaoBackendFormModal } from './GravacaoBackendFormModal';
import { gravacoesRepository } from '@/modules/gravacoes/gravacoes.repository.provider';
import type { Gravacao, GravacaoInput } from '@/modules/gravacoes/gravacoes.types';

export const BackendGravacaoList = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();

  const podeIncluir = canIncluir('Produção', 'Gravação');
  const podeAlterar = canAlterar('Produção', 'Gravação');
  const podeExcluir = canExcluir('Produção', 'Gravação');

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Gravacao | null>(null);
  const [items, setItems] = useState<Gravacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await gravacoesRepository.list(user?.unidadeIds));
    } catch (error) {
      console.error('Error fetching gravacoes from backend:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao carregar gravações: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast, t, user?.unidadeIds]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (input: GravacaoInput) => {
    try {
      await gravacoesRepository.save(input, user?.id);
      toast({
        title: t('common.success'),
        description: editingItem ? 'Gravação atualizada!' : 'Gravação criada!',
      });
      await fetchData();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving gravacao from backend:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao salvar: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm.delete'))) return;

    try {
      await gravacoesRepository.remove(id);
      toast({ title: t('common.deleted'), description: 'Gravação excluída!' });
      await fetchData();
    } catch (error) {
      console.error('Error deleting gravacao from backend:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao excluir: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const filteredItems = items.filter((item) =>
    item.nome.toLowerCase().includes(search.toLowerCase())
    || item.codigo.toLowerCase().includes(search.toLowerCase())
    || item.codigoExterno.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Gravacao>[] = [
    {
      key: 'codigo',
      label: t('common.code'),
      className: 'w-32',
      render: (item) => <span className="font-mono text-sm font-medium text-primary">{item.codigo || '-'}</span>,
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'tipoConteudo',
      label: t('common.type'),
      render: (item) => item.tipoConteudo || '-',
    },
    {
      key: 'classificacao',
      label: t('content.classification'),
      render: (item) => item.classificacao || '-',
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (item) => <Badge className="bg-muted text-muted-foreground">{item.status || t('common.none')}</Badge>,
    },
    {
      key: 'dataPrevista',
      label: t('recordings.expectedDate'),
      className: 'w-32',
      render: (item) => item.dataPrevista ? new Date(`${item.dataPrevista}T00:00:00`).toLocaleDateString('pt-BR') : '-',
    },
    {
      key: 'acoes',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => { setEditingItem(item); setIsModalOpen(true); }}>
            <Edit className="w-4 h-4" />
          </Button>
          {podeExcluir && (
            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <PageHeader title={t('recordings.title')} description="Fluxo principal de gravações migrado para a API própria." />
      <ListActionBar>
        {podeIncluir && <NewButton tooltip={t('recordings.new')} onClick={() => { setEditingItem(null); setIsModalOpen(true); }} />}
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </ListActionBar>
      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title={t('recordings.empty')}
            description="Adicione uma gravação usando o backend próprio."
            icon={Video}
            onAction={() => setIsModalOpen(true)}
            actionLabel={t('recordings.new')}
          />
        ) : (
          <SortableTable data={filteredItems} columns={columns} getRowKey={(item) => item.id} storageKey="kreato_gravacoes_backend_table" />
        )}
      </DataCard>
      <GravacaoBackendFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !podeAlterar}
      />
    </div>
  );
};
