import { useMasterData } from '../common/useMasterData';
import { TipoEmbalaje } from '../../types/tipo-embalaje.types';

export function useTipoEmbalajeMasterData(endpoint: string) {
  return useMasterData<TipoEmbalaje>(endpoint);
}