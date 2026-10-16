'use client';

import { Alert, Paper, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { CheckCircleOutline as OkIcon, ErrorOutline as DifIcon, RemoveCircleOutline as NaIcon } from '@mui/icons-material';
import { getErrorMessage } from '@/shared/utils';
import { useValidacionCoordinacion } from '../../hooks/useValidacion';

const valor = (v: unknown): string => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return v.toLocaleString('es-EC');
  if (typeof v === 'boolean') return v ? 'sí' : 'no';
  if (Array.isArray(v)) return v.map(valor).join(', ');
  if (typeof v === 'object') {
    return Object.entries(v as Record<string, unknown>)
      .map(([k, x]) => `${k}: ${valor(x)}`)
      .join(' · ');
  }
  return String(v);
};

/** Cada regla del sistema nuevo aplicada a esta coordinación, frente a lo que guardó Access. */
export function ValidacionTab({ id }: { id: number }) {
  const { validacion, error, isLoading } = useValidacionCoordinacion(id);
  if (error) return <Alert severity="error">{getErrorMessage(error)}</Alert>;
  if (isLoading || !validacion) return <Skeleton variant="rounded" height={200} />;
  return (
    <Paper variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={36} />
            <TableCell>Regla</TableCell>
            <TableCell align="right">Sistema viejo</TableCell>
            <TableCell align="right">Sistema nuevo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {validacion.reglas.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                {!r.resultado ? (
                  <NaIcon fontSize="small" color="disabled" />
                ) : r.resultado.ok ? (
                  <OkIcon fontSize="small" color="success" />
                ) : (
                  <DifIcon fontSize="small" color="error" />
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {r.nombre}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {r.resultado?.nota ?? r.descripcion}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {r.resultado ? valor(r.resultado.esperado) : 'no aplica'}
              </TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {r.resultado ? valor(r.resultado.calculado) : ''}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
