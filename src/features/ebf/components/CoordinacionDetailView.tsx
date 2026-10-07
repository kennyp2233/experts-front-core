'use client';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import { ArrowBack, ExpandMore, OpenInNew } from '@mui/icons-material';
import Link from 'next/link';
import { useSWRConfig } from 'swr';
import { AppPage } from '@/shared/components/ui';
import { formatDate, formatDateTime, getErrorMessage } from '@/shared/utils';
import { useCoordinacionDetalle } from '../hooks/useEbf';
import type { CoordinacionListItem, CoordinacionListPage } from '../types/coordinacion';
import { EbfHealthBadge } from './EbfHealthBadge';

interface Props {
  id: string;
  /** A dónde vuelve el botón "Coordinaciones" (vigentes o histórico). */
  backHref?: string;
}

const PORTAL_BASE = 'https://portal.ebfcargo.com';

/**
 * El detalle del portal todavía no se descompone (el back devuelve el HTML
 * crudo). Para mostrar algo legible se reutiliza la fila de la lista que ya
 * está en la caché de SWR; si se entra por link directo no hay resumen.
 */
function useCachedListRow(id: string): CoordinacionListItem | null {
  const { cache } = useSWRConfig();
  for (const key of cache.keys()) {
    if (!key.startsWith('ebf/coordinaciones|')) continue;
    const page = cache.get(key)?.data as CoordinacionListPage | undefined;
    const row = page?.items?.find((r) => r.detalleId === id);
    if (row) return row;
  }
  return null;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} sx={{ overflowWrap: 'anywhere' }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

export function CoordinacionDetailView({ id, backHref = '/ebf/coordinaciones' }: Props) {
  const row = useCachedListRow(id);
  const { detalle, error, isLoading, mutate } = useCoordinacionDetalle(id);

  const rawDump =
    typeof detalle?.raw?.html === 'string'
      ? (detalle.raw.html as string).slice(0, 4000)
      : detalle
        ? JSON.stringify(detalle.raw, null, 2)
        : '';

  return (
    <AppPage
      title={row?.awb ? `Coordinación AWB ${row.awb}` : `Coordinación #${id}`}
      subtitle={
        row
          ? [row.exportador, row.marcacion, row.etd && `ETD ${formatDate(row.etd)}`]
              .filter(Boolean)
              .join(' · ')
          : 'Detalle de la coordinación en el portal EBF.'
      }
      actions={
        <>
          {/* En móvil se omite el estado de conexión para que las acciones quepan. */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <EbfHealthBadge />
          </Box>
          <Button component={Link} href={backHref} startIcon={<ArrowBack />} size="small">
            Coordinaciones
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<OpenInNew />}
            component="a"
            href={`${PORTAL_BASE}/exportador/detalle_coordinacion/${encodeURIComponent(id)}/`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Portal EBF
          </Button>
        </>
      }
    >
      {row ? (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            <Field label="ETD (salida estimada)" value={formatDate(row.etd, '')} />
            <Field label="AWB (guía master)" value={row.awb} />
            <Field label="HAWB (guía hija)" value={row.hawb} />
            <Field label="DAE" value={row.dae} />
            <Field label="Exportador" value={row.exportador} />
            <Field label="Marcación" value={row.marcacion} />
            <Field label="Producto" value={row.producto} />
            <Field label="Destino final" value={row.destinoFinal} />
            <Field label="Cajas (equivalente full)" value={row.bxsCoo} />
            <Field label="Piezas" value={row.pcsCoo} />
            <Field label="Cajas en bodega" value={row.bxsWh} />
            <Field label="Piezas en bodega" value={row.pcsWh} />
            <Field label="Origen" value={row.origen} />
            <Field label="Destino AWB" value={row.destinoAwb} />
            <Field
              label="Creada"
              value={row.creacionFecha ? formatDateTime(row.creacionFecha) : row.creacion}
            />
            <Field label="Creada por" value={row.creacionUser} />
          </Box>
        </Paper>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Abre esta coordinación desde la lista para ver su resumen, o consulta el
          detalle completo en el portal EBF.
        </Alert>
      )}

      <Accordion variant="outlined" disableGutters>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="body2" color="text.secondary">
            Datos técnicos del portal (HTML sin procesar)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {error ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => mutate()}>
                  Reintentar
                </Button>
              }
            >
              {getErrorMessage(error)}
            </Alert>
          ) : isLoading || !detalle ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Box
              component="pre"
              sx={{
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                m: 0,
                maxHeight: 480,
                overflow: 'auto',
              }}
            >
              {rawDump}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </AppPage>
  );
}
