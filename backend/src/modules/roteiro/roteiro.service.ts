import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant } from '../common/access.js';
import type { RoteiroRepository } from './roteiro.repository.js';

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().nullable().optional(),
);

export const roteiroQuerySchema = z.object({
  conteudoId: z.string().optional().nullable(),
});

export const saveCenaSchema = z.object({
  id: z.string().optional(),
  ordem: z.number().int().min(1),
  capitulo: optionalString,
  numeroCena: optionalString,
  ambiente: optionalString,
  tipoAmbiente: optionalString,
  periodo: optionalString,
  localGravacao: optionalString,
  personagens: z.array(z.string()).default([]),
  figurantes: z.array(z.string()).default([]),
  tempoAproximado: optionalString,
  ritmo: optionalString,
  descricao: optionalString,
});

export class RoteiroService {
  constructor(private readonly repository: RoteiroRepository) {}

  async list(actor: SessionUser, gravacaoId: string, conteudoId?: string | null) {
    const gravacao = await this.repository.findGravacao(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);
    const data = await this.repository.list(gravacao.tenantId, gravacaoId, conteudoId);

    return {
      cenas: data.cenas.map((item) => ({
        id: item.id,
        ordem: item.ordem,
        capitulo: item.capitulo || '',
        numeroCena: item.numeroCena || '',
        ambiente: item.ambiente || '',
        tipoAmbiente: item.tipoAmbiente || '',
        periodo: item.periodo || '',
        localGravacao: item.localGravacao || '',
        personagens: item.personagens,
        figurantes: item.figurantes,
        tempoAproximado: item.tempoAproximado || '',
        ritmo: item.ritmo || '',
        descricao: item.descricao || '',
      })),
      elenco: data.elenco.map((item) => ({
        id: item.id,
        pessoaId: item.pessoaId,
        nome: item.nome,
        nomeTrabalho: item.nomeTrabalho || '',
        personagem: item.personagem || '',
      })),
      figurantes: data.figurantes.map((item) => ({
        id: item.id,
        nome: item.nome,
        sobrenome: item.sobrenome,
        nomeTrabalho: item.nomeTrabalho || '',
        status: item.status || 'Ativo',
      })),
    };
  }

  async saveCena(actor: SessionUser, gravacaoId: string, input: z.infer<typeof saveCenaSchema>) {
    const gravacao = await this.repository.findGravacao(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);

    const saved = await this.repository.saveCena({
      id: input.id,
      tenantId: gravacao.tenantId,
      gravacaoId,
      ordem: input.ordem,
      capitulo: input.capitulo ?? null,
      numeroCena: input.numeroCena ?? null,
      ambiente: input.ambiente ?? null,
      tipoAmbiente: input.tipoAmbiente ?? null,
      periodo: input.periodo ?? null,
      localGravacao: input.localGravacao ?? null,
      personagens: input.personagens,
      figurantes: input.figurantes,
      tempoAproximado: input.tempoAproximado ?? null,
      ritmo: input.ritmo ?? null,
      descricao: input.descricao ?? null,
    });

    return {
      id: saved.id,
      ordem: saved.ordem,
      capitulo: saved.capitulo || '',
      numeroCena: saved.numeroCena || '',
      ambiente: saved.ambiente || '',
      tipoAmbiente: saved.tipoAmbiente || '',
      periodo: saved.periodo || '',
      localGravacao: saved.localGravacao || '',
      personagens: saved.personagens,
      figurantes: saved.figurantes,
      tempoAproximado: saved.tempoAproximado || '',
      ritmo: saved.ritmo || '',
      descricao: saved.descricao || '',
    };
  }

  async removeCena(actor: SessionUser, gravacaoId: string, sceneId: string) {
    const gravacao = await this.repository.findGravacao(gravacaoId);
    if (!gravacao) {
      throw new Error('Gravacao nao encontrada');
    }

    ensureSameTenant(actor, gravacao.tenantId);
    await this.repository.removeCena(gravacao.tenantId, gravacaoId, sceneId);
  }
}
