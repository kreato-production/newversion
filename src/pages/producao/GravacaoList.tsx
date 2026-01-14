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
import { Edit, Trash2, Video, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GravacaoFormModal } from '@/components/producao/GravacaoFormModal';
import { Badge } from '@/components/ui/badge';

export interface Gravacao {
  id: string;
  codigo: string; // REC-00001-26
  codigoExterno: string;
  nome: string;
  unidadeNegocio: string;
  classificacao: string;
  tipoConteudo: string;
  descricao: string;
  status: string;
  dataPrevista: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

// Função para gerar código automático
export const generateCodigoGravacao = (): string => {
  const currentYear = new Date().getFullYear();
  const yearSuffix = String(currentYear).slice(-2);
  
  // Buscar gravações existentes
  const stored = localStorage.getItem('kreato_gravacoes');
  const gravacoes: Gravacao[] = stored ? JSON.parse(stored) : [];
  
  // Filtrar gravações do ano atual
  const gravacoesMesmoAno = gravacoes.filter((g) => {
    if (!g.codigo) return false;
    const parts = g.codigo.split('-');
    return parts.length === 3 && parts[2] === yearSuffix;
  });
  
  // Encontrar o maior contador do ano
  let maxCounter = 0;
  gravacoesMesmoAno.forEach((g) => {
    const parts = g.codigo.split('-');
    if (parts.length === 3) {
      const counter = parseInt(parts[1], 10);
      if (!isNaN(counter) && counter > maxCounter) {
        maxCounter = counter;
      }
    }
  });
  
  // Incrementar contador
  const nextCounter = maxCounter + 1;
  const paddedCounter = String(nextCounter).padStart(5, '0');
  
  return `REC-${paddedCounter}-${yearSuffix}`;
};

const GravacaoList = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Gravacao | null>(null);
  const [items, setItems] = useState<Gravacao[]>(() => {
    const stored = localStorage.getItem('kreato_gravacoes');
    return stored ? JSON.parse(stored) : [];
  });

  const saveToStorage = (data: Gravacao[]) => {
    localStorage.setItem('kreato_gravacoes', JSON.stringify(data));
    setItems(data);
  };

  const handleSave = (data: Gravacao) => {
    if (editingItem) {
      const updated = items.map((item) => (item.id === data.id ? data : item));
      saveToStorage(updated);
      toast({ title: 'Sucesso', description: 'Gravação atualizada!' });
    } else {
      saveToStorage([...items, data]);
      toast({ title: 'Sucesso', description: 'Gravação cadastrada!' });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir esta gravação?')) {
      saveToStorage(items.filter((item) => item.id !== id));
      toast({ title: 'Excluído', description: 'Gravação removida!' });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Em andamento': 'bg-kreato-blue text-primary-foreground',
      'Concluído': 'bg-green-500 text-primary-foreground',
      'Pendente': 'bg-kreato-orange text-primary-foreground',
      'Cancelado': 'bg-destructive text-destructive-foreground',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Gravações"
        description="Gerencie as gravações de conteúdo"
        onAdd={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
        addLabel="Nova Gravação"
      >
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhuma gravação cadastrada"
            description="Comece adicionando sua primeira gravação de conteúdo."
            icon={Video}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Nova Gravação"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Código</TableHead>
                <TableHead className="w-24">Cód. Externo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Classificação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Data Cadastro</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm font-medium text-primary">{item.codigo || '-'}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{item.codigoExterno || '-'}</TableCell>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell>{item.tipoConteudo || '-'}</TableCell>
                  <TableCell>{item.classificacao || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>{item.status || 'Sem status'}</Badge>
                  </TableCell>
                  <TableCell>{item.dataCadastro}</TableCell>
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

      <GravacaoFormModal
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

export default GravacaoList;
