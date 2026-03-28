import { apiRequest } from '@/lib/api/http';
import type {
  RecursoHumano,
  RecursoHumanoInput,
  RecursoHumanoOcupacao,
  RecursoHumanoOptions,
} from './recursos-humanos.types';

function normalizeInput(input: RecursoHumanoInput): RecursoHumanoInput {
  return {
    ...input,
    tenantId: input.tenantId ?? null,
    codigoExterno: input.codigoExterno?.trim() || '',
    nome: input.nome?.trim() || '',
    sobrenome: input.sobrenome?.trim() || '',
    foto: input.foto || '',
    dataNascimento: input.dataNascimento || '',
    sexo: input.sexo || '',
    telefone: input.telefone?.trim() || '',
    email: input.email?.trim() || '',
    departamento: input.departamento || '',
    departamentoId: input.departamentoId || '',
    funcao: input.funcao || '',
    funcaoId: input.funcaoId || '',
    custoHora: Number(input.custoHora || 0),
    dataContratacao: input.dataContratacao || '',
    anexos: (input.anexos || []).map((anexo) => ({
      ...anexo,
      nome: anexo.nome?.trim() || '',
      tipo: anexo.tipo || '',
      tamanho: Number(anexo.tamanho || 0),
      dataUrl: anexo.dataUrl || '',
    })),
    ausencias: (input.ausencias || []).map((ausencia) => ({
      ...ausencia,
      motivo: ausencia.motivo || '',
      dataInicio: ausencia.dataInicio || '',
      dataFim: ausencia.dataFim || '',
      dias: Number(ausencia.dias || 0),
    })),
    escalas: (input.escalas || []).map((escala) => ({
      ...escala,
      dataInicio: escala.dataInicio || '',
      horaInicio: escala.horaInicio || '',
      dataFim: escala.dataFim || '',
      horaFim: escala.horaFim || '',
      diasSemana: escala.diasSemana || [1, 2, 3, 4, 5],
    })),
  };
}

export class ApiRecursosHumanosRepository {
  async list(): Promise<RecursoHumano[]> {
    const response = await apiRequest<{ data: RecursoHumano[] }>('/recursos-humanos');
    return response.data;
  }

  async listOptions(): Promise<RecursoHumanoOptions> {
    return apiRequest<RecursoHumanoOptions>('/recursos-humanos/options');
  }

  async save(input: RecursoHumanoInput): Promise<void> {
    const path = input.id ? `/recursos-humanos/${input.id}` : '/recursos-humanos';
    const method = input.id ? 'PUT' : 'POST';

    await apiRequest(path, {
      method,
      body: JSON.stringify(normalizeInput(input)),
    });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/recursos-humanos/${id}`, { method: 'DELETE' });
  }

  async listOcupacoes(dataInicio: string, dataFim: string): Promise<RecursoHumanoOcupacao[]> {
    return apiRequest<RecursoHumanoOcupacao[]>(
      `/recursos-humanos/ocupacao?dataInicio=${dataInicio}&dataFim=${dataFim}`,
    );
  }
}
