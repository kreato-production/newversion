import { apiRequest } from '@/lib/api/http';
import type { Etapa, AlocacaoRecurso } from '@/components/producao/EtapasTab';

export type TemplateAlocacaoRecurso = {
  recursoId: string;
  quantidade: number;
  de: string;
  ate: string;
};

export type TemplateAtividade = {
  id: string;
  etapaId: string;
  nome: string;
  horaInicio: string;
  horaFim: string;
  duracaoMinutos: number;
  recursosTecnicos: TemplateAlocacaoRecurso[];
  equipamentos: TemplateAlocacaoRecurso[];
  espacos: TemplateAlocacaoRecurso[];
  ordem: number;
};

export type TemplateEtapa = {
  id: string;
  templateId: string;
  nome: string;
  cor: string;
  ordem: number;
  atividades: TemplateAtividade[];
};

export type Template = {
  id: string;
  tenantId: string;
  nome: string;
  descricao: string | null;
  estado: string;
  createdAt: string;
  updatedAt: string;
  etapas: TemplateEtapa[];
};

export type SaveTemplateInput = {
  id?: string;
  nome: string;
  descricao?: string | null;
  estado?: string;
  etapas: {
    nome: string;
    cor: string;
    ordem: number;
    atividades: {
      nome: string;
      horaInicio: string;
      horaFim: string;
      duracaoMinutos: number;
      recursosTecnicos: TemplateAlocacaoRecurso[];
      equipamentos: TemplateAlocacaoRecurso[];
      espacos: TemplateAlocacaoRecurso[];
      ordem: number;
    }[];
  }[];
};

function toAlocacao(a: AlocacaoRecurso): TemplateAlocacaoRecurso {
  return { recursoId: a.recursoId, quantidade: a.quantidade, de: a.de, ate: a.ate };
}

function fromAlocacao(a: TemplateAlocacaoRecurso): AlocacaoRecurso {
  return { recursoId: a.recursoId, quantidade: a.quantidade, de: a.de, ate: a.ate };
}

export function etapasToInput(etapas: Etapa[]): SaveTemplateInput['etapas'] {
  return etapas.map((e, ei) => ({
    nome: e.nome,
    cor: e.cor,
    ordem: ei,
    atividades: e.atividades.map((a, ai) => ({
      nome: a.nome,
      horaInicio: a.horaInicio,
      horaFim: a.horaFim,
      duracaoMinutos: a.duracaoMinutos,
      recursosTecnicos: a.recursosTecnicos.map(toAlocacao),
      equipamentos: a.equipamentos.map(toAlocacao),
      espacos: a.espacos.map(toAlocacao),
      ordem: ai,
    })),
  }));
}

export function etapasFromTemplate(template: Template): Etapa[] {
  return template.etapas.map((e) => ({
    id: e.id,
    nome: e.nome,
    cor: e.cor,
    atividades: e.atividades.map((a) => ({
      id: a.id,
      nome: a.nome,
      horaInicio: a.horaInicio,
      horaFim: a.horaFim,
      duracaoMinutos: a.duracaoMinutos,
      recursosTecnicos: (a.recursosTecnicos ?? []).map(fromAlocacao),
      equipamentos: (a.equipamentos ?? []).map(fromAlocacao),
      espacos: (a.espacos ?? []).map(fromAlocacao),
    })),
  }));
}

export class ApiTemplatesRepository {
  async list(): Promise<Template[]> {
    const response = await apiRequest<{ data: Template[] }>('/templates');
    return response.data;
  }

  async save(input: SaveTemplateInput): Promise<Template> {
    const path = input.id ? `/templates/${input.id}` : '/templates';
    const method = input.id ? 'PUT' : 'POST';
    return apiRequest<Template>(path, {
      method,
      body: JSON.stringify(input),
    });
  }

  remove(id: string): Promise<void> {
    return apiRequest(`/templates/${id}`, { method: 'DELETE' });
  }
}

export const templatesRepository = new ApiTemplatesRepository();
