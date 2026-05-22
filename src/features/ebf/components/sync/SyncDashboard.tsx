'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  Refresh as RefreshIcon,
  CheckCircleOutline as SyncedIcon,
  ErrorOutline as MismatchIcon,
  HelpOutline as OnlyEbfIcon,
  Storage as OnlyAccessIcon,
  Block as IgnoredIcon,
} from '@mui/icons-material';
import { useSyncList, useSyncRunner, useSyncStats } from '../../hooks/useSync';
import type {
  EbfCoordinacionSync,
  SyncStatus,
  SyncStatusFilter,
} from '../../types/sync';

const BUCKETS: Array<{
  key: SyncStatusFilter;
  label: string;
  color:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
  icon?: React.ReactNode;
}> = [
  { key: 'ALL', label: 'Todos', color: 'default' },
  { key: 'SYNCED', label: 'Sincronizados', color: 'success', icon: <SyncedIcon /> },
  {
    key: 'MISMATCH',
    label: 'Con discrepancia',
    color: 'error',
    icon: <MismatchIcon />,
  },
  {
    key: 'ONLY_EBF',
    label: 'Solo en EBF',
    color: 'warning',
    icon: <OnlyEbfIcon />,
  },
  {
    key: 'ONLY_ACCESS',
    label: 'Solo en Access',
    color: 'info',
    icon: <OnlyAccessIcon />,
  },
  {
    key: 'MANUAL_REVIEW',
    label: 'Revisar',
    color: 'secondary',
  },
  {
    key: 'IGNORED',
    label: 'Ignorados',
    color: 'default',
    icon: <IgnoredIcon />,
  },
];

const statusColor = (s: SyncStatus): typeof BUCKETS[number]['color'] => {
  const found = BUCKETS.find((b) => b.key === s);
  return found?.color ?? 'default';
};

const NUM = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString('es-EC', { maximumFractionDigits: 3 });

export function SyncDashboard() {
  const [bucket, setBucket] = useState<SyncStatusFilter>('MISMATCH');
  const { stats, mutate: mutateStats } = useSyncStats();
  const {
    rows,
    error: listError,
    isLoading: listLoading,
    mutate: mutateList,
  } = useSyncList(bucket, 200);
  const { run, running, lastReport, error: runError } = useSyncRunner();

  const onRun = async () => {
    try {
      await run();
      await Promise.all([mutateStats(), mutateList()]);
    } catch {
      /* error ya en runError */
    }
  };

  return (
    <Stack spacing={3}>
      {/* Stats cards + acciones */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
      >
        <Grid container spacing={1} sx={{ flexGrow: 1 }}>
          {BUCKETS.filter((b) => b.key !== 'ALL').map((b) => (
            <Grid key={b.key} size={{ xs: 6, sm: 4, md: 2 }}>
              <Card
                variant="outlined"
                onClick={() => setBucket(b.key)}
                sx={{
                  cursor: 'pointer',
                  borderColor:
                    bucket === b.key ? `${b.color}.main` : 'divider',
                  borderWidth: bucket === b.key ? 2 : 1,
                }}
              >
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">
                    {b.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {stats?.byStatus[b.key as SyncStatus] ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Stack spacing={1} alignItems="flex-end">
          <Button
            variant="contained"
            color="primary"
            startIcon={running ? <CircularProgress size={16} /> : <RunIcon />}
            onClick={onRun}
            disabled={running}
          >
            {running ? 'Sincronizando…' : 'Sincronizar ahora'}
          </Button>
          <Typography variant="caption" color="text.secondary">
            total: {stats?.total ?? 0}
          </Typography>
        </Stack>
      </Stack>

      {/* Último report */}
      {lastReport && (
        <Alert
          severity={lastReport.errors.length > 0 ? 'warning' : 'success'}
        >
          Último ciclo: {lastReport.totals.matched} OK ·{' '}
          {lastReport.totals.mismatches} mismatches ·{' '}
          {lastReport.totals.onlyEbf} only-EBF · {lastReport.totals.onlyAccess}{' '}
          only-Access · {lastReport.durationMs}ms.
          {lastReport.errors.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {lastReport.errors.map((e, i) => (
                <Typography key={i} variant="caption" component="div">
                  ⚠️ <strong>{e.stage}</strong>: {e.message}
                </Typography>
              ))}
            </Box>
          )}
        </Alert>
      )}
      {runError && (
        <Alert severity="error">
          Sync falló: {(runError as Error).message}
        </Alert>
      )}

      {/* Bucket selector */}
      <Stack direction="row" alignItems="center" spacing={2}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={bucket}
          onChange={(_, v: SyncStatusFilter | null) => v && setBucket(v)}
        >
          {BUCKETS.map((b) => (
            <ToggleButton key={b.key} value={b.key}>
              {b.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <IconButton
          size="small"
          onClick={() => {
            mutateStats();
            mutateList();
          }}
          aria-label="Refrescar"
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" color="text.secondary">
          {rows?.length ?? 0} filas
        </Typography>
      </Stack>

      {/* Tabla */}
      {listError ? (
        <Alert severity="error">
          Error cargando lista: {(listError as Error).message}
        </Alert>
      ) : listLoading && !rows ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <SyncTable rows={rows ?? []} />
      )}
    </Stack>
  );
}

function SyncTable({ rows }: { rows: EbfCoordinacionSync[] }) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>AWB</TableCell>
            <TableCell>Exportador</TableCell>
            <TableCell>Consignee</TableCell>
            <TableCell>Producto</TableCell>
            <TableCell>DAE</TableCell>
            <TableCell>HAWB EBF</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell align="right">BXS-COO</TableCell>
            <TableCell align="right">PCS-COO</TableCell>
            <TableCell align="center">Match</TableCell>
            <TableCell align="center">Access links</TableCell>
            <TableCell>Discrepancias</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={12} align="center">
                Sin filas en este bucket.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{r.awbNumber}</TableCell>
                <TableCell>
                  {r.exportadorEbf}
                  {!r.isOwnedByExperts && (
                    <Tooltip title="AWB no es de EXPERTS — se excluye del sync por defecto">
                      <Chip
                        size="small"
                        label="ajeno"
                        color="default"
                        variant="outlined"
                        sx={{ ml: 0.5 }}
                      />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>{r.consigneeAlias ?? '—'}</TableCell>
                <TableCell>{r.productoEbf ?? '—'}</TableCell>
                <TableCell>{r.daeNumber ?? '—'}</TableCell>
                <TableCell>{r.ebfHawbCode ?? '—'}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={r.status}
                    color={statusColor(r.status)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">{NUM(r.ebfBxsCoo)}</TableCell>
                <TableCell align="right">{NUM(r.ebfPcsCoo)}</TableCell>
                <TableCell align="center">
                  <Typography variant="caption">
                    {r.matchStrategy}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    {(r.matchConfidence * 100).toFixed(0)}%
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {r.accessLinks.length || '—'}
                </TableCell>
                <TableCell>
                  {r.discrepancies ? (
                    <DiscrepancyChips disc={r.discrepancies} />
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DiscrepancyChips({
  disc,
}: {
  disc: Record<string, { access: unknown; ebf: unknown }>;
}) {
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap">
      {Object.entries(disc).map(([field, vals]) => (
        <Tooltip
          key={field}
          title={`Access: ${String(vals.access)} · EBF: ${String(vals.ebf)}`}
        >
          <Chip size="small" label={field} color="warning" variant="outlined" />
        </Tooltip>
      ))}
    </Stack>
  );
}
