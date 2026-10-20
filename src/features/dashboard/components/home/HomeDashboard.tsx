'use client';

import Link from 'next/link';
import { Box, Card, Chip, Divider, Link as MuiLink, Stack, Tooltip, Typography } from '@mui/material';
import {
  CheckCircleOutline as OkIcon,
  ConfirmationNumberOutlined as StockIcon,
  ContentCut as PorCortarIcon,
  FlightTakeoff as HoyIcon,
  HourglassEmpty as PendingIcon,
  ScheduleOutlined as MananaIcon,
  WarningAmberOutlined as WarnIcon,
} from '@mui/icons-material';
import { AppPage } from '@/shared/components/ui/AppPage';
import { toIsoDate } from '@/shared/utils/format';
import { useAuth } from '@/features/auth';
import { useEbfHealth, useSyncStats } from '@/features/ebf';
import { useCoordinaciones } from '@/features/operacion/hooks/useCoordinaciones';
import { useResumenStock } from '@/features/operacion/hooks/useStockGuias';
import type { CoordinacionResumen } from '@/features/operacion/types/coordinacion';
import { num } from '@/features/operacion/utils/formato';
import { KpiCard } from './KpiCard';
import { VuelosProximos } from './VuelosProximos';
import { QuickActions } from './QuickActions';
import { useToday, type PartOfDay } from './useToday';
import { firstNameOf, formatCount, formatLongDate } from './home.utils';

const GREETINGS: Record<PartOfDay, string> = {
  morning: 'Buenos días',
  afternoon: 'Buenas tardes',
  evening: 'Buenas noches',
};

const LOAD_FAILED = 'No se pudo cargar';

/** Guías y fulls de un día de vuelo (sin las anuladas). */
function resumenDia(items: CoordinacionResumen[] | undefined, iso: string | null) {
  const delDia = (items ?? []).filter((c) => c.fechaVuelo === iso && c.estado !== 'ANULADO');
  return {
    guias: delDia.length,
    fulls: delDia.reduce((s, c) => s + (c.totalFulls ?? 0), 0),
    porCortar: delDia.filter((c) => c.estado === 'BORRADOR').length,
  };
}

/** La integración EBF, aparte y en chico: el inicio es de la operación propia. */
function EbfCard() {
  const { ok, isLoading } = useEbfHealth();
  const sync = useSyncStats();
  const diferencias = sync.stats?.byStatus.MISMATCH ?? 0;
  const estado = isLoading ? (
    <Chip size="small" icon={<PendingIcon />} label="Verificando…" />
  ) : ok ? (
    <Chip size="small" color="success" icon={<OkIcon />} label="Conectado" />
  ) : (
    <Tooltip title="Sin sesión con el portal EBF: sus coordinaciones y DAEs pueden no cargar.">
      <Chip size="small" color="warning" icon={<WarnIcon />} label="Sin conexión" />
    </Tooltip>
  );
  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Integración EBF
        </Typography>
        {estado}
      </Stack>
      <Divider />
      <Stack spacing={0.75} sx={{ px: 2, py: 1.5 }}>
        <MuiLink component={Link} href="/ebf/coordinaciones" variant="body2">
          Coordinaciones EBF
        </MuiLink>
        <MuiLink component={Link} href="/sync/ebf-access" variant="body2" color={diferencias > 0 ? 'error' : 'primary'}>
          {sync.stats ? `${formatCount(diferencias)} diferencias con Access` : 'Sincronización EBF'}
        </MuiLink>
      </Stack>
    </Card>
  );
}

/**
 * Inicio de la oficina: los vuelos de hoy y mañana, lo que falta cortar y las
 * guías libres. Cada bloque carga y falla por su cuenta.
 */
