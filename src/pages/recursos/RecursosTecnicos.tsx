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
import { Edit, Trash2, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RecursoTecnicoFormModal } from '@/components/recursos/RecursoTecnicoFormModal';

export interface RecursoTecnico {
  id: string;
  codigoExterno: string;
  nome: string;
  cargoOperador: string; // Cargo que pode operar este recurso
  dataCadastro: string;
  usuarioCadastro: string;
}

const RecursosTecnicos = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecursoTecnico | null>(null);
  const [items, setItems] = useState<RecursoTecnico[]>(() => {
    const stored = localStorage.getItem('kreato_recursos_tecnicos');
    return stored ? JSON.parse(stored) : [];
  });

  const saveToStorage = (data: RecursoTecnico[]) => {
    localStorage.setItem('kreato_recursos_tecnicos', JSON.stringify(data));
    setItems(data);
  };

  const handleSave = (data: RecursoTecnico) => {
    if (editingItem) {
      const updated = items.map((item) => (item.id === data.id ? data : item));
      saveToStorage(updated);
      toast({ title: 'Sucesso', description: 'Recurso técnico atualizado!' });
    } else {
      saveToStorage([...items, data]);
      toast({ title: 'Sucesso', description: 'Recurso técnico cadastrado!' });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir este recurso técnico?')) {
      saveToStorage(items.filter((item) => item.id !== id));
      toast({ title: 'Excluído', description: 'Recurso técnico removido!' });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Recursos Técnicos"
        description="Gerencie os recursos técnicos disponíveis"
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
            title="Nenhum recurso técnico cadastrado"
            description="Adicione recursos técnicos para utilizar nas gravações."
            icon={Wrench}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Adicionar Recurso"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Código</TableHead>
                <TableHead>Nome</TableHead>
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

      <RecursoTecnicoFormModal
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

export default RecursosTecnicos;
