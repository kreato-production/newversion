import { isBackendDataProviderEnabled } from '@/lib/api/http';
import { ApiProgramasRepository } from './programas.api.repository';
import { programasSupabaseRepository } from './programas.repository';

export const programasRepository = isBackendDataProviderEnabled()
  ? new ApiProgramasRepository()
  : programasSupabaseRepository;
