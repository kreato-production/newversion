import { isBackendDataProviderEnabled } from '@/lib/api/http';
import { ApiConteudosRepository } from './conteudos.api.repository';
import { conteudosSupabaseRepository } from './conteudos.repository';

export const conteudosRepository = isBackendDataProviderEnabled()
  ? new ApiConteudosRepository()
  : conteudosSupabaseRepository;
