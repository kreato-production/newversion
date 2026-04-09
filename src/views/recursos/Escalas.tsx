'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
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
import { CalendarRange, Edit, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { EscalaFormModal } from '@/components/recursos/EscalaFormModal';
import { escalasRepository } from '@/modules/escalas/escalas.repository.provider';
import type { Escala, EscalaInput } from '@/modules/escalas/escalas.types';

const STORAGE_KEY = 'kreato_escalas';

export const ESCALAS_PERMISSION_SCOPE = {
  modulo: 'Recursos',
  subModulo1: 'Parametrizações',
  subModulo2: 'Escalas',
} as const;

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'numerador', label: 'Nº', required: true },
  { key: 'codigoExterno', label: 'Código', defaultVisible: true },
  { key: 'titulo', label: 'Título', required: true },
  { key: 'grupoFuncao', label: 'Grupo de Função', defaultVisible: true },
  { key: 'dataInicio', label: 'Início', defaultVisible: true },
  { key: 'dataCadastro', label: 'Cadastro', defaultVisible: false },
  { key: 'actions', label: 'Ações', required: true },
];

function formatDateBR(iso: string) {
  if (!iso) return '-';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

// ─── Card component ─────────────────────────────────────────────────────────

function EscalaCard({
  item,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  item: Escala;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{item.titulo}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.grupoFuncaoNome || '-'}</p>
          </div>
          <span className="text-xs text-muted-foreground shrink-0 font-mono">
            #{item.numerador}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 flex-1">
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {item.codigoExterno && (
            <span>
              Código: <span className="text-foreground font-medium">{item.codigoExterno}</span>
            </span>
          )}
          <span>
            Início: <span className="text-foreground">{formatDateBR(item.dataInicio)}</span>
          </span>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1 mt-auto">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onEdit}
          disabled={!canEdit}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
        {canDelete && (
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

// ─── Detail panel ────────────────────────────────────────────────────────────

function EscalaDetailPanel({
  item,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  item: Escala;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base">{item.titulo}</h3>
          <p className="text-sm text-muted-foreground">{item.grupoFuncaoNome || '-'}</p>
        </div>
        <div className="flex gap-1">
          {canEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Editar
            </Button>
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Excluir
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Nº</p>
          <p>{item.numerador}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Código Externo</p>
          <p>{item.codigoExterno || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Início</p>
          <p>{formatDateBR(item.dataInicio)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Grupo de Função</p>
          <p>{item.grupoFuncaoNome || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Usuário de Cadastro</p>
          <p>{item.usuarioCadastro || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Data de Cadastro</p>
          <p>{item.dataCadastro ? formatDateBR(item.dataCadastro.slice(0, 10)) : '-'}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function Escalas() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();

  const podeIncluir = canIncluir(
    ESCALAS_PERMISSION_SCOPE.modulo,
    ESCALAS_PERMISSION_SCOPE.subModulo1,
    ESCALAS_PERMISSION_SCOPE.subModulo2,
  );
  const podeAlterar = canAlterar(
    ESCALAS_PERMISSION_SCOPE.modulo,
    ESCALAS_PERMISSION_SCOPE.subModulo1,
    ESCALAS_PERMISSION_SCOPE.subModulo2,
  );
  const podeExcluir = canExcluir(
    ESCALAS_PERMISSION_SCOPE.modulo,
    ESCALAS_PERMISSION_SCOPE.subModulo1,
    ESCALAS_PERMISSION_SCOPE.subModulo2,
  );

  const [items, setItems] = useState<Escala[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Escala | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Escala | null>(null);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await escalasRepository.list());
    } catch {
      toast({ variant: 'destructive', title: t('scales.loadError') });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.titulo.toLowerCase().includes(q) ||
        i.grupoFuncaoNome.toLowerCase().includes(q) ||
        i.codigoExterno.toLowerCase().includes(q),
    );
  }, [items, search]);

  const handleSave = async (input: EscalaInput) => {
    try {
      const saved = await escalasRepository.save(input);
      toast({ title: input.id ? t('scales.updated') : t('scales.created') });
      await loadData();
      setIsModalOpen(false);
      setEditingItem(null);
      setSelectedItem(saved);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: t('scales.saveError'), description: msg });
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await escalasRepository.remove(deletingId);
      toast({ title: t('scales.deleted') });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await loadData();
    } catch {
      toast({ variant: 'destructive', title: t('scales.deleteError') });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Table columns ────────────────────────────────────────────────────────

  const columns: Column<Escala>[] = [
    {
      key: 'numerador',
      label: '#',
      render: (item) => <span className="font-mono text-xs">{item.numerador}</span>,
    },
    {
      key: 'codigoExterno',
      label: 'Código',
      render: (item) => item.codigoExterno || '-',
    },
    {
      key: 'titulo',
      label: 'Título',
      render: (item) => <span className="font-medium">{item.titulo}</span>,
    },
    {
      key: 'grupoFuncao',
      label: 'Grupo de Função',
      render: (item) => item.grupoFuncaoNome || '-',
    },
    {
      key: 'dataInicio',
      label: 'Início',
      render: (item) => formatDateBR(item.dataInicio),
    },
    {
      key: 'dataCadastro',
      label: 'Cadastro',
      render: (item) => (item.dataCadastro ? formatDateBR(item.dataCadastro.slice(0, 10)) : '-'),
    },
    {
      key: 'actions',
      label: 'Ações',
      sortable: false,
      className: 'w-24 text-right',
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
            <Edit className="h-3.5 w-3.5" />
          </Button>
          {podeExcluir && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDeletingId(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title={t('scales.title')} description={t('scales.description')} />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={t('scales.new')}
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          />
        )}
        <div className="flex-1" />
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={`Pesquisar ${t('scales.title').toLowerCase()}...`}
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : mode === 'list' ? (
          filtered.length === 0 ? (
            <EmptyState
              title={t('common.noResults')}
              description={t('scales.empty')}
              icon={CalendarRange}
              onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
              actionLabel={t('scales.new')}
            />
          ) : (
            <SortableTable
              data={filtered}
              columns={columns}
              getRowKey={(item) => item.id}
              storageKey={STORAGE_KEY}
              visibleColumnKeys={visibleColumnKeys}
            />
          )
        ) : mode === 'cards' ? (
          <CardGrid
            data={filtered}
            getRowKey={(item) => item.id}
            emptyTitle={t('common.noResults')}
            emptyDescription={t('scales.empty')}
            onEmptyAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            emptyActionLabel={t('scales.new')}
            renderCard={(item) => (
              <EscalaCard
                item={item}
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
            data={filtered}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedItem(item)}
            getRowKey={(item) => item.id}
            detailTitle={t('scales.title')}
            emptyDetailTitle={t('scales.emptyDetailTitle')}
            emptyDetailDescription={t('scales.emptyDetailDescription')}
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <CalendarRange className="h-3.5 w-3.5 text-primary shrink-0" />
                <div>
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                    {item.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.grupoFuncaoNome || '-'}</p>
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <EscalaDetailPanel
                item={item}
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

      <EscalaFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !podeAlterar}
      />

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Escala</AlertDialogTitle>
            <AlertDialogDescription>{t('scales.deleteConfirmation')}</AlertDialogDescription>
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
}
