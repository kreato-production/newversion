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

export type StatusContaPagarApiItem = {
  id: string;
  codigoExterno: string;
  titulo: string;
  descricao: string;
  cor: string;
  isInicial: boolean;
  isBaixa: boolean;
  dataCadastro: string;
  usuarioCadastro: string;
};

export type FormaPagamentoApiItem = {
  id: string;
  codigoExterno: string;
  titulo: string;
  descricao: string;
  cor: string;
  isPadrao: boolean;
  dataCadastro: string;
  usuarioCadastro: string;
};

export type TipoDocumentoFinanceiroApiItem = {
  id: string;
  codigo_externo: string;
  titulo: string;
  descricao: string;
  cor: string | null;
  created_at: string;
  created_by: string;
};

export type TipoPagamentoApiItem = {
  id: string;
  codigo_externo: string;
  titulo: string;
  descricao: string;
  cor: string | null;
  created_at: string;
  created_by: string;
};

export type CategoriaDespesaApiItem = {
  id: string;
  codigo_externo: string;
  titulo: string;
  descricao: string;
  cor: string | null;
  created_at: string;
  created_by: string;
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

  listStatusContasPagar(): Promise<ListResponse<StatusContaPagarApiItem>> {
    return apiRequest('/parametrizacoes/status-contas-pagar');
  }

  saveStatusContaPagar(
    input: Partial<StatusContaPagarApiItem> & { titulo: string },
  ): Promise<StatusContaPagarApiItem> {
    const path = input.id
      ? `/parametrizacoes/status-contas-pagar/${input.id}`
      : '/parametrizacoes/status-contas-pagar';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest(path, {
      method,
      body: JSON.stringify({
        id: input.id,
        codigoExterno: input.codigoExterno,
        titulo: input.titulo,
        descricao: input.descricao,
        cor: input.cor,
        isInicial: input.isInicial,
        isBaixa: input.isBaixa,
      }),
    });
  }

  toggleStatusContaPagarInicial(id: string, value: boolean): Promise<StatusContaPagarApiItem> {
    return apiRequest(`/parametrizacoes/status-contas-pagar/${id}/inicial`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
  }

  removeStatusContaPagar(id: string): Promise<void> {
    return apiRequest(`/parametrizacoes/status-contas-pagar/${id}`, { method: 'DELETE' });
  }

  listFormasPagamento(): Promise<ListResponse<FormaPagamentoApiItem>> {
    return apiRequest('/parametrizacoes/formas-pagamento');
  }

  saveFormaPagamento(
    input: Partial<FormaPagamentoApiItem> & { titulo: string },
  ): Promise<FormaPagamentoApiItem> {
    const path = input.id
      ? `/parametrizacoes/formas-pagamento/${input.id}`
      : '/parametrizacoes/formas-pagamento';
    const method = input.id ? 'PUT' : 'POST';

    return apiRequest(path, {
      method,
      body: JSON.stringify({
        id: input.id,
        codigoExterno: input.codigoExterno,
        titulo: input.titulo,
        descricao: input.descricao,
        cor: input.cor,
        isPadrao: input.isPadrao,
      }),
    });
  }

  toggleFormaPagamentoPadrao(id: string, value: boolean): Promise<FormaPagamentoApiItem> {
    return apiRequest(`/parametrizacoes/formas-pagamento/${id}/padrao`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });
  }

  removeFormaPagamento(id: string): Promise<void> {
    return apiRequest(`/parametrizacoes/formas-pagamento/${id}`, { method: 'DELETE' });
  }

  listTiposDocumentosFinanceiro(): Promise<ListResponse<TipoDocumentoFinanceiroApiItem>> {
    return apiRequest('/parametrizacoes/tipos-documentos-financeiro');
  }

  saveTipoDocumentoFinanceiro(
    input: Partial<TipoDocumentoFinanceiroApiItem> & { titulo: string },
  ): Promise<TipoDocumentoFinanceiroApiItem> {
    const path = input.id
      ? `/parametrizacoes/tipos-documentos-financeiro/${input.id}`
      : '/parametrizacoes/tipos-documentos-financeiro';
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

  removeTipoDocumentoFinanceiro(id: string): Promise<void> {
    return apiRequest(`/parametrizacoes/tipos-documentos-financeiro/${id}`, { method: 'DELETE' });
  }

  listTiposPagamento(): Promise<ListResponse<TipoPagamentoApiItem>> {
    return apiRequest('/parametrizacoes/tipos-pagamento');
  }

  saveTipoPagamento(
    input: Partial<TipoPagamentoApiItem> & { titulo: string },
  ): Promise<TipoPagamentoApiItem> {
    const path = input.id
      ? `/parametrizacoes/tipos-pagamento/${input.id}`
      : '/parametrizacoes/tipos-pagamento';
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

  removeTipoPagamento(id: string): Promise<void> {
    return apiRequest(`/parametrizacoes/tipos-pagamento/${id}`, { method: 'DELETE' });
  }

  listCategoriasDespesa(): Promise<ListResponse<CategoriaDespesaApiItem>> {
    return apiRequest('/parametrizacoes/categorias-despesa');
  }

  saveCategoriaDespesa(
    input: Partial<CategoriaDespesaApiItem> & { titulo: string },
  ): Promise<CategoriaDespesaApiItem> {
    const path = input.id
      ? `/parametrizacoes/categorias-despesa/${input.id}`
      : '/parametrizacoes/categorias-despesa';
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

  removeCategoriaDespesa(id: string): Promise<void> {
    return apiRequest(`/parametrizacoes/categorias-despesa/${id}`, { method: 'DELETE' });
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
