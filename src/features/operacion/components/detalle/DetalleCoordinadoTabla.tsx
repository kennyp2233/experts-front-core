'use client';

import {
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

/** "12/10 09:55": la fecha y hora en que se registró la línea, corta. */
function fechaCorta(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** Usuario que registró la línea: la finca por la web (en azul), una transferencia o la oficina. */
function Usuario({ l }: { l: LineaGuiaHija }) {
  if (!l.usuario) return null;
  const web = l.origen === 'E';
  const quien = web ? 'La registró la finca por la web' : l.origen === 'I' ? 'Transferencia interna' : 'La registró la oficina';
  return (
    <Tooltip title={`${quien} · ${formatDateTime(l.fechaRegistro, '')}`}>
      <Typography variant="body2" noWrap color={web ? 'info.main' : 'text.secondary'} sx={{ maxWidth: 96, fontSize: 'inherit' }}>
        {l.usuario}
      </Typography>
    </Tooltip>
  );
}

/**
 * "Detalle de Coordinación" como la grilla del sistema viejo: una fila por
 * línea, ordenadas por finca y fecha de registro, con las columnas en el mismo
 * orden (Plantación · Producto · FULLs · PCS · Kgs · DAE · Fecha · Guía Hija ·
 * Factura · VALOR · Stems · Observaciones · Usuario). Una línea en 0 con nota es
 * una novedad ("no llegó 1.5", "va a KAM").
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
      tallos: a.tallos + (l.tallos ?? 0),
    }),
    { fulls: 0, cajas: 0, kg: 0, valor: 0, tallos: 0 },
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
      <Table
        size="small"
        // "&&" para ganarle al padding y a las mayúsculas del tema (MuiTable).
        sx={{
          '&& .MuiTableCell-root': { px: 0.75, py: 0.5, fontSize: 13 },
          // Encabezados en minúscula: en mayúsculas espaciadas ensanchan las columnas de números.
          '&& .MuiTableCell-head': { textTransform: 'none', letterSpacing: 0, fontSize: 12.5 },
          '& td': { verticalAlign: 'top' },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Finca</TableCell>
            <TableCell>Producto</TableCell>
            <TableCell align="right">Fulls</TableCell>
            <TableCell align="right">Cajas</TableCell>
            <TableCell align="right">Kg</TableCell>
            <TableCell>DAE</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell>Guía hija</TableCell>
            <TableCell>Factura</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell align="right">Tallos</TableCell>
            <TableCell sx={{ minWidth: 170 }}>Nota</TableCell>
            <TableCell>Usuario</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filas.map((l, i) => {
            const nuevaFinca = i === 0 || filas[i - 1].guia.finca?.id !== l.guia.finca?.id;
            const novedad = l.cantidadCajas === 0;
            // Vacío (no "—") cuando no hay dato, y en las novedades tampoco los ceros: la grilla queda limpia.
            const cero = (v: number | null, d = 2) => (v === null || v === undefined || (novedad && !v) ? '' : num(v, d));
            // En las novedades el sistema viejo guarda "0" en DAE y factura: no se muestran.
            const dae = l.dae ?? l.guia.dae ?? '';
            return (
              <TableRow key={l.id} hover sx={{ bgcolor: novedad ? 'action.hover' : undefined }}>
                <TableCell>
                  {nuevaFinca ? (
                    <Tooltip title={l.guia.finca?.nombre ?? ''}>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 135, fontSize: 'inherit' }}>
                        {nombreCorto(l.guia.finca)}
                      </Typography>
                    </Tooltip>
                  ) : null}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{l.codigoProducto ?? l.producto?.nombre ?? '—'}</TableCell>
                <TableCell align="right" sx={nums}>{cero(l.fulls)}</TableCell>
                <TableCell align="right" sx={nums}>{cero(l.cantidadCajas, 0)}</TableCell>
                <TableCell align="right" sx={nums}>{cero(l.pesoKg)}</TableCell>
                <TableCell sx={{ ...nums, whiteSpace: 'nowrap' }}>{novedad && dae === '0' ? '' : dae}</TableCell>
                <TableCell sx={{ ...nums, whiteSpace: 'nowrap', color: 'text.secondary' }}>{fechaCorta(l.fechaRegistro)}</TableCell>
                <TableCell sx={{ ...nums, fontWeight: 600 }}>{l.guia.numeroGuiaHija}</TableCell>
                <TableCell sx={nums}>{novedad && l.factura === '0' ? '' : (l.factura ?? '')}</TableCell>
                <TableCell align="right" sx={nums}>{cero(l.valor)}</TableCell>
                <TableCell align="right" sx={nums}>{cero(l.tallos, 0)}</TableCell>
                <TableCell sx={{ fontWeight: novedad ? 700 : undefined }}>{l.nota ?? ''}</TableCell>
                <TableCell>
                  <Usuario l={l} />
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow sx={{ '& td': { fontWeight: 700, borderBottom: 'none', bgcolor: 'action.hover' } }}>
            <TableCell colSpan={2}>
              Total · {plural(new Set(guias.map((g) => g.finca?.id)).size, 'finca')}, {plural(filas.length, 'línea')}
            </TableCell>
            <TableCell align="right" sx={nums}>{num(tot.fulls)}</TableCell>
            <TableCell align="right" sx={nums}>{num(tot.cajas, 0)}</TableCell>
            <TableCell align="right" sx={nums}>{num(tot.kg)}</TableCell>
            <TableCell colSpan={4} />
            <TableCell align="right" sx={nums}>{num(tot.valor)}</TableCell>
            <TableCell align="right" sx={nums}>{num(tot.tallos, 0)}</TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
