import useSWR from 'swr';
import { operacionService } from '../services/operacion.service';
import type { ReporteValidacion, ValidacionCoordinacion } from '../types/coordinacion';

export const useReporteValidacion = () => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ReporteValidacion>(
    'operacion/validacion',
    () => operacionService.reporteValidacion(),
    { revalidateOnFocus: false },
  );
  /** Recalcula en el back (sin usar el resultado guardado). */
  const recalcular = () => mutate(operacionService.reporteValidacion(true), { revalidate: false });
  return { reporte: data, error, isLoading, isValidating, mutate, recalcular };
};

export const useValidacionCoordinacion = (id: number | null) => {
  const { data, error, isLoading } = useSWR<ValidacionCoordinacion>(
    id ? ['operacion/validacion', id] : null,
    () => operacionService.validacionCoordinacion(id!),
    { revalidateOnFocus: false },
  );
  return { validacion: data, error, isLoading };
};
