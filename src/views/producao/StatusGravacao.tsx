import { useCallback, useEffect, useState } from 'react';
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
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings, Loader2, Star } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { StatusGravacaoFormModal } from '@/components/producao/StatusGravacaoFormModal';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

export interface StatusGravacaoItem {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  cor: string;
  isInicial: boolean;
  dataCadastro: string;
  usuarioCadastro: string;
}

const repository = new ApiParametrizacoesRepository();

// ─── Column configuration ──────────────────────────────────────────────────────

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno', label: 'Código',       required: false, defaultVisible: true },
  { key: 'nome',          label: 'Nome',          required: true },
  { key: 'cor',           label: 'Cor',           defaultVisible: true },
  { key: 'descricao',     label: 'Descrição',     defaultVisible: true },
  { key: 'isInicial',     label: 'Inicial',       defaultVisible: true },
  { key: 'dataCadastro',  label: 'Data Cadastro', defaultVisible: false },
  { key: 'actions',       label: 'Ações',         required: true },
];

const STORAGE_KEY = 'kreato_status_gravacao_table';

// ─── Card renderer ─────────────────────────────────────────────────────────────

function StatusGravacaoCard({
  item,
  onEdit,
  onDelete,
  onToggleInicial,
}: {
  item: StatusGravacaoItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleInicial: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-3">
          <div
            className="h-10 w-10 rounded-full border border-border shrink-0"
            style={{ backgroundColor: item.cor || '#6b7280' }}
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">
              <Badge style={{ backgroundColor: item.cor || '#6b7280' }} className="text-white">
                {item.nome}
              </Badge>
            </p>
            {item.codigoExterno && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
            )}
          </div>
          {item.isInicial && (
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-1.5 text-xs text-muted-foreground flex-1">
        {item.descricao && <div>{item.descricao}</div>}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono">{item.cor || '-'}</span>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-2 border-t flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleInicial}>
                <Star
                  className={`h-4 w-4 ${item.isInicial ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {item.isInicial ? 'Status inicial ativo' : 'Definir como status inicial'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// ─── Detail panel renderer ─────────────────────────────────────────────────────

function StatusGravacaoDetailPanel({
  item,
  onEdit,
  onDelete,
  onToggleInicial,
}: {
  item: StatusGravacaoItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleInicial: () => void;
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
      <div className="flex items-start gap-3">
        <div
          className="h-12 w-12 rounded-full border border-border shrink-0"
          style={{ backgroundColor: item.cor || '#6b7280' }}
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base leading-snug">
            <Badge style={{ backgroundColor: item.cor || '#6b7280' }} className="text-white text-sm">
              {item.nome}
            </Badge>
          </h3>
          {item.codigoExterno && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
          )}
        </div>
        {item.isInicial && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Código', item.codigoExterno)}
        {field('Cor', item.cor)}
        {field('Data Cadastro', item.dataCadastro ? new Date(item.dataCadastro).toLocaleDateString('pt-BR') : null)}
      </div>

      {item.descricao && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Descrição</p>
            <p className="text-sm leading-relaxed">{item.descricao}</p>
          </div>
        </>
      )}

      <Separator />

      <div className="flex gap-2 flex-wrap">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={onToggleInicial}>
                <Star
                  className={`h-3.5 w-3.5 mr-1.5 ${item.isInicial ? 'fill-yellow-400 text-yellow-400' : ''}`}
                />
                {item.isInicial ? 'Remover Inicial' : 'Definir Inicial'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {item.isInicial ? 'Status inicial ativo' : 'Definir como status inicial'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Excluir
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const StatusGravacao = () => {
  const { toast } = useToast();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StatusGravacaoItem | null>(null);
  const [items, setItems] = useState<StatusGravacaoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<StatusGravacaoItem | null>(null);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchStatusGravacao = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listStatusGravacao();
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching status_gravacao:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar status de gravacao',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchStatusGravacao();
  }, [fetchStatusGravacao]);

  const handleSave = async (data: StatusGravacaoItem) => {
    try {
      await repository.saveStatusGravacao({
        ...(editingItem ? { id: data.id } : {}),
        codigoExterno: data.codigoExterno,
        nome: data.nome,
        descricao: data.descricao,
        cor: data.cor,
        isInicial: data.isInicial,
      });

      toast({
        title: 'Sucesso',
        description: editingItem
          ? 'Status atualizado com sucesso!'
          : 'Status cadastrado com sucesso!',
      });
      await fetchStatusGravacao();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving status_gravacao:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar status', variant: 'destructive' });
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await repository.removeStatusGravacao(deletingId);
      toast({ title: 'Excluido', description: 'Status removido com sucesso!' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchStatusGravacao();
    } catch (error) {
      console.error('Error deleting status_gravacao:', error);
      toast({ title: 'Erro', description: 'Erro ao excluir status', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleInicial = async (id: string, value: boolean) => {
    try {
      await repository.toggleStatusGravacaoInicial(id, value);
      toast({
        title: 'Sucesso',
        description: value ? 'Status definido como inicial' : 'Status inicial removido',
      });
      await fetchStatusGravacao();
    } catch (error) {
      console.error('Error toggling is_inicial:', error);
      toast({ title: 'Erro', description: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<StatusGravacaoItem & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: 'Codigo',
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => (
        <Badge style={{ backgroundColor: item.cor || '#6b7280' }} className="text-white">
          {item.nome}
        </Badge>
      ),
    },
    {
      key: 'cor',
      label: 'Cor',
      className: 'w-24',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-border"
            style={{ backgroundColor: item.cor || '#6b7280' }}
          />
          <span className="text-xs font-mono text-muted-foreground">{item.cor || '-'}</span>
        </div>
      ),
    },
    {
      key: 'descricao',
      label: 'Descricao',
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">
          {item.descricao || '-'}
        </span>
      ),
    },
    {
      key: 'isInicial',
      label: 'Inicial',
      className: 'w-20 text-center',
      sortable: false,
      render: (item) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleToggleInicial(item.id, !item.isInicial);
                }}
              >
                <Star
                  className={`h-4 w-4 ${item.isInicial ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {item.isInicial ? 'Status inicial ativo' : 'Definir como status inicial'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      key: 'dataCadastro',
      label: 'Data Cadastro',
      className: 'w-32',
      render: (item) =>
        item.dataCadastro ? new Date(item.dataCadastro).toLocaleDateString('pt-BR') : '-',
    },
    {
      key: 'actions',
      label: 'Acoes',
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeletingId(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Status de Gravacao"
        description="Gerencie os status possiveis para gravacoes"
      />

      <ListActionBar>
        <NewButton
          tooltip="Novo Status"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
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
              title="Nenhum status cadastrado"
              description="Comece adicionando status para organizar seu sistema."
              icon={Settings}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Adicionar Status"
            />
          ) : (
            <SortableTable
              data={filteredItems}
              columns={columns}
              getRowKey={(item) => item.id}
              storageKey={STORAGE_KEY}
              visibleColumnKeys={mode === 'list' ? visibleColumnKeys : undefined}
            />
          )
        ) : mode === 'cards' ? (
          <CardGrid
            data={filteredItems}
            getRowKey={(item) => item.id}
            emptyTitle="Nenhum status cadastrado"
            emptyDescription="Comece adicionando status para organizar seu sistema."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Adicionar Status"
            renderCard={(item) => (
              <StatusGravacaoCard
                item={item}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
                onToggleInicial={() => void handleToggleInicial(item.id, !item.isInicial)}
              />
            )}
          />
        ) : (
          <MasterDetail
            data={filteredItems}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedItem(item)}
            getRowKey={(item) => item.id}
            detailTitle="Detalhe do Status"
            emptyDetailTitle="Nenhum status selecionado"
            emptyDetailDescription="Clique em um status na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  <Badge style={{ backgroundColor: item.cor || '#6b7280' }} className="text-white text-xs">
                    {item.nome}
                  </Badge>
                </p>
                {item.codigoExterno && (
                  <span className="text-xs font-mono text-muted-foreground">{item.codigoExterno}</span>
                )}
              </div>
            )}
            renderDetail={(item) => (
              <StatusGravacaoDetailPanel
                item={item}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
                onToggleInicial={() => void handleToggleInicial(item.id, !item.isInicial)}
              />
            )}
          />
        )}
      </DataCard>

      <StatusGravacaoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar('Producao', 'Parametrizacoes', 'Status Gravacao')}
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
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
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

export default StatusGravacao;
