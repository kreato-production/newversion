import { useCallback, useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

const STORAGE_KEY = 'kreato_pessoas_table';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'foto',          label: 'Foto',           defaultVisible: true },
  { key: 'nome',          label: 'Nome',           required: true },
  { key: 'email',         label: 'E-mail',         defaultVisible: true },
  { key: 'telefone',      label: 'Telefone',       defaultVisible: false },
  { key: 'classificacao', label: 'Classificação',  defaultVisible: true },
  { key: 'cidade',        label: 'Cidade/UF',      defaultVisible: false },
  { key: 'status',        label: 'Status',         defaultVisible: true },
  { key: 'acoes',         label: 'Ações',          required: true },
];

// ─── Card renderer ────────────────────────────────────────────────────────────

function PessoaCard({
  item,
  onEdit,
  onDelete,
  podeAlterar,
  podeExcluir,
}: {
  item: Pessoa;
  onEdit: () => void;
  onDelete: () => void;
  podeAlterar: boolean;
  podeExcluir: boolean;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={item.foto} />
            <AvatarFallback className="text-xs gradient-brand text-primary-foreground">
              {item.nome.charAt(0)}{item.sobrenome.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug truncate">
              {item.nome} {item.sobrenome}
            </p>
            <p className="text-xs text-muted-foreground truncate">{item.email}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 space-y-1 text-xs text-muted-foreground">
        {item.classificacao && <div>{item.classificacao}</div>}
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5">
          {item.status}
        </Badge>
      </CardContent>

      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1">
        {podeAlterar && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
        )}
        {podeExcluir && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ─── Detail panel renderer ────────────────────────────────────────────────────

function PessoaDetailPanel({
  item,
  onEdit,
  onDelete,
  podeAlterar,
  podeExcluir,
}: {
  item: Pessoa;
  onEdit: () => void;
  onDelete: () => void;
  podeAlterar: boolean;
  podeExcluir: boolean;
}) {
  const field = (label: string, value: string | undefined | null) =>
    value ? (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarImage src={item.foto} />
          <AvatarFallback className="text-sm gradient-brand text-primary-foreground">
            {item.nome.charAt(0)}{item.sobrenome.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.nome} {item.sobrenome}</h3>
          <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5 mt-1">
            {item.status}
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('E-mail', item.email)}
        {field('Telefone', item.telefone)}
        {field('Classificação', item.classificacao)}
        {item.cidade && item.estado ? field('Cidade/UF', `${item.cidade}/${item.estado}`) : null}
      </div>

      <Separator />

      <div className="flex gap-2">
        {podeAlterar && (
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Editar
          </Button>
        )}
        {podeExcluir && (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Excluir
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Pessoa | null>(null);
  const [items, setItems] = useState<Pessoa[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

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

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await pessoasRepository.remove(deletingId);
      toast({ title: t('common.deleted'), description: 'Pessoa removida!' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchPessoas();
    } catch (error) {
      console.error('Error deleting pessoa:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao excluir: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
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
                setDeletingId(item.id);
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
        {mode === 'list' && (
          <ColumnSelector
            columns={optionalColumns}
            visibleColumnKeys={visibleColumnKeys}
            onToggle={toggleColumn}
            onReset={resetColumns}
          />
        )}
        <ViewSwitcher mode={mode} onModeChange={setMode} />
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
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
              storageKey={STORAGE_KEY}
              visibleColumnKeys={visibleColumnKeys}
            />
          )
        ) : mode === 'cards' ? (
          <CardGrid
            data={filteredItems}
            getRowKey={(item) => item.id}
            emptyTitle={t('field.noPersonRegistered')}
            emptyDescription={t('field.peopleHint')}
            onEmptyAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            emptyActionLabel={t('field.addPerson')}
            renderCard={(item) => (
              <PessoaCard
                item={item}
                podeAlterar={podeAlterar}
                podeExcluir={podeExcluir}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
              />
            )}
          />
        ) : (
          <MasterDetail
            data={filteredItems}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedItem(item)}
            getRowKey={(item) => item.id}
            detailTitle="Detalhe da Pessoa"
            emptyDetailTitle="Nenhuma pessoa selecionada"
            emptyDetailDescription="Clique em uma pessoa na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarImage src={item.foto} />
                  <AvatarFallback className="text-xs gradient-brand text-primary-foreground">
                    {item.nome.charAt(0)}{item.sobrenome.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                    {item.nome} {item.sobrenome}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{item.email}</p>
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <PessoaDetailPanel
                item={item}
                podeAlterar={podeAlterar}
                podeExcluir={podeExcluir}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
              />
            )}
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
        navigation={(() => {
          const navIndex = editingItem
            ? filteredItems.findIndex((i) => i.id === editingItem.id)
            : -1;
          return navIndex >= 0
            ? {
                currentIndex: navIndex,
                total: filteredItems.length,
                onPrevious: () => setEditingItem(filteredItems[navIndex - 1]),
                onNext: () => setEditingItem(filteredItems[navIndex + 1]),
              }
            : undefined;
        })()}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Pessoas;
