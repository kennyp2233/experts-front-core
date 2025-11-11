import { useState, useEffect } from 'react';
import { useMasterData } from '../common/useMasterData';
import api from '../../../../shared/services/api';
import { TipoEmbarque } from '../../types/tipo-embarque.types';

export function useTipoEmbarqueMasterData(endpoint: string) {
  const baseHook = useMasterData<TipoEmbarque>(endpoint);
  const [tiposCarga, setTiposCarga] = useState<{ value: number; label: string }[]>([]);
  const [tiposEmbalaje, setTiposEmbalaje] = useState<{ value: number; label: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Load FK options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [tiposCargaRes, tiposEmbalajeRes] = await Promise.all([
          api.get('/master-data/tipo-carga'),
          api.get('/master-data/tipo-embalaje'),
        ]);

        setTiposCarga(tiposCargaRes.data.data?.map((tc: any) => ({
          value: tc.id,
          label: tc.nombre
        })) || []);
        setTiposEmbalaje(tiposEmbalajeRes.data.data?.map((te: any) => ({
          value: te.id,
          label: te.nombre
        })) || []);
      } catch (error) {
        console.error('Error loading FK options for tipo-embarque:', error);
        // Set empty arrays as fallback
        setTiposCarga([]);
        setTiposEmbalaje([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  return {
    ...baseHook,
    loading: baseHook.loading || loadingOptions,
    tiposCarga,
    tiposEmbalaje,
  };
}