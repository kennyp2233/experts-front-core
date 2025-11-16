import { useMasterData } from '../common/useMasterData';
import { useForeignKeyOptions } from '../common/useForeignKeyOptions';

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
      key: 'idPais',
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
    // Return foreignKeyOptions for dynamic config application
    foreignKeyOptions: {
      idPais: fkOptions.idPais || [],
    },
  };
}
