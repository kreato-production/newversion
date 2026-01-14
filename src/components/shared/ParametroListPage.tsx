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
import { ParametroFormModal } from '@/components/shared/ParametroFormModal';
import { Edit, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
      toast({ title: 'Sucesso', description: `${entityName} atualizado com sucesso!` });
    } else {
      saveToStorage([...items, data]);
      toast({ title: 'Sucesso', description: `${entityName} cadastrado com sucesso!` });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(`Deseja realmente excluir este ${entityName.toLowerCase()}?`)) {
      saveToStorage(items.filter((item) => item.id !== id));
      toast({ title: 'Excluído', description: `${entityName} removido com sucesso!` });
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

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel={`Novo ${entityName}`}
      >
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title={`Nenhum ${entityName.toLowerCase()} cadastrado`}
            description={`Comece adicionando ${entityName.toLowerCase()}s para organizar seu sistema.`}
            icon={Settings}
            onAction={() => setIsModalOpen(true)}
            actionLabel={`Adicionar ${entityName}`}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
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
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">
                    {item.descricao || '-'}
                  </TableCell>
                  <TableCell>{item.dataCadastro}</TableCell>
                  <TableCell>{item.usuarioCadastro}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
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
