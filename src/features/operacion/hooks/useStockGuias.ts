import useSWR from 'swr';
import { operacionService } from '../services/operacion.service';
import type {
  GuiasMadreFiltros,
  GuiasMadrePagina,
  IngresoDetalle,
  IngresosFiltros,
  IngresosPagina,
  ResumenStockAerolinea,
} from '../types/coordinacion';

export const useGuiasMadre = (filtros: GuiasMadreFiltros) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<GuiasMadrePagina>(
    ['operacion/guias-madre', JSON.stringify(filtros)],
    () => operacionService.listarGuiasMadre(filtros),
    { keepPreviousData: true, revalidateOnFocus: false },
  );
  return { pagina: data, error, isLoading, isValidating, mutate };
};

export const useIngresos = (filtros: IngresosFiltros) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<IngresosPagina>(
    ['operacion/guias-madre/ingresos', JSON.stringify(filtros)],
    () => operacionService.listarIngresos(filtros),
    { keepPreviousData: true, revalidateOnFocus: false },
  );
  return { pagina: data, error, isLoading, isValidating, mutate };
};

export const useIngreso = (id: number | null) => {
  const { data, error, isLoading, mutate } = useSWR<IngresoDetalle>(
    id ? ['operacion/guias-madre/ingreso', id] : null,
    () => operacionService.ingreso(id!),
    { revalidateOnFocus: false },
  );
  return { ingreso: data, error, isLoading, mutate };
};

export const useResumenStock = () => {
  const { data, error, isLoading, mutate } = useSWR<ResumenStockAerolinea[]>(
    'operacion/guias-madre/resumen',
    () => operacionService.resumenStock(),
    { revalidateOnFocus: false },
  );
  return { resumen: data, error, isLoading, mutate };
};
