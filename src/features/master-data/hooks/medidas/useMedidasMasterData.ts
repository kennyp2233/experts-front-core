import { useMasterData } from '../common/useMasterData';

interface UseMedidasMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useMedidasMasterData(endpoint: string, options: UseMedidasMasterDataOptions = {}) {
  return useMasterData<any>(endpoint, options);
}