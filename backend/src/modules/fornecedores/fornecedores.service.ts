import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { ensureSameTenant, resolveTenantId } from '../common/access.js';
import type { FornecedoresRepository } from './fornecedores.repository.js';

const optionalUuid = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().uuid().nullable().optional(),
);

export const saveFornecedorSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional().nullable(),
  codigoExterno: z.string().optional().nullable(),
  nome: z.string().min(1),
  categoriaId: optionalUuid,
  email: z.string().optional().nullable(),
  pais: z.string().optional().nullable(),
  identificacaoFiscal: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
});

export const addFornecedorServicoSchema = z.object({
  servicoId: z.string().uuid(),
  valor: z.coerce.number().min(0).nullable().optional(),
});

export const updateFornecedorServicoSchema = z.object({
  valor: z.coerce.number().min(0).nullable().optional(),
});

export const addFornecedorArquivoSchema = z.object({
  nome: z.string().min(1),
  url: z.string().min(1),
  tipo: z.string().optional().nullable(),
  tamanho: z.coerce.number().int().min(0).nullable().optional(),
});

export type SaveFornecedorDto = z.infer<typeof saveFornecedorSchema>;

export class FornecedoresService {
  constructor(private readonly repository: FornecedoresRepository) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const { data, total } = await this.repository.listByTenant(tenantId, opts);

    return {
      total,
      data: data.map((item) => ({
        id: item.id,
        codigoExterno: item.codigoExterno || '',
        nome: item.nome,
        categoria: item.categoria || '',
        categoriaId: item.categoriaId || '',
        email: item.email || '',
        pais: item.pais || '',
        identificacaoFiscal: item.identificacaoFiscal || '',
        descricao: item.descricao || '',
        dataCadastro: item.createdAt?.toISOString() || '',
        usuarioCadastro: item.createdByNome || '',
      })),
    };
  }

  async listOptions(actor: SessionUser) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const categorias = await this.repository.listCategorias(tenantId);
    return { categorias };
  }

  async save(actor: SessionUser, input: SaveFornecedorDto) {
    const tenantId = resolveTenantId(actor, input.tenantId ?? actor.tenantId);

    if (input.id) {
      const existing = await this.repository.findById(input.id);
      if (!existing) {
        throw new Error('Fornecedor nao encontrado');
      }
      ensureSameTenant(actor, existing.tenantId);
    }

    const item = await this.repository.save({
      id: input.id,
      tenantId,
      codigoExterno: input.codigoExterno,
      nome: input.nome,
      categoriaId: input.categoriaId,
      email: input.email,
      pais: input.pais,
      identificacaoFiscal: input.identificacaoFiscal,
      descricao: input.descricao,
      createdBy: actor.id,
    });

    return {
      id: item.id,
      codigoExterno: item.codigoExterno || '',
      nome: item.nome,
      categoria: item.categoria || '',
      categoriaId: item.categoriaId || '',
      email: item.email || '',
      pais: item.pais || '',
      identificacaoFiscal: item.identificacaoFiscal || '',
      descricao: item.descricao || '',
      dataCadastro: item.createdAt?.toISOString() || '',
      usuarioCadastro: item.createdByNome || '',
    };
  }

  async remove(actor: SessionUser, id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Fornecedor nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.remove(id);
  }

  async listServicos(actor: SessionUser, fornecedorId: string) {
    const existing = await this.repository.findById(fornecedorId);
    if (!existing) {
      throw new Error('Fornecedor nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);

    const [items, servicos] = await Promise.all([
      this.repository.listFornecedorServicos(existing.tenantId, fornecedorId),
      this.repository.listServicos(existing.tenantId),
    ]);

    return { items, servicos };
  }

  async addServico(actor: SessionUser, fornecedorId: string, input: z.infer<typeof addFornecedorServicoSchema>) {
    const existing = await this.repository.findById(fornecedorId);
    if (!existing) {
      throw new Error('Fornecedor nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.addFornecedorServico({
      fornecedorId,
      tenantId: existing.tenantId,
      servicoId: input.servicoId,
      valor: input.valor ?? null,
    });

    return this.listServicos(actor, fornecedorId);
  }

  async updateServico(actor: SessionUser, fornecedorId: string, itemId: string, input: z.infer<typeof updateFornecedorServicoSchema>) {
    const existing = await this.repository.findById(fornecedorId);
    if (!existing) {
      throw new Error('Fornecedor nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.updateFornecedorServicoValor(itemId, input.valor ?? null);
    return this.listServicos(actor, fornecedorId);
  }

  async removeServico(actor: SessionUser, fornecedorId: string, itemId: string) {
    const existing = await this.repository.findById(fornecedorId);
    if (!existing) {
      throw new Error('Fornecedor nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.removeFornecedorServico(itemId);
  }

  async listArquivos(actor: SessionUser, fornecedorId: string) {
    const existing = await this.repository.findById(fornecedorId);
    if (!existing) {
      throw new Error('Fornecedor nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    const arquivos = await this.repository.listArquivos(fornecedorId);

    return arquivos.map((arquivo) => ({
      id: arquivo.id,
      nome: arquivo.nome,
      url: arquivo.url,
      tipo: arquivo.tipo || '',
      tamanho: arquivo.tamanho ?? null,
      createdAt: arquivo.createdAt?.toISOString() || '',
    }));
  }

  async addArquivo(actor: SessionUser, fornecedorId: string, input: z.infer<typeof addFornecedorArquivoSchema>) {
    const existing = await this.repository.findById(fornecedorId);
    if (!existing) {
      throw new Error('Fornecedor nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    return this.repository.addArquivo({
      fornecedorId,
      tenantId: existing.tenantId,
      nome: input.nome,
      url: input.url,
      tipo: input.tipo,
      tamanho: input.tamanho ?? null,
      createdBy: actor.id,
    });
  }

  async removeArquivo(actor: SessionUser, fornecedorId: string, arquivoId: string) {
    const existing = await this.repository.findById(fornecedorId);
    if (!existing) {
      throw new Error('Fornecedor nao encontrado');
    }

    ensureSameTenant(actor, existing.tenantId);
    await this.repository.removeArquivo(arquivoId);
  }
}
