import { apiRequest } from '@/lib/api/http';

export type StatusGravacaoApiItem = {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  cor: string;
  isInicial: boolean;
  dataCadastro: string;
  usuarioCadastro: string;
};

export type StatusTarefaApiItem = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  cor: string;
  isInicial: boolean;
  dataCadastro: string;
  usuarioCadastro: string;
};

export type IncidenciaParametroApiItem = {
  id: string;
  codigo_externo: string;
  titulo: string;
  descricao: string;
  cor?: string | null;
  created_at: string;
  created_by: string;
};

export type CentroLucroApiItem = {
  id: string;
  codigoExterno: string;
  nome: string;
  descricao: string;
  status: 'Ativo' | 'Inativo';
  parentId: string | null;
  dataCadastro: string;
  usuarioCadastro: string;
};

type ListResponse<T> = {
  data: T[];
};

type CentroLucroUnidadesResponse = {
  unidades: Array<{ id: string; nome: string }>;
  selectedUnidades: string[];
};

export class ApiParametrizacoesRepository {
  listStatusGravacao(): Promise<ListResponse<StatusGravacaoApiItem>> {
    return apiRequest('/parametrizacoes/status-gravacao');
  }

  saveStatusGravacao(
    input: Partial<StatusGravacaoApiItem> & { nome: string },
  ): Promise<StatusGravacaoApiItem> {
    const path = input.id
      ? `/parametrizacoes/status-gravacao/${input.id}`
      : '/parametrizacoes/status-gravacao';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest(path, {
      method,
      body: JSON.stringify(input),
    });
  }

