import { useCallback, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ebfSyncService } from '../services/ebf-sync.service';
import type {
  EbfCoordinacionSync,
  SyncCycleReport,
  SyncStats,
  SyncStatusFilter,
} from '../types/sync';

const SYNC_KEY_PREFIX = 'sync/ebf-access/';

export const useSyncStats = () => {
  const { data, error, isLoading, mutate } = useSWR<SyncStats>(
    `${SYNC_KEY_PREFIX}stats`,
    () => ebfSyncService.stats(),
    {
      // Sondea cada 30 s mientras el endpoint responda. Si nunca respondió
      // (p. ej. 500 en local), no sigue insistiendo: se reintenta a mano.
      refreshInterval: (latest) => (latest ? 30_000 : 0),
      errorRetryCount: 2,
    },
  );
  return { stats: data, error, isLoading, mutate };
};

export const useSyncList = (status: SyncStatusFilter, limit = 100) => {
  const { data, error, isLoading, mutate } = useSWR<EbfCoordinacionSync[]>(
    `${SYNC_KEY_PREFIX}list|${status}|${limit}`,
    () => ebfSyncService.list(status, limit),
    { errorRetryCount: 2 },
  );
  return { rows: data, error, isLoading, mutate };
};

/**
 * Trigger manual del ciclo. Mantiene el último report y un flag `running`
 * para que el botón pueda mostrar loading + el resultado in-place.
 * Al terminar re-valida `stats` y todas las listas cacheadas (todos los estados).
 */
export const useSyncRunner = () => {
  const { mutate } = useSWRConfig();
  const [running, setRunning] = useState(false);
  const [lastReport, setLastReport] = useState<SyncCycleReport | null>(null);
  const [error, setError] = useState<unknown>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const report = await ebfSyncService.runNow();
      setLastReport(report);
      await mutate((key) => typeof key === 'string' && key.startsWith(SYNC_KEY_PREFIX));
      return report;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setRunning(false);
    }
  };

  const dismissReport = useCallback(() => setLastReport(null), []);
  const dismissError = useCallback(() => setError(null), []);

  return { run, running, lastReport, error, dismissReport, dismissError };
};
