import { useCallback, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
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
import { Badge } from '@/components/ui/badge';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { ReceiptText, Edit, Trash2, Settings, Loader2, Download, Upload } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';
import { CategoriaDespesaFormModal } from '@/components/financeiro/CategoriaDespesaFormModal';

export interface CategoriaDespesaItem {
  id: string;
  codigoExterno: string;
  titulo: string;
  descricao: string;
  cor: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

const repository = new ApiParametrizacoesRepository();

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno', label: 'Codigo', required: false, defaultVisible: true },
  { key: 'titulo', label: 'Titulo', required: true },
  { key: 'cor', label: 'Cor', defaultVisible: true },
  { key: 'descricao', label: 'Descricao', defaultVisible: true },
  { key: 'dataCadastro', label: 'Data Cadastro', defaultVisible: false },
  { key: 'actions', label: 'Acoes', required: true },
];

const STORAGE_KEY = 'kreato_categorias_despesa_financeiro_table';

function CategoriaDespesaCard({
  item,
  onEdit,
  onDelete,
}: {
  item: CategoriaDespesaItem;
  onEdit: () => void;
  onDelete: () => void;
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
            <div className="font-medium text-sm truncate">
              <Badge style={{ backgroundColor: item.cor || '#6b7280' }} className="text-white">
                {item.titulo}
              </Badge>
            </div>
            {item.codigoExterno && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2 text-xs text-muted-foreground flex-1">
        {item.descricao && <div>{item.descricao}</div>}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="font-mono">
            {item.cor || '-'}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-2 border-t flex items-center justify-end gap-1">
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

function CategoriaDespesaDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: CategoriaDespesaItem;
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
      <div className="flex items-start gap-3">
        <div
          className="h-12 w-12 rounded-full border border-border shrink-0"
          style={{ backgroundColor: item.cor || '#6b7280' }}
        />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-base leading-snug">
            <Badge
              style={{ backgroundColor: item.cor || '#6b7280' }}
              className="text-white text-sm"
            >
              {item.titulo}
            </Badge>
          </div>
          {item.codigoExterno && (
            <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.codigoExterno}</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Codigo Externo', item.codigoExterno)}
        {field('Cor', item.cor)}
        {field(
          'Data Cadastro',
          item.dataCadastro ? new Date(item.dataCadastro).toLocaleDateString('pt-BR') : null,
        )}
      </div>

      {item.descricao && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Descricao</p>
            <p className="text-sm leading-relaxed">{item.descricao}</p>
          </div>
        </>
      )}

      <Separator />

      <div className="flex gap-2 flex-wrap">
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

const CategoriasDespesa = () => {
  const { toast } = useToast();
  const importFileRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CategoriaDespesaItem | null>(null);
  const [items, setItems] = useState<CategoriaDespesaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CategoriaDespesaItem | null>(null);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchCategoriasDespesa = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listCategoriasDespesa();
      setItems(
        response.data.map((item) => ({
          id: item.id,
          codigoExterno: item.codigo_externo || '',
          titulo: item.titulo,
          descricao: item.descricao || '',
          cor: item.cor || '#888888',
          dataCadastro: item.created_at || '',
          usuarioCadastro: item.created_by || '',
        })),
      );
    } catch (error) {
      console.error('Error fetching categorias_despesa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar categorias de despesas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchCategoriasDespesa();
  }, [fetchCategoriasDespesa]);

  const handleSave = async (data: CategoriaDespesaItem) => {
    try {
      await repository.saveCategoriaDespesa({
        id: editingItem?.id,
        codigo_externo: data.codigoExterno,
        titulo: data.titulo,
        descricao: data.descricao,
        cor: data.cor,
      });

      toast({
        title: 'Sucesso',
        description: `Categoria de despesa ${editingItem ? 'atualizada' : 'criada'} com sucesso`,
      });

      setIsModalOpen(false);
      setEditingItem(null);
      await fetchCategoriasDespesa();
    } catch (error) {
      console.error('Error saving categoria_despesa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar categoria de despesa',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      await repository.removeCategoriaDespesa(deletingId);
      toast({
        title: 'Sucesso',
        description: 'Categoria de despesa removida com sucesso',
      });
      if (selectedItem?.id === deletingId) {
        setSelectedItem(null);
      }
      await fetchCategoriasDespesa();
    } catch (error) {
      console.error('Error deleting categoria_despesa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover categoria de despesa',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    const data = filteredItems.map((item) => ({
      'Código Externo': item.codigoExterno,
      Título: item.titulo,
      Descrição: item.descricao,
      Cor: item.cor,
      'Data de Cadastro': item.dataCadastro
        ? new Date(item.dataCadastro).toLocaleDateString('pt-BR')
        : '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 18 }, { wch: 40 }, { wch: 50 }, { wch: 12 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categorias de Despesa');
    XLSX.writeFile(wb, `categorias_despesa_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({
      title: 'Exportação concluída',
      description: `${filteredItems.length} registro(s) exportado(s).`,
    });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsImporting(true);
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[wb.SheetNames[0]]);
      if (rows.length === 0) {
        toast({
          title: 'Arquivo vazio',
          description: 'O arquivo não contém dados.',
          variant: 'destructive',
        });
        return;
      }
      if (!('Título' in rows[0])) {
        toast({
          title: 'Estrutura inválida',
          description:
            'Coluna obrigatória "Título" não encontrada. Use o arquivo exportado como template.',
          variant: 'destructive',
        });
        return;
      }
      let ok = 0;
      let fail = 0;
      for (const row of rows) {
        const titulo = String(row['Título'] ?? '').trim();
        if (!titulo) {
          fail++;
          continue;
        }
        try {
          await repository.saveCategoriaDespesa({
            codigo_externo: String(row['Código Externo'] ?? '').trim(),
            titulo,
            descricao: String(row['Descrição'] ?? '').trim(),
            cor: String(row['Cor'] ?? '#888888').trim(),
          });
          ok++;
        } catch {
          fail++;
        }
      }
      await fetchCategoriasDespesa();
      if (fail === 0)
        toast({
          title: 'Importação concluída',
          description: `${ok} registro(s) importado(s) com sucesso.`,
        });
      else
        toast({
          title: 'Importação parcial',
          description: `${ok} importado(s), ${fail} com erro.`,
          variant: 'destructive',
        });
    } catch (err) {
      toast({
        title: 'Erro na importação',
        description: `Não foi possível processar o arquivo: ${(err as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const term = search.toLowerCase();

    return (
      item.titulo.toLowerCase().includes(term) ||
      item.codigoExterno.toLowerCase().includes(term) ||
      item.descricao.toLowerCase().includes(term)
    );
  });

  const columns: Column<CategoriaDespesaItem & { actions?: never }>[] = [
    {
      key: 'codigoExterno',
      label: 'Codigo',
      className: 'w-28',
      render: (item) => <span className="font-mono text-sm">{item.codigoExterno || '-'}</span>,
    },
    {
      key: 'titulo',
      label: 'Titulo',
      render: (item) => <span className="font-medium">{item.titulo}</span>,
    },
    {
      key: 'cor',
      label: 'Cor',
      className: 'w-36',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: item.cor }} />
          <span className="font-mono text-xs">{item.cor}</span>
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
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeletingId(item.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const tableVisibleKeys = mode === 'list' ? visibleColumnKeys : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Categorias de Despesas"
        description="Gerencie as categorias de despesas utilizadas no fluxo financeiro"
      />

      <input
        ref={importFileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleImportFile}
      />

      <ListActionBar>
        <NewButton
          tooltip="Nova Categoria de Despesa"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={handleExport}
              disabled={filteredItems.length === 0}
              aria-label="Exportar"
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Exportar</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              onClick={() => importFileRef.current?.click()}
              disabled={isImporting}
              aria-label="Importar"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Importar</TooltipContent>
        </Tooltip>
        <div className="flex-1" />
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar categorias de despesas..."
        />
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
        {mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title="Nenhuma categoria de despesa encontrada"
              description="Adicione a primeira categoria de despesa."
              icon={Settings}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Adicionar Categoria"
            />
          ) : (
            <SortableTable
              data={filteredItems}
              columns={columns}
              getRowKey={(item) => item.id}
              storageKey={STORAGE_KEY}
              visibleColumnKeys={tableVisibleKeys}
            />
          )
        ) : mode === 'cards' ? (
          <CardGrid
            data={filteredItems}
            getRowKey={(item) => item.id}
            emptyTitle="Nenhuma categoria de despesa encontrada"
            emptyDescription="Adicione a primeira categoria de despesa."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Adicionar Categoria"
            renderCard={(item) => (
              <CategoriaDespesaCard
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
            detailTitle="Categoria de Despesa"
            emptyDetailTitle="Nenhuma categoria de despesa selecionada"
            emptyDetailDescription="Clique em um item da lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p
                  className={
                    isSelected
                      ? 'text-sm font-medium truncate text-primary'
                      : 'text-sm font-medium truncate'
                  }
                >
                  {item.titulo}
                </p>
                <div className="flex gap-2 mt-0.5">
                  {item.codigoExterno && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {item.codigoExterno}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <ReceiptText className="h-3 w-3" />
                    Despesa
                  </span>
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <CategoriaDespesaDetailPanel
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

      <CategoriaDespesaFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        navigation={(() => {
          const navIndex = editingItem
            ? filteredItems.findIndex((item) => item.id === editingItem.id)
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
            <AlertDialogTitle>Excluir categoria de despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. A categoria de despesa sera removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteConfirm()}
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

export default CategoriasDespesa;
