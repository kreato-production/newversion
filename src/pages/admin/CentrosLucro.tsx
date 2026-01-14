import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { Edit, Trash2, Landmark, ChevronRight, ChevronDown, FolderTree } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CentroLucroFormModal, CentroLucro } from '@/components/admin/CentroLucroFormModal';
import { cn } from '@/lib/utils';

const CentrosLucro = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CentroLucro | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<CentroLucro[]>(() => {
    const stored = localStorage.getItem('kreato_centros_lucro');
    return stored ? JSON.parse(stored) : [];
  });

  const saveToStorage = (data: CentroLucro[]) => {
    localStorage.setItem('kreato_centros_lucro', JSON.stringify(data));
    setItems(data);
  };

  const handleSave = (data: CentroLucro) => {
    if (editingItem) {
      const updated = items.map((item) => (item.id === data.id ? data : item));
      saveToStorage(updated);
      toast({ title: 'Sucesso', description: 'Centro de Lucro atualizado!' });
    } else {
      saveToStorage([...items, data]);
      toast({ title: 'Sucesso', description: 'Centro de Lucro cadastrado!' });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    // Verificar se tem filhos
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
      saveToStorage(items.filter((item) => item.id !== id));
      toast({ title: 'Excluído', description: 'Centro de Lucro removido!' });
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

  // Filtra itens pela busca
  const filteredItems = useMemo(() => {
    if (!search) return items;
    return items.filter(
      (item) =>
        item.nome.toLowerCase().includes(search.toLowerCase()) ||
        item.codigoExterno?.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  // Organiza hierarquia
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
      >
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

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
