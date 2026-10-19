'use client';

import Link from 'next/link';
import { Alert, Box, Button, Card, CardActionArea, Chip, Skeleton, Stack, Typography } from '@mui/material';
import { CheckCircleOutline as CargadoIcon, ChevronRight as AbrirIcon, FlightTakeoff as VueloIcon } from '@mui/icons-material';
import { getErrorMessage } from '@/shared/utils';
import { awb, diaVuelo, type GuiaAbierta, useGuiasAbiertas } from './portal';

const nf = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 });

/** "2026-10-18" de hoy en Ecuador, y de mañana. */
const diasCercanos = () => {
  const iso = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(d);
  const ahora = new Date();
  return { hoy: iso(ahora), manana: iso(new Date(ahora.getTime() + 86_400_000)) };
};

/** "Hoy · domingo 18 de octubre", "Mañana · lunes 19 de octubre" o "Jueves 22 de octubre". */
function tituloDia(fecha: string, hoy: string, manana: string) {
  const dia = diaVuelo(fecha);
  if (fecha === hoy) return { titulo: 'Hoy', detalle: dia.toLowerCase() };
  if (fecha === manana) return { titulo: 'Mañana', detalle: dia.toLowerCase() };
  return { titulo: dia, detalle: null };
}

function Tarjeta({ g }: { g: GuiaAbierta }) {
  return (
    <Card variant="outlined">
      <CardActionArea component={Link} href={`/portal/guias/${g.id}`} sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
              {g.marca}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {[[g.destino, g.destinoFinal?.codigo].filter(Boolean).join(' → '), g.aerolinea, g.guia ? `guía ${awb(g.guia)}` : null]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
            {g.misLineas > 0 && (
              <Chip
                size="small"
                color="success"
                variant="outlined"
                icon={<CargadoIcon />}
                sx={{ mt: 1 }}
                label={`Ya cargaste ${nf.format(g.misFulls)} fulls · ${g.misCajas} cajas`}
              />
            )}
          </Box>
          <AbrirIcon color="action" />
        </Stack>
      </CardActionArea>
    </Card>
  );
}

/**
 * Guías abiertas para cargar, por día de vuelo (hoy, mañana, …): una tarjeta
 * por guía con la marca, el destino, la aerolínea y, si la finca ya cargó
 * algo, cuánto.
 */
export function GuiasAbiertasPage() {
  const { data, error, isLoading, mutate } = useGuiasAbiertas();

  if (error) {
    return (
      <Alert severity="error" action={<Button onClick={() => mutate()}>Reintentar</Button>}>
        {getErrorMessage(error, 'No se pudieron cargar las guías.')}
      </Alert>
    );
  }
  if (isLoading || !data) {
    return (
      <Stack spacing={1.5}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={88} />
        ))}
      </Stack>
    );
  }
  if (data.length === 0) {
    return (
      <Alert severity="info" icon={<VueloIcon />}>
        No hay guías abiertas para cargar. Cuando la oficina abra una, aparece aquí.
      </Alert>
    );
  }

  const { hoy, manana } = diasCercanos();
  const dias = new Map<string, GuiaAbierta[]>();
  for (const g of data) dias.set(g.fechaVuelo, [...(dias.get(g.fechaVuelo) ?? []), g]);

  return (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        Elige la guía donde va tu carga.
      </Typography>
      {[...dias.entries()].map(([fecha, guias]) => {
        const { titulo, detalle } = tituloDia(fecha, hoy, manana);
        return (
          <Box key={fecha} component="section">
            <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                {titulo}
              </Typography>
              {detalle && (
                <Typography variant="body2" color="text.secondary">
                  {detalle}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto !important' }}>
                {guias.length} {guias.length === 1 ? 'guía' : 'guías'}
              </Typography>
            </Stack>
            <Stack spacing={1.5}>
              {guias.map((g) => (
                <Tarjeta key={g.id} g={g} />
              ))}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}
