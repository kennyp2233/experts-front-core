import { useMasterData } from '../common/useMasterData';

export function useMedidasMasterData(endpoint: string) {
  return useMasterData<any>(endpoint);
}