'use client';

import useSWR from 'swr';
import {
  Alert,
  Box,
  Chip,
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

function Dato({ label, valor, fuerte, ayuda }: { label: string; valor: string; fuerte?: boolean; ayuda?: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant={fuerte ? 'h6' : 'body1'} fontWeight={fuerte ? 700 : 500} sx={nums}>
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
  | { tipo: 'valor'; label: string; normal: string; extra: string; subtotal?: boolean };

/**
 * Liquidación: total = flete + cargos de aerolínea (due carrier) + IVA + cargos
 * de agencia (due agent). Con corte extra la guía se factura con ese juego.
 */
export function LiquidacionPanel({ c }: { c: CoordinacionDetalle }) {
  const normal = c.liquidaciones.find((l) => l.tipo === 'NORMAL');
  const extra = c.liquidaciones.find((l) => l.tipo === 'CORTE_EXTRA');
  const conExtra = !!extra && c.corteExtra;
  const { data: parametros } = useSWR(['operacion/coordinar/parametros', null], () =>
    operacionService.parametrosCoordinacion(null),
  );
  const etiqueta = (k: CodigoAgencia) => parametros?.etiquetasAgencia[k] ?? k.replace('cargo', '').toUpperCase();
  const L = c.liquidacion;

  const conValor = (k: keyof Liquidacion) => [val(normal, k), val(extra, k)].some((v) => v !== null && v !== 0);
  const fila = (label: string, f: (l: Liquidacion | undefined) => string, subtotal = false): Fila => ({
    tipo: 'valor',
    label,
    normal: f(normal),
    extra: f(extra),
    subtotal,
  });
  const filas: Fila[] = [
    { tipo: 'grupo', label: 'Flete' },
    fila('Peso cobrable', (l) => kg(val(l, 'pesoCobrable'))),
    fila('Tarifa por kg', (l) => num(val(l, 'tarifa'))),
    fila('Flete', (l) => usd(l?.resumen.flete), true),
    { tipo: 'grupo', label: 'Cargos de aerolínea (due carrier)' },
    ...AEROLINEA.filter((a) => conValor(a.key)).map((a) => fila(a.label, (l) => usd(val(l, a.key)))),
    fila('Subtotal aerolínea', (l) => usd(l?.resumen.dueCarrier), true),
    ...(conValor('iva') ? [fila('IVA', (l) => usd(val(l, 'iva')))] : []),
    { tipo: 'grupo', label: 'Cargos de agencia (due agent)' },
    ...CODIGOS_AGENCIA.filter((k) => conValor(k)).map((k) => fila(etiqueta(k), (l) => usd(val(l, k)))),
    fila('Subtotal agencia', (l) => usd(l?.resumen.dueAgent), true),
  ];

  const handlingCliente = val(normal, 'aux3Handling');

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={4} rowGap={2} alignItems="flex-start">
          <Dato label="Flete" valor={usd(L.flete)} ayuda={L.pesoCobrable !== null ? `${num(L.pesoCobrable)} kg × ${num(L.tarifa)}` : undefined} />
          <Dato label="+ Cargos aerolínea" valor={usd(L.dueCarrier)} />
          <Dato label="+ Cargos agencia" valor={usd(L.dueAgent)} />
          <Dato label="= Total guía" valor={usd(L.total)} fuerte />
          <Dato label="Comisión agencia IATA" valor={L.comision !== null ? `${num(L.comision)} %` : '—'} />
          {handlingCliente ? <Dato label="Handling al cliente" valor={usd(handlingCliente)} ayuda="Se cobra aparte" /> : null}
        </Stack>
      </Paper>

      {conExtra && (
        <Alert severity="info" variant="outlined">
          Esta guía tiene <strong>corte extra</strong>: el total y la facturación usan la columna &quot;Corte extra&quot;. La
          columna &quot;Normal&quot; queda como referencia (normalmente, lo que cobra la aerolínea).
        </Alert>
      )}
      {L.flete === null && c.origen === 'ACCESS' && (
        <Alert severity="info" variant="outlined">
          El sistema viejo no guardó totales para esta coordinación (anterior a abril de 2012).
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Concepto</TableCell>
              <TableCell align="right">
                Normal {!conExtra && <Chip size="small" label="vigente" color="primary" variant="outlined" sx={{ ml: 1 }} />}
              </TableCell>
              {extra && (
                <TableCell align="right">
                  Corte extra {conExtra && <Chip size="small" label="vigente" color="primary" variant="outlined" sx={{ ml: 1 }} />}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filas.map((f, i) =>
              f.tipo === 'grupo' ? (
                <TableRow key={`g${i}`}>
                  <TableCell colSpan={extra ? 3 : 2} sx={{ pt: 2, pb: 0.5, borderBottom: 'none' }}>
                    <Typography variant="overline" color="text.secondary">
                      {f.label}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={`v${i}`} sx={f.subtotal ? { '& td': { fontWeight: 600 } } : undefined}>
                  <TableCell sx={{ pl: f.subtotal ? 2 : 4 }}>{f.label}</TableCell>
                  <TableCell align="right" sx={nums}>{f.normal}</TableCell>
                  {extra && <TableCell align="right" sx={nums}>{f.extra}</TableCell>}
                </TableRow>
              ),
            )}
            <TableRow sx={{ '& td': { fontWeight: 700, borderBottom: 'none', fontSize: '1rem' } }}>
              <TableCell>Total guía</TableCell>
              <TableCell align="right" sx={nums}>
                {usd(normal?.resumen.total)}
              </TableCell>
              {extra && (
                <TableCell align="right" sx={nums}>
                  {usd(extra.resumen.total)}
                </TableCell>
              )}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
