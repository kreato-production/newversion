import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { Edit, Trash2, Film } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ConteudoFormModal } from '@/components/producao/ConteudoFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { usePermissions } from '@/hooks/usePermissions';

export interface Conteudo {
  id: string;
  codigoExterno: string;
  descricao: string;
  quantidadeEpisodios: number;
  centroLucro: string;
  unidadeNegocio: string;
  tipoConteudo: string;
  classificacao: string;
  anoProducao: string;
  sinopse: string;
  usuarioCadastro: string;
  dataCadastro: string;
}

export const generateCodigoConteudo = (): string => {
  const currentYear = new Date().getFullYear();
  const yearSuffix = String(currentYear).slice(-2);
  
  const stored = localStorage.getItem('kreato_conteudos');
  const conteudos: Conteudo[] = stored ? JSON.parse(stored) : [];
  
  const conteudosMesmoAno = conteudos.filter((c) => {
    if (!c.codigoExterno) return false;
    const parts = c.codigoExterno.split('-');
    return parts.length === 3 && parts[2] === yearSuffix;
  });
  
  let maxCounter = 0;
  conteudosMesmoAno.forEach((c) => {
    const parts = c.codigoExterno.split('-');
    if (parts.length === 3) {
      const counter = parseInt(parts[1], 10);
      if (!isNaN(counter) && counter > maxCounter) {
        maxCounter = counter;
      }
    }
  });
  
  const nextCounter = maxCounter + 1;
  const paddedCounter = String(nextCounter).padStart(5, '0');
  
  return `CNT-${paddedCounter}-${yearSuffix}`;
};

const Conteudo = () => {
  const { toast } = useToast();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  
  // Permissões de ação
  const podeIncluir = canIncluir('Produção', 'Conteúdo');
  const podeAlterar = canAlterar('Produção', 'Conteúdo');
  const podeExcluir = canExcluir('Produção', 'Conteúdo');
  
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Conteudo | null>(null);
  const [items, setItems] = useState<Conteudo[]>(() => {
    const stored = localStorage.getItem('kreato_conteudos');
    return stored ? JSON.parse(stored) : [];
  });

  const saveToStorage = (data: Conteudo[]) => {
    localStorage.setItem('kreato_conteudos', JSON.stringify(data));
    setItems(data);
  };

  const handleSave = (data: Conteudo) => {
    if (editingItem) {
      const updated = items.map((item) => (item.id === data.id ? data : item));
      saveToStorage(updated);
      toast({ title: 'Sucesso', description: 'Conteúdo atualizado!' });
    } else {
      saveToStorage([...items, data]);
      toast({ title: 'Sucesso', description: 'Conteúdo cadastrado!' });
    }
    setEditingItem(null);
  };

  const hasAssociatedResources = (conteudoId: string): boolean => {
    // Buscar gravações associadas a este conteúdo
    const gravacoes = localStorage.getItem('kreato_gravacoes');
    const listaGravacoes = gravacoes ? JSON.parse(gravacoes) : [];
    
    const gravacoesDoConteudo = listaGravacoes.filter(
      (g: { conteudoId?: string }) => g.conteudoId === conteudoId
    );

    // Verificar se alguma gravação possui recursos associados
    for (const gravacao of gravacoesDoConteudo) {
      // Verificar recursos técnicos e físicos
      const recursosKey = `kreato_gravacao_recursos_${gravacao.id}`;
      const recursos = localStorage.getItem(recursosKey);
      if (recursos) {
        const recursosData = JSON.parse(recursos);
        if (recursosData.length > 0) {
          return true;
        }
      }

      // Verificar terceiros
      const terceirosKey = `kreato_gravacao_terceiros_${gravacao.id}`;
      const terceiros = localStorage.getItem(terceirosKey);
      if (terceiros) {
        const terceirosData = JSON.parse(terceiros);
        if (terceirosData.length > 0) {
          return true;
        }
      }
    }

    return false;
  };

  const handleDelete = (id: string) => {
    if (hasAssociatedResources(id)) {
      toast({
        title: 'Exclusão não permitida',
        description: 'Este conteúdo possui gravações com recursos, técnicos, físicos ou terceiros associados.',
        variant: 'destructive',
      });
      return;
    }

    if (confirm('Deseja realmente excluir este conteúdo? Todas as gravações associadas também serão removidas.')) {
      // Remover gravações associadas
      const gravacoes = localStorage.getItem('kreato_gravacoes');
      const listaGravacoes = gravacoes ? JSON.parse(gravacoes) : [];
      const gravacoesAtualizadas = listaGravacoes.filter(
        (g: { conteudoId?: string }) => g.conteudoId !== id
      );
      localStorage.setItem('kreato_gravacoes', JSON.stringify(gravacoesAtualizadas));

      // Remover conteúdo
      saveToStorage(items.filter((item) => item.id !== id));
      toast({ title: 'Excluído', description: 'Conteúdo e gravações associadas removidos!' });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Conteudo>[] = [
    {
      key: 'descricao',
      label: 'Descrição',
      render: (item) => <span className="font-medium">{item.descricao}</span>,
    },
    {
      key: 'quantidadeEpisodios',
      label: 'Episódios',
      className: 'w-24 text-center',
      render: (item) => (
        <span className="font-mono">{item.quantidadeEpisodios}</span>
      ),
    },
    {
      key: 'centroLucro',
      label: 'Centro de Lucro',
      render: (item) => item.centroLucro || '-',
    },
    {
      key: 'anoProducao',
      label: 'Ano',
      className: 'w-20',
      render: (item) => item.anoProducao || '-',
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
          {podeAlterar && (
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
          )}
          {podeExcluir && (
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
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Conteúdos"
        description="Gerencie os conteúdos de produção"
        onAdd={podeIncluir ? () => {
          setEditingItem(null);
          setIsModalOpen(true);
        } : undefined}
        addLabel="Novo Conteúdo"
      >
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <DataCard>
        {filteredItems.length === 0 ? (
          <EmptyState
            title="Nenhum conteúdo cadastrado"
            description="Comece adicionando seu primeiro conteúdo de produção."
            icon={Film}
            onAction={() => setIsModalOpen(true)}
            actionLabel="Novo Conteúdo"
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_conteudos_table"
          />
        )}
      </DataCard>

      <ConteudoFormModal
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

export default Conteudo;
