import { useMasterData } from '../common/useMasterData';
import { TipoEmbalaje } from '../../types/tipo-embalaje.types';

interface UseTipoEmbalajeMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useTipoEmbalajeMasterData(endpoint: string, options: UseTipoEmbalajeMasterDataOptions = {}) {
  return useMasterData<TipoEmbalaje>(endpoint, options);
}