import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ParametroFormModal } from '@/components/shared/ParametroFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trash2, Settings, Building2, Briefcase, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import DepartamentoFuncoesTab from '@/components/recursos/DepartamentoFuncoesTab';

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
  const [selectedDepartamento, setSelectedDepartamento] = useState<Departamento | null>(null);
  const [activeTab, setActiveTab] = useState('dados');
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
      toast({ title: t('common.deleted'), description: `Departamento ${t('common.deleted').toLowerCase()}!` });
    }
  };

  const handleEdit = (item: Departamento) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSelectDepartamento = (item: Departamento) => {
    setSelectedDepartamento(item);
    setActiveTab('dados');
  };

  const handleVoltar = () => {
    setSelectedDepartamento(null);
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
        <button
          className="font-medium text-primary hover:underline text-left"
          onClick={() => handleSelectDepartamento(item)}
        >
          {item.nome}
        </button>
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

  // Vista de detalhe do departamento com tabs
  if (selectedDepartamento) {
    return (
      <div>
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={handleVoltar} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar à lista
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{selectedDepartamento.nome}</h1>
              <p className="text-sm text-muted-foreground">
                Código: {selectedDepartamento.codigoExterno || '-'}
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dados" className="gap-2">
              <Building2 className="h-4 w-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="funcoes" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Funções
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-6">
            <DataCard>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="mt-1 font-medium">{selectedDepartamento.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Código Externo</label>
                  <p className="mt-1 font-medium">{selectedDepartamento.codigoExterno || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="mt-1">{selectedDepartamento.descricao || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Cadastro</label>
                  <p className="mt-1">{selectedDepartamento.dataCadastro}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Usuário de Cadastro</label>
                  <p className="mt-1">{selectedDepartamento.usuarioCadastro}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => handleEdit(selectedDepartamento)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </DataCard>
          </TabsContent>

          <TabsContent value="funcoes" className="mt-6">
            <DataCard>
              <DepartamentoFuncoesTab departamentoId={selectedDepartamento.id} />
            </DataCard>
          </TabsContent>
        </Tabs>

        <ParametroFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onSave={(data) => {
            const departamento = data as Departamento;
            handleSave(departamento);
            setSelectedDepartamento(departamento);
          }}
          title="Departamento"
          data={editingItem}
        />
      </div>
    );
  }

  // Vista de lista
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
            icon={Settings}
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

      <ParametroFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        title="Departamento"
        data={editingItem}
      />
    </div>
  );
};

export default Departamentos;
