'use client';

import { useState, type FormEvent } from 'react';
import { Box, Button, Chip, TextField, Typography } from '@mui/material';
import {
  Search as SearchIcon,
  FlightTakeoff as DepartedIcon,
  Schedule as InProgressIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { DataTable, type DataTableColumn } from '@/shared/components/ui';
import { formatDate, toIsoDate } from '@/shared/utils';
import { useCustomerAwbs } from '../../hooks/useCustomerAwbs';
import type {
  AwbState,
  CustomerAwbListItem,
} from '../../types/customer-awb';

/** Rango por defecto: últimos N días hasta hoy (fechas locales, no UTC). */
function defaultEtdRange(daysBack = 30): { start: string; end: string } {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - daysBack);
  return { start: toIsoDate(start), end: toIsoDate(today) };
}

// El portal EBF devuelve los estados en inglés.
const STATE_LABELS: Record<string, string> = {
  DEPARTED: 'Salió',
  DELIVERED: 'Entregado',
  ARRIVED: 'Llegó',
  'IN PROGRESS': 'En proceso',
  IN_PROGRESS: 'En proceso',
  PENDING: 'Pendiente',
  CANCELLED: 'Cancelado',
};

const stateLabel = (label: string, state: AwbState) => {
  const raw = (label || state).trim();
  return STATE_LABELS[raw.toUpperCase()] ?? raw;
};

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
      label={stateLabel(label, state)}
      color={props.color}
      icon={props.icon}
      variant="outlined"
    />
  );
}

const NUM = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString('es-EC', { maximumFractionDigits: 3 });

const COLUMNS: DataTableColumn<CustomerAwbListItem>[] = [
  {
    key: 'awbNumber',
    label: 'AWB',
    description: 'Guía aérea master',
    value: (r) => r.awbNumber,
    render: (r) => (
      <Typography component="span" variant="inherit" fontWeight={600}>
        {r.awbNumber}
      </Typography>
    ),
    mobile: 'title',
  },
  {
    key: 'consignee',
    label: 'Consignatario',
    description: 'Cliente que recibe la carga',
    value: (r) => r.consignee,
    maxWidth: 240,
    mobile: 'subtitle',
  },
  {
    key: 'etd',
    label: 'ETD',
    description: 'Fecha estimada de salida',
    value: (r) => formatDate(r.etd, ''),
  },
  {
    key: 'eta',
    label: 'ETA',
    description: 'Fecha estimada de llegada',
    value: (r) => formatDate(r.eta, ''),
    defaultHidden: true,
  },
  { key: 'airline', label: 'Aerolínea', value: (r) => r.airline, maxWidth: 180 },
  {
    key: 'destinoAwb',
    label: 'Destino AWB',
    description: 'Aeropuerto de destino de la guía master',
    value: (r) => r.destinoAwb,
    defaultHidden: true,
  },
  {
    key: 'destinoFinal',
    label: 'Destino final',
    description: 'Ciudad o aeropuerto donde se entrega la carga',
    value: (r) => r.destinoFinal,
  },
  {
    key: 'bxsCoo',
    label: 'Cajas COO',
    description: 'Cajas coordinadas en equivalente full: 1 media caja = 0,5 (BXS-COO)',
    value: (r) => NUM(r.bxsCoo),
    align: 'right',
  },
  {
    key: 'pcsCoo',
    label: 'Piezas COO',
    description: 'Cajas físicas coordinadas, sin importar su tamaño (PCS-COO)',
    value: (r) => NUM(r.pcsCoo),
    align: 'right',
    defaultHidden: true,
  },
  {
    key: 'bxsWh',
    label: 'Cajas bodega',
    description: 'Cajas en equivalente full recibidas en bodega (BXS-WH)',
    value: (r) => NUM(r.bxsWh),
    align: 'right',
  },
  {
    key: 'pcsWh',
    label: 'Piezas bodega',
    description: 'Cajas físicas recibidas en bodega (PCS-WH)',
    value: (r) => NUM(r.pcsWh),
    align: 'right',
    defaultHidden: true,
  },
  {
    key: 'grossWeight',
    label: 'Peso bruto',
    description: 'Peso bruto en kg (gross weight)',
    value: (r) => NUM(r.grossWeight),
    align: 'right',
  },
  {
    key: 'chargeWeight',
    label: 'Peso cobrable',
    description: 'Peso facturable en kg: el mayor entre peso bruto y volumétrico (chargeable weight)',
    value: (r) => NUM(r.chargeWeight),
    align: 'right',
    defaultHidden: true,
  },
  {
    key: 'state',
    label: 'Estado',
    value: (r) => r.stateLabel || r.state,
    render: (r) => stateChip(r.state, r.stateLabel),
    align: 'center',
  },
];

