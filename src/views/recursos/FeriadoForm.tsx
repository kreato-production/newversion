import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FormPage } from '@/components/shared/FormPage';
import { TraducaoTab, type Traducoes } from '@/components/shared/TraducaoTab';
import {
  ConfigurableFieldGrid,
  FieldAsterisk,
  useFormFieldConfig,
} from '@/hooks/useFormFieldConfig';
import { usePermissions } from '@/hooks/usePermissions';
import { useRecordForm } from '@/hooks/useRecordForm';
import { useRecordNavigation } from '@/hooks/useRecordNavigation';
import { ApiFeriadosRepository } from '@/modules/feriados/feriados.api.repository';
import { FERIADOS_ROUTES } from '@/modules/feriados/feriados.navigation';
import type { Feriado, FeriadoInput } from '@/modules/feriados/feriados.types';

const repository = new ApiFeriadosRepository();

const EMPTY: FeriadoInput = { data: '', feriado: '', observacoes: '', traducoes: {} };

function toInput(item: Feriado): FeriadoInput {
  return {
    id: item.id,
    data: item.data,
    feriado: item.feriado,
    observacoes: item.observacoes || '',
    traducoes: item.traducoes ?? {},
  };
}

const PERMISSION = ['Recursos', 'Parametrizacoes', 'Feriados'] as const;

const FeriadoForm = ({ id }: { id?: string }) => {
  const { canIncluir, canAlterar } = usePermissions();
  const { goBack, navigation } = useRecordNavigation(FERIADOS_ROUTES, id);
  const readOnly = id ? !canAlterar(...PERMISSION) : !canIncluir(...PERMISSION);
  const { getAsterisk, validate, fieldLabel, fieldLayout } = useFormFieldConfig('feriado');

  const form = useRecordForm<Feriado, FeriadoInput>({
    id,
    empty: EMPTY,
    load: (recordId) => repository.getById(recordId),
    toInput,
    save: (values) =>
      repository.save({
        id: values.id,
        data: values.data,
        feriado: values.feriado.trim(),
        observacoes: values.observacoes?.trim() || '',
        traducoes: values.traducoes,
      }),
    onSaved: goBack,
    readOnly,
    validate: (values) =>
      validate({ data: values.data, feriado: values.feriado, observacoes: values.observacoes }),
    messages: { created: 'Feriado salvo!', updated: 'Feriado atualizado!' },
  });
  const { isEditing, record, formData, update, handleSubmit } = form;
  const disabled = readOnly || form.isSubmitting;

  return (
    <FormPage
      title={isEditing ? record?.feriado || 'Editar Feriado' : 'Novo Feriado'}
      description={
        isEditing ? 'Atualize os dados do feriado.' : 'Preencha os dados do novo feriado.'
      }
      formId="feriado-form"
      onBack={goBack}
      isEditing={isEditing}
      readOnly={readOnly}
      isLoading={form.isLoading}
      isSubmitting={form.isSubmitting}
      loadError={form.loadError}
      notFoundTitle="Feriado não encontrado"
      navigation={navigation}
      createLabel="Salvar"
    >
      <form id="feriado-form" onSubmit={handleSubmit}>
        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            <TabsTrigger value="traducao">Tradução</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4 mt-4">
            <ConfigurableFieldGrid>
              <div className="space-y-2" {...fieldLayout('data')}>
                <Label htmlFor="data">
                  {fieldLabel('data', 'Data')}
                  <FieldAsterisk type={getAsterisk('data', true)} />
                </Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => update('data', e.target.value)}
                  required
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2" {...fieldLayout('feriado')}>
                <Label htmlFor="feriado">
                  {fieldLabel('feriado', 'Feriado')}
                  <FieldAsterisk type={getAsterisk('feriado', true)} />
                </Label>
                <Input
                  id="feriado"
                  value={formData.feriado}
                  onChange={(e) => update('feriado', e.target.value)}
                  maxLength={120}
                  required
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2" {...fieldLayout('observacoes')}>
                <Label htmlFor="observacoes">
                  {fieldLabel('observacoes', 'Observações')}
                  <FieldAsterisk type={getAsterisk('observacoes')} />
                </Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes || ''}
                  onChange={(e) => update('observacoes', e.target.value)}
                  rows={4}
                  disabled={disabled}
                />
              </div>
            </ConfigurableFieldGrid>
          </TabsContent>

          <TabsContent value="traducao">
            <TraducaoTab
              traducoes={(formData.traducoes as Traducoes) ?? {}}
              onChange={(lang, value) =>
                update('traducoes', { ...(formData.traducoes ?? {}), [lang]: value })
              }
              readOnly={disabled}
            />
          </TabsContent>
        </Tabs>
      </form>
    </FormPage>
  );
};

export default FeriadoForm;
