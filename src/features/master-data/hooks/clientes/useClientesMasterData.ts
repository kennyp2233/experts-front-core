import { useMasterData } from '../common/useMasterData';
import { MasterDataEntity } from '../../types/master-data.types';

export function useClientesMasterData(endpoint: string) {
  return useMasterData<MasterDataEntity>(endpoint);
}