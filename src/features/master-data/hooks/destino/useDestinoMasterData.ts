import { useState, useEffect } from 'react';
import { useMasterData } from '../common/useMasterData';
import api from '../../../../shared/services/api';

interface UseDestinoMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useDestinoMasterData(endpoint: string, options: UseDestinoMasterDataOptions = {}) {
  const baseHook = useMasterData<any>(endpoint, options);
  const [paises, setPaises] = useState<{ value: number; label: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Load FK options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const paisesRes = await api.get('/master-data/paises');

        setPaises(paisesRes.data.data?.map((p: any) => ({
          value: p.idPais,
          label: `${p.siglasPais} - ${p.nombre}`
        })) || []);
      } catch (error) {
        console.error('Error loading FK options for destino:', error);
        // Set empty arrays as fallback
        setPaises([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  return {
    ...baseHook,
    loading: baseHook.loading || loadingOptions,
    paises,
  };
}