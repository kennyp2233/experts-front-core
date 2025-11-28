import { useMasterData } from '../common/useMasterData';
import { useForeignKeyOptions } from '../common/useForeignKeyOptions';

interface UseOrigenMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaisResponse {
  idPais: number;
  siglasPais: string;
  nombre: string;
}

interface CaeAduanaResponse {
  idCaeAduana: number;
  nombre: string;
  codigoAduana: string;
}

export function useOrigenMasterData(endpoint: string, options: UseOrigenMasterDataOptions = {}) {
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
    {
      key: 'idCaeAduana',
      endpoint: '/master-data/cae-aduana',
      mapper: (c: CaeAduanaResponse) => ({
        value: c.idCaeAduana,
        label: `${c.nombre} (${c.codigoAduana})`,
      }),
    },
  ]);

  return {
    ...baseHook,
    loading: baseHook.loading || loadingOptions,
    // Return foreignKeyOptions for dynamic config application
    foreignKeyOptions: {
      idPais: fkOptions.idPais || [],
      idCaeAduana: fkOptions.idCaeAduana || [],
    },
  };
}