interface AppliedQuery {
  etdStart: string;
  etdEnd: string;
  aerolinea: string;
  awb: string;
  page: number;
}

export function CustomerAwbsListPage() {
  const router = useRouter();
  const [defaults] = useState(() => defaultEtdRange(30));
  const [etdStart, setEtdStart] = useState(defaults.start);
  const [etdEnd, setEtdEnd] = useState(defaults.end);
  const [aerolinea, setAerolinea] = useState('');
  const [awb, setAwb] = useState('');
  const [applied, setApplied] = useState<AppliedQuery>({
    etdStart: defaults.start,
    etdEnd: defaults.end,
    aerolinea: '',
    awb: '',
    page: 1,
  });

  const {
    page: data,
    error,
    isValidating,
    mutate,
    refresh,
    refreshing,
    refreshError,
  } = useCustomerAwbs({
    etdStart: applied.etdStart,
    etdEnd: applied.etdEnd,
    aerolinea: applied.aerolinea || undefined,
    awb: applied.awb || undefined,
    page: applied.page,
  });

  const rangeInvalid = Boolean(etdStart && etdEnd && etdStart > etdEnd);
  const canApply = Boolean(etdStart && etdEnd) && !rangeInvalid;

  const applyFilters = (e: FormEvent) => {
    e.preventDefault();
    if (!canApply) return;
    setApplied({ etdStart, etdEnd, aerolinea: aerolinea.trim(), awb: awb.trim(), page: 1 });
  };

  const rows = data?.items ?? [];
  const totals = data?.totals;

  return (
    <DataTable
      id="ebf-customer-awbs"
      columns={COLUMNS}
      rows={rows}
      getRowId={(r) => String(r.id)}
      loading={isValidating || refreshing}
      error={error ?? refreshError}
      onRetry={() => (error ? mutate() : refresh())}
      onRefresh={refresh}
      onRowClick={(r) => router.push(`/ebf/customer/awbs/${r.id}`)}
      filters={
        <Box
          component="form"
          onSubmit={applyFilters}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            alignItems: 'flex-start',
          }}
        >
          <TextField
            label="ETD desde"
            type="date"
            size="small"
            value={etdStart}
            onChange={(e) => setEtdStart(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            required
            sx={{ width: 160 }}
          />
          <TextField
            label="ETD hasta"
            type="date"
            size="small"
            value={etdEnd}
            onChange={(e) => setEtdEnd(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            required
            error={rangeInvalid}
            helperText={rangeInvalid ? 'Debe ser igual o posterior a "desde"' : undefined}
            sx={{ width: 160 }}
          />
          <TextField
            label="Aerolínea"
            placeholder="Contiene…"
            size="small"
            value={aerolinea}
            onChange={(e) => setAerolinea(e.target.value)}
            sx={{ width: 160 }}
          />
          <TextField
            label="AWB"
            placeholder="Contiene…"
            size="small"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
            sx={{ width: 160 }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<SearchIcon />}
            disabled={!canApply}
            sx={{ height: 40 }}
          >
            Filtrar
          </Button>
        </Box>
      }
      pagination={{
        page: data?.page ?? applied.page,
        hasNextPage: Boolean(data?.hasNextPage),
        onPageChange: (page) => setApplied((q) => ({ ...q, page })),
      }}
      totals={
        totals
          ? {
              bxsCoo: NUM(totals.bxsCoo),
              pcsCoo: NUM(totals.pcsCoo),
              bxsWh: NUM(totals.bxsWh),
              pcsWh: NUM(totals.pcsWh),
              grossWeight: NUM(totals.grossWeight),
              chargeWeight: NUM(totals.chargeWeight),
            }
          : undefined
      }
      emptyMessage="No hay AWBs para los filtros aplicados."
    />
  );
}
