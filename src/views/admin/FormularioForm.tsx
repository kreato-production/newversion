import { useState } from 'react';
import { FormPage } from '@/components/shared/FormPage';
import {
  FormularioCamposFormBody,
  type FormularioCampoRow,
  type FormularioConfig,
  type FormularioPublicacao,
} from '@/components/admin/FormularioCamposFormBody';
import { cleanTraducoes } from '@/components/admin/formularioLayout';
import { formsRegistry } from '@/data/formsRegistry';
import { ApiAdminConfigRepository, type FullFieldConfig } from '@/modules/admin/admin-config.api';
import {
  FORMULARIOS_ROUTES,
  readFormulariosTenant,
  type FormulariosTenant,
} from '@/modules/admin/formularios.navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useRecordNavigation } from '@/hooks/useRecordNavigation';
import { useRecordPage } from '@/hooks/useRecordPage';

const repository = new ApiAdminConfigRepository();

/**
 * Configuração dos campos de um formulário (só edição: os formulários vêm do `formsRegistry`).
 * Grava pelo "Publicar alterações" do tabulador Preview e continua na página.
 * O GLOBAL_ADMIN configura o tenant escolhido na lista.
 */
const FormularioForm = ({ id }: { id?: string }) => {
  const { user } = useAuth();
  const { enabledModules, canAlterar } = usePermissions();
  const { goBack, navigation } = useRecordNavigation(FORMULARIOS_ROUTES, id);
  const isGlobalAdmin = user?.role === 'GLOBAL_ADMIN';
  // Same rule as the backend (PUT /admin-config/formularios/:id/campos): admins, or users
  // whose profile grants "alterar" on Administração > Formulários.
  const canPublish =
    isGlobalAdmin || user?.role === 'TENANT_ADMIN' || canAlterar('Administração', 'Formulários');
  // Lido uma vez: a página remonta a cada formulário (key={id}).
  const [tenant] = useState<FormulariosTenant | null>(() =>
    isGlobalAdmin ? readFormulariosTenant() : null,
  );

  const page = useRecordPage<FormularioConfig, FormularioPublicacao>({
    id,
    load: async (formId) => {
      const form = formsRegistry.find(
        (item) =>
          item.id === formId && (enabledModules.has(item.modulo) || enabledModules.has('Global')),
      );
      if (!form) throw new Error('Formulário não encontrado.');
      if (isGlobalAdmin && !tenant) {
        throw new Error('Selecione um tenant na lista de formulários antes de configurar.');
      }

      const [configs, lista] = await Promise.all([
        repository.getFormularioCamposFull(form.id, tenant?.id),
        repository.getFormularioLista(form.id, tenant?.id),
      ]);
      const rows: FormularioCampoRow[] = form.campos.map((field) => {
        const saved = configs[field.campo] as FullFieldConfig | undefined;
        return {
          campo: field.campo,
          label: field.label,
          tipoValidacao: saved?.tipoValidacao ?? null,
          tamanho: saved?.tamanho ?? null,
          posicao: saved?.posicao ?? null,
          traducoes: saved?.traducoes ?? null,
        };
      });
      return { form, rows, lista };
    },
    save: ({ rows, lista }) =>
      repository.saveFormularioCamposFull(
        id ?? '',
        rows.map((row) => ({
          campo: row.campo,
          tipoValidacao: row.tipoValidacao,
          tamanho: row.tamanho,
          posicao: row.posicao,
          traducoes: cleanTraducoes(row.traducoes),
        })),
        tenant?.id,
        lista,
      ),
    messages: { updated: 'Alterações publicadas no formulário do módulo.' },
  });

  return (
    <FormPage
      title={page.record?.form.nome || 'Configurar formulário'}
      description={`Configure a validação, tamanho, posição e tradução dos campos deste formulário${
        tenant ? ` (tenant ${tenant.nome})` : ''
      }.`}
      formId="formulario-config"
      onBack={goBack}
      isEditing
      hideSubmit
      isLoading={page.isLoading}
      loadError={page.loadError}
      notFoundTitle="Formulário não disponível"
      navigation={navigation}
    >
      {page.record && (
        <FormularioCamposFormBody
          data={page.record}
          readOnly={!canPublish}
          readOnlyReason={
            canPublish
              ? undefined
              : 'Seu perfil de acesso não permite alterar Administração > Formulários. Você pode consultar a configuração; para publicar alterações, peça a permissão "Alterar" ao administrador.'
          }
          onPublish={page.submit}
        />
      )}
    </FormPage>
  );
};

export default FormularioForm;
