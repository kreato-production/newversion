import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { DepartamentoFormModal } from '@/components/recursos/DepartamentoFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Departamento {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

const Departamentos = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Departamento | null>(null);
  const [items, setItems] = useState<Departamento[]>(() => {
    const stored = localStorage.getItem('kreato_departamentos');
    return stored ? JSON.parse(stored) : [];
  });

  const saveToStorage = (data: Departamento[]) => {
    localStorage.setItem('kreato_departamentos', JSON.stringify(data));
    setItems(data);
  };

  const handleSave = (data: Departamento) => {
    if (editingItem) {
      const updated = items.map((item) => (item.id === data.id ? data : item));
      saveToStorage(updated);
      toast({ title: t('common.success'), description: `Departamento ${t('common.updated').toLowerCase()}!` });
    } else {
      saveToStorage([...items, data]);
      toast({ title: t('common.success'), description: `Departamento ${t('common.save').toLowerCase()}!` });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm.delete'))) {
      saveToStorage(items.filter((item) => item.id !== id));
      // Remover também as funções associadas
      localStorage.removeItem(`kreato_departamento_funcoes_${id}`);
      toast({ title: t('common.deleted'), description: `Departamento ${t('common.deleted').toLowerCase()}!` });
    }
  };

  const handleEdit = (item: Departamento) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Departamento & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: t('common.code'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="font-medium">{item.nome}</span>
        </div>
      ),
    },
    {
      key: 'descricao',
      label: t('common.description'),
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">{item.descricao || '-'}</span>
      ),
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
      className: 'w-32',
    },
    {
      key: 'usuarioCadastro',
      label: t('common.user'),
      className: 'w-32',
    },
    {
      key: 'actions',
      label: t('common.actions'),
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
        title="Departamentos"
        description="Gerencie os departamentos da organização"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel={`${t('common.new')} Departamento`}
      >
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title={t('common.noResults')}
            description="Adicione um departamento."
            icon={Building2}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Departamento"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_departamentos"
          />
        )}
      </DataCard>

      <DepartamentoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={(data) => handleSave(data as Departamento)}
        data={editingItem}
      />
    </div>
  );
};

export default Departamentos;
