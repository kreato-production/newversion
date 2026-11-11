import { useCallback, useEffect, useState } from 'react';
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SortableTable, type Column } from '@/components/shared/SortableTable';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';

interface ClassificacaoIncidencia {
  id: string;
  codigo_externo: string | null;
  titulo: string;
  descricao: string | null;
}

const EMPTY_FORM = { codigo_externo: '', titulo: '', descricao: '' };

const repository = new ApiParametrizacoesRepository();

interface ClassificacoesIncidenciaTabProps {
  categoriaId: string;
  readOnly?: boolean;
}

/** Sub-list of classificações of a categoria de incidência, edited inline. */
export const ClassificacoesIncidenciaTab = ({
  categoriaId,
  readOnly = false,
}: ClassificacoesIncidenciaTabProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [items, setItems] = useState<ClassificacaoIncidencia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editing, setEditing] = useState<ClassificacaoIncidencia | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await repository.listClassificacoesIncidencia(categoriaId);
      setItems(
        response.data.map((item) => ({
          id: item.id,
          codigo_externo: item.codigo_externo || null,
          titulo: item.titulo,
          descricao: item.descricao || null,
        })),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [categoriaId]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) return;
    try {
      await repository.saveClassificacaoIncidencia(categoriaId, {
        ...(editing ? { id: editing.id } : {}),
        titulo: form.titulo,
        descricao: form.descricao || '',
        codigo_externo: form.codigo_externo || '',
      });
      await fetchItems();
      closeForm();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm.delete'))) return;
    try {
      await repository.removeClassificacaoIncidencia(categoriaId, id);
      await fetchItems();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item: ClassificacaoIncidencia) => {
    setEditing(item);
    setForm({
      codigo_externo: item.codigo_externo || '',
      titulo: item.titulo,
      descricao: item.descricao || '',
    });
    setShowForm(true);
  };

  const columns: Column<ClassificacaoIncidencia & { actions?: never }>[] = [
    {
      key: 'codigo_externo',
      label: t('common.externalCode'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-xs">{item.codigo_externo || '-'}</span>,
    },
    {
      key: 'titulo',
      label: t('incidentCategory.title'),
      render: (item) => <span className="font-medium">{item.titulo}</span>,
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
      key: 'actions',
      label: t('common.actions'),
      className: 'w-24 text-right',
      sortable: false,
      render: (item) =>
        readOnly ? null : (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label="Editar classificação"
              onClick={() => handleEdit(item)}
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              aria-label="Excluir classificação"
              onClick={() => void handleDelete(item.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null);
              setForm(EMPTY_FORM);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> {t('common.new')}{' '}
            {t('incidentCategory.classification')}
          </Button>
        </div>
      )}

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="classificacao-codigo">{t('common.externalCode')}</Label>
              <Input
                id="classificacao-codigo"
                maxLength={10}
                value={form.codigo_externo}
                onChange={(e) => setForm({ ...form, codigo_externo: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="classificacao-titulo">{t('incidentCategory.title')} *</Label>
              <Input
                id="classificacao-titulo"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="classificacao-descricao">{t('common.description')}</Label>
            <Textarea
              id="classificacao-descricao"
              rows={3}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={closeForm}>
              {t('common.cancel')}
            </Button>
            <Button type="button" size="sm" onClick={() => void handleSave()}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">
          {t('incidentCategory.noClassifications')}
        </p>
      ) : (
        <SortableTable
          data={items}
          columns={columns}
          getRowKey={(item) => item.id}
          storageKey="kreato_classif_incidencia"
        />
      )}
    </div>
  );
};
