import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Building2, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UnidadeNegocioFormModal } from '@/components/admin/UnidadeNegocioFormModal';

export interface UnidadeNegocio {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  imagem?: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

const STORAGE_KEY = 'kreato_unidades_negocio';

const UnidadesNegocio = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UnidadeNegocio | null>(null);
  const [items, setItems] = useState<UnidadeNegocio[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const saveToStorage = (data: UnidadeNegocio[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setItems(data);
  };

  const handleSave = (data: UnidadeNegocio) => {
    if (editingItem) {
      const updated = items.map((item) => (item.id === data.id ? data : item));
      saveToStorage(updated);
      toast({ title: 'Sucesso', description: 'Unidade de Negócio atualizada com sucesso!' });
    } else {
      saveToStorage([...items, data]);
      toast({ title: 'Sucesso', description: 'Unidade de Negócio cadastrada com sucesso!' });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir esta unidade de negócio?')) {
      saveToStorage(items.filter((item) => item.id !== id));
      toast({ title: 'Excluído', description: 'Unidade de Negócio removida com sucesso!' });
    }
  };

  const handleEdit = (item: UnidadeNegocio) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<UnidadeNegocio & { actions?: never }>[] = [
    {
      key: 'imagem',
      label: 'Logo',
      className: 'w-16',
      sortable: false,
      render: (item) => (
        item.imagem ? (
          <img
            src={item.imagem}
            alt={item.nome}
            className="w-10 h-10 rounded object-contain bg-muted"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </div>
        )
      ),
    },
    {
      key: 'codigoExterno',
      label: 'Código',
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => <span className="font-medium">{item.nome}</span>,
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
      key: 'dataCadastro',
      label: 'Data Cadastro',
      className: 'w-32',
    },
    {
      key: 'usuarioCadastro',
      label: 'Usuário',
      className: 'w-32',
    },
    {
      key: 'actions',
      label: 'Ações',
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(item)}>
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
        title="Unidades de Negócio"
        description="Gerencie as unidades de negócio da organização"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Nova Unidade de Negócio"
      >
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhuma unidade de negócio cadastrada"
            description="Comece adicionando unidades de negócio para organizar seu sistema."
            icon={Building2}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Unidade de Negócio"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey={STORAGE_KEY}
          />
        )}
      </DataCard>

      <UnidadeNegocioFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
      />
    </div>
  );
};

export default UnidadesNegocio;