export function HomeDashboard() {
  const { user } = useAuth();
  const { today, partOfDay } = useToday();

  const hoy = today ? toIsoDate(today) : null;
  const manana = today ? toIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)) : null;

  const proximos = useCoordinaciones(hoy && manana ? { desde: hoy, hasta: manana, page: 1, pageSize: 200 } : null);
  const porCortar = useCoordinaciones({ estado: 'BORRADOR', page: 1, pageSize: 1 });
  const stock = useResumenStock();

  const isAdmin = user?.role === 'ADMIN';
  const firstName = firstNameOf(user?.firstName);
  const greeting = partOfDay ? GREETINGS[partOfDay] : 'Hola';
  const title = firstName ? `${greeting}, ${firstName}` : greeting;
  const subtitle = today ? formatLongDate(today) : undefined;

  const items = proximos.pagina?.items;
  const proximosLoading = !today || (!proximos.pagina && !proximos.error);
  const proximosFallo = !proximos.pagina && Boolean(proximos.error);
  const masDeUnaPagina = (proximos.pagina?.total ?? 0) > (items?.length ?? 0);
  const dHoy = resumenDia(items, hoy);
  const dManana = resumenDia(items, manana);

  const libres = (stock.resumen ?? []).reduce((s, a) => s + a.disponibles, 0);
  const aerolineasConStock = (stock.resumen ?? []).filter((a) => a.disponibles > 0).length;
  const totalPorCortar = porCortar.pagina?.total ?? 0;

  return (
    <AppPage title={title} subtitle={subtitle}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          mb: 2,
        }}
      >
        <KpiCard
          label="Vuelos de hoy"
          href={hoy ? `/operacion/coordinaciones?dia=${hoy}` : '/operacion/coordinaciones'}
          icon={<HoyIcon />}
          tone="primary"
          loading={proximosLoading}
          unavailable={proximosFallo ? LOAD_FAILED : null}
          value={formatCount(dHoy.guias, masDeUnaPagina)}
          hint={`${dHoy.guias === 1 ? 'guía' : 'guías'} · ${num(dHoy.fulls)} fulls`}
        />
        <KpiCard
          label="Vuelos de mañana"
          href={manana ? `/operacion/coordinaciones?dia=${manana}` : '/operacion/coordinaciones'}
          icon={<MananaIcon />}
          tone="info"
          loading={proximosLoading}
          unavailable={proximosFallo ? LOAD_FAILED : null}
          value={formatCount(dManana.guias, masDeUnaPagina)}
          hint={`${dManana.guias === 1 ? 'guía' : 'guías'} · ${num(dManana.fulls)} fulls`}
        />
        <KpiCard
          label="Por cortar"
          href="/operacion/coordinaciones?estado=BORRADOR"
          icon={<PorCortarIcon />}
          tone="warning"
          loading={!porCortar.pagina && !porCortar.error}
          unavailable={!porCortar.pagina && porCortar.error ? LOAD_FAILED : null}
          value={formatCount(totalPorCortar)}
          hint={dHoy.porCortar > 0 ? `${dHoy.porCortar} vuelan hoy` : 'Coordinaciones abiertas'}
          highlight={dHoy.porCortar > 0}
        />
        <KpiCard
          label="Guías libres"
          href="/operacion/guias/administracion"
          icon={<StockIcon />}
          tone="success"
          loading={!stock.resumen && !stock.error}
          unavailable={!stock.resumen && stock.error ? LOAD_FAILED : null}
          value={formatCount(libres)}
          hint={`En ${aerolineasConStock} ${aerolineasConStock === 1 ? 'aerolínea' : 'aerolíneas'}`}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          alignItems: 'start',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 2.2fr) minmax(0, 1fr)' },
        }}
      >
        <VuelosProximos
          dias={
            today && hoy && manana
              ? [
                  { iso: hoy, fecha: today, etiqueta: 'Hoy' },
                  { iso: manana, fecha: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), etiqueta: 'Mañana' },
                ]
              : []
          }
          items={items}
          loading={proximosLoading}
          error={proximosFallo ? proximos.error : undefined}
          onRetry={() => proximos.mutate()}
        />
        <Stack spacing={2}>
          <QuickActions isAdmin={isAdmin} />
          <EbfCard />
        </Stack>
      </Box>
    </AppPage>
  );
}
