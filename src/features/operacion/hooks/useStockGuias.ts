import useSWR from 'swr';
import { operacionService } from '../services/operacion.service';
import type { GuiasMadreFiltros, GuiasMadrePagina, ResumenStockAerolinea } from '../types/coordinacion';

export const useGuiasMadre = (filtros: GuiasMadreFiltros) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR<GuiasMadrePagina>(
    ['operacion/guias-madre', JSON.stringify(filtros)],
    () => operacionService.listarGuiasMadre(filtros),
    { keepPreviousData: true, revalidateOnFocus: false },
  );
  return { pagina: data, error, isLoading, isValidating, mutate };
};

export const useResumenStock = () => {
  const { data, error, isLoading, mutate } = useSWR<ResumenStockAerolinea[]>(
    'operacion/guias-madre/resumen',
    () => operacionService.resumenStock(),
    { revalidateOnFocus: false },
  );
  return { resumen: data, error, isLoading, mutate };
};
