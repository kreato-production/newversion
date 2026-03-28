import { useState, useCallback } from 'react';
import { ApiAnalyticsRepository } from '@/modules/analytics/analytics.api';
import type {
  GravacaoBasicInfo,
  CenaData,
  RecursoData,
  ElencoData,
  ConvidadoData,
  FigurinoData,
  TerceiroData,
  CustoItem,
  GravacaoReportData,
} from '@/modules/analytics/analytics.types';

const apiRepository = new ApiAnalyticsRepository();

export type {
  GravacaoBasicInfo,
  CenaData,
  RecursoData,
  ElencoData,
  ConvidadoData,
  FigurinoData,
  TerceiroData,
  CustoItem,
  GravacaoReportData,
};

export const useGravacaoReportData = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchReportData = useCallback(
    async (gravacaoId: string): Promise<GravacaoReportData | null> => {
      setIsLoading(true);
      try {
        return await apiRepository.getGravacaoReport(gravacaoId);
      } catch (error) {
        console.error('Error fetching report data:', error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    isLoading,
    fetchReportData,
  };
};
