import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { Edit, Trash2, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GravacaoFormModal } from '@/components/producao/GravacaoFormModal';
import { Badge } from '@/components/ui/badge';
import { SortableTable, Column } from '@/components/shared/SortableTable';

export interface Gravacao {
  id: string;
  codigo: string;
  codigoExterno: string;
  nome: string;
  unidadeNegocio: string;
  centroLucro: string;
  classificacao: string;
  tipoConteudo: string;
  descricao: string;
  status: string;
  dataPrevista: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

export const generateCodigoGravacao = (): string => {
  const currentYear = new Date().getFullYear();
  const yearSuffix = String(currentYear).slice(-2);
  
  const stored = localStorage.getItem('kreato_gravacoes');
  const gravacoes: Gravacao[] = stored ? JSON.parse(stored) : [];
  
  const gravacoesMesmoAno = gravacoes.filter((g) => {
    if (!g.codigo) return false;
    const parts = g.codigo.split('-');
    return parts.length === 3 && parts[2] === yearSuffix;
  });
  
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
  
  const nextCounter = maxCounter + 1;
  const paddedCounter = String(nextCounter).padStart(5, '0');
  
  return `REC-${paddedCounter}-${yearSuffix}`;
};

interface StatusGravacaoData {
  id: string;
  nome: string;
  cor: string;
}

const GravacaoList = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Gravacao | null>(null);
  const [statusList, setStatusList] = useState<StatusGravacaoData[]>([]);
  const [items, setItems] = useState<Gravacao[]>(() => {
    const stored = localStorage.getItem('kreato_gravacoes');
    return stored ? JSON.parse(stored) : [];
  });

  // Carregar lista de status para obter as cores
  useState(() => {
    const stored = localStorage.getItem('kreato_status_gravacao');
    if (stored) {
      setStatusList(JSON.parse(stored));
    }
  });

  const saveToStorage = (data: Gravacao[]) => {
    localStorage.setItem('kreato_gravacoes', JSON.stringify(data));
    setItems(data);
  };

  const handleSave = (data: Gravacao) => {
    // Recarregar lista de status ao salvar
    const storedStatus = localStorage.getItem('kreato_status_gravacao');
    if (storedStatus) {
      setStatusList(JSON.parse(storedStatus));
    }
    
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

  const getStatusColor = (statusNome: string): string | undefined => {
    const status = statusList.find((s) => s.nome === statusNome);
    return status?.cor;
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Gravacao>[] = [
    {
      key: 'codigo',
      label: 'Código',
      className: 'w-32',
      render: (item) => (
        <span className="font-mono text-sm font-medium text-primary">{item.codigo || '-'}</span>
      ),
    },
    {
      key: 'codigoExterno',
      label: 'Cód. Externo',
      className: 'w-24',
      render: (item) => (
        <span className="font-mono text-sm text-muted-foreground">{item.codigoExterno || '-'}</span>
      ),
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'tipoConteudo',
      label: 'Tipo',
      render: (item) => item.tipoConteudo || '-',
    },
    {
      key: 'classificacao',
      label: 'Classificação',
      render: (item) => item.classificacao || '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => {
        const cor = getStatusColor(item.status);
        return (
          <Badge 
            style={cor ? { backgroundColor: cor } : undefined}
            className={cor ? 'text-white' : 'bg-muted text-muted-foreground'}
          >
            {item.status || 'Sem status'}
          </Badge>
        );
      },
    },
    {
      key: 'dataCadastro',
      label: 'Data Cadastro',
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
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_gravacoes_table"
          />
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
