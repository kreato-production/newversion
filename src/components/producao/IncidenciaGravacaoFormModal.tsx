import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, Trash2, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useFormFieldConfig, FieldAsterisk } from '@/hooks/useFormFieldConfig';
import {
  ApiIncidenciasGravacaoRepository,
  type IncidenciaAnexoApiItem,
} from '@/modules/incidencias-gravacao/incidencias-gravacao.api';
import { gravacoesRepository } from '@/modules/gravacoes/gravacoes.repository.provider';
import { ApiRecursosFisicosRepository } from '@/modules/recursos-fisicos/recursos-fisicos.api.repository';
import { ApiParametrizacoesRepository } from '@/modules/parametrizacoes/parametrizacoes.api.repository';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';

interface IncidenciaFormData {
  id?: string;
  codigo_externo?: string;
  titulo?: string;
  gravacao_id?: string;
  recurso_fisico_id?: string;
  severidade_id?: string;
  impacto_id?: string;
  categoria_id?: string;
  classificacao_id?: string;
  data_incidencia?: string;
  horario_incidencia?: string;
  tempo_incidencia?: string;
  descricao?: string;
  causa_provavel?: string;
}

interface SelectOption {
  id: string;
  nome?: string;
  titulo?: string;
  codigo?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void> | void;
  data?: IncidenciaFormData;
  readOnly?: boolean;
  defaultGravacaoId?: string;
  navigation?: ModalNavigationProps;
}

const incidenciasRepository = new ApiIncidenciasGravacaoRepository();
const recursosFisicosRepository = new ApiRecursosFisicosRepository();
const parametrizacoesRepository = new ApiParametrizacoesRepository();

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

