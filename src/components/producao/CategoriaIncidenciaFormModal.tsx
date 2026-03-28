import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SortableTable, Column } from '@/components/shared/SortableTable';
import { Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import type { CategoriaIncidencia } from '@/pages/producao/CategoriasIncidencia';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';

interface ClassificacaoIncidencia {
  id: string;
  categoria_incidencia_id: string;
  codigo_externo: string | null;
  titulo: string;
  descricao: string | null;
  created_by: string | null;
  created_at: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  data?: CategoriaIncidencia | null;
  readOnly?: boolean;
}

const repository = new ApiParametrizacoesRepository();

export const CategoriaIncidenciaFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
}: Props) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [formData, setFormData] = useState({ codigo_externo: '', titulo: '', descricao: '' });
  const [classificacoes, setClassificacoes] = useState<ClassificacaoIncidencia[]>([]);
  const [loadingClassif, setLoadingClassif] = useState(false);

  // Classificação inline editing
  const [editingClassif, setEditingClassif] = useState<ClassificacaoIncidencia | null>(null);
  const [classifForm, setClassifForm] = useState({ codigo_externo: '', titulo: '', descricao: '' });
  const [showClassifForm, setShowClassifForm] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData({
        codigo_externo: data.codigo_externo || '',
        titulo: data.titulo || '',
        descricao: data.descricao || '',
      });
    } else {
      setFormData({ codigo_externo: '', titulo: '', descricao: '' });
    }
    setShowClassifForm(false);
    setEditingClassif(null);
  }, [data, isOpen]);

  const fetchClassificacoes = useCallback(async () => {
    if (!data?.id) {
      setClassificacoes([]);
      return;
    }
    setLoadingClassif(true);
    try {
      const response = await repository.listClassificacoesIncidencia(data.id);
      setClassificacoes(
        response.data.map((item) => ({
          id: item.id,
          categoria_incidencia_id: data.id,
          codigo_externo: item.codigo_externo || null,
          titulo: item.titulo,
          descricao: item.descricao || null,
          created_by: item.created_by || null,
          created_at: item.created_at || null,
        })),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClassif(false);
    }
  }, [data?.id]);

  useEffect(() => {
    if (isOpen && data?.id) fetchClassificacoes();
  }, [isOpen, data?.id, fetchClassificacoes]);

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      toast({
        title: t('common.error'),
        description: t('incidentCategory.titleRequired'),
        variant: 'destructive',
      });
      return;
    }
    await onSave(formData);
    onClose();
  };

  // Classificação CRUD
  const handleSaveClassif = async () => {
    if (!classifForm.titulo.trim() || !data?.id) return;
    try {
      const payload = {
        titulo: classifForm.titulo,
        descricao: classifForm.descricao || null,
        codigo_externo: classifForm.codigo_externo || null,
      };

      await repository.saveClassificacaoIncidencia(data.id, {
        ...(editingClassif ? { id: editingClassif.id } : {}),
        titulo: payload.titulo,
        descricao: payload.descricao || '',
        codigo_externo: payload.codigo_externo || '',
      });
      await fetchClassificacoes();
      setShowClassifForm(false);
      setEditingClassif(null);
      setClassifForm({ codigo_externo: '', titulo: '', descricao: '' });
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClassif = async (id: string) => {
    if (!confirm(t('common.confirm.delete'))) return;
    try {
      if (!data?.id) return;
      await repository.removeClassificacaoIncidencia(data.id, id);
      await fetchClassificacoes();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleEditClassif = (item: ClassificacaoIncidencia) => {
    setEditingClassif(item);
    setClassifForm({
      codigo_externo: item.codigo_externo || '',
      titulo: item.titulo,
      descricao: item.descricao || '',
    });
    setShowClassifForm(true);
  };

  const classifColumns: Column<ClassificacaoIncidencia & { actions?: never }>[] = [
    {
      key: 'codigo_externo',
      label: t('common.externalCode'),
      className: 'w-24',
      render: (item) => <span className="font-mono text-sm">{item.codigo_externo || '-'}</span>,
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
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => handleEditClassif(item)}
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => handleDeleteClassif(item.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ),
    },
  ];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {data ? (readOnly ? t('common.view') : t('common.edit')) : t('common.new')}{' '}
            {t('incidentCategory.entity')}
          </DialogTitle>
          <DialogDescription>{t('incidentCategory.formDescription')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados">
          <TabsList className="w-full">
            <TabsTrigger value="dados" className="flex-1">
              {t('incidentCategory.tabGeneral')}
            </TabsTrigger>
            {data?.id && (
              <TabsTrigger value="classificacoes" className="flex-1">
                {t('incidentCategory.tabClassifications')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dados" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.externalCode')}</Label>
                <Input
                  maxLength={10}
                  value={formData.codigo_externo}
                  onChange={(e) => setFormData({ ...formData, codigo_externo: e.target.value })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('incidentCategory.title')} *</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  disabled={readOnly}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('common.description')}</Label>
              <Textarea
                rows={3}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('incidentCategory.user')}</Label>
              <Input value={user?.nome || ''} disabled />
            </div>
          </TabsContent>

          {data?.id && (
            <TabsContent value="classificacoes" className="mt-4 space-y-4">
              {!readOnly && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingClassif(null);
                      setClassifForm({ codigo_externo: '', titulo: '', descricao: '' });
                      setShowClassifForm(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> {t('common.new')}{' '}
                    {t('incidentCategory.classification')}
                  </Button>
                </div>
              )}

              {showClassifForm && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('common.externalCode')}</Label>
                      <Input
                        maxLength={10}
                        value={classifForm.codigo_externo}
                        onChange={(e) =>
                          setClassifForm({ ...classifForm, codigo_externo: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('incidentCategory.title')} *</Label>
                      <Input
                        value={classifForm.titulo}
                        onChange={(e) => setClassifForm({ ...classifForm, titulo: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.description')}</Label>
                    <Textarea
                      rows={3}
                      value={classifForm.descricao}
                      onChange={(e) =>
                        setClassifForm({ ...classifForm, descricao: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowClassifForm(false);
                        setEditingClassif(null);
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button size="sm" onClick={handleSaveClassif}>
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              )}

              {loadingClassif ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : classificacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('incidentCategory.noClassifications')}
                </p>
              ) : (
                <SortableTable
                  data={classificacoes}
                  columns={classifColumns}
                  getRowKey={(item) => item.id}
                  storageKey="kreato_classif_incidencia"
                />
              )}
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {readOnly ? t('common.close') : t('common.cancel')}
          </Button>
          {!readOnly && <Button onClick={() => void handleSubmit()}>{t('common.save')}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
