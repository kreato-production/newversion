import { z } from 'zod';
import type { SessionUser } from '../auth/auth.types.js';
import { resolveTenantId } from '../common/access.js';
import type { MaestroRepository, SaveMaestroInput } from './maestro.repository.js';
import type { GrelhaProgramacaoService } from '../grelha-programacao/grelha-programacao.service.js';

export const saveMaestroSchema = z.object({
  id: z.string().optional(),
  codigoExterno: z.string().nullable().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  cor: z.string().nullable().optional(),
  status: z.enum(['Ativo', 'Inativo']).default('Ativo'),
  tipo: z.string().min(1).default('Provys - API Rest'),
  modulo: z.string().nullable().optional(),
  descricao: z.string().nullable().optional(),
  endpoint: z.string().nullable().optional(),
  authTipo: z.string().nullable().optional(),
  authUsuario: z.string().nullable().optional(),
  authSenha: z.string().nullable().optional(),
  jsonChamada: z.string().nullable().optional(),
  jsonLinguagem: z.string().nullable().optional(),
  esquemaTipo: z.enum(['1-vez', 'diario', 'semanal']).nullable().optional(),
  esquemaDataInicio: z.string().nullable().optional(),
  esquemaHoraInicio: z.string().nullable().optional(),
  esquemaDias: z.number().int().min(1).nullable().optional(),
  esquemaDiasSemana: z.array(z.number().int().min(0).max(6)).default([]),
});

export type SaveMaestroDto = z.infer<typeof saveMaestroSchema>;

export class MaestroService {
  constructor(
    private readonly repository: MaestroRepository,
    private readonly grelhaService?: GrelhaProgramacaoService,
  ) {}

  async list(actor: SessionUser, opts?: { limit?: number; offset?: number }) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.listByTenant(tenantId, opts);
  }

  async getById(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    return this.repository.findById(id, tenantId);
  }

  async save(actor: SessionUser, dto: SaveMaestroDto) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const input: SaveMaestroInput = {
      ...dto,
      id: dto.id,
      tenantId,
      createdBy: actor.id,
    };
    return this.repository.save(input);
  }

  async remove(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    await this.repository.remove(id, tenantId);
  }

  async execute(actor: SessionUser, id: string) {
    const tenantId = resolveTenantId(actor, actor.tenantId);
    const maestro = await this.repository.findById(id, tenantId);
    if (!maestro) throw new Error('Maestro não encontrado');
    if (maestro.status === 'Inativo') throw new Error('Tarefa inativa não pode ser executada.');

    let resultado: { status: number; body: string } | null = null;
    let erro: string | null = null;

    if (maestro.endpoint) {
      try {
        resultado = await this.callEndpoint(maestro);
      } catch (err) {
        erro = err instanceof Error ? err.message : String(err);
      }
    } else {
      erro = 'Endpoint não configurado para esta tarefa.';
    }

    const updated = await this.repository.updateUltimaExecucao(id, tenantId);

    let sincronizados: number | null = null;
    if (this.shouldSyncGrelha(maestro.modulo) && resultado?.body && this.grelhaService) {
      console.log(`[Maestro] Módulo="${maestro.modulo}" → disparando sync da grelha`);
      try {
        sincronizados = await this.grelhaService.syncFromApiResponse(tenantId, id, resultado.body);
      } catch (err) {
        console.error(`[Maestro] Erro ao sincronizar grelha (id=${id}):`, err);
      }
    } else {
      console.log(`[Maestro] Sync da grelha NÃO disparado — modulo="${maestro.modulo}" body=${resultado?.body ? 'presente' : 'ausente'} grelhaService=${!!this.grelhaService}`);
    }

    return { maestro: updated, resultado, erro, sincronizados };
  }

  /** Usado pelo scheduler — não requer SessionUser */
  async listForScheduler() {
    return this.repository.listScheduled();
  }

  /** Executa via agendamento: registra ultima_execucao mesmo que o endpoint falhe */
  async executeScheduled(id: string, tenantId: string): Promise<void> {
    const maestro = await this.repository.findById(id, tenantId);
    if (!maestro || maestro.status !== 'Ativo') return;

    let resultado: { status: number; body: string } | null = null;
    if (maestro.endpoint) {
      try {
        resultado = await this.callEndpoint(maestro);
      } catch (err) {
        console.error(`[Maestro] Erro ao chamar endpoint (id=${id}):`, err);
      }
    }

    await this.repository.updateUltimaExecucao(id, tenantId);

    if (this.shouldSyncGrelha(maestro.modulo) && resultado?.body && this.grelhaService) {
      try {
        await this.grelhaService.syncFromApiResponse(tenantId, id, resultado.body);
      } catch (err) {
        console.error(`[Maestro] Erro ao sincronizar grelha agendada (id=${id}):`, err);
      }
    }
  }

  private shouldSyncGrelha(modulo: string | null | undefined): boolean {
    return modulo === 'Produção' || modulo === 'Grelha de Programação';
  }

  private async callEndpoint(maestro: import('./maestro.repository.js').MaestroRecord) {
    const headers: Record<string, string> = {};
    if (maestro.authTipo === 'Basic Auth' && maestro.authUsuario) {
      const creds = Buffer.from(`${maestro.authUsuario}:${maestro.authSenha ?? ''}`).toString('base64');
      headers['Authorization'] = `Basic ${creds}`;
    }
    const rawBody = maestro.jsonChamada?.trim();
    const isPost = Boolean(rawBody);
    let body: string | undefined;
    if (isPost && rawBody) {
      // Strip single-line comments (// ...) so JSONC authored in the UI doesn't break the request
      body = rawBody.replace(/^\s*\/\/.*$/gm, '').replace(/,\s*(\]|\})/g, '$1');
      headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(maestro.endpoint!, {
      method: isPost ? 'POST' : 'GET',
      headers,
      body,
      signal: AbortSignal.timeout(30_000),
    });
    return { status: response.status, body: await response.text() };
  }
}
