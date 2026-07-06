'use client';

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  X,
  MapPin,
  Plus,
  ImageIcon,
  Trash2,
  FileText,
  Upload,
  ZoomIn,
  Printer,
  CalendarDays,
  LayoutDashboard,
} from 'lucide-react';
import { printEventoRelatorio } from '@/lib/printEventoRelatorio';
import { AgendaTab } from '@/components/eventos/AgendaTab';
import { OrcamentoEventoTab } from '@/components/eventos/OrcamentoEventoTab';
import { PreviewTab } from '@/components/eventos/PreviewTab';
import { useLanguage } from '@/contexts/LanguageContext';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import {
  ApiParametrosRepository,
  type ParametroApiItem,
} from '@/modules/parametros/parametros.api.repository';
import { unidadesRepository } from '@/modules/unidades/unidades.repository.provider';
import type { UnidadeNegocio } from '@/modules/unidades/unidades.types';
import type {
  Evento,
  SaveEventoInput,
  EventoExpositor,
} from '@/modules/gestao-eventos/gestao-eventos.api.repository';
import {
  ApiExpositoresRepository,
  type Expositor,
} from '@/modules/gestao-eventos/expositores.api.repository';

interface EventoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveEventoInput) => Promise<void>;
  data?: Evento | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

const emptyForm: SaveEventoInput = {
  codigoExterno: '',
  nome: '',
  tipoEventoId: null,
  unidadeNegocioId: null,
  descricao: '',
  tags: [],
  inicioEvento: null,
  fimEvento: null,
  local: '',
  latitude: '',
  longitude: '',
  publicoEstimado: '',
  expositores: [],
  layoutArquivo: null,
  layoutNome: null,
  layoutTipo: null,
  agenda: [],
  orcamentoItens: [],
};

const expositoresRepository = new ApiExpositoresRepository();
const parametrosRepository = new ApiParametrosRepository();
const MAX_LAYOUT_BYTES = 10 * 1024 * 1024; // 10 MB

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}

function toIsoString(datetimeLocal: string): string | null {
  return datetimeLocal ? new Date(datetimeLocal).toISOString() : null;
}

