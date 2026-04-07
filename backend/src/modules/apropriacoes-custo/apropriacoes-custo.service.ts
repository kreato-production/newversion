import type { SessionUser } from '../auth/auth.types.js';
import { resolveTenantId } from '../common/access.js';
import type { ApropriacoesCustoRepository } from './apropriacoes-custo.repository.js';

export class ApropriacoesCustoService {
  constructor(private readonly repository: ApropriacoesCustoRepository) {}

  async getApropriacoes(
    actor: SessionUser,
    opts: { ano: number; centroLucroId?: string | null; unidadeId?: string | null },
  ) {
    const tenantId = resolveTenantId(actor, actor.tenantId);

    const [rows, centrosLucro, unidades] = await Promise.all([
      this.repository.aggregateCosts(tenantId, opts),
      this.repository.listCentrosLucro(tenantId),
      this.repository.listUnidades(tenantId),
    ]);

    return { rows, centrosLucro, unidades };
  }
}
