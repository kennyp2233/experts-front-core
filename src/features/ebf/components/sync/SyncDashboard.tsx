'use client';

import { useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import {
  PlayArrow as RunIcon,
  CheckCircleOutline as SyncedIcon,
  ErrorOutline as MismatchIcon,
  CloudOutlined as OnlyEbfIcon,
  Storage as OnlyAccessIcon,
  RateReviewOutlined as ReviewIcon,
  Block as IgnoredIcon,
} from '@mui/icons-material';
import { AppPage } from '@/shared/components/ui/AppPage';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { getErrorMessage } from '@/shared/utils/errors';
import { formatDate, formatDateTime } from '@/shared/utils/format';
import { useSyncList, useSyncRunner, useSyncStats } from '../../hooks/useSync';
import type {
  EbfCoordinacionSync,
  MatchStrategy,
  SyncCycleReport,
  SyncStatus,
  SyncStatusFilter,
} from '../../types/sync';

const LIST_LIMIT = 200;

type Tone = 'success' | 'error' | 'warning' | 'info' | 'secondary' | 'neutral';

interface StatusMeta {
  label: string;
  description: string;
  tone: Tone;
  icon: ReactNode;
}

/** Orden de las tarjetas: primero lo que requiere atención. */
const STATUS_ORDER: SyncStatus[] = [
  'MISMATCH',
  'ONLY_EBF',
  'ONLY_ACCESS',
  'MANUAL_REVIEW',
  'SYNCED',
  'IGNORED',
];

const STATUS_META: Record<SyncStatus, StatusMeta> = {
  MISMATCH: {
    label: 'Con discrepancia',
    description: 'Están en EBF y en Access, pero algún dato no coincide.',
    tone: 'error',
    icon: <MismatchIcon fontSize="small" />,
  },
  ONLY_EBF: {
    label: 'Solo en EBF',
    description: 'Coordinadas en el portal EBF sin registro en Access.',
    tone: 'warning',
    icon: <OnlyEbfIcon fontSize="small" />,
  },
  ONLY_ACCESS: {
    label: 'Solo en Access',
    description: 'Registradas en Access sin coordinación en el portal EBF.',
    tone: 'info',
    icon: <OnlyAccessIcon fontSize="small" />,
  },
  MANUAL_REVIEW: {
    label: 'Por revisar',
    description: 'El emparejamiento no es seguro; conviene revisarlas a mano.',
    tone: 'secondary',
    icon: <ReviewIcon fontSize="small" />,
  },
  SYNCED: {
    label: 'Sincronizadas',
    description: 'Coinciden en EBF y en Access.',
    tone: 'success',
    icon: <SyncedIcon fontSize="small" />,
  },
  IGNORED: {
    label: 'Ignoradas',
    description: 'Excluidas de la comparación (p. ej. AWB de otra agencia).',
    tone: 'neutral',
    icon: <IgnoredIcon fontSize="small" />,
  },
};

const MATCH_LABELS: Record<MatchStrategy, string> = {
  AWB_EXACT: 'AWB exacto',
  DAE_ONLY: 'Solo por DAE',
  COMPOSITE: 'Compuesto',
  MANUAL: 'Manual',
  NONE: 'Sin emparejar',
};

const toneColor = (theme: Theme, tone: Tone) =>
  tone === 'neutral' ? theme.palette.text.secondary : theme.palette[tone].main;

const chipColor = (tone: Tone) => (tone === 'neutral' ? 'default' : tone);

const filterLabel = (f: SyncStatusFilter) => (f === 'ALL' ? 'Todas' : STATUS_META[f].label);

const NUM = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString('es-EC', { maximumFractionDigits: 3 });

const COUNT = (n: number) => n.toLocaleString('es-EC');

export function SyncDashboard() {
  const [bucket, setBucket] = useState<SyncStatusFilter>('MISMATCH');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { stats, error: statsError, mutate: mutateStats } = useSyncStats();
  const {
    rows,
    error: listError,
    isLoading: listLoading,
    mutate: mutateList,
  } = useSyncList(bucket, LIST_LIMIT);
  const { run, running, lastReport, error: runError, dismissReport, dismissError } = useSyncRunner();

  const statsLoading = !stats && !statsError;
  const loadError = statsError ?? listError;

  const refreshAll = () => {
    mutateStats();
    mutateList();
  };

  // Clic en la tarjeta seleccionada = quitar el filtro.
  const selectBucket = (next: SyncStatusFilter) => setBucket((cur) => (cur === next ? 'ALL' : next));

  const onConfirmRun = async () => {
    setConfirmOpen(false);
    try {
      await run();
    } catch {
      /* el error queda en runError */
    }
  };

  return (
    <AppPage
      title="Sincronización EBF ↔ Access"
      subtitle="Compara las coordinaciones del portal EBF con los registros de Access y señala las diferencias."
      actions={
        <Button
          variant="contained"
          startIcon={running ? <CircularProgress size={16} color="inherit" /> : <RunIcon />}
          onClick={() => setConfirmOpen(true)}
          disabled={running}
        >
          {running ? 'Sincronizando…' : 'Sincronizar ahora'}
        </Button>
      }
    >
      <Stack spacing={2}>
        {running && (
          <Alert severity="info">
            Sincronizando con EBF y Access. Puede tardar hasta 2 minutos; puedes seguir usando la app.
          </Alert>
        )}
        {lastReport && !running && <ReportAlert report={lastReport} onClose={dismissReport} />}
        {Boolean(runError) && !running && (
          <Alert severity="error" onClose={dismissError}>
            No se pudo completar la sincronización.{' '}
            {getErrorMessage(runError, 'Intenta de nuevo en unos minutos.')}
          </Alert>
        )}
        {loadError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={refreshAll}>
                Reintentar
              </Button>
            }
          >
            No se pudieron cargar los datos de sincronización.{' '}
            {getErrorMessage(loadError, 'Intenta de nuevo en unos minutos.')}
          </Alert>
        )}

        {/* Tarjetas de estado = filtro de la tabla */}
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
            sx={{ mb: 1 }}
          >
            <Typography variant="body2" color="text.secondary">
              {stats
                ? `${COUNT(stats.total)} coordinaciones comparadas · elige un estado para filtrar`
                : 'Elige un estado para filtrar'}
            </Typography>
            <Button
              size="small"
              variant={bucket === 'ALL' ? 'contained' : 'outlined'}
              onClick={() => setBucket('ALL')}
              aria-pressed={bucket === 'ALL'}
              sx={{ flexShrink: 0 }}
            >
              Ver todas
            </Button>
          </Stack>
          <Box
            role="group"
            aria-label="Filtrar por estado"
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(6, minmax(0, 1fr))',
              },
            }}
          >
            {STATUS_ORDER.map((status) => (
              <StatusCard
                key={status}
                meta={STATUS_META[status]}
                count={stats ? stats.byStatus[status] ?? 0 : null}
                loading={statsLoading}
                selected={bucket === status}
                onClick={() => selectBucket(status)}
              />
            ))}
          </Box>
        </Box>

        {/* Con la lista caída no se pinta la tabla: el aviso de arriba ya lo explica. */}
        {!listError && (
          <DataTable<EbfCoordinacionSync>
            id="sync-ebf-access"
            columns={COLUMNS}
            rows={rows ?? []}
            getRowId={(r) => String(r.id)}
            loading={listLoading}
            onRefresh={refreshAll}
            searchable
            searchPlaceholder="Buscar AWB, exportador, DAE…"
            filters={
              <Tooltip title={bucket === 'ALL' ? '' : STATUS_META[bucket].description}>
                <Chip
                  size="small"
                  label={`Estado: ${filterLabel(bucket)}`}
                  color={bucket === 'ALL' ? 'default' : chipColor(STATUS_META[bucket].tone)}
                  variant="outlined"
                  onDelete={bucket === 'ALL' ? undefined : () => setBucket('ALL')}
                />
              </Tooltip>
            }
            emptyMessage={
              bucket === 'ALL'
                ? 'Aún no hay coordinaciones comparadas. Usa «Sincronizar ahora» para generar la primera comparación.'
                : `No hay coordinaciones en «${filterLabel(bucket)}».`
            }
          />
        )}
        {!listError && rows && rows.length >= LIST_LIMIT && (
          <Typography variant="caption" color="text.secondary">
            Se muestran las primeras {LIST_LIMIT} coordinaciones de este estado.
          </Typography>
        )}
      </Stack>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Sincronizar ahora?</DialogTitle>
        <DialogContent>
          <DialogContentText variant="body2" sx={{ mb: 1.5 }}>
            Se consultará el portal EBF y la base Access para actualizar esta comparación. Solo lee
            datos: no modifica nada en EBF ni en Access.
          </DialogContentText>
          <DialogContentText variant="body2">
            Puede tardar hasta 2 minutos. La sincronización también corre sola en segundo plano, así
            que normalmente no hace falta lanzarla a mano.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={onConfirmRun} startIcon={<RunIcon />}>
            Sincronizar
          </Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}

