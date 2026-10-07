import useSWR from 'swr';
import { ebfService } from '../services/ebf.service';
import type {
  CoordinacionDetalle,
  CoordinacionListPage,
  CoordinacionListQuery,
} from '../types/coordinacion';
import type { DaeListPage } from '../types/dae';
import { useFreshRefresh } from './useFreshRefresh';

const k = (...parts: (string | number | boolean | undefined)[]) =>
  parts.filter((p) => p !== undefined && p !== '').join('|');

export const useEbfHealth = () => {
  const { data, error, isLoading, mutate } = useSWR<{ ok: true }>(
    'ebf/health',
    () => ebfService.health(),
    { revalidateOnFocus: false },
  );
  return { ok: data?.ok ?? false, error, isLoading, mutate };
};

/**
 * Key SWR de una página de coordinaciones. `includeHistorico: false` y
 * `undefined` piden lo mismo, así que comparten key (p.ej. con el resumen de
 * Inicio, que llama `useCoordinaciones({ page: 1 })`).
 */
export const coordinacionesKey = (query: CoordinacionListQuery = {}) =>
  k('ebf/coordinaciones', query.page, query.sort, query.includeHistorico || undefined);

/**
 * Lista de coordinaciones (vigentes o histórico).
 * `refresh()` recarga saltando la caché del back (`fresh=true`); `mutate()`
 * revalida normal (usa la caché del back si está vigente).
 */
export const useCoordinaciones = (query: CoordinacionListQuery = {}) => {
  const key = coordinacionesKey(query);
  const { data, error, isLoading, isValidating, mutate } =
    useSWR<CoordinacionListPage>(key, () =>
      ebfService.listCoordinaciones(query),
    );
  const { refresh, refreshing, refreshError } = useFreshRefresh(
    key,
    mutate,
    () => ebfService.listCoordinaciones({ ...query, fresh: true }),
  );
  return {
    page: data,
    error,
    isLoading,
    isValidating,
    mutate,
    refresh,
    refreshing,
    refreshError,
  };
};

export const useCoordinacionDetalle = (id: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<CoordinacionDetalle>(
    // Prefijo propio: no debe chocar con las keys de la lista ("ebf/coordinaciones|<page>").
    id ? k('ebf/coordinacion-detalle', id) : null,
    () => ebfService.getCoordinacion(id!),
  );
  return { detalle: data, error, isLoading, mutate };
};

export const useDaes = (query: { page?: number } = {}) => {
  const key = k('ebf/daes', query.page);
  const { data, error, isLoading, isValidating, mutate } = useSWR<DaeListPage>(
    key,
    () => ebfService.listDaes(query),
  );
  const { refresh, refreshing, refreshError } = useFreshRefresh(
    key,
    mutate,
    () => ebfService.listDaes({ ...query, fresh: true }),
  );
  return {
    page: data,
    error,
    isLoading,
    isValidating,
    mutate,
    refresh,
    refreshing,
    refreshError,
  };
};
