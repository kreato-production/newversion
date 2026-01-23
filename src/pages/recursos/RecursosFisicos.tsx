import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { Edit, Trash2, MapPin, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RecursoFisicoFormModal } from '@/components/recursos/RecursoFisicoFormModal';
import { MapaRecursosFisicosModal } from '@/components/recursos/MapaRecursosFisicosModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';

export interface FaixaDisponibilidade {
  id: string;
  dataInicio: string;
  dataFim: string;
  horaInicio: string;
  horaFim: string;
  diasSemana: number[]; // 0 = Dom, 1 = Seg, ..., 6 = Sáb
}

export interface RecursoFisico {
  id: string;
  codigoExterno: string;
  nome: string;
  custoHora: number;
  faixasDisponibilidade: FaixaDisponibilidade[];
  dataCadastro: string;
  usuarioCadastro: string;
}

const RecursosFisicos = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapaOpen, setIsMapaOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecursoFisico | null>(null);
  const [items, setItems] = useState<RecursoFisico[]>(() => {
    const stored = localStorage.getItem('kreato_recursos_fisicos');
    return stored ? JSON.parse(stored) : [];
  });

  const saveToStorage = (data: RecursoFisico[]) => {
    localStorage.setItem('kreato_recursos_fisicos', JSON.stringify(data));
    setItems(data);
  };

  const handleSave = (data: RecursoFisico) => {
    if (editingItem) {
      const updated = items.map((item) => (item.id === data.id ? data : item));
      saveToStorage(updated);
      toast({ title: 'Sucesso', description: 'Recurso físico atualizado!' });
    } else {
      saveToStorage([...items, data]);
      toast({ title: 'Sucesso', description: 'Recurso físico cadastrado!' });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este recurso físico?')) {
      saveToStorage(items.filter((item) => item.id !== id));
      toast({ title: 'Excluído', description: 'Recurso físico removido!' });
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<RecursoFisico>[] = [
    {
      key: 'codigoExterno',
      label: 'Código',
      className: 'w-24',
      render: (item) => (
        <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>
      ),
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'custoHora',
      label: 'Custo/Hora',
      className: 'w-32',
      render: (item) => formatCurrency(item.custoHora),
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
      key: 'acoes',
      label: 'Ações',
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Recursos Físicos"
        description="Gerencie os recursos físicos (espaços, estúdios, etc.)"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Novo Recurso"
      >
        <Button
          variant="outline"
          onClick={() => setIsMapaOpen(true)}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Mapa de Disponibilidade
        </Button>
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhum recurso físico cadastrado"
            description="Adicione recursos físicos como estúdios e salas."
            icon={MapPin}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Recurso"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_recursos_fisicos_table"
          />
        )}
      </DataCard>

      <RecursoFisicoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
      />

      <MapaRecursosFisicosModal
        isOpen={isMapaOpen}
        onClose={() => setIsMapaOpen(false)}
        recursos={items}
      />
    </div>
  );
};

export default RecursosFisicos;
