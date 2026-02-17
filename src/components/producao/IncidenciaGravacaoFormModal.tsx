import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, Trash2, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Anexo {
  id: string;
  nome: string;
  url: string;
  tipo: string | null;
  tamanho: number | null;
  created_at: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void> | void;
  data?: any;
  readOnly?: boolean;
}

export const IncidenciaGravacaoFormModal = ({ isOpen, onClose, onSave, data, readOnly = false }: Props) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [form, setForm] = useState({
    codigo_externo: '', titulo: '', gravacao_id: '', recurso_fisico_id: '',
    severidade_id: '', impacto_id: '', categoria_id: '', classificacao_id: '',
    data_incidencia: '', horario_incidencia: '', tempo_incidencia: '',
    descricao: '', causa_provavel: '',
  });
  const [saving, setSaving] = useState(false);

  // Dropdown options
  const [gravacoes, setGravacoes] = useState<any[]>([]);
  const [recursosFisicos, setRecursosFisicos] = useState<any[]>([]);
  const [severidades, setSeveridades] = useState<any[]>([]);
  const [impactos, setImpactos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [classificacoes, setClassificacoes] = useState<any[]>([]);

  // Attachments
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [uploading, setUploading] = useState(false);

  // Fetch dropdown data
  useEffect(() => {
    if (!isOpen) return;
    const fetchOptions = async () => {
      const [g, rf, s, i, c] = await Promise.all([
        (supabase as any).from('gravacoes').select('id, nome, codigo').order('nome'),
        (supabase as any).from('recursos_fisicos').select('id, nome').order('nome'),
        (supabase as any).from('severidades_incidencia').select('id, titulo').order('titulo'),
        (supabase as any).from('impactos_incidencia').select('id, titulo').order('titulo'),
        (supabase as any).from('categorias_incidencia').select('id, titulo').order('titulo'),
      ]);
      setGravacoes(g.data || []);
      setRecursosFisicos(rf.data || []);
      setSeveridades(s.data || []);
      setImpactos(i.data || []);
      setCategorias(c.data || []);
    };
    fetchOptions();
  }, [isOpen]);

  // Fetch classificações when categoria changes
  useEffect(() => {
    if (!form.categoria_id) { setClassificacoes([]); return; }
    const fetchClassif = async () => {
      const { data: items } = await (supabase as any)
        .from('classificacoes_incidencia')
        .select('id, titulo')
        .eq('categoria_incidencia_id', form.categoria_id)
        .order('titulo');
      setClassificacoes(items || []);
    };
    fetchClassif();
  }, [form.categoria_id]);

  // Load form data
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
        codigo_externo: '', titulo: '', gravacao_id: '', recurso_fisico_id: '',
        severidade_id: '', impacto_id: '', categoria_id: '', classificacao_id: '',
        data_incidencia: '', horario_incidencia: '', tempo_incidencia: '',
        descricao: '', causa_provavel: '',
      });
    }
  }, [data, isOpen]);

  // Fetch attachments
  const fetchAnexos = useCallback(async () => {
    if (!data?.id) { setAnexos([]); return; }
    const { data: items } = await (supabase as any)
      .from('incidencia_anexos')
      .select('*')
      .eq('incidencia_id', data.id)
      .order('created_at');
    setAnexos(items || []);
  }, [data?.id]);

  useEffect(() => {
    if (isOpen && data?.id) fetchAnexos();
  }, [isOpen, data?.id, fetchAnexos]);

  const handleSubmit = async () => {
    if (!form.titulo.trim()) {
      toast({ title: t('common.error'), description: t('common.required'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
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
      };

      if (data?.id) {
        const { error } = await (supabase as any).from('incidencias_gravacao').update(payload).eq('id', data.id);
        if (error) throw error;
        toast({ title: t('common.success'), description: `${t('incident.entity')} ${t('common.update').toLowerCase()}!` });
      } else {
        const { error } = await (supabase as any).from('incidencias_gravacao').insert(payload);
        if (error) throw error;
        toast({ title: t('common.success'), description: `${t('incident.entity')} ${t('common.save').toLowerCase()}!` });
      }
      await onSave();
      onClose();
    } catch (err) {
      toast({ title: t('common.error'), description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!data?.id || !e.target.files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        const filePath = `${data.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('incidencias').upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage.from('incidencias').getPublicUrl(filePath);

        const { error: dbError } = await (supabase as any).from('incidencia_anexos').insert({
          incidencia_id: data.id,
          nome: file.name,
          url: publicUrl.publicUrl,
          tipo: file.type,
          tamanho: file.size,
          created_by: user?.id || null,
        });
        if (dbError) throw dbError;
      }
      await fetchAnexos();
      toast({ title: t('common.success'), description: t('common.upload') });
    } catch (err) {
      toast({ title: t('common.error'), description: (err as Error).message, variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAnexo = async (anexo: Anexo) => {
    if (!confirm(t('common.confirm.delete'))) return;
    try {
      // Delete from storage
      const urlParts = anexo.url.split('/incidencias/');
      if (urlParts[1]) {
        await supabase.storage.from('incidencias').remove([decodeURIComponent(urlParts[1])]);
      }
      await (supabase as any).from('incidencia_anexos').delete().eq('id', anexo.id);
      await fetchAnexos();
    } catch (err) {
      toast({ title: t('common.error'), description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleCategoriaChange = (val: string) => {
    setForm({ ...form, categoria_id: val, classificacao_id: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data ? (readOnly ? t('common.view') : t('common.edit')) : t('common.new')} {t('incident.entity')}</DialogTitle>
          <DialogDescription>{t('incident.formDescription')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados">
          <TabsList className="w-full">
            <TabsTrigger value="dados" className="flex-1">{t('incident.tabGeneral')}</TabsTrigger>
            {data?.id && <TabsTrigger value="anexos" className="flex-1">{t('incident.tabAttachments')}</TabsTrigger>}
          </TabsList>

          <TabsContent value="dados" className="space-y-4 mt-4">
            {/* Row 1: Código Externo + Título */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.externalCode')}</Label>
                <Input maxLength={10} value={form.codigo_externo} onChange={(e) => setForm({ ...form, codigo_externo: e.target.value })} disabled={readOnly} />
              </div>
              <div className="space-y-2">
                <Label>{t('incident.title')} *</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} disabled={readOnly} />
              </div>
            </div>

            {/* Row 2: Gravação + Recurso Físico */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('incident.recording')}</Label>
                <Select value={form.gravacao_id} onValueChange={(v) => setForm({ ...form, gravacao_id: v })} disabled={readOnly}>
                  <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                  <SelectContent>
                    {gravacoes.map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{g.codigo} - {g.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('incident.physicalResource')}</Label>
                <Select value={form.recurso_fisico_id} onValueChange={(v) => setForm({ ...form, recurso_fisico_id: v })} disabled={readOnly}>
                  <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                  <SelectContent>
                    {recursosFisicos.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Severidade + Impacto */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('incident.severity')}</Label>
                <Select value={form.severidade_id} onValueChange={(v) => setForm({ ...form, severidade_id: v })} disabled={readOnly}>
                  <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                  <SelectContent>
                    {severidades.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('incident.impact')}</Label>
                <Select value={form.impacto_id} onValueChange={(v) => setForm({ ...form, impacto_id: v })} disabled={readOnly}>
                  <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                  <SelectContent>
                    {impactos.map((i: any) => (
                      <SelectItem key={i.id} value={i.id}>{i.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 4: Categoria + Classificação (dependent) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('incident.category')}</Label>
                <Select value={form.categoria_id} onValueChange={handleCategoriaChange} disabled={readOnly}>
                  <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('incident.classification')}</Label>
                <Select value={form.classificacao_id} onValueChange={(v) => setForm({ ...form, classificacao_id: v })} disabled={readOnly || !form.categoria_id}>
                  <SelectTrigger><SelectValue placeholder={form.categoria_id ? t('common.select') : t('incident.selectCategoryFirst')} /></SelectTrigger>
                  <SelectContent>
                    {classificacoes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 5: Data + Horário + Tempo */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('incident.date')}</Label>
                <Input type="date" value={form.data_incidencia} onChange={(e) => setForm({ ...form, data_incidencia: e.target.value })} disabled={readOnly} />
              </div>
              <div className="space-y-2">
                <Label>{t('incident.time')}</Label>
                <Input type="time" value={form.horario_incidencia} onChange={(e) => setForm({ ...form, horario_incidencia: e.target.value })} disabled={readOnly} />
              </div>
              <div className="space-y-2">
                <Label>{t('incident.duration')}</Label>
                <Input type="time" value={form.tempo_incidencia} onChange={(e) => setForm({ ...form, tempo_incidencia: e.target.value })} disabled={readOnly} placeholder="HH:MM" />
              </div>
            </div>

            {/* Row 6: Descrição */}
            <div className="space-y-2">
              <Label>{t('common.description')}</Label>
              <Textarea rows={3} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} disabled={readOnly} />
            </div>

            {/* Row 7: Causa provável */}
            <div className="space-y-2">
              <Label>{t('incident.probableCause')}</Label>
              <Textarea rows={3} value={form.causa_provavel} onChange={(e) => setForm({ ...form, causa_provavel: e.target.value })} disabled={readOnly} />
            </div>

            {/* Row 8: Usuário */}
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
                        {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                        {t('common.upload')}
                      </span>
                    </Button>
                  </label>
                </div>
              )}

              {anexos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t('incident.noAttachments')}</p>
              ) : (
                <div className="space-y-2">
                  {anexos.map((anexo) => (
                    <div key={anexo.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteAnexo(anexo)}>
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{readOnly ? t('common.close') : t('common.cancel')}</Button>
          {!readOnly && (
            <Button onClick={handleSubmit} disabled={saving || !form.titulo.trim()}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {t('common.save')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
