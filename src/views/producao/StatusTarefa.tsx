import { useCallback, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Settings, Edit, Trash2, Loader2, Star, Download, Upload } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { Button } from '@/components/ui/button';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { useRecordList } from '@/hooks/useRecordNavigation';
import { STATUS_TAREFA_FORM } from '@/modules/parametrizacoes/producao.forms';

interface StatusTarefaItem {
  id: string;
  codigo: string;
  nome: string;
  cor: string;
  descricao: string;
  isInicial: boolean;
  dataCadastro: string;
  usuarioCadastro: string;
}

const repository = new ApiParametrizacoesRepository();

const StatusTarefa = () => {
  const { t } = useLanguage();
  const importFileRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<StatusTarefaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listStatusTarefa();
      setItems(response.data);
    } catch (err) {
      console.error('Error fetching status_tarefa:', err);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const { openNew, openRecord } = useRecordList(STATUS_TAREFA_FORM.routes);
  // Opens the form page; keeps the filtered order for previous/next navigation.
  const handleOpenModal = (item?: StatusTarefaItem) => {
    if (!item) {
      openNew();
      return;
    }
    openRecord(
      item.id,
      filteredItems.map((i) => i.id),
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await repository.removeStatusTarefa(id);
      toast.success(t('common.deleted'));
      await fetchData();
    } catch (err) {
      console.error('Error deleting status_tarefa:', err);
      toast.error('Erro ao excluir');
    }
  };

  const handleToggleInicial = async (id: string, value: boolean) => {
    try {
      await repository.toggleStatusTarefaInicial(id, value);
      toast.success(value ? 'Status definido como inicial' : 'Status inicial removido');
      await fetchData();
    } catch (err) {
      console.error('Error toggling is_inicial:', err);
      toast.error('Erro ao atualizar');
    }
  };

  const handleExport = () => {
    const data = filteredItems.map((item) => ({
      Código: item.codigo,
      Nome: item.nome,
      Cor: item.cor,
      Descrição: item.descricao,
      Inicial: item.isInicial ? 'Sim' : 'Não',
      'Data de Cadastro': item.dataCadastro
        ? new Date(item.dataCadastro).toLocaleDateString('pt-BR')
        : '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 18 }, { wch: 40 }, { wch: 12 }, { wch: 50 }, { wch: 10 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Status de Tarefa');
    XLSX.writeFile(wb, `status_tarefa_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`${filteredItems.length} registro(s) exportado(s).`);
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
        toast.error('O arquivo não contém dados.');
        return;
      }
      if (!('Nome' in rows[0])) {
        toast.error(
          'Coluna obrigatória "Nome" não encontrada. Use o arquivo exportado como template.',
        );
        return;
      }
      const toBool = (v: unknown) =>
        ['sim', 'true', '1'].includes(
          String(v ?? '')
            .trim()
            .toLowerCase(),
        );
      let ok = 0;
      let fail = 0;
      for (const row of rows) {
        const nome = String(row['Nome'] ?? '').trim();
        const codigo = String(row['Código'] ?? '').trim();
        if (!nome || !codigo) {
          fail++;
          continue;
        }
        try {
          await repository.saveStatusTarefa({
            codigo,
            nome,
            cor: String(row['Cor'] ?? '#888888').trim(),
            descricao: String(row['Descrição'] ?? '').trim(),
            isInicial: toBool(row['Inicial']),
          });
          ok++;
        } catch {
          fail++;
        }
      }
      await fetchData();
      if (fail === 0) toast.success(`${ok} registro(s) importado(s) com sucesso.`);
      else toast.error(`${ok} importado(s) com sucesso, ${fail} com erro.`);
    } catch (err) {
      toast.error(`Não foi possível processar o arquivo: ${(err as Error).message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.codigo.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<StatusTarefaItem>[] = [
    {
      key: 'codigo',
      label: t('common.code'),
      className: 'w-28',
      render: (item) => <span className="font-mono text-sm">{item.codigo}</span>,
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'cor',
      label: t('common.color'),
      className: 'w-36',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border" style={{ backgroundColor: item.cor || '#888' }} />
          {item.cor}
        </div>
      ),
    },
    {
      key: 'descricao',
      label: t('common.description'),
      className: 'hidden md:table-cell',
      render: (item) => <span className="truncate">{item.descricao}</span>,
    },
    {
      key: 'isInicial',
      label: 'Inicial',
      className: 'w-20 text-center',
      sortable: false,
      groupable: true,
      groupValue: (item) => (item.isInicial ? 'Inicial' : 'Normal'),
      render: (item) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => void handleToggleInicial(item.id, !item.isInicial)}
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
      key: 'acoes',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(item)}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('common.confirm.delete')}</AlertDialogTitle>
                <AlertDialogDescription>{t('common.deleteConfirmation')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => void handleDelete(item.id)}>
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={t('parameters.taskStatus')}
        description={t('parameters.taskStatusDescription')}
      />

      <input
        ref={importFileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleImportFile}
      />

      <ListActionBar>
        <NewButton tooltip={t('common.new')} onClick={() => handleOpenModal()} />
        <TooltipProvider>
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
        </TooltipProvider>
        <TooltipProvider>
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
        </TooltipProvider>
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} placeholder={t('common.search')} />
      </ListActionBar>

      {filteredItems.length === 0 ? (
        <EmptyState
          title={t('common.noResults')}
          description={t('parameters.taskStatusDescription')}
          icon={Settings}
          onAction={() => handleOpenModal()}
          actionLabel={t('common.add')}
        />
      ) : (
        <DataCard>
          <SortableTable
            data={filteredItems}
            columns={columns}
            getRowKey={(item) => item.id}
            storageKey="kreato_status_tarefa_table"
          />
        </DataCard>
      )}
    </>
  );
};

export default StatusTarefa;