  toggleStatusGravacaoInicial(id: string, value: boolean): Promise<StatusGravacaoApiItem> {
    return apiRequest(`/parametrizacoes/status-gravacao/${id}/inicial`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
  }

  removeStatusGravacao(id: string): Promise<void> {
    return apiRequest(`/parametrizacoes/status-gravacao/${id}`, { method: 'DELETE' });
  }

  listStatusTarefa(): Promise<ListResponse<StatusTarefaApiItem>> {
    return apiRequest('/parametrizacoes/status-tarefa');
  }

  saveStatusTarefa(
    input: Partial<StatusTarefaApiItem> & { codigo: string; nome: string },
  ): Promise<StatusTarefaApiItem> {
    const path = input.id
      ? `/parametrizacoes/status-tarefa/${input.id}`
      : '/parametrizacoes/status-tarefa';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest(path, {
      method,
      body: JSON.stringify(input),
    });
  }

  toggleStatusTarefaInicial(id: string, value: boolean): Promise<StatusTarefaApiItem> {
    return apiRequest(`/parametrizacoes/status-tarefa/${id}/inicial`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
  }

  removeStatusTarefa(id: string): Promise<void> {
    return apiRequest(`/parametrizacoes/status-tarefa/${id}`, { method: 'DELETE' });
  }

  listCategoriasIncidencia(): Promise<ListResponse<IncidenciaParametroApiItem>> {
    return apiRequest('/parametrizacoes/categorias-incidencia');
  }

  saveCategoriaIncidencia(
    input: Partial<IncidenciaParametroApiItem> & { titulo: string },
  ): Promise<IncidenciaParametroApiItem> {
    const path = input.id
      ? `/parametrizacoes/categorias-incidencia/${input.id}`
      : '/parametrizacoes/categorias-incidencia';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest(path, {
      method,
      body: JSON.stringify({
        id: input.id,
        codigoExterno: input.codigo_externo,
        titulo: input.titulo,
        descricao: input.descricao,
      }),
    });
  }

  removeCategoriaIncidencia(id: string): Promise<void> {
    return apiRequest(`/parametrizacoes/categorias-incidencia/${id}`, { method: 'DELETE' });
  }

  listClassificacoesIncidencia(
    categoriaId: string,
  ): Promise<ListResponse<IncidenciaParametroApiItem>> {
    return apiRequest(`/parametrizacoes/categorias-incidencia/${categoriaId}/classificacoes`);
  }

  saveClassificacaoIncidencia(
    categoriaId: string,
    input: Partial<IncidenciaParametroApiItem> & { titulo: string },
  ): Promise<IncidenciaParametroApiItem> {
    const path = input.id
      ? `/parametrizacoes/categorias-incidencia/${categoriaId}/classificacoes/${input.id}`
      : `/parametrizacoes/categorias-incidencia/${categoriaId}/classificacoes`;
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest(path, {
      method,
      body: JSON.stringify({
        id: input.id,
        codigoExterno: input.codigo_externo,
        titulo: input.titulo,
        descricao: input.descricao,
      }),
    });
  }

  removeClassificacaoIncidencia(categoriaId: string, classificacaoId: string): Promise<void> {
    return apiRequest(
      `/parametrizacoes/categorias-incidencia/${categoriaId}/classificacoes/${classificacaoId}`,
      { method: 'DELETE' },
    );
  }

  listSeveridadesIncidencia(): Promise<ListResponse<IncidenciaParametroApiItem>> {
    return apiRequest('/parametrizacoes/severidades-incidencia');
  }

  saveSeveridadeIncidencia(
    input: Partial<IncidenciaParametroApiItem> & { titulo: string; cor?: string | null },
  ): Promise<IncidenciaParametroApiItem> {
    const path = input.id
      ? `/parametrizacoes/severidades-incidencia/${input.id}`
      : '/parametrizacoes/severidades-incidencia';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest(path, {
      method,
      body: JSON.stringify({
        id: input.id,
        codigoExterno: input.codigo_externo,
        titulo: input.titulo,
        descricao: input.descricao,
        cor: input.cor,
      }),
    });
  }

  removeSeveridadeIncidencia(id: string): Promise<void> {
    return apiRequest(`/parametrizacoes/severidades-incidencia/${id}`, { method: 'DELETE' });
  }

  listImpactosIncidencia(): Promise<ListResponse<IncidenciaParametroApiItem>> {
    return apiRequest('/parametrizacoes/impactos-incidencia');
  }

  saveImpactoIncidencia(
    input: Partial<IncidenciaParametroApiItem> & { titulo: string },
  ): Promise<IncidenciaParametroApiItem> {
    const path = input.id
      ? `/parametrizacoes/impactos-incidencia/${input.id}`
      : '/parametrizacoes/impactos-incidencia';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest(path, {
      method,
      body: JSON.stringify({
        id: input.id,
        codigoExterno: input.codigo_externo,
        titulo: input.titulo,
        descricao: input.descricao,
      }),
    });
  }

  removeImpactoIncidencia(id: string): Promise<void> {
    return apiRequest(`/parametrizacoes/impactos-incidencia/${id}`, { method: 'DELETE' });
  }

  listCentrosLucro(): Promise<ListResponse<CentroLucroApiItem>> {
    return apiRequest('/parametrizacoes/centros-lucro');
  }

  saveCentroLucro(
    input: Partial<CentroLucroApiItem> & { nome: string },
  ): Promise<CentroLucroApiItem> {
    const path = input.id
      ? `/parametrizacoes/centros-lucro/${input.id}`
      : '/parametrizacoes/centros-lucro';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest(path, {
      method,
      body: JSON.stringify({
        id: input.id,
        codigoExterno: input.codigoExterno,
        nome: input.nome,
        descricao: input.descricao,
        status: input.status,
        parentId: input.parentId,
      }),
    });
  }

  removeCentroLucro(id: string): Promise<void> {
    return apiRequest(`/parametrizacoes/centros-lucro/${id}`, { method: 'DELETE' });
  }

  listCentroLucroUnidades(id: string): Promise<CentroLucroUnidadesResponse> {
    return apiRequest(`/parametrizacoes/centros-lucro/${id}/unidades`);
  }

  saveCentroLucroUnidades(id: string, unidadeIds: string[]): Promise<void> {
    return apiRequest(`/parametrizacoes/centros-lucro/${id}/unidades`, {
      method: 'PUT',
      body: JSON.stringify({ unidadeIds }),
    });
  }
}
