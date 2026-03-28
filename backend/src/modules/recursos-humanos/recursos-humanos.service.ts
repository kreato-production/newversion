import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { RecursosHumanosRepository } from './recursos-humanos.repository.js';

const optionalUuid = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().uuid().nullable().optional(),
);

const anexoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1),
  tipo: z.string().optional().nullable(),
  tamanho: z.coerce.number().int().min(0).default(0),
  dataUrl: z.string().min(1),
});

const ausenciaSchema = z.object({
  id: z.string().optional(),
  motivo: z.string().min(1),
  dataInicio: z.string().min(1),
  dataFim: z.string().min(1),
  dias: z.coerce.number().int().min(0).default(0),
});

const escalaSchema = z.object({
  id: z.string().optional(),
  dataInicio: z.string().min(1),
  horaInicio: z.string().min(1),
  dataFim: z.string().min(1),
  horaFim: z.string().min(1),
  diasSemana: z.array(z.coerce.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
});

export const saveRecursoHumanoSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional().nullable(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  sobrenome: z.string().min(1).default(''),
  foto: z.string().optional().nullable(),
  dataNascimento: z.string().optional().nullable(),
  sexo: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  departamentoId: optionalUuid,
  funcaoId: optionalUuid,
  custoHora: z.coerce.number().min(0).default(0),
  dataContratacao: z.string().optional().nullable(),
  status: z.enum(['Ativo', 'Inativo']).default('Ativo'),
  anexos: z.array(anexoSchema).default([]),
  ausencias: z.array(ausenciaSchema).default([]),
  escalas: z.array(escalaSchema).default([]),
});

export type SaveRecursoHumanoDto = z.infer<typeof saveRecursoHumanoSchema>;

export class RecursosHumanosService {
  constructor(private readonly repository: RecursosHumanosRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);

    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        codigoExterno: item.codigoExterno || '',
        nome: item.nome,
        sobrenome: item.sobrenome,
        foto: item.foto || '',
        dataNascimento: item.dataNascimento || '',
        sexo: item.sexo || '',
        telefone: item.telefone || '',
        email: item.email || '',
        departamento: item.departamento || '',
        departamentoId: item.departamentoId || '',
        funcao: item.funcao || '',
        funcaoId: item.funcaoId || '',
        custoHora: item.custoHora,
        dataContratacao: item.dataContratacao || '',
        status: item.status === 'Inativo' ? 'Inativo' : 'Ativo',
        dataCadastro: item.createdAt?.toISOString() || '',
        usuarioCadastro: item.createdByNome || '',
        anexos: item.anexos.map((anexo) => ({
          id: anexo.id,
          nome: anexo.nome,
          tipo: anexo.tipo || '',
          tamanho: anexo.tamanho,
          dataUrl: anexo.dataUrl,
        })),
        ausencias: item.ausencias.map((ausencia) => ({
          id: ausencia.id,
          motivo: ausencia.motivo,
          dataInicio: ausencia.dataInicio,
          dataFim: ausencia.dataFim,
          dias: ausencia.dias,
        })),
        escalas: item.escalas.map((escala) => ({
          id: escala.id,
          dataInicio: escala.dataInicio,
          horaInicio: escala.horaInicio,
          dataFim: escala.dataFim,
          horaFim: escala.horaFim,
          diasSemana: escala.diasSemana,
        })),
      })),
    };
  }

  async listOptions(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const [departamentos, funcoes, departamentoFuncoes] = await Promise.all([
      this.repository.listDepartamentos(tenantId),
      this.repository.listFuncoes(tenantId),
      this.repository.listDepartamentoFuncoes(tenantId),
    ]);

    return {
      departamentos,
      funcoes,
      departamentoFuncoes,
    };
  }

  async save(actor: SessionUser, input: SaveRecursoHumanoDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Recurso humano nao encontrado');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      sobrenome: input.sobrenome,
      foto: input.foto,
      dataNascimento: input.dataNascimento,
      sexo: input.sexo,
      telefone: input.telefone,
      email: input.email,
      departamentoId: input.departamentoId,
      funcaoId: input.funcaoId,
      custoHora: input.custoHora,
      dataContratacao: input.dataContratacao,
      status: input.status,
      createdBy: actor.id,
      anexos: input.anexos.map((anexo) => ({
        id: anexo.id || '',
        nome: anexo.nome,
        tipo: anexo.tipo || null,
        tamanho: anexo.tamanho,
        dataUrl: anexo.dataUrl,
      })),
      ausencias: input.ausencias.map((ausencia) => ({
        id: ausencia.id || '',
        motivo: ausencia.motivo,
        dataInicio: ausencia.dataInicio,
        dataFim: ausencia.dataFim,
        dias: ausencia.dias,
      })),
      escalas: input.escalas.map((escala) => ({
        id: escala.id || '',
        dataInicio: escala.dataInicio,
        horaInicio: escala.horaInicio,
        dataFim: escala.dataFim,
        horaFim: escala.horaFim,
        diasSemana: escala.diasSemana,
      })),
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      nome: item.nome,
      sobrenome: item.sobrenome,
      foto: item.foto || '',
      dataNascimento: item.dataNascimento || '',
      sexo: item.sexo || '',
      telefone: item.telefone || '',
      email: item.email || '',
      departamento: item.departamento || '',
      departamentoId: item.departamentoId || '',
      funcao: item.funcao || '',
      funcaoId: item.funcaoId || '',
      custoHora: item.custoHora,
      dataContratacao: item.dataContratacao || '',
      status: item.status === 'Inativo' ? 'Inativo' : 'Ativo',
      dataCadastro: item.createdAt?.toISOString() || '',
      usuarioCadastro: item.createdByNome || '',
      anexos: item.anexos.map((anexo) => ({
        id: anexo.id,
        nome: anexo.nome,
        tipo: anexo.tipo || '',
        tamanho: anexo.tamanho,
        dataUrl: anexo.dataUrl,
      })),
      ausencias: item.ausencias.map((ausencia) => ({
        id: ausencia.id,
        motivo: ausencia.motivo,
        dataInicio: ausencia.dataInicio,
        dataFim: ausencia.dataFim,
        dias: ausencia.dias,
      })),
      escalas: item.escalas.map((escala) => ({
        id: escala.id,
        dataInicio: escala.dataInicio,
        horaInicio: escala.horaInicio,
        dataFim: escala.dataFim,
        horaFim: escala.horaFim,
        diasSemana: escala.diasSemana,
      })),
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Recurso humano nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }

  async listOcupacoes(actor: SessionUser, dataInicio: string, dataFim: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.listOcupacoes(tenantId, dataInicio, dataFim);
  }
}
