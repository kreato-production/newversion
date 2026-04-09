import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
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
import { ParametroFormModal } from '@/components/shared/ParametroFormModal';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';
import { Edit, Trash2, Settings, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NewButton } from '@/components/shared/NewButton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ApiParametrosRepository } from '@/modules/parametros/parametros.api.repository';

interface Parametro {
  id: string;
  codigo_externo: string;
  nome: string;
  descricao: string;
  created_at: string;
  created_by: string;
}

interface ParametroLegacy {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  dataCadastro: string;
  usuarioCadastro: string;
}

interface ParametroListPageProps {
  title: string;
  description: string;
  entityName: string;
  storageKey: string;
  permissionPath?: [string, string, string?];
  showExportImport?: boolean;
}

const apiRepository = new ApiParametrosRepository();

// ─── Column config ────────────────────────────────────────────────────────────

function buildColumnConfig(t: (k: string) => string): ColumnConfig[] {
  return [
    { key: 'codigo_externo', label: t('common.code'), required: false, defaultVisible: true },
    { key: 'nome', label: t('common.name'), required: true },
    { key: 'descricao', label: t('common.description'), defaultVisible: true },
    { key: 'created_at', label: t('common.registrationDate'), defaultVisible: true },
    { key: 'actions', label: t('common.actions'), required: true },
  ];
}

// ─── Card renderer ────────────────────────────────────────────────────────────

