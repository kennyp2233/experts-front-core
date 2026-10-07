'use client';

import { Box, Chip, Tooltip } from '@mui/material';
import {
  CheckCircleOutline as OkIcon,
  CompareArrows as SyncIcon,
  DescriptionOutlined as DaesIcon,
  FlightTakeoff as FlightIcon,
  HourglassEmpty as PendingIcon,
  Hub as CoordinacionesIcon,
  WarningAmberOutlined as WarnIcon,
} from '@mui/icons-material';
import { AppPage } from '@/shared/components/ui/AppPage';
import { formatDate } from '@/shared/utils/format';
import { useAuth } from '@/features/auth';
import { useCoordinaciones, useDaes, useEbfHealth, useSyncStats } from '@/features/ebf';
import { KpiCard } from './KpiCard';
import { UpcomingDepartures } from './UpcomingDepartures';
import { QuickActions } from './QuickActions';
import { useToday, type PartOfDay } from './useToday';
import { daysFrom, findVigenciaColumn, firstNameOf, formatCount, formatLongDate } from './home.utils';

const GREETINGS: Record<PartOfDay, string> = {
  morning: 'Buenos días',
  afternoon: 'Buenas tardes',
  evening: 'Buenas noches',
};

const LOAD_FAILED = 'No se pudo cargar';
const DAE_EXPIRY_WINDOW = 7;

function EbfStatusChip() {
  const { ok, isLoading } = useEbfHealth();
  if (isLoading) {
    return <Chip size="small" variant="outlined" icon={<PendingIcon />} label="Verificando EBF…" />;
  }
  if (!ok) {
    return (
      <Tooltip title="Sin sesión con el portal EBF: las coordinaciones y DAEs pueden no cargar.">
        <Chip size="small" variant="outlined" color="warning" icon={<WarnIcon />} label="EBF sin conexión" />
      </Tooltip>
    );
  }
  return (
    <Tooltip title="Sesión activa con el portal EBF">
      <Chip size="small" variant="outlined" color="success" icon={<OkIcon />} label="EBF conectado" />
    </Tooltip>
  );
}

/**
 * Pantalla de inicio para operadores logísticos: KPIs del día, próximas
 * salidas y accesos rápidos. Cada bloque carga por su cuenta (las listas de
 * EBF pueden tardar 10–15 s) y falla por su cuenta, sin bloquear la página.
 */
export function HomeDashboard() {
  const { user } = useAuth();
  const { today, partOfDay } = useToday();

  const coord = useCoordinaciones({ page: 1 });
  const daes = useDaes({ page: 1 });
  const sync = useSyncStats();

  const isAdmin = user?.role === 'ADMIN';
  const firstName = firstNameOf(user?.firstName);
  const greeting = partOfDay ? GREETINGS[partOfDay] : 'Hola';
  const title = firstName ? `${greeting}, ${firstName}` : greeting;
  const subtitle = today ? `${formatLongDate(today)} · Resumen de la operación` : 'Resumen de la operación';

  // --- Coordinaciones (primera página de vigentes) ---
  const coordItems = coord.page?.items ?? [];
  const coordHasMore = coord.page?.hasNextPage ?? false;
  const coordLoading = !coord.page && !coord.error;
  const coordFailed = !coord.page && Boolean(coord.error);
  const salenHoy = today ? coordItems.filter((i) => daysFrom(today, i.etd) === 0).length : 0;

  // --- DAEs que vencen en los próximos 7 días (primera página) ---
  const vigenciaColumn = findVigenciaColumn(daes.page?.columns ?? []);
  const daesLoading = !daes.page && !daes.error;
  const daesFailed = !daes.page && Boolean(daes.error);
  const daesPorVencer =
    today && vigenciaColumn
      ? (daes.page?.items ?? []).filter((row) => {
          const d = daysFrom(today, row.raw[vigenciaColumn]);
          return d !== null && d >= 0 && d <= DAE_EXPIRY_WINDOW;
        }).length
      : 0;
  const daesHint = daes.page?.hasNextPage
    ? `En los próximos ${DAE_EXPIRY_WINDOW} días (primera página)`
    : `En los próximos ${DAE_EXPIRY_WINDOW} días`;

  // --- Sync EBF ↔ Access ---
  const syncLoading = !sync.stats && !sync.error;
  const mismatches = sync.stats?.byStatus.MISMATCH ?? 0;

  return (
    <AppPage title={title} subtitle={subtitle} actions={<EbfStatusChip />}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          mb: 2.5,
        }}
      >
        <KpiCard
          label="Coordinaciones vigentes"
          href="/ebf/coordinaciones"
          icon={<CoordinacionesIcon />}
          tone="primary"
          loading={coordLoading}
          unavailable={coordFailed ? LOAD_FAILED : null}
          value={formatCount(coordItems.length, coordHasMore)}
          hint={coordHasMore ? 'Hay más en el portal EBF' : 'En el portal EBF'}
        />
        <KpiCard
          label="Salen hoy"
          href="/ebf/coordinaciones"
          icon={<FlightIcon />}
          tone="info"
          loading={coordLoading || !today}
          unavailable={coordFailed ? LOAD_FAILED : null}
          value={formatCount(salenHoy)}
          hint={today ? `ETD ${formatDate(today)}${coordHasMore ? ' (primera página)' : ''}` : undefined}
        />
        <KpiCard
          label="DAEs por vencer"
          href="/ebf/daes"
          icon={<DaesIcon />}
          tone="warning"
          loading={daesLoading || !today}
          unavailable={daesFailed ? LOAD_FAILED : !vigenciaColumn ? 'Sin fecha de vigencia' : null}
          value={formatCount(daesPorVencer)}
          hint={daesHint}
          highlight={daesPorVencer > 0}
        />
        <KpiCard
          label="Discrepancias de sync"
          href="/sync/ebf-access"
          icon={<SyncIcon />}
          tone="error"
          loading={syncLoading}
          unavailable={sync.stats ? null : 'Sin datos'}
          value={formatCount(mismatches)}
          hint={sync.stats ? `De ${formatCount(sync.stats.total)} comparadas con Access` : undefined}
          highlight={mismatches > 0}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          alignItems: 'start',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 2fr) minmax(0, 1fr)' },
        }}
      >
        <UpcomingDepartures
          items={coord.page?.items}
          today={today}
          loading={coordLoading}
          error={coordFailed ? coord.error : undefined}
          onRetry={() => coord.mutate()}
        />
        <QuickActions isAdmin={isAdmin} />
      </Box>
    </AppPage>
  );
}
