import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { FigurinosRepository } from './figurinos.repository.js';

const optionalUuid = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().uuid().nullable().optional(),
);

const imagemSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1),
  isPrincipal: z.boolean().default(false),
});

export const saveFigurinoSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional().nullable(),
  codigoExterno: z.string().optional().nullable(),
  codigoFigurino: z.string().min(1),
  descricao: z.string().min(1),
  tipoFigurinoId: optionalUuid,
  materialId: optionalUuid,
  tamanhoPeca: z.string().optional().nullable(),
  corPredominante: z.string().optional().nullable(),
  corSecundaria: z.string().optional().nullable(),
  imagens: z.array(imagemSchema).default([]),
});

export type SaveFigurinoDto = z.infer<typeof saveFigurinoSchema>;

export class FigurinosService {
  constructor(private readonly repository: FigurinosRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);

    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        codigoExterno: item.codigoExterno || '',
        codigoFigurino: item.codigoFigurino,
        descricao: item.descricao,
        tipoFigurino: item.tipoFigurino || '',
        tipoFigurinoId: item.tipoFigurinoId || '',
        material: item.material || '',
        materialId: item.materialId || '',
        tamanhoPeca: item.tamanhoPeca || '',
        corPredominante: item.corPredominante || '',
        corSecundaria: item.corSecundaria || '',
        imagens: item.imagens.map((imagem) => ({
          id: imagem.id,
          url: imagem.url,
          isPrincipal: imagem.isPrincipal,
        })),
        dataCadastro: item.createdAt?.toISOString() || '',
        usuarioCadastro: item.createdByNome || '',
      })),
    };
  }

  async listOptions(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const [tiposFigurino, materiais] = await Promise.all([
      this.repository.listTiposFigurino(tenantId),
      this.repository.listMateriais(tenantId),
    ]);

    return { tiposFigurino, materiais };
  }

  async save(actor: SessionUser, input: SaveFigurinoDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Figurino nao encontrado');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      codigoFigurino: input.codigoFigurino,
      descricao: input.descricao,
      tipoFigurinoId: input.tipoFigurinoId,
      materialId: input.materialId,
      tamanhoPeca: input.tamanhoPeca,
      corPredominante: input.corPredominante,
      corSecundaria: input.corSecundaria,
      createdBy: actor.id,
      imagens: input.imagens.map((imagem) => ({
        id: imagem.id || '',
        url: imagem.url,
        isPrincipal: imagem.isPrincipal,
      })),
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      codigoFigurino: item.codigoFigurino,
      descricao: item.descricao,
      tipoFigurino: item.tipoFigurino || '',
      tipoFigurinoId: item.tipoFigurinoId || '',
      material: item.material || '',
      materialId: item.materialId || '',
      tamanhoPeca: item.tamanhoPeca || '',
      corPredominante: item.corPredominante || '',
      corSecundaria: item.corSecundaria || '',
      imagens: item.imagens.map((imagem) => ({
        id: imagem.id,
        url: imagem.url,
        isPrincipal: imagem.isPrincipal,
      })),
      dataCadastro: item.createdAt?.toISOString() || '',
      usuarioCadastro: item.createdByNome || '',
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Figurino nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }
}
