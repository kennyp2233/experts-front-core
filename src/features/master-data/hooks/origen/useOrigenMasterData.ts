import { useState, useEffect } from 'react';
import { useMasterData } from '../common/useMasterData';
import api from '../../../../shared/services/api';

interface UseOrigenMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useOrigenMasterData(endpoint: string, options: UseOrigenMasterDataOptions = {}) {
  const baseHook = useMasterData<any>(endpoint, options);
  const [paises, setPaises] = useState<{ value: number; label: string }[]>([]);
  const [caeAduanas, setCaeAduanas] = useState<{ value: number; label: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Load FK options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [paisesRes, caeAduanasRes] = await Promise.all([
          api.get('/master-data/paises'),
          api.get('/master-data/cae-aduana'),
        ]);

        setPaises(paisesRes.data.data?.map((p: any) => ({
          value: p.idPais,
          label: `${p.siglasPais} - ${p.nombre}`
        })) || []);

        setCaeAduanas(caeAduanasRes.data.data?.map((c: any) => ({
          value: c.idCaeAduana,
          label: `${c.nombre} (${c.codigo})`
        })) || []);
      } catch (error) {
        console.error('Error loading FK options for origen:', error);
        // Set empty arrays as fallback
        setPaises([]);
        setCaeAduanas([]);
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
    caeAduanas,
  };
}