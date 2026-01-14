import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StatusGravacaoFormModal } from '@/components/producao/StatusGravacaoFormModal';
import { Badge } from '@/components/ui/badge';

export interface StatusGravacaoItem {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  cor: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

const StatusGravacao = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StatusGravacaoItem | null>(null);
  const [items, setItems] = useState<StatusGravacaoItem[]>(() => {
    const stored = localStorage.getItem('kreato_status_gravacao');
    return stored ? JSON.parse(stored) : [];
  });

  const saveToStorage = (data: StatusGravacaoItem[]) => {
    localStorage.setItem('kreato_status_gravacao', JSON.stringify(data));
    setItems(data);
  };

  const handleSave = (data: StatusGravacaoItem) => {
    if (editingItem) {
      const updated = items.map((item) => (item.id === data.id ? data : item));
      saveToStorage(updated);
      toast({ title: 'Sucesso', description: 'Status atualizado com sucesso!' });
    } else {
      saveToStorage([...items, data]);
      toast({ title: 'Sucesso', description: 'Status cadastrado com sucesso!' });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este status?')) {
      saveToStorage(items.filter((item) => item.id !== id));
      toast({ title: 'Excluído', description: 'Status removido com sucesso!' });
    }
  };

  const handleEdit = (item: StatusGravacaoItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
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
        title="Status de Gravação"
        description="Gerencie os status possíveis para gravações"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Novo Status"
      >
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
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
      />
    </div>
  );
};

export default StatusGravacao;
