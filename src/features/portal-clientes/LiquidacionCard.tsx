'use client';

import { Box, Paper, Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { armarLiquidacion, type Liquidacion, usd } from './portal';

/**
 * El total a pagar, destacado sin pintar un bloque naranja entero: fondo suave
 * de la marca y el importe grande.
 */
export function TotalAPagar({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{ px: 2, py: 1.5, bgcolor: 'action.selected', borderColor: 'primary.light' }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Typography fontWeight={600}>{etiqueta}</Typography>
        <Typography variant="h5" component="p" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {valor}
        </Typography>
      </Stack>
    </Paper>
  );
}

/** Lo que se le cobra al cliente por la guía, renglón por renglón. */
export function LiquidacionCard({ liquidacion }: { liquidacion: Liquidacion }) {
  const renglones = armarLiquidacion(liquidacion);
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Table size="small" aria-label="Liquidación de la guía">
        <TableBody>
          {renglones.map((r, i) => {
            if (r.tipo === 'seccion') {
              return (
                <TableRow key={i} sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 600, py: 0.75, fontSize: '0.8125rem', color: 'text.secondary' }}>
                    {r.concepto}
                  </TableCell>
                </TableRow>
              );
            }
            const fuerte = r.tipo === 'total';
            const subtotal = r.tipo === 'subtotal';
            const aPagar = fuerte && r.concepto === 'TOTAL A PAGAR';
            return (
              <TableRow key={i} sx={aPagar ? { bgcolor: 'action.selected' } : undefined}>
                <TableCell sx={{ pl: r.tipo === 'linea' ? 3 : 2, fontWeight: fuerte || subtotal ? 700 : 400 }}>
                  <Stack>
                    <Box component="span" sx={{ fontSize: aPagar ? '1rem' : undefined }}>
                      {aPagar ? 'Total a pagar' : r.concepto}
                    </Box>
                    {r.detalle && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400 }}>
                        {r.detalle}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: fuerte || subtotal ? 700 : 400,
                    fontSize: aPagar ? '1.125rem' : undefined,
                  }}
                >
                  {usd(r.valor)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}
