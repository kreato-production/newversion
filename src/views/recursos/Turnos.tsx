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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { NewButton } from '@/components/shared/NewButton';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';
import { Clock3, Edit, Loader2, Trash2, UsersRound, Download, Upload } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { TurnoFormModal } from '@/components/recursos/TurnoFormModal';
import { turnosRepository } from '@/modules/turnos/turnos.repository.provider';
import type { Turno, TurnoInput, WeekdayKey } from '@/modules/turnos/turnos.types';
import { weekdayKeys } from '@/modules/turnos/turnos.types';

const STORAGE_KEY = 'kreato_turnos';
export const TURNOS_PERMISSION_SCOPE = {
  modulo: 'Recursos',
  subModulo1: 'Parametrizações',
  subModulo2: 'Turnos',
} as const;

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'nome', label: 'Nome', required: true },
  { key: 'sigla', label: 'Sigla', defaultVisible: true },
  { key: 'horario', label: 'Horario', defaultVisible: true },
  { key: 'diasTrabalhados', label: 'Dias Trabalhados', defaultVisible: true },
  { key: 'folgasPorSemana', label: 'Folgas', defaultVisible: true },
  { key: 'actions', label: 'Acoes', required: true },
];

const weekdayLabelKeys: Record<WeekdayKey, string> = {
  dom: 'field.sun',
  seg: 'field.mon',
  ter: 'field.tue',
  qua: 'field.wed',
  qui: 'field.thu',
  sex: 'field.fri',
  sab: 'field.sat',
};

function formatTime(value: string) {
  return value.slice(0, 5);
}

function formatSchedule(item: Pick<Turno, 'horaInicio' | 'horaFim'>) {
  return `${formatTime(item.horaInicio)} - ${formatTime(item.horaFim)}`;
}

function getActiveDays(item: Turno) {
  return weekdayKeys.filter((key) => item.diasSemana[key]);
}

