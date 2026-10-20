'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  LinearProgress,
  Link as MuiLink,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Refresh as RecalcularIcon } from '@mui/icons-material';
import { AppPage } from '@/shared/components/ui';
import { formatDateTime, getErrorMessage } from '@/shared/utils';
import { useReporteValidacion } from '../hooks/useValidacion';
import type { ResumenRegla } from '../types/coordinacion';

const valor = (v: unknown) => (v === null || v === undefined ? '—' : typeof v === 'number' ? v.toLocaleString('es-EC') : String(v));

const color = (p: number | null) => (p === null ? 'default' : p >= 99.5 ? 'success' : p >= 95 ? 'warning' : 'error');

function Regla({ r }: { r: ResumenRegla }) {
  const [abierta, setAbierta] = useState(false);
  const diferentes = r.evaluadas - r.coinciden;
  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1.5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600}>
            {r.nombre}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {r.descripcion}
          </Typography>
        </Box>
        <Box sx={{ width: { sm: 220 }, flexShrink: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="baseline">
            <Chip size="small" color={color(r.porcentaje)} label={r.porcentaje === null ? 'sin datos' : `${r.porcentaje} %`} />
            <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {r.coinciden.toLocaleString('es-EC')} de {r.evaluadas.toLocaleString('es-EC')}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={r.porcentaje ?? 0}
            color={color(r.porcentaje) === 'default' ? 'inherit' : (color(r.porcentaje) as 'success' | 'warning' | 'error')}
            sx={{ mt: 0.75, height: 4, borderRadius: 2 }}
          />
        </Box>
        {/* Columna fija: las barras quedan alineadas haya o no diferencias. */}
        <Box sx={{ width: { sm: 170 }, flexShrink: 0, textAlign: { sm: 'right' } }}>
          {diferentes > 0 ? (
            <Button size="small" onClick={() => setAbierta((v) => !v)}>
              {abierta ? 'Ocultar' : `Ver diferencias (${diferentes.toLocaleString('es-EC')})`}
            </Button>
          ) : (
            <Typography variant="caption" color="text.secondary">
              Sin diferencias
            </Typography>
          )}
        </Box>
      </Stack>
      <Collapse in={abierta} unmountOnExit>
        <Table size="small" sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Coordinación</TableCell>
              <TableCell align="right">Sistema viejo</TableCell>
              <TableCell align="right">Sistema nuevo</TableCell>
              <TableCell>Nota</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {r.diferencias.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <MuiLink component={Link} href={`/operacion/coordinaciones/${d.id}`}>
                    {d.numeroGuia ?? d.id}
                  </MuiLink>
                  {d.codigoAccess !== null && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      N° {d.codigoAccess}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{valor(d.esperado)}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{valor(d.calculado)}</TableCell>
                <TableCell>
                  <Typography variant="caption">{d.nota ?? ''}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {diferentes > r.diferencias.length && (
          <Typography variant="caption" color="text.secondary">
            Se muestran las primeras {r.diferencias.length}.
          </Typography>
        )}
      </Collapse>
    </Paper>
  );
}

/**
 * Prueba de la lógica del sistema nuevo: cada regla se aplica a todas las
 * coordinaciones que vinieron del sistema viejo y se compara con lo que
 * Access guardó.
 */
export function ValidacionPage() {
  const { reporte, error, isLoading, isValidating, mutate, recalcular } = useReporteValidacion();

  return (
    <AppPage
      title="Validación contra el sistema viejo"
      subtitle="Cada regla del sistema nuevo se aplica a las coordinaciones del sistema viejo y se compara con el resultado que guardó Access."
      actions={
        <Button variant="outlined" startIcon={<RecalcularIcon />} onClick={() => recalcular()} disabled={isValidating}>
          Recalcular
        </Button>
      }
    >
      {isValidating && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" action={<Button onClick={() => mutate()}>Reintentar</Button>} sx={{ mb: 2 }}>
          {getErrorMessage(error, 'No se pudo generar la validación.')}
        </Alert>
      )}
      {isLoading && !reporte ? (
        <Stack spacing={1.5}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={84} />
          ))}
          <Typography variant="caption" color="text.secondary">
            Recorriendo todas las coordinaciones… puede tardar un minuto.
          </Typography>
        </Stack>
      ) : reporte ? (
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            {reporte.coordinaciones.toLocaleString('es-EC')} coordinaciones revisadas · {formatDateTime(reporte.generadoEn)} ·{' '}
            {(reporte.ms / 1000).toFixed(1)} s
          </Typography>
          {reporte.reglas.map((r) => (
            <Regla key={r.id} r={r} />
          ))}
        </Stack>
      ) : null}
    </AppPage>
  );
}
