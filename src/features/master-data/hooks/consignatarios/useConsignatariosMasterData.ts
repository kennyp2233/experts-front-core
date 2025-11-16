import { useMasterData } from '../common/useMasterData';
import { useForeignKeyOptions } from '../common/useForeignKeyOptions';

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
      key: 'idEmbarcador',
      endpoint: '/master-data/embarcadores',
      mapper: (e: EmbarcadorResponse) => ({
        value: e.id,
        label: e.nombre,
      }),
    },
    {
      key: 'idCliente',
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
    // Return foreignKeyOptions for dynamic config application
    foreignKeyOptions: {
      idEmbarcador: fkOptions.idEmbarcador || [],
      idCliente: fkOptions.idCliente || [],
    },
  };
}
