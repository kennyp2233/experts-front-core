import { useState } from 'react';
import useSWR from 'swr';
import { ebfSyncService } from '../services/ebf-sync.service';
import type {
  EbfCoordinacionSync,
  SyncCycleReport,
  SyncStats,
  SyncStatusFilter,
} from '../types/sync';

export const useSyncStats = () => {
  const { data, error, isLoading, mutate } = useSWR<SyncStats>(
    'sync/ebf-access/stats',
    () => ebfSyncService.stats(),
    { refreshInterval: 30_000 },
  );
  return { stats: data, error, isLoading, mutate };
};

export const useSyncList = (status: SyncStatusFilter, limit = 100) => {
  const { data, error, isLoading, mutate } = useSWR<EbfCoordinacionSync[]>(
    `sync/ebf-access/list|${status}|${limit}`,
    () => ebfSyncService.list(status, limit),
  );
  return { rows: data, error, isLoading, mutate };
};

/**
 * Trigger manual del ciclo. Mantiene el último report y un flag `running`
 * para que el botón pueda mostrar loading + el resultado in-place.
 * Re-valida `stats` y `list` (todas) al terminar.
 */
export const useSyncRunner = () => {
  const [running, setRunning] = useState(false);
  const [lastReport, setLastReport] = useState<SyncCycleReport | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const report = await ebfSyncService.runNow();
      setLastReport(report);
      return report;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setRunning(false);
    }
  };

  return { run, running, lastReport, error };
};