function StatusCard({
  meta,
  count,
  loading,
  selected,
  onClick,
}: {
  meta: StatusMeta;
  count: number | null;
  loading: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={(theme) => {
        const color = toneColor(theme, meta.tone);
        return {
          height: '100%',
          borderColor: selected ? color : 'divider',
          bgcolor: selected ? alpha(color, 0.08) : 'background.paper',
          boxShadow: selected ? `inset 0 0 0 1px ${color}` : undefined,
          '&:hover': { transform: 'none' },
        };
      }}
    >
      <CardActionArea onClick={onClick} aria-pressed={selected} sx={{ height: '100%', p: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box
            component="span"
            sx={(theme) => ({ display: 'flex', color: toneColor(theme, meta.tone) })}
          >
            {meta.icon}
          </Box>
          <Typography variant="body2" color="text.secondary" fontWeight={selected ? 600 : 500} noWrap>
            {meta.label}
          </Typography>
        </Stack>
        {loading ? (
          <Skeleton variant="text" width={48} sx={{ fontSize: '1.5rem', mt: 0.5 }} />
        ) : (
          <Typography
            variant="h5"
            component="p"
            fontWeight={700}
            sx={{
              mt: 0.5,
              fontVariantNumeric: 'tabular-nums',
              color: count == null ? 'text.disabled' : 'text.primary',
            }}
          >
            {count == null ? '—' : COUNT(count)}
          </Typography>
        )}
      </CardActionArea>
    </Card>
  );
}

function ReportAlert({ report, onClose }: { report: SyncCycleReport; onClose: () => void }) {
  const t = report.totals;
  const seconds = (report.durationMs / 1000).toLocaleString('es-EC', { maximumFractionDigits: 1 });
  const hasErrors = report.errors.length > 0;
  return (
    <Alert severity={hasErrors ? 'warning' : 'success'} onClose={onClose}>
      Sincronización {hasErrors ? 'terminada con avisos' : 'completada'} en {seconds} s:{' '}
      {COUNT(t.matched)} coinciden · {COUNT(t.mismatches)} con discrepancia · {COUNT(t.onlyEbf)} solo
      en EBF · {COUNT(t.onlyAccess)} solo en Access.
      {hasErrors && (
        <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
          {report.errors.map((e, i) => (
            <Typography key={i} component="li" variant="caption">
              <strong>{e.stage}</strong>: {e.message}
            </Typography>
          ))}
        </Box>
      )}
    </Alert>
  );
}

function StatusChip({ status }: { status: SyncStatus }) {
  const meta = STATUS_META[status];
  if (!meta) return <Chip component="span" size="small" variant="outlined" label={status} />;
  return (
    <Chip component="span" size="small" variant="outlined" color={chipColor(meta.tone)} label={meta.label} />
  );
}

function DiscrepancyChips({ disc }: { disc: Record<string, { access: unknown; ebf: unknown }> }) {
  const entries = Object.entries(disc);
  const shown = entries.slice(0, 3);
  const rest = entries.length - shown.length;
  return (
    <Box component="span" sx={{ display: 'inline-flex', gap: 0.5 }}>
      {shown.map(([field, vals]) => (
        <Tooltip key={field} title={`Access: ${String(vals.access ?? '—')} · EBF: ${String(vals.ebf ?? '—')}`}>
          <Chip component="span" size="small" label={field} color="warning" variant="outlined" />
        </Tooltip>
      ))}
      {rest > 0 && (
        <Tooltip title={entries.slice(3).map(([f]) => f).join(', ')}>
          <Chip component="span" size="small" label={`+${rest}`} variant="outlined" />
        </Tooltip>
      )}
    </Box>
  );
}

const COLUMNS: DataTableColumn<EbfCoordinacionSync>[] = [
  {
    key: 'awb',
    label: 'AWB',
    pinned: true,
    mobile: 'title',
    value: (r) => r.awbNumber,
    render: (r) => (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        <Box component="span" sx={{ fontWeight: 600 }}>
          {r.awbNumber}
        </Box>
        {!r.isOwnedByExperts && (
          <Tooltip title="AWB de otra agencia: se excluye de la comparación por defecto.">
            <Chip component="span" size="small" variant="outlined" label="Otra agencia" />
          </Tooltip>
        )}
      </Box>
    ),
  },
  {
    key: 'status',
    label: 'Estado',
    mobile: 'field',
    value: (r) => STATUS_META[r.status]?.label ?? r.status,
    render: (r) => <StatusChip status={r.status} />,
  },
  {
    key: 'exportador',
    label: 'Exportador',
    mobile: 'subtitle',
    value: (r) => r.exportadorEbf,
  },
  { key: 'consignatario', label: 'Consignatario', value: (r) => r.consigneeAlias },
  { key: 'producto', label: 'Producto', value: (r) => r.productoEbf },
  {
    key: 'vuelo',
    label: 'Vuelo',
    description: 'Fecha de vuelo según EBF',
    value: (r) => (r.fechaVuelo ? formatDate(r.fechaVuelo) : null),
  },
  { key: 'destino', label: 'Destino final', defaultHidden: true, value: (r) => r.destinoFinal },
  { key: 'dae', label: 'DAE', value: (r) => r.daeNumber },
  { key: 'hawb', label: 'HAWB EBF', defaultHidden: true, value: (r) => r.ebfHawbCode },
  {
    key: 'cajas',
    label: 'Cajas',
    description: 'Cajas coordinadas en EBF (BXS-COO)',
    align: 'right',
    value: (r) => r.ebfBxsCoo,
    render: (r) => NUM(r.ebfBxsCoo),
  },
  {
    key: 'piezas',
    label: 'Piezas',
    description: 'Piezas coordinadas en EBF (PCS-COO)',
    align: 'right',
    value: (r) => r.ebfPcsCoo,
    render: (r) => NUM(r.ebfPcsCoo),
  },
  {
    key: 'diferencias',
    label: 'Diferencias',
    description: 'Campos que no coinciden entre Access y EBF (pasa el cursor para ver los valores)',
    maxWidth: 360,
    value: (r) => (r.discrepancies ? Object.keys(r.discrepancies).join(', ') : null),
    render: (r) =>
      r.discrepancies && Object.keys(r.discrepancies).length > 0 ? (
        <DiscrepancyChips disc={r.discrepancies} />
      ) : (
        '—'
      ),
  },
  {
    key: 'emparejamiento',
    label: 'Emparejamiento',
    description: 'Cómo se emparejó el registro de EBF con Access y con qué confianza',
    defaultHidden: true,
    value: (r) =>
      `${MATCH_LABELS[r.matchStrategy] ?? r.matchStrategy} · ${Math.round(r.matchConfidence * 100)}%`,
  },
  {
    key: 'registrosAccess',
    label: 'Registros Access',
    description: 'Filas de Access vinculadas a esta coordinación',
    align: 'right',
    defaultHidden: true,
    value: (r) => r.accessLinks.length,
    render: (r) => (r.accessLinks.length ? COUNT(r.accessLinks.length) : '—'),
  },
  {
    key: 'ultimaSync',
    label: 'Última sync',
    defaultHidden: true,
    value: (r) => (r.lastSyncAt ? formatDateTime(r.lastSyncAt) : null),
  },
];
