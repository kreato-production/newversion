import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Building2, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
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
      toast({ title: t('common.success'), description: t('businessUnits.updated') });
    } else {
      saveToStorage([...items, data]);
      toast({ title: t('common.success'), description: t('businessUnits.saved') });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm.delete'))) {
      saveToStorage(items.filter((item) => item.id !== id));
      toast({ title: t('common.success'), description: t('businessUnits.deleted') });
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
      label: t('common.logo'),
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
        title={t('businessUnits.title')}
        description={t('businessUnits.description')}
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel={t('businessUnits.new')}
      >
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title={t('businessUnits.empty')}
            description={t('businessUnits.emptyDescription')}
            icon={Building2}
            onAction={() => setIsModalOpen(true)}
            actionLabel={t('common.add')}
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
