import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import {
  Edit,
  Trash2,
  Landmark,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Loader2,
} from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CentroLucroFormModal, type CentroLucro } from '@/components/admin/CentroLucroFormModal';
import { cn } from '@/lib/utils';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';

const repository = new ApiParametrizacoesRepository();

const CentrosLucro = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CentroLucro | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<CentroLucro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listCentrosLucro();
      setItems(response.data);
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
  }, [toast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleSave = async (data: CentroLucro) => {
    try {
      await repository.saveCentroLucro({
        ...(editingItem ? { id: data.id } : {}),
        codigoExterno: data.codigoExterno || '',
        nome: data.nome,
        descricao: data.descricao || '',
        status: data.status,
        parentId: data.parentId,
      });

      toast({
        title: 'Sucesso',
        description: editingItem ? 'Centro de Custos atualizado!' : 'Centro de Custos cadastrado!',
      });
      await fetchData();
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving centro lucro:', err);
      toast({
        title: 'Erro',
        description: `Erro ao salvar: ${(err as Error).message}`,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    const hasChildren = items.some((item) => item.parentId === id);
    if (hasChildren) {
      toast({
        title: 'Nao e possivel excluir',
        description: 'Este centro de custos possui itens filhos. Exclua-os primeiro.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Deseja realmente excluir este centro de custos?')) {
      return;
    }

    try {
      await repository.removeCentroLucro(id);
      await fetchData();
      toast({ title: 'Excluido', description: 'Centro de Custos removido!' });
    } catch (err) {
      console.error('Error deleting centro lucro:', err);
      toast({
        title: 'Erro',
        description: `Erro ao excluir: ${(err as Error).message}`,
        variant: 'destructive',
      });
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
        item.codigoExterno.toLowerCase().includes(search.toLowerCase()),
    );
  }, [items, search]);

  const getChildren = (parentId: string | null): CentroLucro[] =>
    filteredItems.filter((item) => item.parentId === parentId);
  const hasChildren = (id: string): boolean => items.some((item) => item.parentId === id);

  const renderItem = (item: CentroLucro, level = 0) => {
    const children = getChildren(item.id);
    const isExpanded = expandedItems.has(item.id);
    const hasChildItems = hasChildren(item.id);

    return (
      <div key={item.id}>
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-3 border-b hover:bg-muted/50 transition-colors',
            level > 0 && 'bg-muted/20',
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

          <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>{item.status}</Badge>

          <span className="text-xs text-muted-foreground w-24">
            {item.dataCadastro ? new Date(item.dataCadastro).toLocaleDateString('pt-BR') : '-'}
          </span>

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
              onClick={() => void handleDelete(item.id)}
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
        title="Centro de Custos"
        description="Gerencie os centros de custos hierarquicos"
      />

      <ListActionBar>
        <NewButton
          tooltip="Novo Centro de Custos"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} />
      </ListActionBar>

      <DataCard>
        {items.length === 0 ? (
          <EmptyState
            title="Nenhum centro de custos cadastrado"
            description="Adicione centros de custos para organizar suas operacoes."
            icon={FolderTree}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Centro de Custos"
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
              <div className="w-20">Acoes</div>
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
        navigation={(() => {
          const navIndex = editingItem
            ? filteredItems.findIndex((i) => i.id === editingItem.id)
            : -1;
          return navIndex >= 0
            ? {
                currentIndex: navIndex,
                total: filteredItems.length,
                onPrevious: () => setEditingItem(filteredItems[navIndex - 1]),
                onNext: () => setEditingItem(filteredItems[navIndex + 1]),
              }
            : undefined;
        })()}
      />
    </div>
  );
};

export default CentrosLucro;
