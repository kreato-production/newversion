import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, AlertTriangle, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { IncidenciaGravacaoFormModal } from '@/components/producao/IncidenciaGravacaoFormModal';

export interface IncidenciaGravacao {
  id: string;
  codigo_externo: string | null;
  titulo: string;
  gravacao_id: string | null;
  recurso_fisico_id: string | null;
  severidade_id: string | null;
  impacto_id: string | null;
  categoria_id: string | null;
  classificacao_id: string | null;
  data_incidencia: string | null;
  horario_incidencia: string | null;
  tempo_incidencia: string | null;
  descricao: string | null;
  causa_provavel: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  // joined
  gravacao_nome?: string;
  severidade_titulo?: string;
  severidade_cor?: string;
}

const IncidenciasGravacao = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canAlterar, canIncluir, canExcluir } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IncidenciaGravacao | null>(null);
  const [items, setItems] = useState<IncidenciaGravacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const permPath = ['Produção', 'Incidências de Gravação'] as const;

  const fetchData = useCallback(async () => {
    if (!session) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('incidencias_gravacao')
        .select(`*, gravacoes(nome), severidades_incidencia(titulo, cor)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems((data || []).map((item: any) => ({
        ...item,
        gravacao_nome: item.gravacoes?.nome || null,
        severidade_titulo: item.severidades_incidencia?.titulo || null,
        severidade_cor: item.severidades_incidencia?.cor || null,
      })));
    } catch (err) {
      toast({ title: t('common.error'), description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm.delete'))) return;
    try {
      const { error } = await (supabase as any).from('incidencias_gravacao').delete().eq('id', id);
      if (error) throw error;
      toast({ title: t('common.deleted'), description: `${t('incident.entity')} ${t('common.deleted').toLowerCase()}!` });
      await fetchData();
    } catch (err) {
      toast({ title: t('common.error'), description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    await fetchData();
    setEditingItem(null);
  };

  const filteredItems = items.filter(
    (item) =>
      item.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      (item.codigo_externo || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.gravacao_nome || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<IncidenciaGravacao & { actions?: never }>[] = [
    {
      key: 'codigo_externo',
      label: t('common.externalCode'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigo_externo || '-'}</span>,
    },
    {
      key: 'titulo',
      label: t('incident.title'),
      render: (item) => <span className="font-medium">{item.titulo}</span>,
    },
    {
      key: 'gravacao_nome' as any,
      label: t('incident.recording'),
      className: 'hidden md:table-cell',
      render: (item) => <span className="text-muted-foreground">{item.gravacao_nome || '-'}</span>,
    },
    {
      key: 'severidade_titulo' as any,
      label: t('incident.severity'),
      className: 'hidden md:table-cell',
      render: (item) => item.severidade_titulo ? (
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.severidade_cor || '#888' }} />
          <span>{item.severidade_titulo}</span>
        </div>
      ) : '-',
    },
    {
      key: 'data_incidencia',
      label: t('incident.date'),
      className: 'w-32',
      render: (item) => item.data_incidencia ? new Date(item.data_incidencia + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
    },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingItem(item); setIsModalOpen(true); }}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
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
      <PageHeader title={t('incident.pageTitle')} description={t('incident.pageDescription')} />
      <ListActionBar>
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
        <Button onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" />
          {`${t('common.new')} ${t('incident.entity')}`}
        </Button>
      </ListActionBar>
      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title={t('common.noResults')}
            description={`${t('common.add')} ${t('incident.entity').toLowerCase()}.`}
            icon={AlertTriangle}
            onAction={() => setIsModalOpen(true)}
            actionLabel={`${t('common.add')} ${t('incident.entity')}`}
          />
        ) : (
          <SortableTable data={filteredItems} columns={columns} getRowKey={(item) => item.id} storageKey="kreato_incidencias_gravacao" />
        )}
      </DataCard>
      <IncidenciaGravacaoFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar(permPath[0], permPath[1])}
      />
    </div>
  );
};

export default IncidenciasGravacao;
