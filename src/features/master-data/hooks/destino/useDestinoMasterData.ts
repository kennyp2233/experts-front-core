import { useMasterData } from '../common/useMasterData';
import { useForeignKeyOptions } from '../../../../shared/hooks';

interface UseDestinoMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaisResponse {
  idPais: number;
  siglasPais: string;
  nombre: string;
}

export function useDestinoMasterData(endpoint: string, options: UseDestinoMasterDataOptions = {}) {
  const baseHook = useMasterData<any>(endpoint, options);

  // Load FK options using the generic hook
  const { options: fkOptions, loading: loadingOptions } = useForeignKeyOptions([
    {
      key: 'paises',
      endpoint: '/master-data/paises',
      mapper: (p: PaisResponse) => ({
        value: p.idPais,
        label: `${p.siglasPais} - ${p.nombre}`,
      }),
    },
  ]);

  return {
    ...baseHook,
    loading: baseHook.loading || loadingOptions,
    paises: fkOptions.paises || [],
  };
}
