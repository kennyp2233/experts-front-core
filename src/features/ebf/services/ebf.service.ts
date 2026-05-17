import api from '../../../shared/services/api';
import type {
  CoordinacionDetalle,
  CoordinacionListPage,
  CoordinacionListQuery,
} from '../types/coordinacion';
import type { DaeListPage } from '../types/dae';

const BASE = '/integrations/ebf-portal';

export const ebfService = {
  health: async (): Promise<{ ok: true }> => {
    const { data } = await api.get<{ ok: true }>(`${BASE}/health`);
    return data;
  },

  listCoordinaciones: async (
    query: CoordinacionListQuery = {},
  ): Promise<CoordinacionListPage> => {
    const { data } = await api.get<CoordinacionListPage>(
      `${BASE}/coordinaciones`,
      {
        params: {
          page: query.page,
          sort: query.sort,
          historico: query.includeHistorico ? 'true' : undefined,
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
    query: { page?: number } = {},
  ): Promise<DaeListPage> => {
    const { data } = await api.get<DaeListPage>(`${BASE}/daes`, {
      params: { page: query.page },
    });
    return data;
  },
};
