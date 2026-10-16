import useSWR from 'swr';
import { operacionService } from '../services/operacion.service';
import type { CoordinacionDetalle, CoordinacionFiltros, CoordinacionPagina } from '../types/coordinacion';

/** Lista paginada; conserva la página anterior mientras carga la siguiente. */
export const useCoordinaciones = (filtros: CoordinacionFiltros) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<CoordinacionPagina>(
    ['operacion/coordinaciones', JSON.stringify(filtros)],
    () => operacionService.listarCoordinaciones(filtros),
    { keepPreviousData: true, revalidateOnFocus: false },
  );
  return { pagina: data, error, isLoading, isValidating, mutate };
};

export const useCoordinacion = (id: number | null) => {
  const { data, error, isLoading, mutate } = useSWR<CoordinacionDetalle>(
    id ? ['operacion/coordinacion', id] : null,
    () => operacionService.coordinacion(id!),
    { revalidateOnFocus: false },
  );
  return { coordinacion: data, error, isLoading, mutate };
};
