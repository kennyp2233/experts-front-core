import useSWR from 'swr';
import { ebfService } from '../services/ebf.service';
import type { ColaEbf, EquivalenciaEbf, EstadoEbfCoordinacion, TipoEquivalenciaEbf } from '../types/ebf';

/** Una coordinación frente a EBF. El back relee EBF si lo leído tiene más de 2 minutos. Con `null` no consulta. */
export const useEstadoEbf = (id: number | null) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<EstadoEbfCoordinacion>(
    id ? ['operacion/ebf/coordinacion', id] : null,
    () => ebfService.estado(id!),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  return { estado: data, error, isLoading, isValidating, mutate };
};

/** Lo pendiente con EBF (no lee EBF: recalcula contra la última lectura). Se refresca cada minuto. */
export const useColaEbf = () => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ColaEbf>('operacion/ebf/cola', ebfService.cola, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });
  return { cola: data, error, isLoading, isValidating, mutate };
};

export const useEquivalenciasEbf = (tipo: TipoEquivalenciaEbf) => {
  const { data, error, isLoading, mutate } = useSWR<EquivalenciaEbf[]>(['operacion/ebf/equivalencias', tipo], () =>
    ebfService.equivalencias(tipo),
  );
  return { equivalencias: data, error, isLoading, mutate };
};
