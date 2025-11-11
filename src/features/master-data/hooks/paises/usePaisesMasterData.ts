import { useState, useEffect } from 'react';
import { useMasterData } from '../common/useMasterData';
import api from '../../../../shared/services/api';

export function usePaisesMasterData(endpoint: string) {
  const baseHook = useMasterData<any>(endpoint);
  const [paisesPadre, setPaisesPadre] = useState<{ value: number; label: string }[]>([]);
  const [acuerdos, setAcuerdos] = useState<{ value: number; label: string }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Load FK options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [paisesRes, acuerdosRes] = await Promise.all([
          api.get('/master-data/paises'),
          api.get('/master-data/acuerdos-arancelarios'),
        ]);

        setPaisesPadre(paisesRes.data.data?.map((p: any) => ({
          value: p.idPais,
          label: `${p.siglasPais} - ${p.nombre}`
        })) || []);
        setAcuerdos(acuerdosRes.data.data?.map((a: any) => ({
          value: a.id,
          label: a.nombre || `Acuerdo ${a.id}`
        })) || []);
      } catch (error) {
        console.error('Error loading FK options for paises:', error);
        // Set empty arrays as fallback
        setPaisesPadre([]);
        setAcuerdos([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  return {
    ...baseHook,
    loading: baseHook.loading || loadingOptions,
    paisesPadre,
    acuerdos,
  };
}