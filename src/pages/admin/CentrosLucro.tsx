import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, Landmark, ChevronRight, ChevronDown, FolderTree, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CentroLucroFormModal, CentroLucro } from '@/components/admin/CentroLucroFormModal';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CentrosLucro = () => {
  const { toast } = useToast();
  const { session, user } = useAuth();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CentroLucro | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<CentroLucro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('centros_lucro')
        .select('*')
        .order('nome');

      if (error) throw error;

      setItems(
        (data || []).map((item) => ({
          id: item.id,
          codigoExterno: item.codigo_externo || '',
          nome: item.nome,
          descricao: item.descricao || '',
          status: (item.status as 'Ativo' | 'Inativo') || 'Ativo',
          parentId: item.parent_id || null,
          dataCadastro: item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '',
          usuarioCadastro: user?.nome || '',
        }))
      );
    } catch (err) {
      console.error('Error fetching centros lucro:', err);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data: CentroLucro) => {
    try {
      const dbData = {
        codigo_externo: data.codigoExterno || null,
        nome: data.nome,
        descricao: data.descricao || null,
        status: data.status,
        parent_id: data.parentId || null,
        created_by: user?.id || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('centros_lucro')
          .update(dbData)
          .eq('id', data.id);

        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Centro de Lucro atualizado!' });
      } else {
        const { error } = await supabase.from('centros_lucro').insert(dbData);

        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Centro de Lucro cadastrado!' });
      }

      await fetchData();
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving centro lucro:', err);
      toast({
        title: 'Erro',
        description: `Erro ao salvar: ${(err as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const hasChildren = items.some((item) => item.parentId === id);
    if (hasChildren) {
      toast({
        title: 'Não é possível excluir',
        description: 'Este centro de lucro possui itens filhos. Exclua-os primeiro.',
        variant: 'destructive',
      });
      return;
    }

    if (confirm('Deseja realmente excluir este centro de lucro?')) {
      try {
        const { error } = await supabase.from('centros_lucro').delete().eq('id', id);

        if (error) throw error;
        await fetchData();
        toast({ title: 'Excluído', description: 'Centro de Lucro removido!' });
      } catch (err) {
        console.error('Error deleting centro lucro:', err);
        toast({
          title: 'Erro',
          description: `Erro ao excluir: ${(err as Error).message}`,
          variant: 'destructive',
        });
      }
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filteredItems = useMemo(() => {
    if (!search) return items;
    return items.filter(
      (item) =>
        item.nome.toLowerCase().includes(search.toLowerCase()) ||
        item.codigoExterno?.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const getChildren = (parentId: string | null): CentroLucro[] => {
    return filteredItems.filter((item) => item.parentId === parentId);
  };

  const hasChildren = (id: string): boolean => {
    return items.some((item) => item.parentId === id);
  };

  const renderItem = (item: CentroLucro, level: number = 0) => {
    const children = getChildren(item.id);
    const isExpanded = expandedItems.has(item.id);
    const hasChildItems = hasChildren(item.id);

    return (
      <div key={item.id}>
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-3 border-b hover:bg-muted/50 transition-colors',
            level > 0 && 'bg-muted/20'
          )}
          style={{ paddingLeft: `${16 + level * 24}px` }}
        >
          <div className="w-6 flex justify-center">
            {hasChildItems ? (
              <button
                onClick={() => toggleExpand(item.id)}
                className="p-0.5 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}
          </div>

          <Landmark className="w-4 h-4 text-primary shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.nome}</span>
              {item.codigoExterno && (
                <span className="text-xs text-muted-foreground font-mono">
                  [{item.codigoExterno}]
                </span>
              )}
            </div>
            {item.descricao && (
              <p className="text-xs text-muted-foreground truncate">{item.descricao}</p>
            )}
          </div>

          <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>
            {item.status}
          </Badge>

          <span className="text-xs text-muted-foreground w-24">{item.dataCadastro}</span>

          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setEditingItem(item);
                setIsModalOpen(true);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDelete(item.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isExpanded && children.length > 0 && (
          <div>{children.map((child) => renderItem(child, level + 1))}</div>
        )}
      </div>
    );
  };

  const rootItems = getChildren(null);

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
        title="Centro de Lucro"
        description="Gerencie os centros de lucro hierárquicos"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Novo Centro de Lucro"
      />

      <ListActionBar>
        <SearchBar value={search} onChange={setSearch} />
      </ListActionBar>

      <DataCard>
        {items.length === 0 ? (
          <EmptyState
            title="Nenhum centro de lucro cadastrado"
            description="Adicione centros de lucro para organizar suas operações."
            icon={FolderTree}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Centro de Lucro"
          />
        ) : rootItems.length === 0 && search ? (
          <EmptyState
            title="Nenhum resultado encontrado"
            description="Tente buscar por outro termo."
            icon={Landmark}
          />
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
              <div className="w-6" />
              <div className="w-4" />
              <div className="flex-1">Nome</div>
              <div className="w-16">Status</div>
              <div className="w-24">Data</div>
              <div className="w-20">Ações</div>
            </div>
            {rootItems.map((item) => renderItem(item))}
          </div>
        )}
      </DataCard>

      <CentroLucroFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        centrosLucro={items}
      />
    </div>
  );
};

export default CentrosLucro;