export const IncidenciaGravacaoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  defaultGravacaoId,
  navigation,
}: Props) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { getAsterisk, validateRequired, showValidationError } =
    useFormFieldConfig('incidenciaGravacao');

  const fieldKeyMap: Record<string, string> = {
    codigo_externo: 'codigoExterno',
    titulo: 'titulo',
    gravacao_id: 'gravacaoId',
    recurso_fisico_id: 'recursoFisicoId',
    severidade_id: 'severidadeId',
    impacto_id: 'impactoId',
    categoria_id: 'categoriaId',
    classificacao_id: 'classificacaoId',
    data_incidencia: 'dataIncidencia',
    horario_incidencia: 'horarioIncidencia',
    tempo_incidencia: 'tempoIncidencia',
    descricao: 'descricao',
    causa_provavel: 'causaProvavel',
  };
  const fieldLabels: Record<string, string> = {
    codigoExterno: 'Código Externo',
    titulo: 'Título',
    gravacaoId: 'Gravação',
    recursoFisicoId: 'Recurso Físico',
    severidadeId: 'Severidade',
    impactoId: 'Impacto',
    categoriaId: 'Categoria',
    classificacaoId: 'Classificação',
    dataIncidencia: 'Data da Incidência',
    horarioIncidencia: 'Horário da Incidência',
    tempoIncidencia: 'Tempo da Incidência',
    descricao: 'Descrição',
    causaProvavel: 'Causa Provável',
  };

  const [form, setForm] = useState({
    codigo_externo: '',
    titulo: '',
    gravacao_id: '',
    recurso_fisico_id: '',
    severidade_id: '',
    impacto_id: '',
    categoria_id: '',
    classificacao_id: '',
    data_incidencia: '',
    horario_incidencia: '',
    tempo_incidencia: '',
    descricao: '',
    causa_provavel: '',
  });
  const [saving, setSaving] = useState(false);

  const [gravacoes, setGravacoes] = useState<SelectOption[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<SelectOption[]>([]);
  const [severidades, setSeveridades] = useState<SelectOption[]>([]);
  const [impactos, setImpactos] = useState<SelectOption[]>([]);
  const [categorias, setCategorias] = useState<SelectOption[]>([]);
  const [classificacoes, setClassificacoes] = useState<SelectOption[]>([]);

  const [anexos, setAnexos] = useState<IncidenciaAnexoApiItem[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      try {
        const [g, rf, s, i, c] = await Promise.all([
          gravacoesRepository.list(),
          recursosFisicosRepository.list(),
          parametrizacoesRepository.listSeveridadesIncidencia(),
          parametrizacoesRepository.listImpactosIncidencia(),
          parametrizacoesRepository.listCategoriasIncidencia(),
        ]);
        setGravacoes((g || []) as SelectOption[]);
        setRecursosFisicos((rf || []) as SelectOption[]);
        setSeveridades((s.data || []) as SelectOption[]);
        setImpactos((i.data || []) as SelectOption[]);
        setCategorias((c.data || []) as SelectOption[]);
      } catch (error) {
        console.error('Error loading incidencia options:', error);
      }
    };

    void fetchOptions();
  }, [isOpen]);

  useEffect(() => {
    if (!form.categoria_id) {
      setClassificacoes([]);
      return;
    }

    const fetchClassif = async () => {
      try {
        const response = await parametrizacoesRepository.listClassificacoesIncidencia(
          form.categoria_id,
        );
        setClassificacoes((response.data || []) as SelectOption[]);
      } catch (error) {
        console.error('Error loading classificacoes incidencia:', error);
      }
    };

    void fetchClassif();
  }, [form.categoria_id]);

  useEffect(() => {
    if (data) {
      setForm({
        codigo_externo: data.codigo_externo || '',
        titulo: data.titulo || '',
        gravacao_id: data.gravacao_id || '',
        recurso_fisico_id: data.recurso_fisico_id || '',
        severidade_id: data.severidade_id || '',
        impacto_id: data.impacto_id || '',
        categoria_id: data.categoria_id || '',
        classificacao_id: data.classificacao_id || '',
        data_incidencia: data.data_incidencia || '',
        horario_incidencia: data.horario_incidencia || '',
        tempo_incidencia: data.tempo_incidencia || '',
        descricao: data.descricao || '',
        causa_provavel: data.causa_provavel || '',
      });
    } else {
      setForm({
        codigo_externo: '',
        titulo: '',
        gravacao_id: defaultGravacaoId || '',
        recurso_fisico_id: '',
        severidade_id: '',
        impacto_id: '',
        categoria_id: '',
        classificacao_id: '',
        data_incidencia: '',
        horario_incidencia: '',
        tempo_incidencia: '',
        descricao: '',
        causa_provavel: '',
      });
    }
  }, [data, isOpen, defaultGravacaoId]);

  const fetchAnexos = useCallback(async () => {
    if (!data?.id) {
      setAnexos([]);
      return;
    }

    const items = await incidenciasRepository.listAnexos(data.id);
    setAnexos(items || []);
  }, [data?.id]);

  useEffect(() => {
    if (isOpen && data?.id) {
      void fetchAnexos();
    }
  }, [isOpen, data?.id, fetchAnexos]);

  const handleSubmit = async () => {
    const camelCaseData: Record<string, unknown> = {};
    Object.entries(form).forEach(([key, val]) => {
      const camelKey = fieldKeyMap[key] || key;
      camelCaseData[camelKey] = val;
    });

    const missing = validateRequired(camelCaseData, fieldLabels);
    if (missing.length > 0) {
      showValidationError(missing);
      return;
    }

    if (!form.titulo.trim()) {
      toast({
        title: t('common.error'),
        description: t('common.required'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await incidenciasRepository.save({
        id: data?.id,
        titulo: form.titulo,
        codigo_externo: form.codigo_externo || null,
        gravacao_id: form.gravacao_id || null,
        recurso_fisico_id: form.recurso_fisico_id || null,
        severidade_id: form.severidade_id || null,
        impacto_id: form.impacto_id || null,
        categoria_id: form.categoria_id || null,
        classificacao_id: form.classificacao_id || null,
        data_incidencia: form.data_incidencia || null,
        horario_incidencia: form.horario_incidencia || null,
        tempo_incidencia: form.tempo_incidencia || null,
        descricao: form.descricao || null,
        causa_provavel: form.causa_provavel || null,
        created_by: user?.id || null,
      });

      toast({
        title: t('common.success'),
        description: data?.id
          ? `${t('incident.entity')} ${t('common.update').toLowerCase()}!`
          : `${t('incident.entity')} ${t('common.save').toLowerCase()}!`,
      });

      await onSave();
      onClose();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!data?.id || !e.target.files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        const dataUrl = await readFileAsDataUrl(file);
        await incidenciasRepository.addAnexo(data.id, {
          nome: file.name,
          url: dataUrl,
          tipo: file.type,
          tamanho: file.size,
        });
      }

      await fetchAnexos();
      toast({ title: t('common.success'), description: t('common.upload') });
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAnexo = async (anexo: IncidenciaAnexoApiItem) => {
    if (!confirm(t('common.confirm.delete'))) return;
    try {
      await incidenciasRepository.removeAnexo(data.id, anexo.id);
      await fetchAnexos();
    } catch (err) {
      toast({
        title: t('common.error'),
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleCategoriaChange = (val: string) => {
    setForm({ ...form, categoria_id: val, classificacao_id: '' });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {data ? (readOnly ? t('common.view') : t('common.edit')) : t('common.new')}{' '}
            {t('incident.entity')}
          </DialogTitle>
          <DialogDescription>{t('incident.formDescription')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados">
          <TabsList className="w-full">
            <TabsTrigger value="dados" className="flex-1">
              {t('incident.tabGeneral')}
            </TabsTrigger>
            {data?.id && (
              <TabsTrigger value="anexos" className="flex-1">
                {t('incident.tabAttachments')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dados" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('common.externalCode')} <FieldAsterisk type={getAsterisk('codigoExterno')} />
                </Label>
                <Input
                  maxLength={10}
                  value={form.codigo_externo}
                  onChange={(e) => setForm({ ...form, codigo_externo: e.target.value })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('incident.title')} <FieldAsterisk type={getAsterisk('titulo')} />
                </Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  disabled={readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('incident.recording')} <FieldAsterisk type={getAsterisk('gravacaoId')} />
                </Label>
                <SearchableSelect
                  options={gravacoes.map((g) => ({
                    value: g.id,
                    label: `${g.codigo ?? ''} - ${g.nome ?? ''}`,
                  }))}
                  value={form.gravacao_id}
                  onValueChange={(v) => setForm({ ...form, gravacao_id: v })}
                  disabled={readOnly || !!defaultGravacaoId}
                  placeholder={t('common.select')}
                  searchPlaceholder="Pesquisar gravação..."
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('incident.physicalResource')}{' '}
                  <FieldAsterisk type={getAsterisk('recursoFisicoId')} />
                </Label>
                <SearchableSelect
                  options={recursosFisicos.map((r) => ({ value: r.id, label: r.nome ?? '' }))}
                  value={form.recurso_fisico_id}
                  onValueChange={(v) => setForm({ ...form, recurso_fisico_id: v })}
                  disabled={readOnly}
                  placeholder={t('common.select')}
                  searchPlaceholder="Pesquisar recurso físico..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('incident.severity')} <FieldAsterisk type={getAsterisk('severidadeId')} />
                </Label>
                <SearchableSelect
                  options={severidades.map((s) => ({ value: s.id, label: s.titulo ?? '' }))}
                  value={form.severidade_id}
                  onValueChange={(v) => setForm({ ...form, severidade_id: v })}
                  disabled={readOnly}
                  placeholder={t('common.select')}
                  searchPlaceholder="Pesquisar severidade..."
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('incident.impact')} <FieldAsterisk type={getAsterisk('impactoId')} />
                </Label>
                <SearchableSelect
                  options={impactos.map((i) => ({ value: i.id, label: i.titulo ?? '' }))}
                  value={form.impacto_id}
                  onValueChange={(v) => setForm({ ...form, impacto_id: v })}
                  disabled={readOnly}
                  placeholder={t('common.select')}
                  searchPlaceholder="Pesquisar impacto..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('incident.category')} <FieldAsterisk type={getAsterisk('categoriaId')} />
                </Label>
                <SearchableSelect
                  options={categorias.map((c) => ({ value: c.id, label: c.titulo ?? '' }))}
                  value={form.categoria_id}
                  onValueChange={handleCategoriaChange}
                  disabled={readOnly}
                  placeholder={t('common.select')}
                  searchPlaceholder="Pesquisar categoria..."
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('incident.classification')}{' '}
                  <FieldAsterisk type={getAsterisk('classificacaoId')} />
                </Label>
                <SearchableSelect
                  options={classificacoes.map((c) => ({ value: c.id, label: c.titulo ?? '' }))}
                  value={form.classificacao_id}
                  onValueChange={(v) => setForm({ ...form, classificacao_id: v })}
                  disabled={readOnly || !form.categoria_id}
                  placeholder={
                    form.categoria_id ? t('common.select') : t('incident.selectCategoryFirst')
                  }
                  searchPlaceholder="Pesquisar classificação..."
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('incident.date')} <FieldAsterisk type={getAsterisk('dataIncidencia')} />
                </Label>
                <Input
                  type="date"
                  value={form.data_incidencia}
                  onChange={(e) => setForm({ ...form, data_incidencia: e.target.value })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('incident.time')} <FieldAsterisk type={getAsterisk('horarioIncidencia')} />
                </Label>
                <Input
                  type="time"
                  value={form.horario_incidencia}
                  onChange={(e) => setForm({ ...form, horario_incidencia: e.target.value })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('incident.duration')} <FieldAsterisk type={getAsterisk('tempoIncidencia')} />
                </Label>
                <Input
                  type="time"
                  value={form.tempo_incidencia}
                  onChange={(e) => setForm({ ...form, tempo_incidencia: e.target.value })}
                  disabled={readOnly}
                  placeholder="HH:MM"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                {t('common.description')} <FieldAsterisk type={getAsterisk('descricao')} />
              </Label>
              <Textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t('incident.probableCause')} <FieldAsterisk type={getAsterisk('causaProvavel')} />
              </Label>
              <Textarea
                rows={3}
                value={form.causa_provavel}
                onChange={(e) => setForm({ ...form, causa_provavel: e.target.value })}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('common.user')}</Label>
              <Input value={user?.nome || ''} disabled />
            </div>
          </TabsContent>

          {data?.id && (
            <TabsContent value="anexos" className="mt-4 space-y-4">
              {!readOnly && (
                <div className="flex justify-end">
                  <label className="cursor-pointer">
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                    <Button asChild size="sm" disabled={uploading}>
                      <span>
                        {uploading ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-1" />
                        )}
                        {t('common.upload')}
                      </span>
                    </Button>
                  </label>
                </div>
              )}

              {anexos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('incident.noAttachments')}
                </p>
              ) : (
                <div className="space-y-2">
                  {anexos.map((anexo) => (
                    <div
                      key={anexo.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-medium truncate">{anexo.nome}</span>
                        {anexo.tamanho && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {(anexo.tamanho / 1024).toFixed(0)} KB
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                          <a href={anexo.url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                        {!readOnly && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteAnexo(anexo)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className={navigation ? 'sm:justify-between' : undefined}>
          {navigation && <ModalNavigation {...navigation} />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {readOnly ? t('common.close') : t('common.cancel')}
            </Button>
            {!readOnly && (
              <Button
                onClick={() => {
                  void handleSubmit();
                }}
                disabled={saving || !form.titulo.trim()}
              >
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {t('common.save')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
