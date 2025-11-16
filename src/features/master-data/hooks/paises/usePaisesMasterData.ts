import { useMasterData } from '../common/useMasterData';
import { useForeignKeyOptions } from '../../../../shared/hooks';

interface UsePaisesMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

interface Pais {
  idPais: number;
  siglasPais: string;
  nombre: string;
}

interface Acuerdo {
  idAcuerdo: number;
  nombre: string;
}

export function usePaisesMasterData(endpoint: string, options: UsePaisesMasterDataOptions = {}) {
  const baseHook = useMasterData<Pais>(endpoint, options);

  // Load FK options using the generic hook
  const { options: fkOptions, loading: loadingOptions } = useForeignKeyOptions([
    {
      key: 'paisesPadre',
      endpoint: '/master-data/paises',
      mapper: (p: Pais) => ({
        value: p.idPais,
        label: `${p.siglasPais} - ${p.nombre}`,
      }),
    },
    {
      key: 'acuerdos',
      endpoint: '/master-data/acuerdos-arancelarios',
      mapper: (a: Acuerdo) => ({
        value: a.idAcuerdo,
        label: a.nombre || `Acuerdo ${a.idAcuerdo}`,
      }),
    },
  ]);

  return {
    ...baseHook,
    loading: baseHook.loading || loadingOptions,
    paisesPadre: fkOptions.paisesPadre || [],
    acuerdos: fkOptions.acuerdos || [],
  };
}
