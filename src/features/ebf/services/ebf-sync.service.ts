import api from '../../../shared/services/api';
import type {
  EbfCoordinacionSync,
  SyncCycleReport,
  SyncStats,
  SyncStatusFilter,
} from '../types/sync';

const BASE = '/sync/ebf-access';

export const ebfSyncService = {
  stats: async (): Promise<SyncStats> => {
    const { data } = await api.get<SyncStats>(`${BASE}/stats`);
    return data;
  },

  list: async (
    status: SyncStatusFilter = 'ALL',
    limit = 100,
  ): Promise<EbfCoordinacionSync[]> => {
    const { data } = await api.get<EbfCoordinacionSync[]>(`${BASE}/list`, {
      params: { status, limit },
    });
    return data;
  },

  /** Trigger manual del ciclo — bloquea hasta terminar (puede tardar). */
  runNow: async (): Promise<SyncCycleReport> => {
    const { data } = await api.post<SyncCycleReport>(`${BASE}/run`);
    return data;
  },
};
