import { useCallback, useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataCard, EmptyState, PageHeader, SearchBar } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { NewButton } from '@/components/shared/NewButton';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { PessoaFormModal } from '@/components/recursos/PessoaFormModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { pessoasRepository } from '@/modules/pessoas/pessoas.repository.provider';
import type { Pessoa, PessoaInput } from '@/modules/pessoas/pessoas.types';
import { Edit, Loader2, Trash2, Users } from 'lucide-react';

const Pessoas = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Pessoas');
  const podeAlterar = canAlterar('Recursos', 'Pessoas');
  const podeExcluir = canExcluir('Recursos', 'Pessoas');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pessoa | null>(null);
  const [items, setItems] = useState<Pessoa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPessoas = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await pessoasRepository.list());
    } catch (error) {
      console.error('Error fetching pessoas:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao carregar pessoas: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, t, toast]);

  useEffect(() => {
    fetchPessoas();
  }, [fetchPessoas]);

  const handleSave = async (input: PessoaInput) => {
    try {
      await pessoasRepository.save({
        ...input,
        tenantId: user?.tenantId ?? null,
      });
      toast({
        title: t('common.success'),
        description: editingItem ? 'Pessoa atualizada!' : 'Pessoa cadastrada!',
      });
      await fetchPessoas();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving pessoa:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao salvar: ${(error as Error).message}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta pessoa?')) {
      return;
    }

    try {
      await pessoasRepository.remove(id);
      toast({ title: t('common.deleted'), description: 'Pessoa removida!' });
      await fetchPessoas();
    } catch (error) {
      console.error('Error deleting pessoa:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao excluir: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.sobrenome.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.classificacao.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Pessoa>[] = [
    {
      key: 'foto',
      label: '',
      className: 'w-12',
      sortable: false,
      render: (item) => (
        <Avatar className="w-8 h-8">
          <AvatarImage src={item.foto} />
          <AvatarFallback className="text-xs gradient-brand text-primary-foreground">
            {item.nome.charAt(0)}
            {item.sobrenome.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => (
        <span className="font-medium">
          {item.nome} {item.sobrenome}
        </span>
      ),
    },
    {
      key: 'email',
      label: t('common.email'),
      render: (item) => item.email || '-',
    },
    {
      key: 'telefone',
      label: t('common.phone'),
      render: (item) => item.telefone || '-',
    },
    {
      key: 'classificacao',
      label: t('field.classification'),
      render: (item) => item.classificacao || '-',
    },
    {
      key: 'cidade',
      label: t('field.cityState'),
      render: (item) => (item.cidade && item.estado ? `${item.cidade}/${item.estado}` : '-'),
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (item) => (
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>{item.status}</Badge>
      ),
    },
    {
      key: 'acoes',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            disabled={!podeAlterar}
            onClick={(event) => {
              event.stopPropagation();
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {podeExcluir && (
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation();
                handleDelete(item.id);
              }}
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
      <PageHeader title={t('people.title')} description={t('field.managePeople')} />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={t('field.newPerson')}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          />
        )}
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} />
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={t('field.noPersonRegistered')}
            description={t('field.peopleHint')}
            icon={Users}
            onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            actionLabel={t('field.addPerson')}
          />
        ) : (
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_pessoas_table"
          />
        )}
      </DataCard>

      <PessoaFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !podeAlterar}
      />
    </div>
  );
};

export default Pessoas;
