import { useMasterData } from '../common/useMasterData';
import { useForeignKeyOptions } from '../../../../shared/hooks';
import type { Pais } from '../../types/paises.types';

interface UsePaisesMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaisResponse {
  idPais: number;
  siglasPais: string;
  nombre: string;
}

interface AcuerdoResponse {
  idAcuerdo: number;
  nombre: string;
}

export function usePaisesMasterData(endpoint: string, options: UsePaisesMasterDataOptions = {}) {
  const baseHook = useMasterData<Pais>(endpoint, options);

  // Load FK options using the generic hook
  const { options: fkOptions, loading: loadingOptions } = useForeignKeyOptions([
    {
      key: 'idAcuerdo',
      endpoint: '/master-data/acuerdos-arancelarios',
      mapper: (a: AcuerdoResponse) => ({
        value: a.idAcuerdo,
        label: a.nombre || `Acuerdo ${a.idAcuerdo}`,
      }),
    },
  ]);

  return {
    ...baseHook,
    loading: baseHook.loading || loadingOptions,
    foreignKeyOptions: {
      idAcuerdo: fkOptions.idAcuerdo || [],
    },
  };
}
