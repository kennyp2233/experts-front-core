'use client';

import useSWR from 'swr';
import {
  Alert,
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { operacionService } from '../../services/operacion.service';
import type { CodigoAgencia, CoordinacionDetalle, Liquidacion } from '../../types/coordinacion';
import { CODIGOS_AGENCIA } from '../../types/coordinacion';
import { kg, num, usd } from '../../utils/formato';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

const AEROLINEA: Array<{ key: keyof Liquidacion; label: string }> = [
  { key: 'guiaAerea', label: 'Guía aérea' },
  { key: 'combustible', label: 'Combustible' },
  { key: 'seguridad', label: 'Seguridad' },
  { key: 'otros', label: 'Otros' },
  { key: 'aux1', label: 'Aux 1' },
  { key: 'aux2', label: 'Aux 2' },
  { key: 'calAux', label: 'Cálculo auxiliar' },
];

const val = (l: Liquidacion | undefined, k: keyof Liquidacion) => {
  const v = l?.[k];
  return typeof v === 'number' ? v : null;
};

function Dato({ label, valor, fuerte, ayuda, color }: { label: string; valor: string; fuerte?: boolean; ayuda?: string; color?: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant={fuerte ? 'h6' : 'body1'} fontWeight={fuerte ? 700 : 500} color={color} sx={nums}>
        {valor}
      </Typography>
      {ayuda && (
        <Typography variant="caption" color="text.secondary">
          {ayuda}
        </Typography>
      )}
    </Box>
  );
}

type Fila =
  | { tipo: 'grupo'; label: string }
  | {
      tipo: 'valor';
      label: string;
      aerolinea: number | null | undefined;
      cliente: number | null | undefined;
      fmt: (n: number | null | undefined) => string;
      subtotal?: boolean;
    };

const diferencia = (a: number | null | undefined, b: number | null | undefined) =>
  a === null || a === undefined || b === null || b === undefined ? null : Math.round((b - a) * 100) / 100;

/**
 * Liquidación de la guía: lo que cobra la aerolínea (va en la guía madre) y,
 * si se le cobra distinto, lo que se le cobra al cliente. La ganancia es la
 * diferencia (hoy no hay comisión). En el sistema viejo el cobro al cliente se
 * llama "corte extra".
 */
export function LiquidacionPanel({ c }: { c: CoordinacionDetalle }) {
  const normal = c.liquidaciones.find((l) => l.tipo === 'NORMAL');
  const cliente = c.corteExtra ? c.liquidaciones.find((l) => l.tipo === 'CORTE_EXTRA') : undefined;
  const { data: parametros } = useSWR(['operacion/coordinar/parametros', null], () =>
    operacionService.parametrosCoordinacion(null),
  );
  const etiqueta = (k: CodigoAgencia) => parametros?.etiquetasAgencia[k] ?? k.replace('cargo', '').toUpperCase();

  const conValor = (k: keyof Liquidacion) => [val(normal, k), val(cliente, k)].some((v) => v !== null && v !== 0);
  const fila = (
    label: string,
    f: (l: Liquidacion | undefined) => number | null | undefined,
    fmt: (n: number | null | undefined) => string = usd,
    subtotal = false,
  ): Fila => ({ tipo: 'valor', label, aerolinea: f(normal), cliente: f(cliente), fmt, subtotal });
  const filas: Fila[] = [
    { tipo: 'grupo', label: 'Flete' },
    fila('Peso cobrable', (l) => val(l, 'pesoCobrable'), kg),
    fila('Tarifa por kg', (l) => val(l, 'tarifa'), num),
    fila('Flete', (l) => l?.resumen.flete, usd, true),
    { tipo: 'grupo', label: 'Cargos de aerolínea (due carrier)' },
    ...AEROLINEA.filter((a) => conValor(a.key)).map((a) => fila(a.label, (l) => val(l, a.key))),
    fila('Subtotal aerolínea', (l) => l?.resumen.dueCarrier, usd, true),
    ...(conValor('iva') ? [fila('IVA', (l) => val(l, 'iva'))] : []),
    { tipo: 'grupo', label: 'Cargos de agencia (due agent)' },
    ...CODIGOS_AGENCIA.filter((k) => conValor(k)).map((k) => fila(etiqueta(k), (l) => val(l, k))),
    fila('Subtotal agencia', (l) => l?.resumen.dueAgent, usd, true),
  ];

  const handlingCliente = val(normal, 'aux3Handling');
  const totalAerolinea = normal?.resumen.total;
  const totalCliente = cliente?.resumen.total;
  const ganancia = diferencia(totalAerolinea, totalCliente);
  const sinTotales = c.liquidacion.flete === null && c.origen === 'ACCESS';
  const columnas = cliente ? 4 : 2;

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={4} rowGap={2} alignItems="flex-start">
          {cliente ? (
            <>
              <Dato label="Cobro al cliente" valor={usd(totalCliente)} fuerte />
              <Dato label="Guía madre (aerolínea)" valor={usd(totalAerolinea)} fuerte />
              <Dato
                label="Ganancia"
                valor={usd(ganancia)}
                fuerte
                color={ganancia !== null && ganancia < 0 ? 'error.main' : 'success.main'}
                ayuda={
                  val(normal, 'tarifa') !== null && val(cliente, 'tarifa') !== null
                    ? `tarifa ${num(val(normal, 'tarifa'))} → ${num(val(cliente, 'tarifa'))} por kg`
                    : undefined
                }
              />
            </>
          ) : (
            <>
              <Dato label="Flete" valor={usd(normal?.resumen.flete)} />
              <Dato label="+ Cargos aerolínea" valor={usd(normal?.resumen.dueCarrier)} />
              <Dato label="+ Cargos agencia" valor={usd(normal?.resumen.dueAgent)} />
              <Dato label="= Total guía" valor={usd(totalAerolinea)} fuerte />
            </>
          )}
          {handlingCliente ? <Dato label="Handling al cliente" valor={usd(handlingCliente)} ayuda="Se cobra aparte" /> : null}
        </Stack>
      </Paper>

      {sinTotales && (
        <Alert severity="info" variant="outlined">
          El sistema viejo no guardó totales para esta coordinación (anterior a abril de 2012).
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Concepto</TableCell>
              <TableCell align="right">Aerolínea (guía madre)</TableCell>
              {cliente && <TableCell align="right">Cobro al cliente</TableCell>}
              {cliente && <TableCell align="right">Diferencia</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filas.map((f, i) => {
              if (f.tipo === 'grupo') {
                return (
                  <TableRow key={`g${i}`}>
                    <TableCell colSpan={columnas} sx={{ pt: 2, pb: 0.5, borderBottom: 'none' }}>
                      <Typography variant="overline" color="text.secondary">
                        {f.label}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              }
              const d = diferencia(f.aerolinea, f.cliente);
              return (
                <TableRow key={`v${i}`} sx={f.subtotal ? { '& td': { fontWeight: 600 } } : undefined}>
                  <TableCell sx={{ pl: f.subtotal ? 2 : 4 }}>{f.label}</TableCell>
                  <TableCell align="right" sx={nums}>{f.fmt(f.aerolinea)}</TableCell>
                  {cliente && <TableCell align="right" sx={nums}>{f.fmt(f.cliente)}</TableCell>}
                  {cliente && (
                    <TableCell align="right" sx={{ ...nums, color: 'text.secondary' }}>
                      {d ? `${d > 0 ? '+' : '−'}${f.fmt(Math.abs(d))}` : ''}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            <TableRow sx={{ '& td': { fontWeight: 700, borderBottom: 'none', fontSize: '1rem' } }}>
              <TableCell>Total guía</TableCell>
              <TableCell align="right" sx={nums}>{usd(totalAerolinea)}</TableCell>
              {cliente && <TableCell align="right" sx={nums}>{usd(totalCliente)}</TableCell>}
              {cliente && (
                <TableCell align="right" sx={{ ...nums, color: ganancia !== null && ganancia < 0 ? 'error.main' : 'success.main' }}>
                  {ganancia ? `${ganancia > 0 ? '+' : '−'}${usd(Math.abs(ganancia))}` : ''}
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
