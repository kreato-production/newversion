import { useState, useEffect, useCallback } from 'react';
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
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Settings, Loader2, Calendar } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { TabelaPrecoFormModal } from '@/components/producao/TabelaPrecoFormModal';
import type { TabelaPrecoItem } from '@/modules/tabelas-preco/tabelas-preco.types';
import { ApiTabelasPrecoRepository } from '@/modules/tabelas-preco/tabelas-preco.api.repository';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

const tabelasPrecoRepository = new ApiTabelasPrecoRepository();

// ─── Column configuration ──────────────────────────────────────────────────────

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno',     label: 'Código',            required: false, defaultVisible: true },
  { key: 'nome',              label: 'Nome',              required: true },
  { key: 'unidadeNegocioNome',label: 'Unidade de Negócio',defaultVisible: true },
  { key: 'status',            label: 'Status',            defaultVisible: true },
  { key: 'vigenciaInicio',    label: 'Vigência De',       defaultVisible: true },
  { key: 'vigenciaFim',       label: 'Vigência Até',      defaultVisible: true },
  { key: 'descricao',         label: 'Descrição',         defaultVisible: false },
  { key: 'dataCadastro',      label: 'Data Cadastro',     defaultVisible: false },
  { key: 'actions',           label: 'Ações',             required: true },
];

const STORAGE_KEY = 'kreato_tabelas_preco_table';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(value: string | undefined | null) {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

// ─── Card renderer ─────────────────────────────────────────────────────────────

function TabelaPrecoCard({
  item,
  onEdit,
  onDelete,
}: {
  item: TabelaPrecoItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
            {item.codigoExterno && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
            )}
          </div>
          <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>{item.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-1.5 text-xs text-muted-foreground flex-1">
        {item.unidadeNegocioNome && <div>{item.unidadeNegocioNome}</div>}
        {(item.vigenciaInicio || item.vigenciaFim) && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>
              {formatDate(item.vigenciaInicio)} – {formatDate(item.vigenciaFim)}
            </span>
          </div>
        )}
        {item.descricao && (
          <div className="truncate">{item.descricao}</div>
        )}
      </CardContent>
      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1">
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
      </CardFooter>
    </Card>
  );
}

// ─── Detail panel renderer ─────────────────────────────────────────────────────

function TabelaPrecoDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: TabelaPrecoItem;
  onEdit: () => void;
  onDelete: () => void;
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
          {item.codigoExterno && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
          )}
        </div>
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>{item.status}</Badge>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Unidade de Negócio', item.unidadeNegocioNome)}
        {field('Vigência De', formatDate(item.vigenciaInicio))}
        {field('Vigência Até', formatDate(item.vigenciaFim))}
        {field('Data Cadastro', item.dataCadastro ? String(item.dataCadastro) : null)}
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

      <div className="flex gap-2">
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

const TabelasPreco = () => {
  const { toast } = useToast();
  const { canAlterar } = usePermissions();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TabelaPrecoItem | null>(null);
  const [items, setItems] = useState<TabelaPrecoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TabelaPrecoItem | null>(null);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await tabelasPrecoRepository.list());
    } catch (error) {
      console.error('Error fetching tabelas_preco:', error);
      toast({
        title: 'Erro',
        description: `Erro ao carregar tabelas de preço: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSave = async () => {
    await fetchItems();
    setEditingItem(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await tabelasPrecoRepository.remove(deletingId);
      toast({ title: 'Excluído', description: 'Tabela de preço removida com sucesso!' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchItems();
    } catch (error) {
      console.error('Error deleting tabela_preco:', error);
      toast({
        title: 'Erro',
        description: `Erro ao excluir tabela de preço: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<TabelaPrecoItem & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: 'Código',
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    { key: 'nome', label: 'Nome' },
    {
      key: 'unidadeNegocioNome',
      label: 'Unidade de Negócio',
      render: (item) => item.unidadeNegocioNome || '-',
    },
    {
      key: 'status',
      label: 'Status',
      className: 'w-24',
      render: (item) => (
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>{item.status}</Badge>
      ),
    },
    {
      key: 'vigenciaInicio',
      label: 'Vigência De',
      className: 'w-28',
      render: (item) => formatDate(item.vigenciaInicio),
    },
    {
      key: 'vigenciaFim',
      label: 'Vigência Até',
      className: 'w-28',
      render: (item) => formatDate(item.vigenciaFim),
    },
    {
      key: 'descricao',
      label: 'Descrição',
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">
          {item.descricao || '-'}
        </span>
      ),
    },
    { key: 'dataCadastro', label: 'Data Cadastro', className: 'w-32' },
    {
      key: 'actions',
      label: 'Ações',
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
        title="Tabelas de Preços"
        description="Gerencie tabelas de preços para recursos técnicos e físicos"
      />
      <ListActionBar>
        <NewButton
          tooltip="Nova Tabela"
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
              title="Nenhuma tabela de preço cadastrada"
              description="Comece adicionando tabelas de preços."
              icon={Settings}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Adicionar Tabela"
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
            emptyTitle="Nenhuma tabela de preço cadastrada"
            emptyDescription="Comece adicionando tabelas de preços."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Adicionar Tabela"
            renderCard={(item) => (
              <TabelaPrecoCard
                item={item}
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
            detailTitle="Detalhe da Tabela"
            emptyDetailTitle="Nenhuma tabela selecionada"
            emptyDetailDescription="Clique em uma tabela na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  {item.nome}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.codigoExterno && (
                    <span className="text-xs font-mono text-muted-foreground">{item.codigoExterno}</span>
                  )}
                  <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5">
                    {item.status}
                  </Badge>
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <TabelaPrecoDetailPanel
                item={item}
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
      <TabelaPrecoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !canAlterar('Produção', 'Parametrizações', 'Tabelas de Preços')}
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

export default TabelasPreco;
