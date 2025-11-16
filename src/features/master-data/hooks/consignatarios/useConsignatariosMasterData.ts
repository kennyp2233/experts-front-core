import { useMasterData } from '../common/useMasterData';
import { useForeignKeyOptions } from '../../../../shared/hooks';

interface UseConsignatariosMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

interface EmbarcadorResponse {
  id: number;
  nombre: string;
}

interface ClienteResponse {
  id: number;
  nombre: string;
}

export function useConsignatariosMasterData(endpoint: string, options: UseConsignatariosMasterDataOptions = {}) {
  const baseHook = useMasterData<any>(endpoint, options);

  // Load FK options using the generic hook
  const { options: fkOptions, loading: loadingOptions } = useForeignKeyOptions([
    {
      key: 'embarcadores',
      endpoint: '/master-data/embarcadores',
      mapper: (e: EmbarcadorResponse) => ({
        value: e.id,
        label: e.nombre,
      }),
    },
    {
      key: 'clientes',
      endpoint: '/master-data/clientes',
      mapper: (c: ClienteResponse) => ({
        value: c.id,
        label: c.nombre,
      }),
    },
  ]);

  return {
    ...baseHook,
    loading: baseHook.loading || loadingOptions,
    embarcadores: fkOptions.embarcadores || [],
    clientes: fkOptions.clientes || [],
  };
}
