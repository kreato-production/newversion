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
import { Building2, Edit, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { EspacoFormModal } from '@/components/recursos/EspacoFormModal';
import { espacosRepository } from '@/modules/espacos/espacos.repository.provider';
import type { Espaco, EspacoInput } from '@/modules/espacos/espacos.types';

const STORAGE_KEY = 'kreato_espacos';

export const ESPACOS_PERMISSION_SCOPE = {
  modulo: 'Recursos',
  subModulo1: 'Espaços',
} as const;

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'codigoExterno', label: 'Código', defaultVisible: true },
  { key: 'titulo', label: 'Título', required: true },
  { key: 'descricao', label: 'Descrição', defaultVisible: true },
  { key: 'dataCadastro', label: 'Cadastro', defaultVisible: false },
  { key: 'actions', label: 'Ações', required: true },
];

function formatDateBR(iso: string) {
  if (!iso) return '-';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

// ─── Card component ──────────────────────────────────────────────────────────

function EspacoCard({
  item,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  item: Espaco;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-2 min-w-0">
          <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="font-medium text-sm leading-snug truncate">{item.titulo}</p>
        </div>
        {item.codigoExterno && (
          <p className="text-xs font-mono text-muted-foreground mt-1">{item.codigoExterno}</p>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-3 flex-1 text-xs text-muted-foreground">
        {item.descricao ? (
          <p className="line-clamp-2">{item.descricao}</p>
        ) : (
          <p className="italic">Sem descrição</p>
        )}
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

function EspacoDetailPanel({
  item,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  item: Espaco;
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
          {item.codigoExterno && (
            <p className="text-sm text-muted-foreground font-mono">{item.codigoExterno}</p>
          )}
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
          <p className="text-xs text-muted-foreground mb-0.5">Código Externo</p>
          <p>{item.codigoExterno || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Usuário de Cadastro</p>
          <p>{item.usuarioCadastro || '-'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground mb-0.5">Descrição</p>
          <p>{item.descricao || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Data de Cadastro</p>
          <p>{item.dataCadastro ? formatDateBR(item.dataCadastro.slice(0, 10)) : '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Disponibilidade</p>
          <p>{item.faixasDisponibilidade?.length ?? 0} faixa(s)</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Espacos() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();

  const podeIncluir = canIncluir(
    ESPACOS_PERMISSION_SCOPE.modulo,
    ESPACOS_PERMISSION_SCOPE.subModulo1,
  );
  const podeAlterar = canAlterar(
    ESPACOS_PERMISSION_SCOPE.modulo,
    ESPACOS_PERMISSION_SCOPE.subModulo1,
  );
  const podeExcluir = canExcluir(
    ESPACOS_PERMISSION_SCOPE.modulo,
    ESPACOS_PERMISSION_SCOPE.subModulo1,
  );

  const [items, setItems] = useState<Espaco[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Espaco | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Espaco | null>(null);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await espacosRepository.list());
    } catch {
      toast({ variant: 'destructive', title: t('spaces.loadError') });
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
        (i.codigoExterno && i.codigoExterno.toLowerCase().includes(q)) ||
        (i.descricao && i.descricao.toLowerCase().includes(q)),
    );
  }, [items, search]);

  const handleSave = async (input: EspacoInput) => {
    try {
      await espacosRepository.save(input);
      toast({ title: input.id ? t('spaces.updated') : t('spaces.created') });
      await loadData();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: t('spaces.saveError'), description: msg });
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await espacosRepository.remove(deletingId);
      toast({ title: t('spaces.deleted') });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await loadData();
    } catch {
      toast({ variant: 'destructive', title: t('spaces.deleteError') });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Table columns ─────────────────────────────────────────────────────────

  const columns: Column<Espaco>[] = [
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
      key: 'descricao',
      label: 'Descrição',
      render: (item) => (
        <span className="text-muted-foreground max-w-xs truncate block">
          {item.descricao || '-'}
        </span>
      ),
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title={t('spaces.title')} description={t('spaces.description')} />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={t('spaces.new')}
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
          placeholder={`Pesquisar ${t('spaces.title').toLowerCase()}...`}
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
              description={t('spaces.empty')}
              icon={Building2}
              onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
              actionLabel={t('spaces.new')}
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
            emptyDescription={t('spaces.empty')}
            onEmptyAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            emptyActionLabel={t('spaces.new')}
            renderCard={(item) => (
              <EspacoCard
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
            detailTitle={t('spaces.title')}
            emptyDetailTitle={t('spaces.emptyDetailTitle')}
            emptyDetailDescription={t('spaces.emptyDetailDescription')}
            renderRow={(item, isSelected) => (
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <div>
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                    {item.titulo}
                  </p>
                  {item.codigoExterno && (
                    <p className="text-xs text-muted-foreground font-mono">{item.codigoExterno}</p>
                  )}
                </div>
              </div>
            )}
            renderDetail={(item) => (
              <EspacoDetailPanel
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

      <EspacoFormModal
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
            <AlertDialogTitle>Excluir Espaço</AlertDialogTitle>
            <AlertDialogDescription>{t('spaces.deleteConfirmation')}</AlertDialogDescription>
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
