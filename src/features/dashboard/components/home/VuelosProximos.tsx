'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Card, Divider, List, ListItem, ListItemButton, Skeleton, Stack, Typography } from '@mui/material';
import { ArrowForward as ArrowIcon, FlightTakeoff as FlightIcon } from '@mui/icons-material';
import { getErrorMessage } from '@/shared/utils/errors';
import { EstadoCoordinacionChip } from '@/features/operacion/components/EstadoCoordinacionChip';
import type { CoordinacionResumen } from '@/features/operacion/types/coordinacion';
import { formatoAwb, nombreCorto, num, ordenDelDia } from '@/features/operacion/utils/formato';
import { formatLongDate } from './home.utils';

/** Guías que se muestran por día; el resto, en la lista del día. */
const POR_DIA = 8;

export interface DiaDeVuelo {
  iso: string;
  fecha: Date;
  etiqueta: string;
}

interface VuelosProximosProps {
  dias: DiaDeVuelo[];
  items?: CoordinacionResumen[];
  loading: boolean;
  error?: unknown;
  onRetry: () => void;
}

/** Hoy y mañana: las guías de cada vuelo, en el orden de la lista del día. */
export function VuelosProximos({ dias, items, loading, error, onRetry }: VuelosProximosProps) {
  let body: ReactNode;
  if (loading) {
    body = (
      <Stack divider={<Divider />}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Box key={i} sx={{ px: 2, py: 1.25 }}>
            <Skeleton variant="text" width="35%" />
            <Skeleton variant="text" width="60%" />
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
  } else {
    body = dias.map((d, i) => {
      const delDia = (items ?? []).filter((c) => c.fechaVuelo === d.iso && c.estado !== 'ANULADO').sort(ordenDelDia);
      const fulls = delDia.reduce((s, c) => s + (c.totalFulls ?? 0), 0);
      return (
        <Box key={d.iso}>
          {i > 0 && <Divider />}
          <Stack direction="row" alignItems="baseline" spacing={1} sx={{ px: 2, pt: 1.5, pb: 0.75 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {d.etiqueta}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }} noWrap>
              {formatLongDate(d.fecha)}
            </Typography>
            {delDia.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                {delDia.length === 1 ? '1 guía' : `${delDia.length} guías`} · {num(fulls)} fulls
              </Typography>
            )}
          </Stack>
          {delDia.length === 0 ? (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, pb: 1.5, color: 'text.secondary' }}>
              <FlightIcon fontSize="small" />
              <Typography variant="body2">Sin guías coordinadas.</Typography>
            </Stack>
          ) : (
            <List disablePadding>
              {delDia.slice(0, POR_DIA).map((c) => (
                <ListItem key={c.id} disablePadding>
                  <ListItemButton component={Link} href={`/operacion/coordinaciones/${c.id}`} sx={{ px: 2, py: 0.75, borderRadius: 0 }}>
                    <Fila c={c} />
                  </ListItemButton>
                </ListItem>
              ))}
              {delDia.length > POR_DIA && (
                <ListItem disablePadding>
                  <Button
                    component={Link}
                    href={`/operacion/coordinaciones?dia=${d.iso}`}
                    size="small"
                    endIcon={<ArrowIcon />}
                    sx={{ mx: 1, mb: 1 }}
                  >
                    Ver las {delDia.length} guías del día
                  </Button>
                </ListItem>
              )}
            </List>
          )}
        </Box>
      );
    });
  }

  return (
    <Card>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ px: 2, py: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" component="h2" fontWeight={600}>
            Próximos vuelos
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Coordinaciones de hoy y mañana, por aerolínea
          </Typography>
        </Box>
        <Button component={Link} href="/operacion/coordinaciones" size="small" endIcon={<ArrowIcon />} sx={{ flexShrink: 0 }}>
          Coordinaciones
        </Button>
      </Stack>
      <Divider />
      {body}
    </Card>
  );
}

function Fila({ c }: { c: CoordinacionResumen }) {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr) auto', sm: '120px minmax(0, 0.8fr) minmax(0, 1.6fr) 84px 72px' },
        columnGap: 2,
        alignItems: 'center',
      }}
    >
      <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {formatoAwb(c.numeroGuia)}
      </Typography>
      <Typography variant="body2" color="text.secondary" noWrap sx={{ display: { xs: 'none', sm: 'block' } }}>
        {nombreCorto(c.aerolinea)}
      </Typography>
      <Typography variant="body2" noWrap title={c.consignatario?.nombre} sx={{ display: { xs: 'none', sm: 'block' } }}>
        {c.consignatario?.nombre ?? '—'}
      </Typography>
      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        <EstadoCoordinacionChip estado={c.estado} />
      </Box>
      <Typography variant="body2" color="text.secondary" align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {num(c.totalFulls)} fulls
      </Typography>
    </Box>
  );
}
