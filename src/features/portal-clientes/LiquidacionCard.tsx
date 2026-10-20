'use client';

import { Box, Paper, Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { armarLiquidacion, type Liquidacion, usd } from './portal';

/** Lo que se le cobra al cliente por la guía, renglón por renglón. */
export function LiquidacionCard({ liquidacion }: { liquidacion: Liquidacion }) {
  const renglones = armarLiquidacion(liquidacion);
  return (
    <Paper variant="outlined">
      <Table size="small" aria-label="Liquidación de la guía">
        <TableBody>
          {renglones.map((r, i) => {
            if (r.tipo === 'seccion') {
              return (
                <TableRow key={i} sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 700, py: 0.75 }}>
                    {r.concepto}
                  </TableCell>
                </TableRow>
              );
            }
            const fuerte = r.tipo === 'total';
            const subtotal = r.tipo === 'subtotal';
            return (
              <TableRow key={i} sx={fuerte && r.concepto === 'TOTAL A PAGAR' ? { bgcolor: 'primary.main', '& td': { color: 'primary.contrastText' } } : undefined}>
                <TableCell sx={{ pl: r.tipo === 'linea' ? 3 : 2, fontWeight: fuerte || subtotal ? 700 : 400 }}>
                  <Stack>
                    <Box component="span" sx={{ fontSize: fuerte && r.concepto === 'TOTAL A PAGAR' ? '1.1rem' : undefined }}>
                      {r.concepto}
                    </Box>
                    {r.detalle && (
                      <Typography variant="caption" sx={{ opacity: 0.75, fontWeight: 400 }}>
                        {r.detalle}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    fontWeight: fuerte || subtotal ? 700 : 400,
                    fontSize: fuerte && r.concepto === 'TOTAL A PAGAR' ? '1.1rem' : undefined,
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
