import { apiRequest } from '@/lib/api/http';

export type IncidenciaGravacaoApiItem = {
  id: string;
  tenantId: string;
  codigo_externo: string | null;
  titulo: string;
  gravacao_id: string | null;
  recurso_fisico_id: string | null;
  severidade_id: string | null;
  impacto_id: string | null;
  categoria_id: string | null;
  classificacao_id: string | null;
  data_incidencia: string | null;
  horario_incidencia: string | null;
  tempo_incidencia: string | null;
  descricao: string | null;
  causa_provavel: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type IncidenciaAnexoApiItem = {
  id: string;
  incidencia_id: string;
  nome: string;
  url: string;
  tipo: string | null;
  tamanho: number | null;
  created_at: string | null;
};

export class ApiIncidenciasGravacaoRepository {
  list() {
    return apiRequest<IncidenciaGravacaoApiItem[]>('/incidencias-gravacao');
  }

  listByGravacao(gravacaoId: string) {
    return apiRequest<IncidenciaGravacaoApiItem[]>(`/gravacoes/${gravacaoId}/incidencias`);
  }

  save(input: Partial<IncidenciaGravacaoApiItem> & { titulo: string }) {
    const path = input.id ? `/incidencias-gravacao/${input.id}` : '/incidencias-gravacao';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest<IncidenciaGravacaoApiItem>(path, {
      method,
      body: JSON.stringify(input),
    });
  }

  remove(id: string) {
    return apiRequest<void>(`/incidencias-gravacao/${id}`, {
      method: 'DELETE',
    });
  }

  listAnexos(incidenciaId: string) {
    return apiRequest<IncidenciaAnexoApiItem[]>(`/incidencias-gravacao/${incidenciaId}/anexos`);
  }

  addAnexo(
    incidenciaId: string,
    input: { nome: string; url: string; tipo?: string | null; tamanho?: number | null },
  ) {
    return apiRequest<IncidenciaAnexoApiItem>(`/incidencias-gravacao/${incidenciaId}/anexos`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  removeAnexo(incidenciaId: string, anexoId: string) {
    return apiRequest<void>(`/incidencias-gravacao/${incidenciaId}/anexos/${anexoId}`, {
      method: 'DELETE',
    });
  }
}
