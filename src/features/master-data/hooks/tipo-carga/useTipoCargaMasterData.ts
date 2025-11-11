import { useMasterData } from '../common/useMasterData';
import { TipoCarga } from '../../types/tipo-carga.types';

export function useTipoCargaMasterData(endpoint: string) {
  return useMasterData<TipoCarga>(endpoint);
}