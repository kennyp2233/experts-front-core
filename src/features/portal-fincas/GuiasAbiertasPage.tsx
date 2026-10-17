'use client';

import Link from 'next/link';
import { Alert, Box, Button, Card, CardActionArea, Chip, Skeleton, Stack, Typography } from '@mui/material';
import { ChevronRight as AbrirIcon, FlightTakeoff as VueloIcon } from '@mui/icons-material';
import { getErrorMessage } from '@/shared/utils';
import { awb, diaVuelo, useGuiasAbiertas } from './portal';

const nf = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 });

/**
 * Guías abiertas para cargar (como la lista de la web vieja): una por guía,
 * con el día de vuelo, la marca, el destino y la aerolínea; si la finca ya
 * cargó algo, cuánto.
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

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        Elige la guía donde va tu carga.
      </Typography>
      {data.map((g) => (
        <Card key={g.id} variant="outlined">
          <CardActionArea component={Link} href={`/portal/guias/${g.id}`} sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {diaVuelo(g.fechaVuelo)}
                </Typography>
                <Typography variant="body1" fontWeight={500} noWrap>
                  {g.marca}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {[g.destino, g.destinoFinal?.codigo].filter(Boolean).join(' → ')}
                  {g.aerolinea ? ` · ${g.aerolinea}` : ''}
                  {g.guia ? ` · guía ${awb(g.guia)}` : ''}
                </Typography>
                {g.misLineas > 0 && (
                  <Chip
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ mt: 1 }}
                    label={`Ya cargaste ${nf.format(g.misFulls)} fulls · ${g.misCajas} cajas`}
                  />
                )}
              </Box>
              <AbrirIcon color="action" />
            </Stack>
          </CardActionArea>
        </Card>
      ))}
    </Stack>
  );
}
