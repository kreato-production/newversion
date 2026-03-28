import { ensureSameTenant } from '../common/access.js';
import type { SessionUser } from '../auth/auth.types.js';
import type { AnalyticsRepository } from './analytics.repository.js';

export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository) {}

  async getDashboardOverview(actor: SessionUser) {
    const tenantId = actor.role === 'GLOBAL_ADMIN' ? actor.tenantId ?? null : actor.tenantId;
    return this.repository.getDashboardOverview(tenantId, actor.unidadeIds ?? []);
  }

  async getGravacaoReport(actor: SessionUser, gravacaoId: string) {
    const report = await this.repository.getGravacaoReport(gravacaoId);

    if (!report) {
      throw new Error('Gravação não encontrada');
    }

    ensureSameTenant(actor, report.basicInfo.tenantId);
    return report;
  }
}
