'use client';

import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { formatDateTime } from '@/shared/utils';
import type { GuiaHija, LineaGuiaHija } from '../../types/coordinacion';
import { nombreCorto, num, plural } from '../../utils/formato';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

type Fila = LineaGuiaHija & { guia: GuiaHija };

/** Quién registró la línea (la finca por la web, una transferencia o la oficina); la fecha, en el tooltip. */
function Registro({ l }: { l: LineaGuiaHija }) {
  if (!l.usuario && !l.fechaRegistro) return null;
  const web = l.origen === 'E';
  const quien = web ? 'La registró la finca por la web' : l.origen === 'I' ? 'Transferencia interna' : 'La registró la oficina';
  return (
    <Tooltip title={`${quien} · ${formatDateTime(l.fechaRegistro, '')}`}>
      <Typography variant="caption" color="text.secondary" component="div" noWrap sx={{ maxWidth: 130 }}>
        {web && <Chip label="web" size="small" color="info" variant="outlined" sx={{ mr: 0.5, height: 18, fontSize: 11 }} />}
        {l.usuario ?? ''}
      </Typography>
    </Tooltip>
  );
}

/**
 * Detalle coordinado, como la grilla del sistema viejo: una fila por línea,
 * ordenadas por finca y fecha de registro, con la nota y quién la registró (la
 * finca por la web o la oficina). Una línea en 0 con nota es una novedad ("no
 * llegó 1.5", "va a KAM").
 */
export function DetalleCoordinadoTabla({ guias }: { guias: GuiaHija[] }) {
  const filas: Fila[] = guias
    .flatMap((g) => g.lineas.map((l) => ({ ...l, guia: g })))
    .sort(
      (a, b) =>
        nombreCorto(a.guia.finca).localeCompare(nombreCorto(b.guia.finca)) ||
        (a.fechaRegistro ?? '').localeCompare(b.fechaRegistro ?? ''),
    );
  const tot = filas.reduce(
    (a, l) => ({
      fulls: a.fulls + (l.fulls ?? 0),
      cajas: a.cajas + l.cantidadCajas,
      kg: a.kg + (l.pesoKg ?? 0),
      valor: a.valor + (l.valor ?? 0),
    }),
    { fulls: 0, cajas: 0, kg: 0, valor: 0 },
  );

  if (filas.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        Esta coordinación no tiene detalle.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" sx={{ '& td': { verticalAlign: 'top' } }}>
        <TableHead>
          <TableRow>
            <TableCell>Finca</TableCell>
            <TableCell>Producto</TableCell>
            <TableCell align="right">Fulls</TableCell>
            <TableCell align="right">Cajas</TableCell>
            <TableCell align="right">Kg</TableCell>
            <TableCell>DAE</TableCell>
            <TableCell>Guía hija</TableCell>
            <TableCell>Factura</TableCell>
            <TableCell align="right">Valor $</TableCell>
            <TableCell sx={{ minWidth: 160 }}>Nota</TableCell>
            <TableCell>Registró</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filas.map((l, i) => {
            const nuevaFinca = i === 0 || filas[i - 1].guia.finca?.id !== l.guia.finca?.id;
            const novedad = l.cantidadCajas === 0;
            const cero = (v: number | null, d = 2) => (novedad && !v ? '' : num(v, d));
            return (
                <TableRow key={l.id} sx={{ bgcolor: novedad ? 'action.hover' : undefined, '& td': nuevaFinca && i > 0 ? { borderTop: 2, borderTopColor: 'divider' } : {} }}>
                  <TableCell>
                    {nuevaFinca ? (
                      <Tooltip title={l.guia.finca?.nombre ?? ''}>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 170 }}>
                          {nombreCorto(l.guia.finca)}
                        </Typography>
                      </Tooltip>
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{l.codigoProducto ?? l.producto?.nombre ?? '—'}</TableCell>
                  <TableCell align="right" sx={nums}>{cero(l.fulls)}</TableCell>
                  <TableCell align="right" sx={nums}>{cero(l.cantidadCajas, 0)}</TableCell>
                  <TableCell align="right" sx={nums}>{cero(l.pesoKg)}</TableCell>
                  <TableCell sx={{ ...nums, whiteSpace: 'nowrap' }}>{l.dae ?? l.guia.dae ?? ''}</TableCell>
                  <TableCell sx={{ ...nums, fontWeight: 600 }}>{l.guia.numeroGuiaHija}</TableCell>
                  <TableCell sx={nums}>{novedad && l.factura === '0' ? '' : (l.factura ?? '')}</TableCell>
                  <TableCell align="right" sx={nums}>{cero(l.valor)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={novedad ? 700 : undefined}>
                      {l.nota ?? ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Registro l={l} />
                  </TableCell>
                </TableRow>
            );
          })}
          <TableRow sx={{ '& td': { fontWeight: 600, borderBottom: 'none' } }}>
            <TableCell colSpan={2}>
              Total ({plural(new Set(guias.map((g) => g.finca?.id)).size, 'finca')}, {plural(filas.length, 'línea')})
            </TableCell>
            <TableCell align="right" sx={nums}>{num(tot.fulls)}</TableCell>
            <TableCell align="right" sx={nums}>{num(tot.cajas, 0)}</TableCell>
            <TableCell align="right" sx={nums}>{num(tot.kg)}</TableCell>
            <TableCell colSpan={3} />
            <TableCell align="right" sx={nums}>{num(tot.valor)}</TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
