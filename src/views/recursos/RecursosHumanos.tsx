import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { NewButton } from '@/components/shared/NewButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RecursoHumanoFormModal } from '@/components/recursos/RecursoHumanoFormModal';
import { MapaEscalasModal } from '@/components/recursos/MapaEscalasModal';
import { MapaOciosidadeModal } from '@/components/recursos/MapaOciosidadeModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { parseISO, isWithinInterval, startOfDay } from 'date-fns';
import { Edit, Trash2, Users, UserX, Calendar, Loader2, Clock } from 'lucide-react';
import { recursosHumanosRepository } from '@/modules/recursos-humanos/recursos-humanos.repository.provider';
import type {
  Ausencia,
  RecursoHumano,
  RecursoHumanoInput,
} from '@/modules/recursos-humanos/recursos-humanos.types';
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';

const STORAGE_KEY = 'kreato_recursos_humanos_table';

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'foto',        label: 'Foto',          defaultVisible: true },
  { key: 'nome',        label: 'Nome',           required: true },
  { key: 'email',       label: 'E-mail',         defaultVisible: true },
  { key: 'departamento',label: 'Departamento',   defaultVisible: true },
  { key: 'funcao',      label: 'Função',         defaultVisible: true },
  { key: 'custoHora',   label: 'Custo/h',        defaultVisible: false },
  { key: 'status',      label: 'Status',         defaultVisible: true },
  { key: 'acoes',       label: 'Ações',          required: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hoje = startOfDay(new Date());

function getAusenciaHoje(item: RecursoHumano): Ausencia | null {
  return (
    item.ausencias.find((ausencia) => {
      try {
        const inicio = startOfDay(parseISO(ausencia.dataInicio));
        const fim = startOfDay(parseISO(ausencia.dataFim));
        return isWithinInterval(hoje, { start: inicio, end: fim });
      } catch {
        return false;
      }
    }) ?? null
  );
}

const formatCustoHora = (value: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

// ─── Card renderer ────────────────────────────────────────────────────────────

function RecursoHumanoCard({
  item,
  podeAlterar,
  podeExcluir,
  onEdit,
  onDelete,
}: {
  item: RecursoHumano;
  podeAlterar: boolean;
  podeExcluir: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ausenciaHoje = getAusenciaHoje(item);

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <Avatar className="w-10 h-10">
              <AvatarImage src={item.foto} />
              <AvatarFallback className="text-xs gradient-brand text-primary-foreground">
                {item.nome.charAt(0)}{item.sobrenome.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {ausenciaHoje && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <UserX className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug truncate">{item.nome} {item.sobrenome}</p>
            <p className="text-xs text-muted-foreground truncate">{item.funcao || '-'}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 space-y-1.5 text-xs text-muted-foreground">
        {item.departamento && <div>{item.departamento}</div>}
        {ausenciaHoje && (
          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
            {ausenciaHoje.motivo}
          </Badge>
        )}
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5">
          {item.status}
        </Badge>
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

function RecursoHumanoDetailPanel({
  item,
  podeAlterar,
  podeExcluir,
  onEdit,
  onDelete,
}: {
  item: RecursoHumano;
  podeAlterar: boolean;
  podeExcluir: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ausenciaHoje = getAusenciaHoje(item);
  const field = (label: string, value: string | undefined | null) =>
    value ? (
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar className="w-12 h-12">
            <AvatarImage src={item.foto} />
            <AvatarFallback className="text-sm gradient-brand text-primary-foreground">
              {item.nome.charAt(0)}{item.sobrenome.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {ausenciaHoje && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
              <UserX className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-base leading-snug">{item.nome} {item.sobrenome}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'} className="text-[10px] h-4 px-1.5">
              {item.status}
            </Badge>
            {ausenciaHoje && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                {ausenciaHoje.motivo}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {field('E-mail', item.email)}
        {field('Departamento', item.departamento)}
        {field('Função', item.funcao)}
        {field('Custo/h', formatCustoHora(item.custoHora))}
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

const RecursosHumanos = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();
  const podeIncluir = canIncluir('Recursos', 'Recursos Humanos');
  const podeAlterar = canAlterar('Recursos', 'Recursos Humanos');
  const podeExcluir = canExcluir('Recursos', 'Recursos Humanos');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapaOpen, setIsMapaOpen] = useState(false);
  const [isMapaOciosidadeOpen, setIsMapaOciosidadeOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecursoHumano | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RecursoHumano | null>(null);
  const [items, setItems] = useState<RecursoHumano[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchRecursosHumanos = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setItems(await recursosHumanosRepository.list());
    } catch (error) {
      console.error('Error fetching recursos humanos:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao carregar recursos humanos: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, t, toast]);

  useEffect(() => {
    void fetchRecursosHumanos();
  }, [fetchRecursosHumanos]);

  const handleSave = async (data: RecursoHumanoInput) => {
    try {
      await recursosHumanosRepository.save({
        ...data,
        tenantId: user?.tenantId ?? null,
      });
      toast({
        title: t('common.success'),
        description: editingItem ? 'Colaborador atualizado!' : 'Colaborador criado!',
      });
      await fetchRecursosHumanos();
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving recurso humano:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao salvar: ${(error as Error).message}`,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await recursosHumanosRepository.remove(deletingId);
      toast({ title: t('common.deleted'), description: t('common.deleted') });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchRecursosHumanos();
    } catch (error) {
      console.error('Error deleting recurso humano:', error);
      toast({
        title: t('common.error'),
        description: `Erro ao excluir: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          `${item.nome} ${item.sobrenome}`.toLowerCase().includes(search.toLowerCase()) ||
          item.email.toLowerCase().includes(search.toLowerCase()) ||
          item.departamento.toLowerCase().includes(search.toLowerCase()) ||
          item.funcao.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

  const columns: Column<RecursoHumano>[] = [
    {
      key: 'foto',
      label: '',
      className: 'w-12',
      sortable: false,
      render: (item) => {
        const ausenciaHoje = getAusenciaHoje(item);
        return (
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarImage src={item.foto} />
              <AvatarFallback className="text-xs gradient-brand text-primary-foreground">
                {item.nome.charAt(0)}
                {item.sobrenome.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {ausenciaHoje && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <UserX className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'nome',
      label: t('common.name'),
      render: (item) => {
        const ausenciaHoje = getAusenciaHoje(item);
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {item.nome} {item.sobrenome}
            </span>
            {ausenciaHoje && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30"
                    >
                      {ausenciaHoje.motivo}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{ausenciaHoje.motivo}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    {
      key: 'email',
      label: t('common.email'),
      render: (item) => item.email || '-',
    },
    {
      key: 'departamento',
      label: t('field.department'),
      render: (item) => item.departamento || '-',
    },
    {
      key: 'funcao',
      label: t('field.function'),
      render: (item) => item.funcao || '-',
    },
    {
      key: 'custoHora',
      label: t('field.costPerHour'),
      render: (item) => formatCustoHora(item.custoHora),
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (item) => (
        <Badge variant={item.status === 'Ativo' ? 'default' : 'secondary'}>{item.status}</Badge>
      ),
    },
    {
      key: 'acoes',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            disabled={!podeAlterar}
            onClick={(e) => {
              e.stopPropagation();
              setEditingItem(item);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          {podeExcluir && (
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingId(item.id);
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={t('humanResources.title')} description={t('field.manageCollaborators')} />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip={t('field.newCollaborator')}
            onClick={() => {
              setEditingItem(null);
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMapaOpen(true)}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          {t('field.scaleMap')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMapaOciosidadeOpen(true)}
          className="flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Mapa de Ociosidade
        </Button>
      </ListActionBar>

      <DataCard>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title={t('field.noCollaboratorRegistered')}
              description={t('field.manageCollaboratorsTeam')}
              icon={Users}
              onAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
              actionLabel={t('field.addCollaborator')}
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
            emptyTitle={t('field.noCollaboratorRegistered')}
            emptyDescription={t('field.manageCollaboratorsTeam')}
            onEmptyAction={podeIncluir ? () => setIsModalOpen(true) : undefined}
            emptyActionLabel={t('field.addCollaborator')}
            renderCard={(item) => (
              <RecursoHumanoCard
                item={item}
                podeAlterar={podeAlterar}
                podeExcluir={podeExcluir}
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
            detailTitle="Detalhe do Colaborador"
            emptyDetailTitle="Nenhum colaborador selecionado"
            emptyDetailDescription="Clique em um colaborador na lista para ver os detalhes."
            renderRow={(item, isSelected) => {
              const ausenciaHoje = getAusenciaHoje(item);
              return (
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={item.foto} />
                      <AvatarFallback className="text-xs gradient-brand text-primary-foreground">
                        {item.nome.charAt(0)}{item.sobrenome.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {ausenciaHoje && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
                        <UserX className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                      {item.nome} {item.sobrenome}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{item.funcao}</p>
                  </div>
                </div>
              );
            }}
            renderDetail={(item) => (
              <RecursoHumanoDetailPanel
                item={item}
                podeAlterar={podeAlterar}
                podeExcluir={podeExcluir}
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

      <RecursoHumanoFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
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

      <MapaEscalasModal
        isOpen={isMapaOpen}
        onClose={() => setIsMapaOpen(false)}
        recursos={items}
        onUpdateRecurso={podeAlterar ? handleSave : undefined}
      />

      <MapaOciosidadeModal
        isOpen={isMapaOciosidadeOpen}
        onClose={() => setIsMapaOciosidadeOpen(false)}
        recursos={items}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.
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

export default RecursosHumanos;
