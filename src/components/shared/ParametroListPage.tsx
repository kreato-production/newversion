import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ParametroFormModal } from '@/components/shared/ParametroFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Parametro {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

interface ParametroListPageProps {
  title: string;
  description: string;
  entityName: string;
  storageKey: string;
}

const ParametroListPage = ({ title, description, entityName, storageKey }: ParametroListPageProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Parametro | null>(null);
  const [items, setItems] = useState<Parametro[]>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  });

  const saveToStorage = (data: Parametro[]) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
    setItems(data);
  };

  const handleSave = (data: Parametro) => {
    if (editingItem) {
      const updated = items.map((item) => (item.id === data.id ? data : item));
      saveToStorage(updated);
      toast({ title: t('common.success'), description: `${entityName} ${t('common.updated').toLowerCase()}!` });
    } else {
      saveToStorage([...items, data]);
      toast({ title: t('common.success'), description: `${entityName} ${t('common.save').toLowerCase()}!` });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm.delete'))) {
      saveToStorage(items.filter((item) => item.id !== id));
      toast({ title: t('common.deleted'), description: `${entityName} ${t('common.deleted').toLowerCase()}!` });
    }
  };

  const handleEdit = (item: Parametro) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Parametro & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: t('common.code'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => <span className="font-medium">{item.nome}</span>,
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
        title={title}
        description={description}
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel={`${t('common.new')} ${entityName}`}
      >
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title={t('common.noResults')}
            description={`${t('common.add')} ${entityName.toLowerCase()}.`}
            icon={Settings}
            onAction={() => setIsModalOpen(true)}
            actionLabel={`${t('common.add')} ${entityName}`}
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey={storageKey}
          />
        )}
      </DataCard>

      <ParametroFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        title={entityName}
        data={editingItem}
      />
    </div>
  );
};

export default ParametroListPage;
