import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, FolderOpen, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { ProgramaFormModal } from '@/components/producao/ProgramaFormModal';
import { programasRepository } from '@/modules/programas/programas.repository.provider';
import type { Programa, ProgramaInput } from '@/modules/programas/programas.types';

const Programas = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();

  const podeIncluir = canIncluir('Produção', 'Programas');
  const podeAlterar = canAlterar('Produção', 'Programas');
  const podeExcluir = canExcluir('Produção', 'Programas');

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Programa | null>(null);
  const [items, setItems] = useState<Programa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await programasRepository.list());
    } catch (err) {
      console.error('Error fetching programas:', err);
      toast({ title: t('common.error'), description: `Erro ao carregar programas: ${(err as Error).message}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data: ProgramaInput) => {
    try {
      await programasRepository.save({
        ...data,
        tenantId: user?.tenantId ?? null,
      }, user?.id);
      toast({ title: t('common.success'), description: editingItem ? 'Programa atualizado!' : 'Programa criado!' });
      await fetchData();
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving programa:', err);
      toast({ title: t('common.error'), description: `Erro ao salvar: ${(err as Error).message}`, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm.delete'))) return;

    try {
      await programasRepository.remove(id);
      toast({ title: t('common.deleted'), description: 'Programa excluído!' });
      await fetchData();
    } catch (err) {
      console.error('Error deleting programa:', err);
      toast({ title: t('common.error'), description: `Erro ao excluir: ${(err as Error).message}`, variant: 'destructive' });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Programa>[] = [
    { key: 'codigoExterno', label: t('common.externalCode'), className: 'w-24', render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span> },
    { key: 'nome', label: t('common.name'), render: (item) => <span className="font-medium">{item.nome}</span> },
    { key: 'unidadeNegocio', label: t('recordings.businessUnit') || 'Unidade de Negócio', render: (item) => item.unidadeNegocio || '-' },
    { key: 'descricao', label: t('common.description'), className: 'hidden md:table-cell', render: (item) => <span className="text-muted-foreground max-w-xs truncate block">{item.descricao || '-'}</span> },
    { key: 'dataCadastro', label: t('common.registrationDate'), className: 'w-32' },
    {
      key: 'acoes',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingItem(item); setIsModalOpen(true); }}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          {podeExcluir && (
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
              <Trash2 className="w-3.5 h-3.5" />
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
      <PageHeader title="Programas" description="Gerencie os programas de produção" />
      <ListActionBar>
        {podeIncluir && <NewButton tooltip="Novo Programa" onClick={() => { setEditingItem(null); setIsModalOpen(true); }} />}
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </ListActionBar>
      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState title={t('common.noResults')} description="Adicione um programa." icon={FolderOpen} onAction={() => setIsModalOpen(true)} actionLabel="Novo Programa" />
        ) : (
          <SortableTable data={filteredItems} columns={columns} getRowKey={(item) => item.id} storageKey="kreato_programas_table" />
        )}
      </DataCard>
      <ProgramaFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !podeAlterar}
      />
    </div>
  );
};

export default Programas;
