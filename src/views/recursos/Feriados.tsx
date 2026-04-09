import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { NewButton } from '@/components/shared/NewButton';
import { FeriadoFormModal } from '@/components/recursos/FeriadoFormModal';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ApiFeriadosRepository } from '@/modules/feriados/feriados.api.repository';
import type { Feriado, FeriadoInput } from '@/modules/feriados/feriados.types';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';
import { CalendarDays, Edit, Loader2, Trash2, Download, Upload } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const STORAGE_KEY = 'kreato_feriados';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'data', label: 'Data', required: true },
  { key: 'feriado', label: 'Feriado', required: true },
  { key: 'observacoes', label: 'Observacoes', defaultVisible: true },
  { key: 'dataCadastro', label: 'Cadastro', defaultVisible: false },
  { key: 'usuarioCadastro', label: 'Usuario', defaultVisible: false },
  { key: 'actions', label: 'Acoes', required: true },
];

const feriadosRepository = new ApiFeriadosRepository();

const formatDate = (value: string) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : '-';

function FeriadoCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Feriado;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-2">
          <CalendarDays className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug truncate">{item.feriado}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(item.data)}</p>
          </div>
        </div>
      </CardHeader>

      {item.observacoes && (
        <CardContent className="px-4 pb-3 flex-1 text-xs text-muted-foreground">
          <p className="line-clamp-3">{item.observacoes}</p>
        </CardContent>
      )}

      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1 mt-auto">
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

function FeriadoDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: Feriado;
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
        <CalendarDays className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.feriado}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{formatDate(item.data)}</p>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('Data', formatDate(item.data))}
        {field(
          'Data de Cadastro',
          item.dataCadastro ? new Date(item.dataCadastro).toLocaleDateString('pt-BR') : null,
        )}
        {field('Usuario', item.usuarioCadastro)}
      </div>

      {item.observacoes && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Observacoes</p>
            <p className="text-sm leading-relaxed">{item.observacoes}</p>
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

const Feriados = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Parametrizacoes', 'Feriados');
  const podeAlterar = canAlterar('Recursos', 'Parametrizacoes', 'Feriados');
  const podeExcluir = canExcluir('Recursos', 'Parametrizacoes', 'Feriados');
  const importFileRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Feriado | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Feriado | null>(null);
  const [items, setItems] = useState<Feriado[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchFeriados = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await feriadosRepository.list());
    } catch (error) {
      console.error('Error fetching feriados:', error);
      toast({
        title: 'Erro',
        description: `Erro ao carregar feriados: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchFeriados();
  }, [fetchFeriados]);

  const handleSave = async (data: FeriadoInput) => {
    try {
      await feriadosRepository.save(data);
      toast({
        title: t('common.success'),
        description: editingItem ? 'Feriado atualizado!' : 'Feriado salvo!',
      });
      await fetchFeriados();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving feriado:', error);
      toast({
        title: 'Erro',
        description: `Erro ao salvar feriado: ${(error as Error).message}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      await feriadosRepository.remove(deletingId);
      toast({
        title: t('common.deleted'),
        description: 'Feriado excluido!',
      });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchFeriados();
    } catch (error) {
      console.error('Error deleting feriado:', error);
      toast({
        title: 'Erro',
        description: `Erro ao excluir feriado: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    const data = filteredItems.map((item) => ({
      'Data (AAAA-MM-DD)': item.data,
      Feriado: item.feriado,
      Observações: item.observacoes,
      'Data de Cadastro': item.dataCadastro
        ? new Date(item.dataCadastro).toLocaleDateString('pt-BR')
        : '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 18 }, { wch: 50 }, { wch: 60 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Feriados');
    XLSX.writeFile(wb, `feriados_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      if (!('Feriado' in rows[0]) || !('Data (AAAA-MM-DD)' in rows[0])) {
        toast({
          title: 'Estrutura inválida',
          description: 'Colunas obrigatórias "Data (AAAA-MM-DD)" e "Feriado" não encontradas.',
          variant: 'destructive',
        });
        return;
      }
      let ok = 0;
      let fail = 0;
      for (const row of rows) {
        const feriado = String(row['Feriado'] ?? '').trim();
        const data = String(row['Data (AAAA-MM-DD)'] ?? '').trim();
        if (!feriado || !data) {
          fail++;
          continue;
        }
        try {
          await feriadosRepository.save({
            data,
            feriado,
            observacoes: String(row['Observações'] ?? '').trim(),
          });
          ok++;
        } catch {
          fail++;
        }
      }
      await fetchFeriados();
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

  const filteredItems = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    if (!searchTerm) return items;

    return items.filter(
      (item) =>
        item.feriado.toLowerCase().includes(searchTerm) ||
        item.data.includes(searchTerm) ||
        item.observacoes.toLowerCase().includes(searchTerm),
    );
  }, [items, search]);

  const columns: Column<Feriado>[] = [
    {
      key: 'data',
      label: 'Data',
      className: 'w-36',
      render: (item) => <span className="font-medium">{formatDate(item.data)}</span>,
    },
    {
      key: 'feriado',
      label: 'Feriado',
      render: (item) => (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="font-medium">{item.feriado}</span>
        </div>
      ),
    },
    {
      key: 'observacoes',
      label: 'Observacoes',
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">
          {item.observacoes || '-'}
        </span>
      ),
    },
    {
      key: 'dataCadastro',
      label: t('common.registrationDate'),
      className: 'w-32',
      render: (item) =>
        item.dataCadastro ? new Date(item.dataCadastro).toLocaleDateString('pt-BR') : '-',
    },
    {
      key: 'usuarioCadastro',
      label: t('common.user'),
      className: 'w-32',
      render: (item) => item.usuarioCadastro || '-',
    },
    {
      key: 'actions',
      label: t('common.actions'),
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
            disabled={!podeAlterar}
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          {podeExcluir && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDeletingId(item.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Feriados" description="Gerencie os feriados disponiveis para o tenant" />

      <input
        ref={importFileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleImportFile}
      />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip="Novo Feriado"
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          />
        )}
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
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
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
              title={t('common.noResults')}
              description="Adicione um feriado."
              icon={CalendarDays}
              onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
              actionLabel="Adicionar Feriado"
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
            emptyTitle={t('common.noResults')}
            emptyDescription="Adicione um feriado."
            onEmptyAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            emptyActionLabel="Adicionar Feriado"
            renderCard={(item) => (
              <FeriadoCard
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
            detailTitle="Detalhe do Feriado"
            emptyDetailTitle="Nenhum feriado selecionado"
            emptyDetailDescription="Clique em um feriado na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                <div>
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                    {item.feriado}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.data)}</p>
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <FeriadoDetailPanel
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

      <FeriadoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={
          editingItem
            ? {
                id: editingItem.id,
                data: editingItem.data,
                feriado: editingItem.feriado,
                observacoes: editingItem.observacoes,
              }
            : null
        }
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

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Feriado</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao pode ser desfeita. Tem certeza que deseja excluir este feriado?
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

export default Feriados;
