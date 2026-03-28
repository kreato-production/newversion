import { apiRequest } from '@/lib/api/http';
import type { PermissionItem } from '@/modules/auth/auth.types';

export type FieldValidationType = 'obrigatorio' | 'sugerido' | null;

export class ApiAdminConfigRepository {
  async getPerfilPermissions(
    perfilId: string,
  ): Promise<{ perfilId: string; permissoes: PermissionItem[] } | null> {
    return apiRequest(`/admin-config/perfis/${perfilId}/permissoes`);
  }

  async savePerfilPermissions(perfilId: string, permissoes: PermissionItem[]): Promise<void> {
    await apiRequest(`/admin-config/perfis/${perfilId}/permissoes`, {
      method: 'PUT',
      body: JSON.stringify({ permissoes }),
    });
  }

  async getFormularioCampos(formularioId: string): Promise<Record<string, FieldValidationType>> {
    const response = await apiRequest<{
      formulario: string;
      campos: { campo: string; tipoValidacao: FieldValidationType }[];
    }>(`/admin-config/formularios/${formularioId}/campos`);

    return response.campos.reduce<Record<string, FieldValidationType>>((acc, item) => {
      acc[item.campo] = item.tipoValidacao;
      return acc;
    }, {});
  }

  async saveFormularioCampos(
    formularioId: string,
    fieldConfigs: Record<string, FieldValidationType>,
  ): Promise<void> {
    await apiRequest(`/admin-config/formularios/${formularioId}/campos`, {
      method: 'PUT',
      body: JSON.stringify({
        campos: Object.entries(fieldConfigs).map(([campo, tipoValidacao]) => ({
          campo,
          tipoValidacao,
        })),
      }),
    });
  }
}
