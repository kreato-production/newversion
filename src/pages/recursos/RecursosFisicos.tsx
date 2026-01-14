import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { Edit, Trash2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RecursoFisicoFormModal } from '@/components/recursos/RecursoFisicoFormModal';

export interface RecursoFisico {
  id: string;
  codigoExterno: string;
  nome: string;
  custoHora: number;
  dataCadastro: string;
  usuarioCadastro: string;
}

const RecursosFisicos = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="w-32">Custo/Hora</TableHead>
                <TableHead className="w-32">Data Cadastro</TableHead>
                <TableHead className="w-32">Usuário</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.codigoExterno || '-'}</TableCell>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell>{formatCurrency(item.custoHora)}</TableCell>
                  <TableCell>{item.dataCadastro}</TableCell>
                  <TableCell>{item.usuarioCadastro}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </div>
  );
};

export default RecursosFisicos;