function TurnoCard({
  item,
  dayLabel,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  item: Turno;
  dayLabel: (key: WeekdayKey) => string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const activeDays = getActiveDays(item);

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: item.cor }}
                aria-hidden="true"
              />
              <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{formatSchedule(item)}</p>
          </div>
          {item.sigla && <Badge variant="outline">{item.sigla}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 space-y-3">
        <div className="flex flex-wrap gap-1">
          {activeDays.length > 0 ? (
            activeDays.map((key) => (
              <Badge key={key} variant="secondary" className="text-[10px]">
                {dayLabel(key)}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>{item.diasTrabalhados ?? '-'} dias</span>
          <span>{item.folgasPorSemana} folgas</span>
        </div>
      </CardContent>

      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1 mt-auto">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onEdit}
          disabled={!canEdit}
          aria-label="Editar turno"
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        {canDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label="Excluir turno"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function TurnoDetailPanel({
  item,
  dayLabel,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  item: Turno;
  dayLabel: (key: WeekdayKey) => string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const activeDays = getActiveDays(item);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-full border shrink-0"
          style={{ backgroundColor: item.cor }}
          aria-hidden="true"
        />
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{formatSchedule(item)}</p>
          {item.sigla && (
            <p className="text-xs font-mono text-muted-foreground mt-1">{item.sigla}</p>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Dias trabalhados</p>
          <p className="text-sm">{item.diasTrabalhados ?? '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Folgas por semana</p>
          <p className="text-sm">{item.folgasPorSemana}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Folga especial</p>
          <p className="text-sm">{item.folgaEspecial || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Data de cadastro</p>
          <p className="text-sm">
            {item.dataCadastro ? new Date(item.dataCadastro).toLocaleDateString('pt-BR') : '-'}
          </p>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Dias da semana</p>
        <div className="flex flex-wrap gap-1">
          {activeDays.length > 0 ? (
            activeDays.map((key) => (
              <Badge key={key} variant="secondary">
                {dayLabel(key)}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Pessoas por dia</p>
        <div className="flex flex-wrap gap-1">
          {weekdayKeys.map((key) => (
            <Badge key={key} variant={item.diasSemana[key] ? 'default' : 'outline'}>
              {dayLabel(key)}: {item.pessoasPorDia[key]}
            </Badge>
          ))}
        </div>
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

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onEdit} disabled={!canEdit}>
          <Edit className="h-3.5 w-3.5 mr-1.5" />
          Editar
        </Button>
        {canDelete && (
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

const Turnos = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir(
    TURNOS_PERMISSION_SCOPE.modulo,
    TURNOS_PERMISSION_SCOPE.subModulo1,
    TURNOS_PERMISSION_SCOPE.subModulo2,
  );
  const podeAlterar = canAlterar(
    TURNOS_PERMISSION_SCOPE.modulo,
    TURNOS_PERMISSION_SCOPE.subModulo1,
    TURNOS_PERMISSION_SCOPE.subModulo2,
  );
  const podeExcluir = canExcluir(
    TURNOS_PERMISSION_SCOPE.modulo,
    TURNOS_PERMISSION_SCOPE.subModulo1,
    TURNOS_PERMISSION_SCOPE.subModulo2,
  );
  const importFileRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Turno | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Turno | null>(null);
  const [items, setItems] = useState<Turno[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const dayLabel = useCallback((key: WeekdayKey) => t(weekdayLabelKeys[key]), [t]);

  const fetchTurnos = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await turnosRepository.list());
    } catch (error) {
      console.error('Error fetching turnos:', error);
      toast({
        title: t('common.error'),
        description: t('turns.loadError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void fetchTurnos();
  }, [fetchTurnos]);

  const handleSave = async (data: TurnoInput) => {
    try {
      await turnosRepository.save({
        ...data,
        id: editingItem?.id,
      });
      toast({
        title: t('common.success'),
        description: editingItem ? t('turns.updated') : t('turns.created'),
      });
      await fetchTurnos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving turno:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('turns.saveError'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      await turnosRepository.remove(deletingId);
      toast({
        title: t('common.deleted'),
        description: t('turns.deleted'),
      });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchTurnos();
    } catch (error) {
      console.error('Error deleting turno:', error);
      toast({
        title: t('common.error'),
        description: t('turns.deleteError'),
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    const data = filteredItems.map((item) => ({
      Nome: item.nome,
      Sigla: item.sigla,
      'Hora Início': formatTime(item.horaInicio),
      'Hora Fim': formatTime(item.horaFim),
      Dom: item.diasSemana.dom ? 'Sim' : 'Não',
      Seg: item.diasSemana.seg ? 'Sim' : 'Não',
      Ter: item.diasSemana.ter ? 'Sim' : 'Não',
      Qua: item.diasSemana.qua ? 'Sim' : 'Não',
      Qui: item.diasSemana.qui ? 'Sim' : 'Não',
      Sex: item.diasSemana.sex ? 'Sim' : 'Não',
      Sáb: item.diasSemana.sab ? 'Sim' : 'Não',
      'Folgas/Semana': item.folgasPorSemana,
      'Folga Especial': item.folgaEspecial,
      Cor: item.cor,
      Descrição: item.descricao,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 30 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      ...Array(7).fill({ wch: 8 }),
      { wch: 14 },
      { wch: 20 },
      { wch: 12 },
      { wch: 40 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Turnos');
    XLSX.writeFile(wb, `turnos_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      if (!('Nome' in rows[0]) || !('Hora Início' in rows[0])) {
        toast({
          title: 'Estrutura inválida',
          description: 'Colunas obrigatórias "Nome" e "Hora Início" não encontradas.',
          variant: 'destructive',
        });
        return;
      }
      const toB = (v: unknown) =>
        ['sim', 'true', '1'].includes(
          String(v ?? '')
            .trim()
            .toLowerCase(),
        );
      let ok = 0;
      let fail = 0;
      for (const row of rows) {
        const nome = String(row['Nome'] ?? '').trim();
        const horaInicio = String(row['Hora Início'] ?? '').trim();
        const horaFim = String(row['Hora Fim'] ?? '').trim();
        if (!nome || !horaInicio || !horaFim) {
          fail++;
          continue;
        }
        try {
          await turnosRepository.save({
            nome,
            horaInicio,
            horaFim,
            sigla: String(row['Sigla'] ?? '').trim(),
            cor: String(row['Cor'] ?? '#3b82f6').trim(),
            descricao: String(row['Descrição'] ?? '').trim(),
            folgasPorSemana: Number(row['Folgas/Semana'] ?? 0),
            folgaEspecial: String(row['Folga Especial'] ?? '').trim(),
            diasTrabalhados: null,
            diasSemana: {
              dom: toB(row['Dom']),
              seg: toB(row['Seg']),
              ter: toB(row['Ter']),
              qua: toB(row['Qua']),
              qui: toB(row['Qui']),
              sex: toB(row['Sex']),
              sab: toB(row['Sáb']),
            },
            pessoasPorDia: { dom: 0, seg: 0, ter: 0, qua: 0, qui: 0, sex: 0, sab: 0 },
          });
          ok++;
        } catch {
          fail++;
        }
      }
      await fetchTurnos();
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
        item.nome.toLowerCase().includes(searchTerm) ||
        item.sigla.toLowerCase().includes(searchTerm) ||
        item.descricao.toLowerCase().includes(searchTerm),
    );
  }, [items, search]);

  const columns: Column<Turno>[] = [
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.cor }} />
          <span className="font-medium">{item.nome}</span>
        </div>
      ),
    },
    {
      key: 'sigla',
      label: t('turns.abbreviation'),
      className: 'w-28',
      render: (item) => <span className="font-mono">{item.sigla || '-'}</span>,
    },
    {
      key: 'horario',
      label: t('turns.schedule'),
      className: 'w-36',
      render: (item) => <span>{formatSchedule(item)}</span>,
    },
    {
      key: 'diasTrabalhados',
      label: t('turns.daysWorked'),
      className: 'w-32',
      render: (item) => item.diasTrabalhados ?? '-',
    },
    {
      key: 'folgasPorSemana',
      label: t('turns.weeklyDaysOff'),
      className: 'w-28',
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
            aria-label={t('common.edit')}
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          {podeExcluir && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDeletingId(item.id)}
              aria-label={t('common.delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const modalData: TurnoInput | null = editingItem
    ? {
        id: editingItem.id,
        nome: editingItem.nome,
        horaInicio: formatTime(editingItem.horaInicio),
        horaFim: formatTime(editingItem.horaFim),
        diasSemana: editingItem.diasSemana,
        pessoasPorDia: editingItem.pessoasPorDia,
        cor: editingItem.cor,
        sigla: editingItem.sigla,
        folgasPorSemana: editingItem.folgasPorSemana,
        folgaEspecial: editingItem.folgaEspecial,
        descricao: editingItem.descricao,
        diasTrabalhados: editingItem.diasTrabalhados,
      }
    : null;

  return (
    <div>
      <PageHeader title={t('turns.title')} description={t('turns.description')} />

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
            tooltip={t('turns.new')}
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
              description={t('turns.empty')}
              icon={Clock3}
              onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
              actionLabel={t('turns.new')}
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
            emptyDescription={t('turns.empty')}
            onEmptyAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            emptyActionLabel={t('turns.new')}
            renderCard={(item) => (
              <TurnoCard
                item={item}
                dayLabel={dayLabel}
                canEdit={podeAlterar}
                canDelete={podeExcluir}
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
            detailTitle={t('turns.title')}
            emptyDetailTitle={t('turns.emptyDetailTitle')}
            emptyDetailDescription={t('turns.emptyDetailDescription')}
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <UsersRound className="h-3.5 w-3.5 text-primary shrink-0" />
                <div>
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                    {item.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatSchedule(item)}</p>
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <TurnoDetailPanel
                item={item}
                dayLabel={dayLabel}
                canEdit={podeAlterar}
                canDelete={podeExcluir}
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

      <TurnoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={modalData}
        readOnly={!!editingItem && !podeAlterar}
        dataCadastro={editingItem?.dataCadastro}
        usuarioCadastro={editingItem?.usuarioCadastro}
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
            <AlertDialogTitle>{t('common.confirm.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('turns.deleteConfirmation')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Turnos;
