import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings, Loader2, Star } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { StatusGravacaoFormModal } from '@/components/producao/StatusGravacaoFormModal';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { usePermissions } from '@/hooks/usePermissions';

type StatusGravacaoDB = Tables<'status_gravacao'>;

export interface StatusGravacaoItem {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  cor: string;
  isInicial: boolean;
  dataCadastro: string;
  usuarioCadastro: string;
}

const mapDbToStatusGravacao = (db: StatusGravacaoDB): StatusGravacaoItem => ({
  id: db.id,
  codigoExterno: db.codigo_externo || '',
  nome: db.nome,
  descricao: db.descricao || '',
  cor: db.cor || '#888888',
  isInicial: (db as any).is_inicial || false,
  dataCadastro: db.created_at ? new Date(db.created_at).toLocaleDateString('pt-BR') : '',
  usuarioCadastro: '',
});

const StatusGravacao = () => {
  const { toast } = useToast();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StatusGravacaoItem | null>(null);
  const [items, setItems] = useState<StatusGravacaoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatusGravacao = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('status_gravacao')
        .select('*')
        .order('nome');

      if (error) throw error;
      setItems((data || []).map(mapDbToStatusGravacao));
    } catch (error) {
      console.error('Error fetching status_gravacao:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar status de gravação', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusGravacao();
  }, []);

  const handleSave = async (data: StatusGravacaoItem) => {
    try {
      const dbData: TablesInsert<'status_gravacao'> = {
        id: data.id || undefined,
        codigo_externo: data.codigoExterno || null,
        nome: data.nome,
        descricao: data.descricao || null,
        cor: data.cor || '#888888',
      };

      if (editingItem) {
        const { error } = await supabase
          .from('status_gravacao')
          .update(dbData as TablesUpdate<'status_gravacao'>)
          .eq('id', data.id);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Status atualizado com sucesso!' });
      } else {
        const { error } = await supabase.from('status_gravacao').insert(dbData);
        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Status cadastrado com sucesso!' });
      }

      await fetchStatusGravacao();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving status_gravacao:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar status', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este status?')) {
      try {
        const { error } = await supabase.from('status_gravacao').delete().eq('id', id);
        if (error) throw error;
        toast({ title: 'Excluído', description: 'Status removido com sucesso!' });
        await fetchStatusGravacao();
      } catch (error) {
        console.error('Error deleting status_gravacao:', error);
        toast({ title: 'Erro', description: 'Erro ao excluir status', variant: 'destructive' });
      }
    }
  };

  const handleToggleInicial = async (id: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('status_gravacao')
        .update({ is_inicial: value } as any)
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Sucesso', description: value ? 'Status definido como inicial' : 'Status inicial removido' });
      await fetchStatusGravacao();
    } catch (error) {
      console.error('Error toggling is_inicial:', error);
      toast({ title: 'Erro', description: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<StatusGravacaoItem & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: 'Código',
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => (
        <Badge 
          style={{ backgroundColor: item.cor || '#6b7280' }}
          className="text-white"
        >
          {item.nome}
        </Badge>
      ),
    },
    {
      key: 'cor',
      label: 'Cor',
      className: 'w-24',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded border border-border"
            style={{ backgroundColor: item.cor || '#6b7280' }}
          />
          <span className="text-xs font-mono text-muted-foreground">{item.cor || '-'}</span>
        </div>
      ),
    },
    {
      key: 'descricao',
      label: 'Descrição',
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">{item.descricao || '-'}</span>
      ),
    },
    {
      key: 'isInicial' as any,
      label: 'Inicial',
      className: 'w-20 text-center',
      sortable: false,
      render: (item) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => { e.stopPropagation(); handleToggleInicial(item.id, !item.isInicial); }}
              >
                <Star className={`h-4 w-4 ${item.isInicial ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {item.isInicial ? 'Status inicial ativo' : 'Definir como status inicial'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      key: 'dataCadastro',
      label: 'Data Cadastro',
      className: 'w-32',
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingItem(item); setIsModalOpen(true); }}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Status de Gravação"
        description="Gerencie os status possíveis para gravações"
      />

      <ListActionBar>
        <NewButton tooltip="Novo Status" onClick={() => { setEditingItem(null); setIsModalOpen(true); }} />
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
            title="Nenhum status cadastrado"
            description="Comece adicionando status para organizar seu sistema."
            icon={Settings}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Status"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_status_gravacao_table"
          />
        )}
      </DataCard>

      <StatusGravacaoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar('Produção', 'Parametrizações', 'Status Gravação')}
      />
    </div>
  );
};

export default StatusGravacao;
