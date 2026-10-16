'use client';

import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { CoordinacionArmada } from '../../types/coordinacion';
import { kg, num } from '../../utils/formato';

interface Props {
  armada: CoordinacionArmada | undefined;
  calculando: boolean;
  /** Error del servidor al simular (regla incumplida). */
  error: string | null;
  faltantes: string[];
  nombresFinca: Record<number, string>;
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {valor}
      </Typography>
    </Box>
  );
}

/**
 * Lo que va a quedar guardado: totales y guías hijas (una por marca + finca +
 * producto), calculado por el servidor con las mismas reglas que al guardar.
 */
export function VistaPrevia({ armada, calculando, error, faltantes, nombresFinca }: Props) {
  const t = armada?.totales;
  return (
    <Paper variant="outlined" sx={{ p: 2, position: 'relative', overflow: 'hidden' }}>
      {calculando && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
        Vista previa
      </Typography>

      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={3} rowGap={1} sx={{ mb: 2 }}>
        <Dato label="Guías hijas" valor={armada ? String(armada.guiasHijas.length) : '—'} />
        <Dato label="Fulls" valor={num(t?.fulls, 4)} />
        <Dato label="Cajas" valor={num(t?.cajas, 0)} />
        <Dato label="Peso bruto" valor={kg(t?.kgs)} />
        <Dato label="Volumen" valor={t ? `${num(t.volumen)} kg vol.` : '—'} />
      </Stack>

      <Stack spacing={1} sx={{ mb: armada?.guiasHijas.length ? 2 : 0 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {faltantes.length > 0 && (
          <Alert severity="warning" variant="outlined">
            <Typography variant="body2" fontWeight={600}>
              Para guardar falta:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {faltantes.slice(0, 8).map((f) => (
                <li key={f}>
                  <Typography variant="body2">{f}</Typography>
                </li>
              ))}
              {faltantes.length > 8 && (
                <li>
                  <Typography variant="body2">… y {faltantes.length - 8} más</Typography>
                </li>
              )}
            </Box>
          </Alert>
        )}
        {armada?.advertencias
          .filter((a) => !a.includes('"-"'))
          .map((a) => (
            <Alert key={a} severity="info" variant="outlined">
              {a}
            </Alert>
          ))}
      </Stack>

      {armada && armada.guiasHijas.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Guía hija</TableCell>
              <TableCell>Finca</TableCell>
              <TableCell align="right">Cajas</TableCell>
              <TableCell align="right">Fulls</TableCell>
              <TableCell align="right">Kg</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {armada.guiasHijas.map((g) => (
              <TableRow key={g.clave}>
                <TableCell>
                  {g.numeroGuiaHija ? (
                    <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {g.numeroGuiaHija}
                    </Typography>
                  ) : (
                    <Chip size="small" label="nueva" variant="outlined" />
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>
                    {nombresFinca[g.idFinca] ?? `Finca ${g.idFinca}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {g.lineas.map((l) => l.codigoProducto).filter(Boolean).join(', ')}
                    {g.lineas.length > 1 ? ` · ${g.lineas.length} líneas` : ''}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{num(g.totalPiezas, 0)}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{num(g.totalFulls, 4)}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{num(g.pesoBruto)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {!armada && !error && faltantes.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Completa la guía, la marca y al menos una línea para ver el resultado.
        </Typography>
      )}
    </Paper>
  );
}
