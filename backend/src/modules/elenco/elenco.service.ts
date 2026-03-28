import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant } from '../common/access.js';
import type { ElencoEntityType, ElencoRepository } from './elenco.repository.js';

const nonEmptyString = z.string().trim().min(1);

export const listElencoParamsSchema = z.object({
  entityType: z.enum(['gravacao', 'conteudo']),
  entityId: z.string().min(1),
});

export const saveElencoSchema = z.object({
  pessoaId: z.string().min(1),
  personagem: nonEmptyString,
  descricaoPersonagem: z.string().optional().nullable(),
  figurinoIds: z.array(z.string().min(1)).default([]),
});

export const updateElencoSchema = z.object({
  personagem: nonEmptyString,
  descricaoPersonagem: z.string().optional().nullable(),
  figurinoIds: z.array(z.string().min(1)).default([]),
});

export class ElencoService {
  constructor(private readonly repository: ElencoRepository) {}

  async list(actor: SessionUser, entityType: ElencoEntityType, entityId: string) {
    const entity = await this.resolveEntity(entityType, entityId);
    ensureSameTenant(actor, entity.tenantId);

    const data = await this.repository.list(entityType, entityId, entity.tenantId);

    return {
      pessoas: data.pessoas.map((item) => ({
        id: item.id,
        nome: item.nome,
        sobrenome: item.sobrenome,
        nomeTrabalho: item.nomeTrabalho || '',
        foto: item.foto || '',
        classificacao: item.classificacao || '',
        telefone: item.telefone || '',
        email: item.email || '',
        status: item.status || 'Ativo',
      })),
      figurinos: data.figurinos.map((item) => ({
        id: item.id,
        codigoFigurino: item.codigoFigurino,
        descricao: item.descricao,
        imagens: item.imagens.map((imagem) => ({
          id: imagem.id,
          url: imagem.url,
          isPrincipal: imagem.isPrincipal,
        })),
      })),
      items: data.items.map((item) => ({
        id: item.id,
        pessoaId: item.pessoaId,
        nome: `${item.nome} ${item.sobrenome}`.trim(),
        nomeTrabalho: item.nomeTrabalho || '',
        foto: item.foto || '',
        classificacao: item.classificacao || '',
        personagem: item.personagem || '',
        descricaoPersonagem: item.descricaoPersonagem || '',
        figurinos: item.figurinos.map((figurino) => ({
          figurinoId: figurino.figurinoId,
          codigoFigurino: figurino.codigoFigurino,
          descricao: figurino.descricao,
          imagemPrincipal: figurino.imagemPrincipal || '',
        })),
      })),
    };
  }

  async add(actor: SessionUser, entityType: ElencoEntityType, entityId: string, input: z.infer<typeof saveElencoSchema>) {
    const entity = await this.resolveEntity(entityType, entityId);
    ensureSameTenant(actor, entity.tenantId);

    const item = await this.repository.add({
      tenantId: entity.tenantId,
      entityType,
      entityId,
      pessoaId: input.pessoaId,
      personagem: input.personagem,
      descricaoPersonagem: input.descricaoPersonagem,
      figurinoIds: input.figurinoIds,
    });

    return {
      id: item.id,
      pessoaId: item.pessoaId,
      nome: `${item.nome} ${item.sobrenome}`.trim(),
      nomeTrabalho: item.nomeTrabalho || '',
      foto: item.foto || '',
      classificacao: item.classificacao || '',
      personagem: item.personagem || '',
      descricaoPersonagem: item.descricaoPersonagem || '',
      figurinos: item.figurinos.map((figurino) => ({
        figurinoId: figurino.figurinoId,
        codigoFigurino: figurino.codigoFigurino,
        descricao: figurino.descricao,
        imagemPrincipal: figurino.imagemPrincipal || '',
      })),
    };
  }

  async update(actor: SessionUser, entityType: ElencoEntityType, entityId: string, itemId: string, input: z.infer<typeof updateElencoSchema>) {
    const item = await this.repository.findById(itemId);
    if (!item || item.entityType !== entityType || item.entityId !== entityId) {
      throw new Error('Membro do elenco nao encontrado');
    }

    ensureSameTenant(actor, item.tenantId);

    const updated = await this.repository.update({
      id: itemId,
      personagem: input.personagem,
      descricaoPersonagem: input.descricaoPersonagem,
      figurinoIds: input.figurinoIds,
    });

    if (!updated) {
      throw new Error('Membro do elenco nao encontrado');
    }

    return {
      id: updated.id,
      pessoaId: updated.pessoaId,
      nome: `${updated.nome} ${updated.sobrenome}`.trim(),
      nomeTrabalho: updated.nomeTrabalho || '',
      foto: updated.foto || '',
      classificacao: updated.classificacao || '',
      personagem: updated.personagem || '',
      descricaoPersonagem: updated.descricaoPersonagem || '',
      figurinos: updated.figurinos.map((figurino) => ({
        figurinoId: figurino.figurinoId,
        codigoFigurino: figurino.codigoFigurino,
        descricao: figurino.descricao,
        imagemPrincipal: figurino.imagemPrincipal || '',
      })),
    };
  }

  async remove(actor: SessionUser, entityType: ElencoEntityType, entityId: string, itemId: string) {
    const item = await this.repository.findById(itemId);
    if (!item || item.entityType !== entityType || item.entityId !== entityId) {
      throw new Error('Membro do elenco nao encontrado');
    }

    ensureSameTenant(actor, item.tenantId);
    await this.repository.remove(itemId);
  }

  private async resolveEntity(entityType: ElencoEntityType, entityId: string) {
    if (entityType === 'gravacao') {
      const gravacao = await this.repository.findGravacao(entityId);
      if (!gravacao) {
        throw new Error('Gravacao nao encontrada');
      }
      return gravacao;
    }

    const conteudo = await this.repository.findConteudo(entityId);
    if (!conteudo || !conteudo.tenantId) {
      throw new Error('Conteudo nao encontrado');
    }

    return { id: conteudo.id, tenantId: conteudo.tenantId };
  }
}
