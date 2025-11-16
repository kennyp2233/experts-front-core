import { useMasterData } from '../common/useMasterData';
import { useForeignKeyOptions } from '../../../../shared/hooks';
import { TipoEmbarque } from '../../types/tipo-embarque.types';

interface UseTipoEmbarqueMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

interface TipoCargaResponse {
  id: number;
  nombre: string;
}

interface TipoEmbalajeResponse {
  id: number;
  nombre: string;
}

export function useTipoEmbarqueMasterData(endpoint: string, options: UseTipoEmbarqueMasterDataOptions = {}) {
  const baseHook = useMasterData<TipoEmbarque>(endpoint, options);

  // Load FK options using the generic hook
  const { options: fkOptions, loading: loadingOptions } = useForeignKeyOptions([
    {
      key: 'tiposCarga',
      endpoint: '/master-data/tipo-carga',
      mapper: (tc: TipoCargaResponse) => ({
        value: tc.id,
        label: tc.nombre,
      }),
    },
    {
      key: 'tiposEmbalaje',
      endpoint: '/master-data/tipo-embalaje',
      mapper: (te: TipoEmbalajeResponse) => ({
        value: te.id,
        label: te.nombre,
      }),
    },
  ]);

  return {
    ...baseHook,
    loading: baseHook.loading || loadingOptions,
    tiposCarga: fkOptions.tiposCarga || [],
    tiposEmbalaje: fkOptions.tiposEmbalaje || [],
  };
}
