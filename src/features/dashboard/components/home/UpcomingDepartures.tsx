'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  List,
  ListItem,
  ListItemButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { ArrowForward as ArrowIcon, FlightTakeoff as FlightIcon } from '@mui/icons-material';
import type { CoordinacionListItem } from '@/features/ebf';
import { formatDate, parseDate } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/utils/errors';
import { daysFrom, relativeDayLabel } from './home.utils';

const MAX_ROWS = 6;

interface Departure {
  item: CoordinacionListItem;
  date: Date;
  days: number;
}

/** Próximas salidas por ETD (hoy en adelante), las más cercanas primero. */
export function selectUpcoming(
  items: CoordinacionListItem[],
  today: Date,
  limit = MAX_ROWS,
): Departure[] {
  return items
    .flatMap((item) => {
      const date = parseDate(item.etd);
      const days = date ? daysFrom(today, date) : null;
      return date && days !== null && days >= 0 ? [{ item, date, days }] : [];
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime() || (a.item.awb ?? '').localeCompare(b.item.awb ?? ''))
    .slice(0, limit);
}

interface UpcomingDeparturesProps {
  items?: CoordinacionListItem[];
  today: Date | null;
  loading: boolean;
  error?: unknown;
  onRetry: () => void;
}

export function UpcomingDepartures({ items, today, loading, error, onRetry }: UpcomingDeparturesProps) {
  const departures = items && today ? selectUpcoming(items, today) : [];

  let body: ReactNode;
  if (loading || !today) {
    body = (
      <Stack divider={<Divider />}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box key={i} sx={{ px: 2, py: 1.25 }}>
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="70%" />
          </Box>
        ))}
      </Stack>
    );
  } else if (error) {
    body = (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              Reintentar
            </Button>
          }
        >
          {getErrorMessage(error, 'No se pudieron cargar las coordinaciones.')}
        </Alert>
      </Box>
    );
  } else if (departures.length === 0) {
    body = (
      <Stack alignItems="center" spacing={1} sx={{ py: 5, px: 2, color: 'text.secondary', textAlign: 'center' }}>
        <FlightIcon />
        <Typography variant="body2">No hay salidas programadas desde hoy en las coordinaciones vigentes.</Typography>
      </Stack>
    );
  } else {
    body = (
      <List disablePadding>
        {departures.map(({ item, date, days }, index) => (
          <ListItem key={item.detalleId ?? `${item.awb}-${index}`} disablePadding divider={index < departures.length - 1}>
            <ListItemButton
              component={Link}
              href={item.detalleId ? `/ebf/coordinaciones/${encodeURIComponent(item.detalleId)}` : '/ebf/coordinaciones'}
              sx={{ px: 2, py: 1, borderRadius: 0, mb: 0 }}
            >
              <DepartureRow item={item} date={date} days={days} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    );
  }

  return (
    <Card variant="outlined" sx={{ '&:hover': { transform: 'none' } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ px: 2, py: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" component="h2" fontWeight={600}>
            Próximas salidas
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Coordinaciones vigentes ordenadas por ETD
          </Typography>
        </Box>
        <Button component={Link} href="/ebf/coordinaciones" size="small" endIcon={<ArrowIcon />} sx={{ flexShrink: 0 }}>
          Ver todas
        </Button>
      </Stack>
      <Divider />
      {body}
    </Card>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
      <Typography variant="caption" color="text.secondary" display="block" noWrap>
        {label}
      </Typography>
      <Typography variant="body2" noWrap title={value ?? undefined}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

function DepartureRow({ item, date, days }: Departure) {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: {
          xs: '72px minmax(0, 1fr)',
          sm: '84px minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 0.9fr)',
        },
        columnGap: 2,
        alignItems: 'center',
      }}
    >
      <Box>
        <Typography variant="body2" fontWeight={600} color={days === 0 ? 'primary.main' : 'text.primary'}>
          {relativeDayLabel(date, days)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatDate(date)}
        </Typography>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {item.awb || 'Sin AWB'}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" noWrap title={item.exportador ?? undefined}>
          {item.exportador || '—'}
        </Typography>
        {/* En móvil, producto y destino van en una segunda línea */}
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ display: { xs: 'block', sm: 'none' } }}
        >
          {[item.producto, item.destinoFinal].filter(Boolean).join(' · ') || '—'}
        </Typography>
      </Box>
      <Field label="Producto" value={item.producto} />
      <Field label="Destino final" value={item.destinoFinal} />
    </Box>
  );
}
