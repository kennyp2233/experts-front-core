import useSWR from 'swr';
import { ebfService } from '../services/ebf.service';
import type {
  CoordinacionDetalle,
  CoordinacionListPage,
  CoordinacionListQuery,
} from '../types/coordinacion';
import type { DaeListPage } from '../types/dae';

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

export const useCoordinaciones = (query: CoordinacionListQuery = {}) => {
  const key = k(
    'ebf/coordinaciones',
    query.page,
    query.sort,
    query.includeHistorico,
  );
  const { data, error, isLoading, mutate } = useSWR<CoordinacionListPage>(
    key,
    () => ebfService.listCoordinaciones(query),
  );
  return { page: data, error, isLoading, mutate };
};

export const useCoordinacionDetalle = (id: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<CoordinacionDetalle>(
    id ? k('ebf/coordinaciones', id) : null,
    () => ebfService.getCoordinacion(id!),
  );
  return { detalle: data, error, isLoading, mutate };
};

export const useDaes = (query: { page?: number } = {}) => {
  const { data, error, isLoading, mutate } = useSWR<DaeListPage>(
    k('ebf/daes', query.page),
    () => ebfService.listDaes(query),
  );
  return { page: data, error, isLoading, mutate };
};
