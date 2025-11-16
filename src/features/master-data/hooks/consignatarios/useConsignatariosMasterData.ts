import { useState, useEffect } from 'react';
import { useMasterData } from '../common/useMasterData';
import api from '../../../../shared/services/api';

interface UseConsignatariosMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useConsignatariosMasterData(endpoint: string, options: UseConsignatariosMasterDataOptions = {}) {
  const baseHook = useMasterData<any>(endpoint, options);
  const [embarcadores, setEmbarcadores] = useState<{ value: number; label: string }[]>([]);
  const [clientes, setClientes] = useState<{ value: number; label: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Load FK options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [embarcadoresRes, clientesRes] = await Promise.all([
          api.get('/master-data/embarcadores'),
          api.get('/master-data/clientes'),
        ]);

        setEmbarcadores(embarcadoresRes.data.data?.map((e: any) => ({
          value: e.id,
          label: e.nombre
        })) || []);

        setClientes(clientesRes.data.data?.map((c: any) => ({
          value: c.id,
          label: c.nombre
        })) || []);
      } catch (error) {
        console.error('Error loading FK options for consignatarios:', error);
        // Set empty arrays as fallback
        setEmbarcadores([]);
        setClientes([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  return {
    ...baseHook,
    loading: baseHook.loading || loadingOptions,
    embarcadores,
    clientes,
  };
}