import { useMasterData } from '../common/useMasterData';
import { useForeignKeyOptions } from '../../../../shared/hooks';

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
  codigo: string;
}

export function useOrigenMasterData(endpoint: string, options: UseOrigenMasterDataOptions = {}) {
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
    {
      key: 'caeAduanas',
      endpoint: '/master-data/cae-aduana',
      mapper: (c: CaeAduanaResponse) => ({
        value: c.idCaeAduana,
        label: `${c.nombre} (${c.codigo})`,
      }),
    },
  ]);

  return {
    ...baseHook,
    loading: baseHook.loading || loadingOptions,
    paises: fkOptions.paises || [],
    caeAduanas: fkOptions.caeAduanas || [],
  };
}
