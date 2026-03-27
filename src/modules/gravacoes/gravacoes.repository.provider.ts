import { isBackendDataProviderEnabled } from '@/lib/api/http';
import { ApiGravacoesRepository } from './gravacoes.api.repository';
import { gravacoesSupabaseRepository } from './gravacoes.repository';

export const gravacoesRepository = isBackendDataProviderEnabled()
  ? new ApiGravacoesRepository()
  : gravacoesSupabaseRepository;