function ParametroCard({
  item,
  entityName,
  onEdit,
  onDelete,
}: {
  item: Parametro;
  entityName: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-snug">{item.nome}</p>
          {item.codigo_externo && (
            <span className="text-xs font-mono text-primary shrink-0">{item.codigo_externo}</span>
          )}
        </div>
      </CardHeader>
      {item.descricao && (
        <CardContent className="px-4 pb-3 flex-1">
          <p className="text-xs text-muted-foreground line-clamp-3">{item.descricao}</p>
        </CardContent>
      )}
      <CardFooter className="px-4 py-2 border-t flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-'}
        </span>
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

// ─── Detail panel renderer ────────────────────────────────────────────────────

function ParametroDetailPanel({
  item,
  onEdit,
  onDelete,
}: {
  item: Parametro;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base">{item.nome}</h3>
          {item.codigo_externo && (
            <p className="text-xs font-mono text-primary mt-0.5">{item.codigo_externo}</p>
          )}
        </div>
      </div>
      <Separator />
      <div className="space-y-3 text-sm">
        {item.descricao && (
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Descrição</p>
            <p>{item.descricao}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Data de cadastro</p>
          <p>{item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-'}</p>
        </div>
      </div>
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

// ─── Main component ───────────────────────────────────────────────────────────

const ParametroListPage = ({
  title,
  description,
  entityName,
  storageKey,
  permissionPath,
  showExportImport = true,
}: ParametroListPageProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canAlterar } = usePermissions();

  const importFileRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ParametroLegacy | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Parametro | null>(null);
  const [items, setItems] = useState<Parametro[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const columnConfig = buildColumnConfig(t);
  const {
    mode,
    setMode,
    visibleColumnKeys,
    toggleColumn,
    isColumnVisible,
    resetColumns,
    optionalColumns,
  } = useListingView({ storageKey, columns: columnConfig });

  // ── Data ───────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiRepository.list(storageKey);
      setItems(data || []);
    } catch (err) {
      toast({
        title: 'Erro',
        description: `Erro ao carregar dados: ${(err as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, storageKey, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toLegacyFormat = (data: Parametro): ParametroLegacy => ({
    id: data.id,
    codigoExterno: data.codigo_externo || '',
    nome: data.nome,
    descricao: data.descricao || '',
    dataCadastro: data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR') : '',
    usuarioCadastro: user?.nome || '',
  });

  const openEdit = (item: Parametro) => {
    setEditingItem(toLegacyFormat(item));
    setIsModalOpen(true);
  };

  const openDelete = (id: string) => setDeletingId(id);

  const handleSave = async (data: ParametroLegacy) => {
    await apiRepository.save(storageKey, {
      id: editingItem ? data.id : undefined,
      codigoExterno: data.codigoExterno,
      nome: data.nome,
      descricao: data.descricao,
    });
    toast({
      title: t('common.success'),
      description: `${entityName} ${editingItem ? t('common.updated').toLowerCase() : t('common.save').toLowerCase()}!`,
    });
    await fetchData();
    setEditingItem(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await apiRepository.remove(storageKey, deletingId);
      toast({
        title: t('common.deleted'),
        description: `${entityName} ${t('common.deleted').toLowerCase()}!`,
      });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchData();
    } catch (err) {
      toast({
        title: 'Erro',
        description: `Erro ao excluir: ${(err as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Export / Import ────────────────────────────────────────────────────────

  const handleExport = () => {
    const exportData = filteredItems.map((item) => ({
      'Código Externo': item.codigo_externo || '',
      Nome: item.nome,
      Descrição: item.descricao || '',
      'Data de Cadastro': item.created_at
        ? new Date(item.created_at).toLocaleDateString('pt-BR')
        : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [{ wch: 18 }, { wch: 40 }, { wch: 50 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title);

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${storageKey}_${date}.xlsx`);

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
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

      if (rows.length === 0) {
        toast({
          title: 'Arquivo vazio',
          description: 'O arquivo não contém dados.',
          variant: 'destructive',
        });
        return;
      }

      const firstRow = rows[0];
      if (!('Nome' in firstRow)) {
        toast({
          title: 'Estrutura inválida',
          description:
            'A coluna obrigatória "Nome" não foi encontrada. Use o arquivo exportado como template.',
          variant: 'destructive',
        });
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        const nome = String(row['Nome'] ?? '').trim();
        if (!nome) {
          errorCount++;
          continue;
        }
        try {
          await apiRepository.save(storageKey, {
            codigoExterno: String(row['Código Externo'] ?? '').trim(),
            nome,
            descricao: String(row['Descrição'] ?? '').trim(),
          });
          successCount++;
        } catch {
          errorCount++;
        }
      }

      await fetchData();

      if (errorCount === 0) {
        toast({
          title: 'Importação concluída',
          description: `${successCount} registro(s) importado(s) com sucesso.`,
        });
      } else {
        toast({
          title: 'Importação parcial',
          description: `${successCount} importado(s) com sucesso, ${errorCount} com erro.`,
          variant: 'destructive',
        });
      }
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

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filteredItems = items.filter(
    (item) =>
      item.nome?.toLowerCase().includes(search.toLowerCase()) ||
      (item.codigo_externo || '').toLowerCase().includes(search.toLowerCase()),
  );

  // ── Table columns ──────────────────────────────────────────────────────────

  const columns: Column<Parametro & { actions?: never }>[] = [
    {
      key: 'codigo_externo',
      label: t('common.code'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigo_externo || '-'}</span>,
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'descricao',
      label: t('common.description'),
      className: 'hidden md:table-cell',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">
          {item.descricao || '-'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: t('common.registrationDate'),
      className: 'w-32',
      render: (item) =>
        item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-',
    },
    {
      key: 'actions',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => openDelete(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const tableVisibleKeys = mode === 'list' ? visibleColumnKeys : undefined;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title={title} description={description} />

      {showExportImport && (
        <input
          ref={importFileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleImportFile}
        />
      )}

      <ListActionBar>
        <NewButton
          tooltip={`${t('common.new')} ${entityName}`}
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
        {showExportImport && (
          <>
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
          </>
        )}
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
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title={t('common.noResults')}
              description={`${t('common.add')} ${entityName.toLowerCase()}.`}
              icon={Settings}
              onAction={() => setIsModalOpen(true)}
              actionLabel={`${t('common.add')} ${entityName}`}
            />
          ) : (
            <SortableTable
              data={filteredItems}
              columns={columns}
              getRowKey={(item) => item.id}
              storageKey={storageKey}
              visibleColumnKeys={tableVisibleKeys}
            />
          )
        ) : mode === 'cards' ? (
          <CardGrid
            data={filteredItems}
            getRowKey={(item) => item.id}
            emptyTitle={t('common.noResults')}
            emptyDescription={`${t('common.add')} ${entityName.toLowerCase()}.`}
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel={`${t('common.add')} ${entityName}`}
            renderCard={(item) => (
              <ParametroCard
                item={item}
                entityName={entityName}
                onEdit={() => openEdit(item)}
                onDelete={() => openDelete(item.id)}
              />
            )}
          />
        ) : (
          <MasterDetail
            data={filteredItems}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedItem(item)}
            getRowKey={(item) => item.id}
            detailTitle={entityName}
            emptyDetailTitle={`Nenhum ${entityName.toLowerCase()} selecionado`}
            emptyDetailDescription={`Clique em um item na lista para ver os detalhes.`}
            renderRow={(item, isSelected) => (
              <div>
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  {item.nome}
                </p>
                {item.codigo_externo && (
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {item.codigo_externo}
                  </p>
                )}
              </div>
            )}
            renderDetail={(item) => (
              <ParametroDetailPanel
                item={item}
                onEdit={() => openEdit(item)}
                onDelete={() => openDelete(item.id)}
              />
            )}
          />
        )}
      </DataCard>

      <ParametroFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        title={entityName}
        data={editingItem}
        readOnly={
          !!editingItem && permissionPath
            ? !canAlterar(permissionPath[0], permissionPath[1], permissionPath[2] || '-')
            : false
        }
        navigation={(() => {
          const navIndex = editingItem
            ? filteredItems.findIndex((i) => i.id === editingItem.id)
            : -1;
          return navIndex >= 0
            ? {
                currentIndex: navIndex,
                total: filteredItems.length,
                onPrevious: () => setEditingItem(toLegacyFormat(filteredItems[navIndex - 1])),
                onNext: () => setEditingItem(toLegacyFormat(filteredItems[navIndex + 1])),
              }
            : undefined;
        })()}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete') || 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ParametroListPage;
