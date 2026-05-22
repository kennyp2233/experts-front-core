'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  FlightTakeoff as DepartedIcon,
  Schedule as InProgressIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useCustomerAwbs } from '../../hooks/useCustomerAwbs';
import type {
  AwbState,
  CustomerAwbListItem,
} from '../../types/customer-awb';

/** Devuelve fecha YYYY-MM-DD para hoy y N días atrás. */
function defaultEtdRange(daysBack = 30): { start: string; end: string } {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - daysBack);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(today) };
}

function stateChip(state: AwbState, label: string) {
  const props = {
    IN_PROGRESS: {
      color: 'default' as const,
      icon: <InProgressIcon fontSize="small" />,
    },
    DEPARTED: {
      color: 'primary' as const,
      icon: <DepartedIcon fontSize="small" />,
    },
    UNKNOWN: { color: 'default' as const, icon: undefined },
  }[state];
  return (
    <Chip
      size="small"
      label={label || state}
      color={props.color}
      icon={props.icon}
      variant="outlined"
    />
  );
}

const NUM = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString('es-EC', { maximumFractionDigits: 3 });

export function CustomerAwbsListPage() {
  const defaults = defaultEtdRange(30);
  const [etdStart, setEtdStart] = useState(defaults.start);
  const [etdEnd, setEtdEnd] = useState(defaults.end);
  const [aerolinea, setAerolinea] = useState('');
  const [awb, setAwb] = useState('');
  const [page, setPage] = useState(1);
  const [appliedQuery, setAppliedQuery] = useState({
    etdStart: defaults.start,
    etdEnd: defaults.end,
    aerolinea: '',
    awb: '',
    page: 1,
  });

  const {
    page: data,
    error,
    isLoading,
    mutate,
  } = useCustomerAwbs({
    etdStart: appliedQuery.etdStart,
    etdEnd: appliedQuery.etdEnd,
    aerolinea: appliedQuery.aerolinea || undefined,
    awb: appliedQuery.awb || undefined,
    page: appliedQuery.page,
  });

  const applyFilters = () => {
    setAppliedQuery({ etdStart, etdEnd, aerolinea, awb, page: 1 });
    setPage(1);
  };

  const onPage = (delta: number) => {
    const next = Math.max(1, page + delta);
    setPage(next);
    setAppliedQuery({ ...appliedQuery, page: next });
  };

  const rows = data?.items ?? [];
  const totals = data?.totals;

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="end">
          <TextField
            label="ETD desde"
            type="date"
            size="small"
            value={etdStart}
            onChange={(e) => setEtdStart(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="ETD hasta"
            type="date"
            size="small"
            value={etdEnd}
            onChange={(e) => setEtdEnd(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Aerolínea contiene"
            size="small"
            value={aerolinea}
            onChange={(e) => setAerolinea(e.target.value)}
          />
          <TextField
            label="AWB contiene"
            size="small"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
          />
          <Button
            variant="contained"
            size="small"
            startIcon={<SearchIcon />}
            onClick={applyFilters}
            disabled={!etdStart || !etdEnd}
          >
            Filtrar
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error">
          No se pudo cargar la lista de AWBs: {(error as Error).message}
        </Alert>
      )}

      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="body2" color="text.secondary">
          {rows.length} resultados — página {data?.page ?? page}
        </Typography>
        <IconButton
          size="small"
          onClick={() => mutate()}
          aria-label="Refrescar"
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Stack>

      {isLoading && !data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Consignee</TableCell>
                <TableCell>ETD</TableCell>
                <TableCell>ETA</TableCell>
                <TableCell>Airline</TableCell>
                <TableCell>D. AWB</TableCell>
                <TableCell>D. Final</TableCell>
                <TableCell>AWB</TableCell>
                <TableCell align="right">BXS-COO</TableCell>
                <TableCell align="right">PCS-COO</TableCell>
                <TableCell align="right">BXS-WH</TableCell>
                <TableCell align="right">PCS-WH</TableCell>
                <TableCell align="right">Gross</TableCell>
                <TableCell align="right">Charge</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} align="center">
                    Sin AWBs para los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r: CustomerAwbListItem) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.consignee ?? '—'}</TableCell>
                    <TableCell>{r.etd ?? '—'}</TableCell>
                    <TableCell>{r.eta ?? '—'}</TableCell>
                    <TableCell>{r.airline ?? '—'}</TableCell>
                    <TableCell>{r.destinoAwb ?? '—'}</TableCell>
                    <TableCell>{r.destinoFinal ?? '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.awbNumber}</TableCell>
                    <TableCell align="right">{NUM(r.bxsCoo)}</TableCell>
                    <TableCell align="right">{NUM(r.pcsCoo)}</TableCell>
                    <TableCell align="right">{NUM(r.bxsWh)}</TableCell>
                    <TableCell align="right">{NUM(r.pcsWh)}</TableCell>
                    <TableCell align="right">{NUM(r.grossWeight)}</TableCell>
                    <TableCell align="right">{NUM(r.chargeWeight)}</TableCell>
                    <TableCell align="center">
                      {stateChip(r.state, r.stateLabel)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        component={Link}
                        href={`/ebf/customer/awbs/${r.id}`}
                        aria-label="Ver detalle"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {totals && rows.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7} sx={{ fontWeight: 600 }}>
                    Totales
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {NUM(totals.bxsCoo)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {NUM(totals.pcsCoo)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {NUM(totals.bxsWh)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {NUM(totals.pcsWh)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {NUM(totals.grossWeight)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {NUM(totals.chargeWeight)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
      )}

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button
          size="small"
          disabled={page <= 1 || isLoading}
          onClick={() => onPage(-1)}
        >
          Anterior
        </Button>
        <Button
          size="small"
          disabled={!data?.hasNextPage || isLoading}
          onClick={() => onPage(1)}
        >
          Siguiente
        </Button>
      </Stack>
    </Stack>
  );
}