export const EventoFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: EventoFormModalProps) => {
  const { t } = useLanguage();
  const [form, setForm] = useState<SaveEventoInput>(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tiposEvento, setTiposEvento] = useState<ParametroApiItem[]>([]);
  const [unidades, setUnidades] = useState<UnidadeNegocio[]>([]);
  const [allExpositores, setAllExpositores] = useState<Expositor[]>([]);
  const [selectedExpositorId, setSelectedExpositorId] = useState('');
  const [layoutError, setLayoutError] = useState('');
  const [layoutZoom, setLayoutZoom] = useState(false);
  const layoutInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!data;

  // Load parametros once
  useEffect(() => {
    parametrosRepository
      .list('kreato_tipo_evento')
      .then(setTiposEvento)
      .catch(() => {});
    expositoresRepository
      .list()
      .then((r) => setAllExpositores(r.data))
      .catch(() => {});
    unidadesRepository
      .list()
      .then(setUnidades)
      .catch(() => {});
  }, []);

  const linkedIds = new Set((form.expositores ?? []).map((e) => e.id));

  const addExpositor = () => {
    const expositor = allExpositores.find((e) => e.id === selectedExpositorId);
    if (!expositor || linkedIds.has(expositor.id)) return;
    const item: EventoExpositor = {
      id: expositor.id,
      nome: expositor.nome,
      logo: expositor.logo ?? null,
      tipoExpositorNome: expositor.tipoExpositorNome ?? '',
    };
    set('expositores', [...(form.expositores ?? []), item]);
    setSelectedExpositorId('');
  };

  const removeExpositor = (id: string) => {
    set(
      'expositores',
      (form.expositores ?? []).filter((e) => e.id !== id),
    );
  };

  const handleLayoutFile = (file: File | null) => {
    setLayoutError('');
    if (!file) return;
    if (file.size > MAX_LAYOUT_BYTES) {
      setLayoutError(
        `Arquivo muito grande. Tamanho máximo: 10 MB. Tamanho atual: ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      set('layoutArquivo', e.target?.result as string);
      set('layoutNome', file.name);
      set('layoutTipo', file.type);
    };
    reader.readAsDataURL(file);
  };

  const removeLayout = () => {
    set('layoutArquivo', null);
    set('layoutNome', null);
    set('layoutTipo', null);
    setLayoutError('');
    setLayoutZoom(false);
    if (layoutInputRef.current) layoutInputRef.current.value = '';
  };

  const isLayoutImage = form.layoutTipo?.startsWith('image/') ?? false;
  const isLayoutPdf = form.layoutTipo === 'application/pdf';

  const hasCoords =
    form.latitude &&
    form.longitude &&
    !isNaN(parseFloat(form.latitude ?? '')) &&
    !isNaN(parseFloat(form.longitude ?? ''));

  useEffect(() => {
    if (isOpen) {
      if (data) {
        setForm({
          id: data.id,
          codigoExterno: data.codigoExterno ?? '',
          nome: data.nome ?? '',
          tipoEventoId: data.tipoEventoId ?? null,
          unidadeNegocioId: data.unidadeNegocioId ?? null,
          descricao: data.descricao ?? '',
          tags: data.tags ?? [],
          inicioEvento: data.inicioEvento ?? null,
          fimEvento: data.fimEvento ?? null,
          local: data.local ?? '',
          latitude: data.latitude ?? '',
          longitude: data.longitude ?? '',
          publicoEstimado: data.publicoEstimado ?? '',
          expositores: data.expositores ?? [],
          layoutArquivo: data.layoutArquivo ?? null,
          layoutNome: data.layoutNome ?? null,
          layoutTipo: data.layoutTipo ?? null,
          agenda: data.agenda ?? [],
          orcamentoItens: data.orcamentoItens ?? [],
        });
      } else {
        setForm(emptyForm);
      }
      setTagInput('');
      setSelectedExpositorId('');
      setLayoutError('');
      setLayoutZoom(false);
      setIsSubmitting(false);
    }
  }, [isOpen, data]);

  const set = useCallback(
    <K extends keyof SaveEventoInput>(field: K, value: SaveEventoInput[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || (form.tags ?? []).includes(tag)) return;
    set('tags', [...(form.tags ?? []), tag]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    set(
      'tags',
      (form.tags ?? []).filter((t) => t !== tag),
    );
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
    if (e.key === ',' || e.key === ';') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        ...form,
        inicioEvento: toIsoString(form.inicioEvento as string),
        fimEvento: toIsoString(form.fimEvento as string),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const leafletSrcdoc = hasCoords
    ? `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head><body><div id="map"></div><script>
var redIcon=L.divIcon({
  html:'<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path fill="#dc2626" stroke="#fff" stroke-width="1.5" d="M14 1C7.373 1 2 6.373 2 13c0 9 12 26 12 26s12-17 12-26c0-6.627-5.373-12-12-12z"/><circle fill="#fff" cx="14" cy="13" r="5"/></svg>',
  className:'',iconSize:[28,40],iconAnchor:[14,40],popupAnchor:[0,-40]
});
var map=L.map('map',{zoomControl:true}).setView([${form.latitude},${form.longitude}],15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);
L.marker([${form.latitude},${form.longitude}],{icon:redIcon}).addTo(map);
</script></body></html>`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[1400px] max-w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `${t('common.edit')} Evento` : `${t('common.new')} Evento`}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('common.edit') : t('common.add')} evento.
          </DialogDescription>
        </DialogHeader>

        {/* min-w-0: DialogContent usa `grid`; sem isso, o item de grid herda
            min-width:auto e cresce para acomodar conteudo largo (ex.: a
            timeline horizontal do Preview) em vez de conter/rolar dentro do
            modal, mesmo com overflow-x-hidden no container. */}
        <form onSubmit={handleSubmit} className="min-w-0">
          <Tabs defaultValue="geral">
            <TabsList className="w-full">
              <TabsTrigger value="geral" className="flex-1">
                Dados Gerais
              </TabsTrigger>
              <TabsTrigger value="local" className="flex-1">
                Local & Mapa
              </TabsTrigger>
              <TabsTrigger value="expositores" className="flex-1">
                Expositores
                {(form.expositores ?? []).length > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                    {(form.expositores ?? []).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex-1">
                Layout
                {form.layoutArquivo && (
                  <span className="ml-1.5 h-2 w-2 rounded-full bg-primary inline-block" />
                )}
              </TabsTrigger>
              <TabsTrigger value="agenda" className="flex-1">
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                Agenda
                {(form.agenda ?? []).length > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                    {(form.agenda ?? []).reduce((s, d) => s + d.atividades.length, 0)}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="orcamento" className="flex-1">
                Orçamento
                {(form.orcamentoItens ?? []).length > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                    {(form.orcamentoItens ?? []).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1">
                <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                Preview
              </TabsTrigger>
            </TabsList>

            {/* ── Dados Gerais ── */}
            <TabsContent value="geral" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoExterno">{t('common.externalCode')}</Label>
                  <Input
                    id="codigoExterno"
                    value={form.codigoExterno ?? ''}
                    onChange={(e) => set('codigoExterno', e.target.value)}
                    maxLength={20}
                    disabled={readOnly || isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">
                    Nome do Evento <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => set('nome', e.target.value)}
                    maxLength={150}
                    required
                    disabled={readOnly || isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Evento</Label>
                  <SearchableSelect
                    options={tiposEvento.map((t) => ({ value: t.id, label: t.nome }))}
                    value={form.tipoEventoId ?? ''}
                    onValueChange={(v) => set('tipoEventoId', v || null)}
                    placeholder="Selecione o tipo de evento..."
                    searchPlaceholder="Pesquisar tipo de evento..."
                    emptyMessage="Nenhum tipo de evento encontrado."
                    disabled={readOnly || isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidade de Negócio</Label>
                  <SearchableSelect
                    options={unidades.map((u) => ({ value: u.id, label: u.nome }))}
                    value={form.unidadeNegocioId ?? ''}
                    onValueChange={(v) => set('unidadeNegocioId', v || null)}
                    placeholder="Selecione a unidade de negócio..."
                    searchPlaceholder="Pesquisar unidade..."
                    emptyMessage="Nenhuma unidade encontrada."
                    disabled={readOnly || isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição do Evento</Label>
                <Textarea
                  id="descricao"
                  value={form.descricao ?? ''}
                  onChange={(e) => set('descricao', e.target.value)}
                  rows={3}
                  disabled={readOnly || isSubmitting}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Digite uma tag e pressione Enter"
                    disabled={readOnly || isSubmitting}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    disabled={!tagInput.trim() || readOnly || isSubmitting}
                  >
                    Adicionar
                  </Button>
                </div>
                {(form.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(form.tags ?? []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inicioEvento">Início do Evento</Label>
                  <Input
                    id="inicioEvento"
                    type="datetime-local"
                    value={toDatetimeLocal(form.inicioEvento as string | null)}
                    onChange={(e) => set('inicioEvento', e.target.value || null)}
                    disabled={readOnly || isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fimEvento">Fim do Evento</Label>
                  <Input
                    id="fimEvento"
                    type="datetime-local"
                    value={toDatetimeLocal(form.fimEvento as string | null)}
                    onChange={(e) => set('fimEvento', e.target.value || null)}
                    disabled={readOnly || isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicoEstimado">Público Estimado</Label>
                <Input
                  id="publicoEstimado"
                  value={form.publicoEstimado ?? ''}
                  onChange={(e) => set('publicoEstimado', e.target.value)}
                  disabled={readOnly || isSubmitting}
                />
              </div>

              {/* Dados de cadastro (somente leitura no modo edição) */}
              {isEditing && data && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="space-y-2">
                    <Label>{t('common.registrationDate')}</Label>
                    <Input
                      value={
                        data.createdAt ? new Date(data.createdAt).toLocaleString('pt-BR') : '-'
                      }
                      readOnly
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.registrationUser')}</Label>
                    <Input value={data.createdBy || '-'} readOnly disabled className="bg-muted" />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Local & Mapa ── */}
            <TabsContent value="local" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="local">Local</Label>
                <Input
                  id="local"
                  value={form.local ?? ''}
                  onChange={(e) => set('local', e.target.value)}
                  placeholder="Nome ou endereço do local"
                  disabled={readOnly || isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    value={form.latitude ?? ''}
                    onChange={(e) => set('latitude', e.target.value)}
                    placeholder="-23.5505"
                    disabled={readOnly || isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    value={form.longitude ?? ''}
                    onChange={(e) => set('longitude', e.target.value)}
                    placeholder="-46.6333"
                    disabled={readOnly || isSubmitting}
                  />
                </div>
              </div>

              {/* Mapa */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Mapa
                </Label>
                {leafletSrcdoc ? (
                  <div className="rounded-md overflow-hidden border h-64">
                    <iframe
                      srcDoc={leafletSrcdoc}
                      title="Localização do evento"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                    />
                  </div>
                ) : (
                  <div className="rounded-md border h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30">
                    <MapPin className="h-8 w-8 opacity-30" />
                    <p className="text-sm">Informe latitude e longitude para visualizar o mapa</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Expositores ── */}
            <TabsContent value="expositores" className="space-y-4 mt-4">
              {!readOnly && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={allExpositores
                        .filter((e) => !linkedIds.has(e.id))
                        .map((e) => ({
                          value: e.id,
                          label: e.tipoExpositorNome
                            ? `${e.nome} — ${e.tipoExpositorNome}`
                            : e.nome,
                        }))}
                      value={selectedExpositorId}
                      onValueChange={setSelectedExpositorId}
                      placeholder="Selecione um expositor..."
                      searchPlaceholder="Pesquisar expositor..."
                      emptyMessage="Nenhum expositor encontrado."
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addExpositor}
                    disabled={!selectedExpositorId || isSubmitting}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              )}

              {(form.expositores ?? []).length === 0 ? (
                <div className="rounded-md border h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30">
                  <ImageIcon className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Nenhum expositor vinculado a este evento</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(form.expositores ?? []).map((exp) => (
                    <div key={exp.id} className="flex items-center gap-3 rounded-md border p-3">
                      {exp.logo ? (
                        <img
                          src={exp.logo}
                          alt={exp.nome}
                          className="h-10 w-10 rounded object-contain border bg-white flex-shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{exp.nome}</p>
                        {exp.tipoExpositorNome && (
                          <p className="text-xs text-muted-foreground">{exp.tipoExpositorNome}</p>
                        )}
                      </div>
                      {!readOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => removeExpositor(exp.id)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Layout ── */}
            <TabsContent value="layout" className="space-y-4 mt-4">
              {/* Upload area */}
              {!readOnly && (
                <div>
                  <input
                    ref={layoutInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleLayoutFile(e.target.files?.[0] ?? null)}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => layoutInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="w-full rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40 transition-colors p-6 flex flex-col items-center gap-2 text-muted-foreground"
                  >
                    <Upload className="h-7 w-7 opacity-60" />
                    <span className="text-sm font-medium">
                      {form.layoutArquivo ? 'Substituir arquivo' : 'Clique para selecionar'}
                    </span>
                    <span className="text-xs">
                      Imagens (PNG, JPG, GIF, WEBP) ou PDF — máx. 10 MB
                    </span>
                  </button>
                  {layoutError && <p className="text-xs text-destructive mt-1">{layoutError}</p>}
                </div>
              )}

              {/* Preview */}
              {form.layoutArquivo ? (
                <div className="space-y-2">
                  {/* File info + remove */}
                  <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isLayoutPdf ? (
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="text-sm truncate">{form.layoutNome ?? 'arquivo'}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      {isLayoutImage && (
                        <button
                          type="button"
                          onClick={() => setLayoutZoom((z) => !z)}
                          className="rounded p-1 hover:bg-muted transition-colors"
                          title={layoutZoom ? 'Reduzir' : 'Ampliar'}
                        >
                          <ZoomIn className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={removeLayout}
                          className="rounded p-1 hover:bg-destructive/10 transition-colors"
                          title="Remover arquivo"
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Image preview */}
                  {isLayoutImage && (
                    <div
                      className={`rounded-md overflow-hidden border bg-muted/20 flex items-center justify-center transition-all ${layoutZoom ? 'max-h-[60vh]' : 'max-h-72'}`}
                    >
                      <img
                        src={form.layoutArquivo}
                        alt={form.layoutNome ?? 'Layout'}
                        className={`object-contain w-full ${layoutZoom ? 'max-h-[60vh]' : 'max-h-72'}`}
                      />
                    </div>
                  )}

                  {/* PDF preview */}
                  {isLayoutPdf && (
                    <div className="rounded-md overflow-hidden border h-[420px]">
                      <iframe
                        src={form.layoutArquivo}
                        title="Preview do layout"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                      />
                    </div>
                  )}
                </div>
              ) : !readOnly ? null : (
                <div className="rounded-md border h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30">
                  <FileText className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Nenhum layout cadastrado para este evento</p>
                </div>
              )}
            </TabsContent>
            {/* ── Agenda ── */}
            <TabsContent value="agenda" className="space-y-4 mt-4">
              <AgendaTab
                value={form.agenda ?? []}
                onChange={(dias) => set('agenda', dias)}
                readOnly={readOnly}
                disabled={isSubmitting}
              />
            </TabsContent>

            {/* ── Orçamento ── */}
            <TabsContent value="orcamento" className="space-y-4 mt-4">
              <OrcamentoEventoTab
                value={form.orcamentoItens ?? []}
                onChange={(itens) => set('orcamentoItens', itens)}
                unidadeNegocioId={form.unidadeNegocioId}
                readOnly={readOnly}
                disabled={isSubmitting}
              />
            </TabsContent>

            {/* ── Preview ── */}
            <TabsContent value="preview" className="mt-4">
              <PreviewTab agenda={form.agenda ?? []} />
            </TabsContent>
          </Tabs>

          <DialogFooter className={`mt-4 ${navigation ? 'sm:justify-between' : ''}`}>
            {navigation && <ModalNavigation {...navigation} />}
            <div className="flex gap-2 flex-wrap">
              {isEditing && data && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    printEventoRelatorio({
                      form,
                      evento: data,
                      tipoEventoNome:
                        tiposEvento.find((t) => t.id === form.tipoEventoId)?.nome ?? null,
                    })
                  }
                  disabled={isSubmitting}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir PDF
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {readOnly ? 'Fechar' : t('common.cancel')}
              </Button>
              {!readOnly && (
                <Button type="submit" disabled={isSubmitting || !form.nome.trim()}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('common.save')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
