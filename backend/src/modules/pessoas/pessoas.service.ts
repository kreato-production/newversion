import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { PessoaRecord, PessoasRepository } from './pessoas.repository.js';

const optionalUuid = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().uuid().nullable().optional(),
);

export const MAX_PESSOA_TAGS = 30;
export const MAX_PESSOA_TAG_LENGTH = 40;

/** Trims, drops empties and removes case-insensitive duplicates, keeping the first spelling. */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().replace(/\s+/g, ' ');
    const key = tag.toLocaleLowerCase('pt-BR');
    if (tag && !seen.has(key)) {
      seen.add(key);
      result.push(tag);
    }
  }
  return result;
}

const tagsSchema = z
  .array(z.string().max(MAX_PESSOA_TAG_LENGTH))
  .nullable()
  .optional()
  .transform((value) => normalizeTags(value ?? []))
  .refine((value) => value.length <= MAX_PESSOA_TAGS, {
    message: `Informe no maximo ${MAX_PESSOA_TAGS} tags`,
  });

export const savePessoaSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional().nullable(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  sobrenome: z.string().min(1).default(''),
  nomeTrabalho: z.string().optional().nullable(),
  foto: z.string().optional().nullable(),
  dataNascimento: z.string().optional().nullable(),
  sexo: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  classificacaoId: optionalUuid,
  documento: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  paisNascimento: z.string().optional().nullable(),
  idiomaNativo: z.string().optional().nullable(),
  tags: tagsSchema,
  status: z.enum(['Ativo', 'Inativo']).default('Ativo'),
});

export type SavePessoaDto = z.infer<typeof savePessoaSchema>;

function toPessoaDto(item: PessoaRecord) {
  return {
    id: item.id,
    codigoExterno: item.codigoExterno || '',
    nome: item.nome,
    sobrenome: item.sobrenome,
    nomeTrabalho: item.nomeTrabalho || '',
    foto: item.foto || '',
    dataNascimento: item.dataNascimento || '',
    sexo: item.sexo || '',
    telefone: item.telefone || '',
    email: item.email || '',
    classificacao: item.classificacao || '',
    classificacaoId: item.classificacaoId || '',
    documento: item.documento || '',
    endereco: item.endereco || '',
    cidade: item.cidade || '',
    estado: item.estado || '',
    cep: item.cep || '',
    observacoes: item.observacoes || '',
    paisNascimento: item.paisNascimento || '',
    idiomaNativo: item.idiomaNativo || '',
    tags: item.tags ?? [],
    status: item.status === 'Inativo' ? 'Inativo' : 'Ativo',
    dataCadastro: item.createdAt?.toISOString() || '',
    usuarioCadastro: item.createdByNome || '',
  };
}

export class PessoasService {
  constructor(private readonly repository: PessoasRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);

    return {
      total,
      data: data.map(toPessoaDto),
    };
  }

  async listOptions(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const [classificacoes, tags] = await Promise.all([
      this.repository.listClassificacoes(tenantId),
      this.repository.listTags(tenantId),
    ]);
    return { classificacoes, tags };
  }

  async getById(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      return null;
    }

    ensureSameTenant(actor, existing.tenantId);
    return toPessoaDto(existing);
  }

  async save(actor: SessionUser, input: SavePessoaDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Pessoa nao encontrada');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      sobrenome: input.sobrenome,
      nomeTrabalho: input.nomeTrabalho,
      foto: input.foto,
      dataNascimento: input.dataNascimento,
      sexo: input.sexo,
      telefone: input.telefone,
      email: input.email,
      classificacaoId: input.classificacaoId,
      documento: input.documento,
      endereco: input.endereco,
      cidade: input.cidade,
      estado: input.estado,
      cep: input.cep,
      observacoes: input.observacoes,
      paisNascimento: input.paisNascimento || null,
      idiomaNativo: input.idiomaNativo || null,
      tags: input.tags,
      status: input.status,
      createdBy: actor.id,
    });

    return toPessoaDto(item);
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Pessoa nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }

  async listGravacoes(actor: SessionUser, pessoaId: string) {
    const existing = await this.repository.findById(pessoaId);
    if (!existing) {
      throw new Error('Pessoa nao encontrada');
    }

    ensureSameTenant(actor, existing.tenantId);

    const gravacoes = await this.repository.listGravacoes(existing.tenantId, pessoaId);
    return gravacoes.map((item) => ({
      id: item.id,
      codigo: item.codigo,
      nome: item.nome,
      dataPrevista: item.dataPrevista || '',
    }));
  }
}
