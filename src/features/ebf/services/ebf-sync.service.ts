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

  /**
   * Trigger manual del ciclo — bloquea hasta terminar.
   * Un ciclo encadena N requests a EBF + lectura de Access, fácil pasa los
   * 30s del timeout global. Override de 2 min (sobra para data esperada;
   * si supera ese, conviene mover a job async + polling — F2.1 futuro).
   */
  runNow: async (): Promise<SyncCycleReport> => {
    const { data } = await api.post<SyncCycleReport>(
      `${BASE}/run`,
      undefined,
      { timeout: 120_000 },
    );
    return data;
  },
};
