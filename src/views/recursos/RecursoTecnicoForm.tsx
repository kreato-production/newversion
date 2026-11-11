import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormPage } from '@/components/shared/FormPage';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { useAuth } from '@/contexts/AuthContext';
import {
  FieldAsterisk,
  useFormFieldConfig,
  ConfigurableFieldGrid,
} from '@/hooks/useFormFieldConfig';
import { usePermissions } from '@/hooks/usePermissions';
import { useRecordForm } from '@/hooks/useRecordForm';
import { useRecordNavigation } from '@/hooks/useRecordNavigation';
import { recursosTecnicosRepository } from '@/modules/recursos-tecnicos/recursos-tecnicos.repository.provider';
import { RECURSOS_TECNICOS_ROUTES } from '@/modules/recursos-tecnicos/recursos-tecnicos.navigation';
import type {
  RecursoTecnico,
  RecursoTecnicoInput,
} from '@/modules/recursos-tecnicos/recursos-tecnicos.types';

interface Funcao {
  id: string;
  nome: string;
}

const EMPTY: RecursoTecnicoInput = {
  codigoExterno: '',
  nome: '',
  funcaoOperador: '',
  funcaoOperadorId: '',
};

function toInput(item: RecursoTecnico): RecursoTecnicoInput {
  return {
    id: item.id,
    codigoExterno: item.codigoExterno || '',
    nome: item.nome || '',
    funcaoOperador: item.funcaoOperador || '',
    funcaoOperadorId: item.funcaoOperadorId || '',
  };
}

const RecursoTecnicoForm = ({ id }: { id?: string }) => {
  const { user } = useAuth();
  const { getAsterisk, validate, fieldLabel, fieldLayout } = useFormFieldConfig('recursoTecnico');
  const { canIncluir, canAlterar } = usePermissions();
  const { goBack, navigation } = useRecordNavigation(RECURSOS_TECNICOS_ROUTES, id);
  const readOnly = id
    ? !canAlterar('Recursos', 'Recursos Técnicos')
    : !canIncluir('Recursos', 'Recursos Técnicos');

  const form = useRecordForm<RecursoTecnico, RecursoTecnicoInput>({
    id,
    empty: EMPTY,
    load: (recordId) => recursosTecnicosRepository.getById(recordId),
    toInput,
    save: (values) =>
      recursosTecnicosRepository.save({
        ...values,
        funcaoOperadorId: values.funcaoOperadorId || undefined,
        tenantId: user?.tenantId ?? null,
      }),
    onSaved: goBack,
    validate: (values) =>
      validate({
        codigoExterno: values.codigoExterno,
        nome: values.nome,
        funcaoOperador: values.funcaoOperadorId,
      }),
    readOnly,
    messages: { created: 'Recurso técnico criado!', updated: 'Recurso técnico atualizado!' },
  });
  const { isEditing, record, formData, setFormData, update, handleSubmit } = form;
  const disabled = readOnly || form.isSubmitting;

  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [isLoadingFuncoes, setIsLoadingFuncoes] = useState(true);

  useEffect(() => {
    recursosTecnicosRepository
      .listOptions()
      .then((response) => setFuncoes(response.funcoes || []))
      .catch((error) => {
        console.error('Error fetching funcoes do recurso tecnico:', error);
        setFuncoes([]);
      })
      .finally(() => setIsLoadingFuncoes(false));
  }, []);

  return (
    <FormPage
      title={isEditing ? record?.nome || 'Editar Recurso Técnico' : 'Novo Recurso Técnico'}
      description={`Preencha os campos para ${isEditing ? 'editar' : 'cadastrar'} o recurso técnico.`}
      formId="recurso-tecnico-form"
      onBack={goBack}
      isEditing={isEditing}
      readOnly={readOnly}
      isLoading={form.isLoading}
      isSubmitting={form.isSubmitting}
      loadError={form.loadError}
      notFoundTitle="Recurso técnico não encontrado"
      navigation={navigation}
      createLabel="Salvar"
    >
      <form id="recurso-tecnico-form" onSubmit={handleSubmit} className="space-y-4">
        <ConfigurableFieldGrid>
          <div className="space-y-1.5" {...fieldLayout('codigoExterno')}>
            <Label htmlFor="codigoExterno">
              {fieldLabel('codigoExterno', 'Código Externo')}{' '}
              <FieldAsterisk type={getAsterisk('codigoExterno')} />
            </Label>
            <Input
              id="codigoExterno"
              value={formData.codigoExterno}
              onChange={(e) => update('codigoExterno', e.target.value)}
              maxLength={10}
              placeholder="Máx. 10 caracteres"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5" {...fieldLayout('nome')}>
            <Label htmlFor="nome">
              {fieldLabel('nome', 'Nome')} <FieldAsterisk type={getAsterisk('nome', true)} />
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
          <div className="space-y-1.5" {...fieldLayout('funcaoOperador')}>
            <Label htmlFor="funcaoOperador">
              {fieldLabel('funcaoOperador', 'Função do Operador')}{' '}
              <FieldAsterisk type={getAsterisk('funcaoOperador')} />
            </Label>
            <SearchableSelect
              options={funcoes.map((item) => ({ value: item.id, label: item.nome }))}
              value={formData.funcaoOperadorId || ''}
              onValueChange={(value) => {
                const selecionada = funcoes.find((item) => item.id === value);
                setFormData((current) => ({
                  ...current,
                  funcaoOperadorId: value,
                  funcaoOperador: selecionada?.nome || '',
                }));
              }}
              placeholder="Selecione a função..."
              searchPlaceholder="Pesquisar função..."
              disabled={disabled || isLoadingFuncoes}
            />
            <p className="text-xs text-muted-foreground">
              Define qual função pode operar este recurso
            </p>
          </div>
        </ConfigurableFieldGrid>
      </form>
    </FormPage>
  );
};

export default RecursoTecnicoForm;
