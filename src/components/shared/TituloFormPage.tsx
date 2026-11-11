import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { FormPage } from '@/components/shared/FormPage';
import { TraducaoTab, type Traducoes } from '@/components/shared/TraducaoTab';
import { usePermissions } from '@/hooks/usePermissions';
import { useRecordForm } from '@/hooks/useRecordForm';
import { useRecordNavigation } from '@/hooks/useRecordNavigation';
import type { TituloFormConfig, TituloFormValues } from './TituloFormPage.types';

const FALLBACK_COR = '#3b82f6';
const FORM_ID = 'titulo-form';

function emptyValues(config: TituloFormConfig): TituloFormValues {
  return {
    codigoExterno: '',
    titulo: '',
    descricao: '',
    cor: config.defaultCor ?? FALLBACK_COR,
    traducoes: {},
    flags: Object.fromEntries((config.flags ?? []).map((flag) => [flag.key, false])),
  };
}

interface TituloFormPageProps {
  config: TituloFormConfig;
  id?: string;
}

/**
 * Form page shared by the simple parametrizations: código, título/nome, cor, descrição,
 * tradução, optional boolean flags and optional extra tabs — all driven by `config`.
 */
export const TituloFormPage = ({ config, id }: TituloFormPageProps) => {
  const { canIncluir, canAlterar } = usePermissions();
  const { goBack, navigation } = useRecordNavigation(config.routes, id);
  const empty = useMemo(() => emptyValues(config), [config]);

  const {
    nameLabel = 'Título',
    codigoLabel = 'Código Externo',
    codigoMaxLength = 50,
    showCor = true,
    showDescricao = true,
    showTraducao = true,
    permission,
  } = config;

  const readOnly = permission
    ? id
      ? !canAlterar(permission[0], permission[1], permission[2] || '-')
      : !canIncluir(permission[0], permission[1], permission[2] || '-')
    : false;

  const form = useRecordForm<TituloFormValues, TituloFormValues>({
    id,
    empty,
    load: config.load,
    toInput: (values) => ({ ...values, cor: values.cor || empty.cor }),
    save: config.save,
    onSaved: goBack,
    readOnly,
    messages: config.messages,
  });
  const { isEditing, record, formData, update, setFormData, handleSubmit } = form;
  const disabled = readOnly || form.isSubmitting;

  const extraTabs = (config.extraTabs ?? []).filter((tab) => !tab.requiresRecord || isEditing);
  const hasTabs = showTraducao || extraTabs.length > 0;
  const title = isEditing ? record?.titulo || config.editTitle : config.newTitle;

  const dadosGerais = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="codigoExterno">
            {codigoLabel}
            {config.codigoRequired && <span className="text-destructive"> *</span>}
          </Label>
          <Input
            id="codigoExterno"
            form={FORM_ID}
            value={formData.codigoExterno}
            onChange={(event) => update('codigoExterno', event.target.value)}
            maxLength={codigoMaxLength}
            placeholder={config.codigoRequired ? undefined : 'Opcional'}
            required={config.codigoRequired}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="titulo">
            {nameLabel} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="titulo"
            form={FORM_ID}
            value={formData.titulo}
            onChange={(event) => update('titulo', event.target.value)}
            maxLength={config.nameMaxLength}
            required
            disabled={disabled}
          />
        </div>
      </div>

      {showCor && (
        <div className="space-y-2">
          <Label>Cor</Label>
          <ColorPicker
            value={formData.cor}
            onChange={(cor) => update('cor', cor)}
            disabled={disabled}
            previewLabel={formData.titulo}
          />
        </div>
      )}

      {config.flags && config.flags.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {config.flags.map((flag) => (
            <div key={flag.key} className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox
                id={flag.key}
                checked={formData.flags[flag.key] ?? false}
                onCheckedChange={(checked) =>
                  setFormData((current) => ({
                    ...current,
                    flags: { ...current.flags, [flag.key]: Boolean(checked) },
                  }))
                }
                disabled={disabled}
              />
              <div className="space-y-1">
                <Label htmlFor={flag.key} className="cursor-pointer">
                  {flag.label}
                </Label>
                <p className="text-xs text-muted-foreground">{flag.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDescricao && (
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            form={FORM_ID}
            value={formData.descricao}
            onChange={(event) => update('descricao', event.target.value)}
            rows={4}
            placeholder={config.descricaoPlaceholder}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );

  return (
    <FormPage
      title={title}
      description={`Preencha os campos abaixo para ${isEditing ? 'editar' : 'cadastrar'} ${config.entityArticle}.`}
      formId={FORM_ID}
      onBack={goBack}
      isEditing={isEditing}
      readOnly={readOnly}
      isLoading={form.isLoading}
      isSubmitting={form.isSubmitting}
      loadError={form.loadError}
      notFoundTitle={config.notFoundTitle}
      navigation={navigation}
      createLabel="Salvar"
    >
      {/* Extra tabs may contain their own forms, so the fields are linked to the main
          <form> through the `form` attribute instead of being nested in it. */}
      <form id={FORM_ID} onSubmit={handleSubmit} />
      {hasTabs ? (
        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            {extraTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
            {showTraducao && <TabsTrigger value="traducao">Tradução</TabsTrigger>}
          </TabsList>

          <TabsContent value="dados" className="mt-4">
            {dadosGerais}
          </TabsContent>
          {extraTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {tab.render({ id, readOnly, values: formData })}
            </TabsContent>
          ))}
          {showTraducao && (
            <TabsContent value="traducao">
              <TraducaoTab
                traducoes={formData.traducoes}
                onChange={(lang, value) =>
                  update('traducoes', { ...formData.traducoes, [lang]: value } as Traducoes)
                }
                readOnly={disabled}
              />
            </TabsContent>
          )}
        </Tabs>
      ) : (
        dadosGerais
      )}
    </FormPage>
  );
};

/** Route component for `<lista>/novo` and `<lista>/[id]`. */
export const TituloFormRoute = ({ config }: { config: TituloFormConfig }) => {
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  return <TituloFormPage key={id ?? 'novo'} config={config} id={id} />;
};
