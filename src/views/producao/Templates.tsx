import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PageHeader, SearchBar, DataCard, EmptyState } from '@/components/shared/PageComponents';
import { ListActionBar } from '@/components/shared/ListActionBar';
import { Edit, Trash2, LayoutList, Layers } from 'lucide-react';
import { NewButton } from '@/components/shared/NewButton';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { usePermissions } from '@/hooks/usePermissions';
import {
  ListFilterPanel,
  FilterSection,
  SortChip,
  SORT_OPTIONS_NOME_DATA,
  sortSubtitle,
} from '@/components/shared/ListFilter';
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
import {
  useListingView,
  ViewSwitcher,
  ColumnSelector,
  CardGrid,
  MasterDetail,
  type ColumnConfig,
} from '@/components/listing';
import { TemplateFormModal } from '@/components/producao/TemplateFormModal';
import { PlanoProducaoModal } from '@/components/producao/PlanoProducaoModal';
import { etapasFromTemplate } from '@/modules/templates/templates.api';
import {
  templatesRepository,
  type Template,
  type SaveTemplateInput,
} from '@/modules/templates/templates.api';

// ─── Column configuration ─────────────────────────────────────────────────────

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'nome', label: 'Nome', required: true },
  { key: 'descricao', label: 'Descrição', defaultVisible: true },
  { key: 'estado', label: 'Estado', defaultVisible: true },
  { key: 'etapas', label: 'Etapas', defaultVisible: true },
  { key: 'atividades', label: 'Atividades', defaultVisible: true },
  { key: 'acoes', label: 'Ações', required: true },
];

const STORAGE_KEY = 'kreato_templates_table';

// ─── Card renderer ────────────────────────────────────────────────────────────

