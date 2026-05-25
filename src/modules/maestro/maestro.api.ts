import { apiRequest } from '@/lib/api/http';

export type EsquemaTipo = '1-vez' | 'diario' | 'semanal';

export type Maestro = {
  id: string;
  tenantId: string;
  codigoExterno: string | null;
  nome: string;
  cor: string | null;
  status: 'Ativo' | 'Inativo';
  tipo: string;
  modulo: string | null;
  descricao: string | null;
  endpoint: string | null;
  authTipo: string | null;
  authUsuario: string | null;
  authSenha: string | null;
  jsonChamada: string | null;
  jsonLinguagem: string | null;
  esquemaTipo: EsquemaTipo | null;
  esquemaDataInicio: string | null;
  esquemaHoraInicio: string | null;
  esquemaDias: number | null;
  esquemaDiasSemana: number[];
  ultimaExecucao: string | null;
  createdAt: string | null;
  createdBy: string | null;
  createdByNome: string | null;
};

export type SaveMaestroInput = {
  id?: string;
  codigoExterno?: string | null;
  nome: string;
  cor?: string | null;
  status: 'Ativo' | 'Inativo';
  tipo: string;
  modulo?: string | null;
  descricao?: string | null;
  endpoint?: string | null;
  authTipo?: string | null;
  authUsuario?: string | null;
  authSenha?: string | null;
  jsonChamada?: string | null;
  jsonLinguagem?: string | null;
  esquemaTipo?: EsquemaTipo | null;
  esquemaDataInicio?: string | null;
  esquemaHoraInicio?: string | null;
  esquemaDias?: number | null;
  esquemaDiasSemana?: number[];
};

export class ApiMaestroRepository {
  async list(): Promise<{ data: Maestro[]; total: number }> {
    return apiRequest<{ data: Maestro[]; total: number }>('/maestro');
  }

  async save(input: SaveMaestroInput): Promise<Maestro> {
    const path = input.id ? `/maestro/${input.id}` : '/maestro';
    const method = input.id ? 'PUT' : 'POST';
    return apiRequest<Maestro>(path, { method, body: JSON.stringify(input) });
  }

  async remove(id: string): Promise<void> {
    await apiRequest(`/maestro/${id}`, { method: 'DELETE' });
  }

  async execute(id: string): Promise<{
    maestro: Maestro;
    resultado: { status: number; body: string } | null;
    erro: string | null;
    sincronizados: number | null;
  }> {
    return apiRequest(`/maestro/${id}/executar`, { method: 'POST' });
  }
}
