import { useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { FormPage } from '@/components/shared/FormPage';
import { TraducaoTab, type Traducoes } from '@/components/shared/TraducaoTab';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useRecordForm } from '@/hooks/useRecordForm';
import {
  parentPath,
  useRecordNavigation,
  type RecordRouteConfig,
} from '@/hooks/useRecordNavigation';
import {
  ApiParametrosRepository,
  type ParametroApiItem,
} from '@/modules/parametros/parametros.api.repository';
import {
  parametroNavStorageKey,
  type ParametroPageConfig,
} from '@/modules/parametros/parametros.config';

const repository = new ApiParametrosRepository();

interface ParametroFormValues {
  id?: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  cor: string | null;
  traducoes: Traducoes;
}

const EMPTY: ParametroFormValues = {
  codigoExterno: '',
  nome: '',
  descricao: '',
  cor: null,
  traducoes: {},
};

function toFormValues(item: ParametroApiItem): ParametroFormValues {
  return {
    id: item.id,
    codigoExterno: item.codigo_externo || '',
    nome: item.nome,
    descricao: item.descricao || '',
    cor: item.cor ?? null,
    traducoes: (item.traducoes as Traducoes) ?? {},
  };
}

interface ParametroFormPageProps {
  config: ParametroPageConfig;
  /** Route of the list this form belongs to (the same parametro can live under several menus). */
  basePath: string;
  id?: string;
}

export const ParametroFormPage = ({ config, basePath, id }: ParametroFormPageProps) => {
  const { t } = useLanguage();
  const { canIncluir, canAlterar } = usePermissions();
  const { entityName, storageKey, permissionPath, showCor = false } = config;

  const routes = useMemo<RecordRouteConfig>(
    () => ({ basePath, navStorageKey: parametroNavStorageKey(storageKey) }),
    [basePath, storageKey],
  );
  const { goBack, navigation } = useRecordNavigation(routes, id);

  const readOnly = permissionPath
    ? id
      ? !canAlterar(permissionPath[0], permissionPath[1], permissionPath[2] || '-')
      : !canIncluir(permissionPath[0], permissionPath[1], permissionPath[2] || '-')
    : false;

  const form = useRecordForm<ParametroApiItem, ParametroFormValues>({
    id,
    empty: EMPTY,
    load: (recordId) => repository.getById(storageKey, recordId),
    toInput: toFormValues,
    save: (values) =>
      repository.save(storageKey, {
        id: values.id,
        codigoExterno: values.codigoExterno,
        nome: values.nome,
        descricao: values.descricao,
        cor: values.cor,
        traducoes: values.traducoes,
      }),
    onSaved: goBack,
    readOnly,
    messages: {
      created: `${entityName} ${t('common.save').toLowerCase()}!`,
      updated: `${entityName} ${t('common.updated').toLowerCase()}!`,
    },
  });
  const { isEditing, record, formData, update, handleSubmit } = form;
  const disabled = readOnly || form.isSubmitting;

  const title = isEditing
    ? (record?.nome ?? `${t('common.edit')} ${entityName}`)
    : `${t('common.new')} ${entityName}`;

  return (
    <FormPage
      title={title}
      description={`${isEditing ? t('common.edit') : t('common.add')} ${entityName.toLowerCase()}`}
      formId="parametro-form"
      onBack={goBack}
      isEditing={isEditing}
      readOnly={readOnly}
      isLoading={form.isLoading}
      isSubmitting={form.isSubmitting}
      loadError={form.loadError}
      notFoundTitle={`${entityName} não encontrado(a)`}
      navigation={navigation}
      createLabel={t('common.save')}
    >
      <form id="parametro-form" onSubmit={handleSubmit}>
        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="traducao">Tradução</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="codigoExterno">{t('common.externalCode')}</Label>
                <Input
                  id="codigoExterno"
                  value={formData.codigoExterno}
                  onChange={(e) => update('codigoExterno', e.target.value)}
                  maxLength={10}
                  placeholder={t('common.maxChars')}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nome">
                  {t('common.name')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => update('nome', e.target.value)}
                  maxLength={100}
                  required
                  disabled={disabled}
                />
              </div>
            </div>

            {showCor && (
              <div className="space-y-2">
                <Label>Cor</Label>
                <ColorPicker
                  value={formData.cor || '#3b82f6'}
                  onChange={(cor) => update('cor', cor)}
                  disabled={disabled}
                  previewLabel={formData.nome}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="descricao">{t('common.description')}</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => update('descricao', e.target.value)}
                rows={4}
                disabled={disabled}
              />
            </div>

            {record?.created_at && (
              <div className="grid grid-cols-1 gap-4 pt-2 border-t md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="dataCadastro">{t('common.registrationDate')}</Label>
                  <Input
                    id="dataCadastro"
                    value={new Date(record.created_at).toLocaleDateString('pt-BR')}
                    readOnly
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="traducao">
            <TraducaoTab
              traducoes={formData.traducoes}
              onChange={(lang, value) =>
                update('traducoes', { ...formData.traducoes, [lang]: value })
              }
              readOnly={disabled}
            />
          </TabsContent>
        </Tabs>
      </form>
    </FormPage>
  );
};

/**
 * Route component for `<lista>/novo` and `<lista>/[id]`: reads the id and the list
 * path from the URL, so the same parametro works under any menu (e.g. Serviços).
 */
export const ParametroFormRoute = ({ config }: { config: ParametroPageConfig }) => {
  const params = useParams<{ id?: string }>();
  const pathname = usePathname();
  const id = params?.id;

  return (
    <ParametroFormPage key={id ?? 'novo'} config={config} basePath={parentPath(pathname)} id={id} />
  );
};
