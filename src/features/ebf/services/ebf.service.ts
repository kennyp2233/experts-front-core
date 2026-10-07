import api from '../../../shared/services/api';
import type {
  CoordinacionDetalle,
  CoordinacionListPage,
  CoordinacionListQuery,
} from '../types/coordinacion';
import type { DaeListPage } from '../types/dae';

const BASE = '/integrations/ebf-portal';

/**
 * Opción común de las listas: `fresh: true` le pide al back que ignore su
 * caché (TTL ~2 min) y vuelva a consultar el portal. Solo se envía cuando el
 * usuario pulsa "Actualizar" o tras editar/eliminar; las cargas normales usan
 * la caché.
 */
export interface EbfFreshOption {
  fresh?: boolean;
}

const freshParam = (fresh?: boolean) => (fresh ? 'true' : undefined);

export const ebfService = {
  health: async (): Promise<{ ok: true }> => {
    const { data } = await api.get<{ ok: true }>(`${BASE}/health`);
    return data;
  },

  listCoordinaciones: async (
    query: CoordinacionListQuery & EbfFreshOption = {},
  ): Promise<CoordinacionListPage> => {
    const { data } = await api.get<CoordinacionListPage>(
      `${BASE}/coordinaciones`,
      {
        params: {
          page: query.page,
          sort: query.sort,
          historico: query.includeHistorico ? 'true' : undefined,
          fresh: freshParam(query.fresh),
        },
      },
    );
    return data;
  },

  getCoordinacion: async (id: string): Promise<CoordinacionDetalle> => {
    const { data } = await api.get<CoordinacionDetalle>(
      `${BASE}/coordinaciones/${encodeURIComponent(id)}`,
    );
    return data;
  },

  listDaes: async (
    query: { page?: number } & EbfFreshOption = {},
  ): Promise<DaeListPage> => {
    const { data } = await api.get<DaeListPage>(`${BASE}/daes`, {
      params: { page: query.page, fresh: freshParam(query.fresh) },
    });
    return data;
  },
};