function TemplateCard({
  item,
  onEdit,
  onDelete,
  onPlano,
  podeAlterar,
  podeExcluir,
}: {
  item: Template;
  onEdit: () => void;
  onDelete: () => void;
  onPlano: () => void;
  podeAlterar: boolean;
  podeExcluir: boolean;
}) {
  const totalAtividades = item.etapas.reduce((acc, e) => acc + e.atividades.length, 0);

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-4">
        <p className="font-medium text-sm leading-snug truncate">{item.nome}</p>
        {item.descricao && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.descricao}</p>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-3 flex-1 space-y-2">
        <div className="flex flex-wrap gap-1">
          {item.etapas.map((e) => (
            <span
              key={e.id}
              className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: e.cor + '22',
                color: e.cor,
                border: `1px solid ${e.cor}44`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: e.cor }}
              />
              {e.nome}
            </span>
          ))}
          {item.etapas.length === 0 && (
            <span className="text-xs text-muted-foreground">Sem etapas</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{totalAtividades} atividade(s) no total</p>
      </CardContent>

      <CardFooter className="px-4 py-2 border-t flex justify-end gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          title="Plano de Produção"
          disabled={item.etapas.length === 0}
          onClick={onPlano}
        >
          <LayoutList className="h-3.5 w-3.5" />
        </Button>
        {podeAlterar && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
        )}
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

function TemplateDetailPanel({
  item,
  onEdit,
  onDelete,
  onPlano,
  podeAlterar,
  podeExcluir,
}: {
  item: Template;
  onEdit: () => void;
  onDelete: () => void;
  onPlano: () => void;
  podeAlterar: boolean;
  podeExcluir: boolean;
}) {
  const totalAtividades = item.etapas.reduce((acc, e) => acc + e.atividades.length, 0);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-base leading-snug">{item.nome}</h3>
        {item.descricao && <p className="text-sm text-muted-foreground mt-1">{item.descricao}</p>}
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Etapas ({item.etapas.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {item.etapas.map((e) => (
              <span
                key={e.id}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: e.cor + '22',
                  color: e.cor,
                  border: `1px solid ${e.cor}55`,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.cor }} />
                {e.nome}
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4">
                  {e.atividades.length}
                </Badge>
              </span>
            ))}
            {item.etapas.length === 0 && (
              <span className="text-xs text-muted-foreground">Nenhuma etapa cadastrada</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Total de Atividades</p>
          <p className="text-sm">{totalAtividades}</p>
        </div>
      </div>

      <Separator />

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" disabled={item.etapas.length === 0} onClick={onPlano}>
          <LayoutList className="h-3.5 w-3.5 mr-1.5" />
          Plano de Produção
        </Button>
        {podeAlterar && (
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Editar
          </Button>
        )}
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

export default function Templates() {
  const { toast } = useToast();
  const { canIncluir, canAlterar, canExcluir } = usePermissions();

  const podeIncluir = canIncluir('Produção', 'Templates');
  const podeAlterar = canAlterar('Produção', 'Templates');
  const podeExcluir = canExcluir('Produção', 'Templates');

  const [items, setItems] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSortBy, setFilterSortBy] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Template | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Template | null>(null);
  const [planoTemplate, setPlanoTemplate] = useState<Template | null>(null);

  const { mode, setMode, visibleColumnKeys, toggleColumn, resetColumns, optionalColumns } =
    useListingView({ storageKey: STORAGE_KEY, columns: COLUMN_CONFIG });

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await templatesRepository.list();
      setItems(data);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar templates.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const handleSave = async (input: SaveTemplateInput) => {
    try {
      await templatesRepository.save(input);
      toast({
        title: 'Sucesso',
        description: editingItem ? 'Template atualizado.' : 'Template criado.',
      });
      await fetchTemplates();
      setEditingItem(null);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao salvar template.', variant: 'destructive' });
      throw new Error('save failed');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await templatesRepository.remove(deletingId);
      toast({ title: 'Removido', description: 'Template removido com sucesso.' });
      if (selectedItem?.id === deletingId) setSelectedItem(null);
      await fetchTemplates();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao remover template.', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = (() => {
    const result = items.filter(
      (item) =>
        item.nome.toLowerCase().includes(search.toLowerCase()) ||
        (item.descricao ?? '').toLowerCase().includes(search.toLowerCase()),
    );
    if (filterSortBy === 'nome-asc')
      return [...result].sort((a, b) => a.nome.localeCompare(b.nome));
    if (filterSortBy === 'nome-desc')
      return [...result].sort((a, b) => b.nome.localeCompare(a.nome));
    if (filterSortBy === 'data-asc')
      return [...result].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (filterSortBy === 'data-desc')
      return [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return result;
  })();

  const columns: Column<Template>[] = [
    {
      key: 'nome',
      label: 'Nome',
      render: (item) => <span className="font-medium">{item.nome}</span>,
    },
    {
      key: 'descricao',
      label: 'Descrição',
      render: (item) => (
        <span className="text-muted-foreground truncate max-w-xs block">
          {item.descricao || '-'}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      className: 'w-28',
      groupable: true,
      groupValue: (item) => item.estado || '(Sem estado)',
      render: (item) => (
        <Badge variant={item.estado === 'Ativo' ? 'default' : 'secondary'}>
          {item.estado || '-'}
        </Badge>
      ),
    },
    {
      key: 'etapas',
      label: 'Etapas',
      className: 'w-48',
      sortable: false,
      render: (item) => (
        <div className="flex gap-1 flex-wrap">
          {item.etapas.map((e) => (
            <span
              key={e.id}
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: e.cor }}
              title={e.nome}
            />
          ))}
          {item.etapas.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: 'atividades',
      label: 'Atividades',
      className: 'w-24 text-center',
      sortable: false,
      render: (item) => (
        <Badge variant="secondary">
          {item.etapas.reduce((acc, e) => acc + e.atividades.length, 0)}
        </Badge>
      ),
    },
    {
      key: 'acoes',
      label: 'Ações',
      className: 'w-28 text-right',
      sortable: false,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            title="Plano de Produção"
            disabled={item.etapas.length === 0}
            onClick={(e) => {
              e.stopPropagation();
              setPlanoTemplate(item);
            }}
          >
            <LayoutList className="h-3.5 w-3.5" />
          </Button>
          {podeAlterar && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setEditingItem(item);
                setIsModalOpen(true);
              }}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {podeExcluir && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingId(item.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const loadingSkeleton = (
    <div className="p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Templates"
        description="Gerencie os templates de produção com etapas e atividades."
      />

      <ListActionBar>
        {podeIncluir && (
          <NewButton
            tooltip="Novo Template"
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          />
        )}
        <div className="flex-1" />
        <SearchBar value={search} onChange={setSearch} />
        <ListFilterPanel
          activeCount={filterSortBy ? 1 : 0}
          resultCount={filteredItems.length}
          onClear={() => setFilterSortBy('')}
          entityLabel="templates"
        >
          <FilterSection
            title="Ordenar por"
            subtitle={sortSubtitle(filterSortBy, SORT_OPTIONS_NOME_DATA)}
            defaultOpen
          >
            <SortChip
              value={filterSortBy}
              onChange={setFilterSortBy}
              options={[...SORT_OPTIONS_NOME_DATA]}
            />
          </FilterSection>
        </ListFilterPanel>
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
          loadingSkeleton
        ) : mode === 'list' ? (
          filteredItems.length === 0 ? (
            <EmptyState
              title="Nenhum template encontrado"
              description="Crie o primeiro template de produção."
              icon={Layers}
              onAction={() => setIsModalOpen(true)}
              actionLabel="Novo Template"
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
            emptyTitle="Nenhum template encontrado"
            emptyDescription="Crie o primeiro template de produção."
            onEmptyAction={() => setIsModalOpen(true)}
            emptyActionLabel="Novo Template"
            renderCard={(item) => (
              <TemplateCard
                item={item}
                podeAlterar={podeAlterar}
                podeExcluir={podeExcluir}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
                onPlano={() => setPlanoTemplate(item)}
              />
            )}
          />
        ) : (
          <MasterDetail
            data={filteredItems}
            selectedItem={selectedItem}
            onSelect={(item) => setSelectedItem(item)}
            getRowKey={(item) => item.id}
            detailTitle="Detalhe do Template"
            emptyDetailTitle="Nenhum template selecionado"
            emptyDetailDescription="Clique em um template na lista para ver os detalhes."
            renderRow={(item, isSelected) => (
              <div>
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                  {item.nome}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.etapas.length} etapa(s)
                </p>
              </div>
            )}
            renderDetail={(item) => (
              <TemplateDetailPanel
                item={item}
                podeAlterar={podeAlterar}
                podeExcluir={podeExcluir}
                onEdit={() => {
                  setEditingItem(item);
                  setIsModalOpen(true);
                }}
                onDelete={() => setDeletingId(item.id)}
                onPlano={() => setPlanoTemplate(item)}
              />
            )}
          />
        )}
      </DataCard>

      <TemplateFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        data={editingItem}
        readOnly={!!editingItem && !podeAlterar}
      />

      {planoTemplate && (
        <PlanoProducaoModal
          isOpen
          onClose={() => setPlanoTemplate(null)}
          etapas={etapasFromTemplate(planoTemplate)}
          titulo={planoTemplate.nome}
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template será removido permanentemente.
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
}
