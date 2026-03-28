import { apiRequest } from '@/lib/api/http';
import type { DashboardOverviewResponse, GravacaoReportData } from './analytics.types';

export class ApiAnalyticsRepository {
  async getDashboardOverview(): Promise<DashboardOverviewResponse> {
    return apiRequest('/dashboard/overview');
  }

  async getGravacaoReport(gravacaoId: string): Promise<GravacaoReportData | null> {
    return apiRequest(`/gravacoes/${gravacaoId}/report`);
  }
}
