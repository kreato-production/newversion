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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProgramaFormModal } from '@/components/producao/ProgramaFormModal';

interface ProgramaDB {
  id: string;
  codigo_externo: string | null;
  nome: string;
  descricao: string | null;
  unidade_negocio_id: string | null;
  created_at: string | null;
  created_by: string | null;
  unidade_negocio?: { nome: string } | null;
}

export interface Programa {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  unidadeNegocioId: string;
  unidadeNegocio: string;
  dataCadastro: string;
}

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
  const [items, setItems] = useState<ProgramaDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('programas')
        .select('*, unidade_negocio:unidade_negocio_id(nome)')
        .order('nome');
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching programas:', err);
      toast({ title: t('common.error'), description: `Erro ao carregar programas: ${(err as Error).message}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toFormFormat = (item: ProgramaDB): Programa => ({
    id: item.id,
    codigoExterno: item.codigo_externo || '',
    nome: item.nome,
    descricao: item.descricao || '',
    unidadeNegocioId: item.unidade_negocio_id || '',
    unidadeNegocio: item.unidade_negocio?.nome || '',
    dataCadastro: item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '',
  });

  const handleSave = async (data: Programa) => {
    try {
      const unidadeId = data.unidadeNegocioId || null;
      const recordData = {
        codigo_externo: data.codigoExterno || null,
        nome: data.nome,
        descricao: data.descricao || null,
        unidade_negocio_id: unidadeId,
        created_by: user?.id || null,
      };

      if (editingItem) {
        const { error } = await supabase.from('programas').update(recordData).eq('id', data.id);
        if (error) throw error;
        toast({ title: t('common.success'), description: 'Programa atualizado!' });
      } else {
        const { error } = await supabase.from('programas').insert(recordData);
        if (error) throw error;
        toast({ title: t('common.success'), description: 'Programa criado!' });
      }
      await fetchData();
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving programa:', err);
      toast({ title: t('common.error'), description: `Erro ao salvar: ${(err as Error).message}`, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirm.delete'))) {
      try {
        const { error } = await supabase.from('programas').delete().eq('id', id);
        if (error) throw error;
        toast({ title: t('common.deleted'), description: 'Programa excluído!' });
        await fetchData();
      } catch (err) {
        console.error('Error deleting programa:', err);
        toast({ title: t('common.error'), description: `Erro ao excluir: ${(err as Error).message}`, variant: 'destructive' });
      }
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome?.toLowerCase().includes(search.toLowerCase()) ||
      (item.codigo_externo || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<ProgramaDB>[] = [
    { key: 'codigo_externo', label: t('common.externalCode'), className: 'w-24', render: (item) => <span className="font-mono text-sm">{item.codigo_externo || '-'}</span> },
    { key: 'nome', label: t('common.name'), render: (item) => <span className="font-medium">{item.nome}</span> },
    { key: 'unidade_negocio_id', label: t('recordings.businessUnit') || 'Unidade de Negócio', render: (item) => item.unidade_negocio?.nome || '-' },
    { key: 'descricao', label: t('common.description'), className: 'hidden md:table-cell', render: (item) => <span className="text-muted-foreground max-w-xs truncate block">{item.descricao || '-'}</span> },
    { key: 'created_at', label: t('common.registrationDate'), className: 'w-32', render: (item) => item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-' },
    {
      key: 'acoes', label: t('common.actions'), className: 'w-24 text-right', sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingItem(toFormFormat(item)); setIsModalOpen(true); }}>
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
