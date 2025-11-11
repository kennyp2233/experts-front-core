import { useMasterData } from '../common/useMasterData';
import { TipoCarga } from '../../types/tipo-carga.types';

interface UseTipoCargaMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useTipoCargaMasterData(endpoint: string, options: UseTipoCargaMasterDataOptions = {}) {
  return useMasterData<TipoCarga>(endpoint, options);
}