'use client';

import { useState, useEffect, useCallback, KeyboardEvent, useRef } from 'react';
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
import { Loader2, X, Plus, Trash2, ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ModalNavigation, type ModalNavigationProps } from '@/components/shared/ModalNavigation';
import {
  ApiParametrosRepository,
  type ParametroApiItem,
} from '@/modules/parametros/parametros.api.repository';
import type {
  Expositor,
  SaveExpositorInput,
  ExpositorProduto,
} from '@/modules/gestao-eventos/expositores.api.repository';

interface ExpositorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SaveExpositorInput) => Promise<void>;
  data?: Expositor | null;
  readOnly?: boolean;
  navigation?: ModalNavigationProps;
}

const emptyForm: SaveExpositorInput = {
  codigoExterno: '',
  nome: '',
  logo: null,
  tipoExpositorId: null,
  descricao: '',
  tags: [],
  contato: '',
  telefone: '',
  email: '',
  instagram: '',
  facebook: '',
  produtos: [],
};

const parametrosRepository = new ApiParametrosRepository();

export const ExpositorFormModal = ({
  isOpen,
  onClose,
  onSave,
  data,
  readOnly = false,
  navigation,
}: ExpositorFormModalProps) => {
  const { t } = useLanguage();
  const [form, setForm] = useState<SaveExpositorInput>(emptyForm);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tiposExpositor, setTiposExpositor] = useState<ParametroApiItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!data;

  // Load tipos_expositor parametros
  useEffect(() => {
    parametrosRepository
      .list('kreato_tipo_expositor')
      .then(setTiposExpositor)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (data) {
        setForm({
          id: data.id,
          codigoExterno: data.codigoExterno ?? '',
          nome: data.nome ?? '',
          logo: data.logo ?? null,
          tipoExpositorId: data.tipoExpositorId ?? null,
          descricao: data.descricao ?? '',
          tags: data.tags ?? [],
          contato: data.contato ?? '',
          telefone: data.telefone ?? '',
          email: data.email ?? '',
          instagram: data.instagram ?? '',
          facebook: data.facebook ?? '',
          produtos: data.produtos ?? [],
        });
      } else {
        setForm(emptyForm);
      }
      setTagInput('');
      setIsSubmitting(false);
    }
  }, [isOpen, data]);

  const set = useCallback(
    <K extends keyof SaveExpositorInput>(field: K, value: SaveExpositorInput[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Tags
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

  // Logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert('A imagem deve ter no máximo 500KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      set('logo', ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Produtos
  const addProduto = () => {
    const novo: ExpositorProduto = {
      id: crypto.randomUUID(),
      nome: '',
      descricao: null,
      preco: null,
    };
    set('produtos', [...(form.produtos ?? []), novo]);
  };

  const updateProduto = (index: number, field: keyof ExpositorProduto, value: string | null) => {
    const updated = [...(form.produtos ?? [])];
    updated[index] = { ...updated[index], [field]: value };
    set('produtos', updated);
  };

  const removeProduto = (index: number) => {
    set(
      'produtos',
      (form.produtos ?? []).filter((_, i) => i !== index),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[780px] max-w-[780px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `${t('common.edit')} Expositor` : `${t('common.new')} Expositor`}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('common.edit') : t('common.add')} expositor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="geral">
            <TabsList className="w-full">
              <TabsTrigger value="geral" className="flex-1">
                Dados Gerais
              </TabsTrigger>
              <TabsTrigger value="contato" className="flex-1">
                Contato
              </TabsTrigger>
              <TabsTrigger value="produtos" className="flex-1">
                Produtos
              </TabsTrigger>
            </TabsList>

            {/* ── Dados Gerais ── */}
            <TabsContent value="geral" className="space-y-4 mt-4">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 border rounded flex items-center justify-center bg-muted/30 shrink-0 overflow-hidden">
                    {form.logo ? (
                      <img
                        src={form.logo}
                        className="w-full h-full object-contain"
                        alt="Logo do expositor"
                      />
                    ) : (
                      <ImageIcon className="h-7 w-7 text-muted-foreground opacity-50" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                      disabled={readOnly || isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={readOnly || isSubmitting}
                    >
                      {form.logo ? 'Alterar Logo' : 'Selecionar Logo'}
                    </Button>
                    {form.logo && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => set('logo', null)}
                        disabled={readOnly || isSubmitting}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Remover
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Máximo 500KB. Formatos: JPG, PNG, GIF, WebP.
                    </p>
                  </div>
                </div>
              </div>

              {/* Código / Nome */}
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
                    Nome do Expositor <span className="text-destructive">*</span>
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

              {/* Tipo de Expositor */}
              <div className="space-y-2">
                <Label htmlFor="tipoExpositorId">Tipo de Expositor</Label>
                <select
                  id="tipoExpositorId"
                  value={form.tipoExpositorId ?? ''}
                  onChange={(e) => set('tipoExpositorId', e.target.value || null)}
                  disabled={readOnly || isSubmitting}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione um tipo...</option>
                  {tiposExpositor.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
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

            {/* ── Contato ── */}
            <TabsContent value="contato" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contato">Contato</Label>
                  <Input
                    id="contato"
                    value={form.contato ?? ''}
                    onChange={(e) => set('contato', e.target.value)}
                    placeholder="Nome do contato"
                    disabled={readOnly || isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={form.telefone ?? ''}
                    onChange={(e) => set('telefone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    disabled={readOnly || isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email ?? ''}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="email@exemplo.com"
                    disabled={readOnly || isSubmitting}
                  />
                </div>
                <div />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">@</span>
                  <Input
                    id="instagram"
                    value={form.instagram ?? ''}
                    onChange={(e) => set('instagram', e.target.value.replace(/^@/, ''))}
                    placeholder="usuario"
                    disabled={readOnly || isSubmitting}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={form.facebook ?? ''}
                  onChange={(e) => set('facebook', e.target.value)}
                  placeholder="facebook.com/pagina"
                  disabled={readOnly || isSubmitting}
                />
              </div>
            </TabsContent>

            {/* ── Produtos ── */}
            <TabsContent value="produtos" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label>Produtos do Expositor</Label>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProduto}
                    disabled={isSubmitting}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar Produto
                  </Button>
                )}
              </div>

              {(form.produtos ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum produto adicionado. Clique em &quot;Adicionar Produto&quot; para começar.
                </p>
              ) : (
                <div className="space-y-3">
                  {(form.produtos ?? []).map((produto, index) => (
                    <div
                      key={produto.id}
                      className="flex items-start gap-3 p-3 border rounded-md bg-muted/20"
                    >
                      <div className="grid grid-cols-3 gap-3 flex-1">
                        <div className="space-y-1">
                          <Label className="text-xs">Nome *</Label>
                          <Input
                            value={produto.nome}
                            onChange={(e) => updateProduto(index, 'nome', e.target.value)}
                            placeholder="Nome do produto"
                            disabled={readOnly || isSubmitting}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Descrição</Label>
                          <Input
                            value={produto.descricao ?? ''}
                            onChange={(e) =>
                              updateProduto(index, 'descricao', e.target.value || null)
                            }
                            placeholder="Breve descrição"
                            disabled={readOnly || isSubmitting}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Preço</Label>
                          <Input
                            value={produto.preco ?? ''}
                            onChange={(e) => updateProduto(index, 'preco', e.target.value || null)}
                            placeholder="R$ 0,00"
                            disabled={readOnly || isSubmitting}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      {!readOnly && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive shrink-0 mt-5"
                          onClick={() => removeProduto(index)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className={`mt-4 ${navigation ? 'sm:justify-between' : ''}`}>
            {navigation && <ModalNavigation {...navigation} />}
            <div className="flex gap-2">
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
