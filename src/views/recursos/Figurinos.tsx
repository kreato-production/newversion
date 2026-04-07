import { useCallback, useEffect, useState } from 'react';
import { Edit, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import FigurinoFormModal from '@/components/recursos/FigurinoFormModal';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { figurinosRepository } from '@/modules/figurinos/figurinos.repository.provider';
import type { Figurino, FigurinoInput } from '@/modules/figurinos/figurinos.types';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

const STORAGE_KEY = 'kreato_figurinos_table';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'imagem',         label: 'Imagem',     defaultVisible: true },
  { key: 'codigoFigurino', label: 'Código',     required: true },
  { key: 'descricao',      label: 'Descrição',  required: true },
  { key: 'tipoFigurino',   label: 'Tipo',       defaultVisible: true },
  { key: 'tamanhoPeca',    label: 'Tamanho',    defaultVisible: true },
  { key: 'cores',          label: 'Cores',      defaultVisible: true },
  { key: 'qtdImagens',     label: 'Imagens',    defaultVisible: false },
  { key: 'actions',        label: 'Ações',      required: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getImagemPrincipal(figurino: Figurino): string | undefined {
  const principal = figurino.imagens?.find((img) => img.isPrincipal);
  return principal?.url || figurino.imagens?.[0]?.url;
}

function ColorSwatches({ figurino }: { figurino: Figurino }) {
  return (
    <div className="flex gap-1">
      {figurino.corPredominante && (
        <div
          className="w-6 h-6 rounded border"
          style={{ backgroundColor: figurino.corPredominante }}
          title={`Predominante: ${figurino.corPredominante}`}
        />
      )}
      {figurino.corSecundaria && (
        <div
          className="w-6 h-6 rounded border"
          style={{ backgroundColor: figurino.corSecundaria }}
          title={`Secundária: ${figurino.corSecundaria}`}
        />
      )}
    </div>
  );
}

// ─── Card renderer ────────────────────────────────────────────────────────────

function FigurinoCard({
  item,
  podeAlterar,
  podeExcluir,
  onEdit,
  onDelete,
}: {
  item: Figurino;
  podeAlterar: boolean;
  podeExcluir: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const imgUrl = getImagemPrincipal(item);

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-3">
          {imgUrl ? (
            <img src={imgUrl} alt={item.descricao} className="w-12 h-12 rounded object-cover shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug truncate">{item.descricao}</p>
            {item.codigoFigurino && (
              <p className="text-xs font-mono text-muted-foreground">{item.codigoFigurino}</p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 space-y-1.5 text-xs text-muted-foreground">
        {item.tipoFigurino && <div>{item.tipoFigurino}</div>}
        {item.tamanhoPeca && <div>Tamanho: {item.tamanhoPeca}</div>}
        <ColorSwatches figurino={item} />
      </CardContent>

      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={!podeAlterar} onClick={onEdit}>
          <Edit className="h-3.5 w-3.5" />
        </Button>
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

function FigurinoDetailPanel({
  item,
  podeAlterar,
  podeExcluir,
  onEdit,
  onDelete,
}: {
  item: Figurino;
  podeAlterar: boolean;
  podeExcluir: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const imgUrl = getImagemPrincipal(item);
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
        {imgUrl ? (
          <img src={imgUrl} alt={item.descricao} className="w-16 h-16 rounded object-cover shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.descricao}</h3>
          {item.codigoFigurino && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoFigurino}</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Tipo', item.tipoFigurino)}
        {field('Tamanho', item.tamanhoPeca)}
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Cores</p>
          <ColorSwatches figurino={item} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Imagens</p>
          <Badge variant="secondary">{item.imagens?.length || 0}</Badge>
        </div>
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={!podeAlterar} onClick={onEdit}>
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
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

const Figurinos = () => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Figurino | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Figurino | null>(null);
  const [items, setItems] = useState<Figurino[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Figurinos');
  const podeAlterar = canAlterar('Recursos', 'Figurinos');
  const podeExcluir = canExcluir('Recursos', 'Figurinos');

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchFigurinos = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await figurinosRepository.list());
    } catch (error) {
      console.error('Error fetching figurinos:', error);
      toast({ title: 'Erro', description: 'Erro ao carregar figurinos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    void fetchFigurinos();
  }, [fetchFigurinos]);

  const handleSave = async (figurino: FigurinoInput) => {
    try {
      await figurinosRepository.save({
        ...figurino,
        tenantId: user?.tenantId ?? null,
      });
      toast({
        title: editingData ? 'Figurino atualizado' : 'Figurino criado',
        description: editingData
          ? 'O figurino foi atualizado com sucesso.'
          : 'O figurino foi criado com sucesso.',
      });
      await fetchFigurinos();
      setIsModalOpen(false);
      setEditingData(null);
    } catch (error) {
      console.error('Error saving figurino:', error);
      toast({ title: 'Erro', description: 'Erro ao salvar figurino', variant: 'destructive' });
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await figurinosRepository.remove(deletingId);
      toast({ title: 'Figurino excluído', description: 'O figurino foi excluído com sucesso.' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchFigurinos();
    } catch (error) {
      console.error('Error deleting figurino:', error);
      toast({ title: 'Erro', description: 'Erro ao excluir figurino', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoFigurino?.toLowerCase().includes(search.toLowerCase()) ||
      item.codigoExterno?.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Figurino>[] = [
    {
      key: 'imagem',
      label: 'Imagem',
      sortable: false,
      render: (figurino) => {
        const imgUrl = getImagemPrincipal(figurino);
        return imgUrl ? (
          <img src={imgUrl} alt={figurino.descricao} className="w-12 h-12 rounded object-cover" />
        ) : (
          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          </div>
        );
      },
    },
    { key: 'codigoFigurino', label: 'Código', sortable: true },
    { key: 'descricao', label: 'Descrição', sortable: true },
    { key: 'tipoFigurino', label: 'Tipo', sortable: true },
    { key: 'tamanhoPeca', label: 'Tamanho', sortable: true },
    {
      key: 'cores',
      label: 'Cores',
      sortable: false,
      render: (figurino) => <ColorSwatches figurino={figurino} />,
    },
    {
      key: 'qtdImagens',
      label: 'Imagens',
      sortable: false,
      render: (figurino) => <Badge variant="secondary">{figurino.imagens?.length || 0}</Badge>,
    },
    {
      key: 'actions',
      label: 'Ações',
      sortable: false,
      render: (figurino) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditingData(figurino);
              setIsModalOpen(true);
            }}
            disabled={!podeAlterar}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {podeExcluir && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingId(figurino.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Figurinos"
        description="Gerencie os figurinos disponíveis para as produções"
      />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip="Novo Figurino"
            onClick={() => {
              setEditingData(null);
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
              icon={ImageIcon}
              title="Nenhum figurino encontrado"
              description="Adicione um novo figurino para começar."
              onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
              actionLabel="Adicionar Figurino"
            />
          ) : (
            <SortableTable
              columns={columns}
              data={filteredItems}
              getRowKey={(item) => item.id}
              storageKey={STORAGE_KEY}
              visibleColumnKeys={visibleColumnKeys}
            />
          )
        ) : mode === 'cards' ? (
          <CardGrid
            data={filteredItems}
            getRowKey={(item) => item.id}
            emptyTitle="Nenhum figurino encontrado"
            emptyDescription="Adicione um novo figurino para começar."
            onEmptyAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            emptyActionLabel="Adicionar Figurino"
            renderCard={(item) => (
              <FigurinoCard
                item={item}
                podeAlterar={podeAlterar}
                podeExcluir={podeExcluir}
                onEdit={() => {
                  setEditingData(item);
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
            detailTitle="Detalhe do Figurino"
            emptyDetailTitle="Nenhum figurino selecionado"
            emptyDetailDescription="Clique em um figurino na lista para ver os detalhes."
            renderRow={(item, isSelected) => {
              const imgUrl = getImagemPrincipal(item);
              return (
                <div className="flex items-center gap-2">
                  {imgUrl ? (
                    <img src={imgUrl} alt={item.descricao} className="w-7 h-7 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                      {item.descricao}
                    </p>
                    {item.codigoFigurino && (
                      <p className="text-xs text-muted-foreground font-mono">{item.codigoFigurino}</p>
                    )}
                  </div>
                </div>
              );
            }}
            renderDetail={(item) => (
              <FigurinoDetailPanel
                item={item}
                podeAlterar={podeAlterar}
                podeExcluir={podeExcluir}
                onEdit={() => {
                  setEditingData(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
              />
            )}
          />
        )}
      </DataCard>

      <FigurinoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingData(null);
        }}
        onSave={handleSave}
        data={editingData}
        readOnly={!!editingData && !podeAlterar}
        navigation={(() => {
          const navIndex = editingData
            ? filteredItems.findIndex((i) => i.id === editingData.id)
            : -1;
          return navIndex >= 0
            ? {
                currentIndex: navIndex,
                total: filteredItems.length,
                onPrevious: () => setEditingData(filteredItems[navIndex - 1]),
                onNext: () => setEditingData(filteredItems[navIndex + 1]),
              }
            : undefined;
        })()}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão do Figurino</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este figurino? Esta ação não pode ser desfeita.
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

export default Figurinos;
