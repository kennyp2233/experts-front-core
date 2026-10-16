'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Refresh as RecalcularIcon } from '@mui/icons-material';
import { formatDate } from '@/shared/utils';
import {
  CODIGOS_AGENCIA,
  CONCEPTOS_AEROLINEA,
  type ConceptoAerolineaCampo,
  type ParametrosCoordinacion,
  type ResumenLiquidacion,
  type ValoresLiquidacion,
} from '../../types/coordinacion';
import { num, tarifa, usd } from '../../utils/formato';
import { type LiquidacionForm, numero } from './formulario';

type Campo = keyof ValoresLiquidacion;

const NOMBRE_CONCEPTO: Record<ConceptoAerolineaCampo, string> = {
  guiaAerea: 'Guía aérea',
  combustible: 'Combustible',
  seguridad: 'Seguridad',
  otros: 'Otros',
  aux1: 'Aux 1',
  aux2: 'Aux 2',
  calAux: 'Calc. aux.',
};

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

interface Props {
  /** Lo que cobra la aerolínea (guía madre). */
  aerolinea: LiquidacionForm;
  onAerolinea: (campo: Campo, valor: string) => void;
  /** Lo que cambia para el cliente (vacío = igual que la guía madre). */
  cliente: LiquidacionForm;
  onCliente: (campo: Campo, valor: string) => void;
  conCliente: boolean;
  onConCliente: (v: boolean) => void;
  parametros: ParametrosCoordinacion | undefined;
  resumenAerolinea: ResumenLiquidacion | undefined;
  resumenCliente: ResumenLiquidacion | null | undefined;
  diferencia: { tarifa: number | null; flete: number | null; total: number | null } | null | undefined;
  pesoBruto: number | undefined;
  /** Copia tarifa y conceptos de la aerolínea (ya calculados sobre el peso actual). */
  onSugerir?: () => void;
  liqAuto: boolean;
  handlingAuto: boolean;
  /** Cobro al cliente propuesto (en cursiva) mientras no se edite. */
  clienteAuto: boolean;
  /** De qué guía de la marca salió la propuesta. */
  propuestaCliente?: { numeroGuia: string | null; fechaVuelo: string };
  /** Error del servidor sobre el peso cobrable (se muestra debajo del campo). */
  errorPesoCobrable?: string | null;
}

function Entrada({
  value,
  onChange,
  placeholder,
  auto,
  label,
  error,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  auto?: boolean;
  label: string;
  error?: string | null;
}) {
  return (
    <TextField
      size="small"
      fullWidth
      value={value ?? ''}
      placeholder={placeholder}
      error={!!error}
      helperText={error || undefined}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{ htmlInput: { inputMode: 'decimal', 'aria-label': label } }}
      sx={{
        '& input': {
          textAlign: 'right',
          ...nums,
          py: 0.75,
          fontStyle: auto && value ? 'italic' : undefined,
          color: auto && value ? 'text.secondary' : undefined,
        },
      }}
    />
  );
}

const signo = (n: number | null | undefined, fmt: (x: number) => string) =>
  n === null || n === undefined || Math.abs(n) < 0.005 ? '' : `${n > 0 ? '+' : '−'}${fmt(Math.abs(n))}`;

/**
 * Liquidación de la guía en dos columnas: lo que cobra la aerolínea (va en la
 * guía madre) y lo que se le cobra al cliente. La ganancia es la diferencia
 * (hoy no hay comisión: la aerolínea da p. ej. 3,00 el kilo y al cliente se le
 * cobra 3,30). Para el cliente solo se escribe lo que cambia; lo vacío es igual
 * a la guía madre. Los totales los calcula el servidor con las fórmulas del
 * sistema viejo.
 */
export function LiquidacionEditor({
  aerolinea: a,
  onAerolinea,
  cliente: c,
  onCliente,
  conCliente,
  onConCliente,
  parametros,
  resumenAerolinea: ra,
  resumenCliente: rc,
  diferencia,
  pesoBruto,
  onSugerir,
  liqAuto,
  handlingAuto,
  clienteAuto,
  propuestaCliente,
  errorPesoCobrable,
}: Props) {
  const [todosLosCargos, setTodosLosCargos] = useState(false);
  // En Access hay conceptos sin rótulo guardados como "0".
  const abreviatura = (campo: string) => {
    const x = parametros?.aerolinea?.conceptos.find((k) => k.campo === campo)?.abreviatura?.trim();
    return x && x !== '0' ? x : null;
  };
  const ayudaConcepto = (campo: string) => {
    const k = parametros?.aerolinea?.conceptos.find((x) => x.campo === campo);
    if (!k || !k.valor) return null;
    return k.porPeso ? `${k.valor} por kg ${k.sobrePesoCobrable ? 'cobrable' : 'bruto'}` : null;
  };
  const tieneValor = (k: Campo) => (a[k] ?? '') !== '' || (c[k] ?? '') !== '';
  const conceptos = CONCEPTOS_AEROLINEA.filter(
    (k) => ['guiaAerea', 'combustible', 'otros'].includes(k) || abreviatura(k) || tieneValor(k),
  );
  // Cargos de agencia: solo los que se usan en esta guía (o todos, si se pide).
  const codigosAgencia = CODIGOS_AGENCIA.filter((k) => todosLosCargos || tieneValor(k));
  const ocultos = CODIGOS_AGENCIA.length - codigosAgencia.length;
  const efectivoCliente = (k: Campo) => numero(c[k]) ?? numero(a[k]);
  const difCampo = (k: Campo) => {
    const x = efectivoCliente(k);
    const y = numero(a[k]);
    return x === undefined && y === undefined ? null : (x ?? 0) - (y ?? 0);
  };

  const fila = (
    k: Campo,
    etiqueta: string,
    opts: { auto?: boolean; ayuda?: string | null; fmt?: (x: number) => string; error?: string | null } = {},
  ) => (
    <TableRow key={k}>
      <TableCell>
        <Typography variant="body2">{etiqueta}</Typography>
        {opts.ayuda && (
          <Typography variant="caption" color="text.secondary">
            {opts.ayuda}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Entrada
          label={`${etiqueta} guía madre`}
          value={a[k]}
          auto={opts.auto}
          error={opts.error}
          onChange={(v) => onAerolinea(k, v)}
        />
      </TableCell>
      {conCliente && (
        <>
          <TableCell>
            <Entrada
              label={`${etiqueta} cliente`}
              value={c[k]}
              auto={clienteAuto}
              placeholder={a[k] || undefined}
              onChange={(v) => onCliente(k, v)}
            />
          </TableCell>
          <TableCell align="right" sx={{ ...nums, color: 'text.secondary' }}>
            {signo(difCampo(k), opts.fmt ?? ((x) => num(x)))}
          </TableCell>
        </>
      )}
    </TableRow>
  );

  const calculada = (etiqueta: string, va: number | null | undefined, vc: number | null | undefined, dif: number | null | undefined, fuerte = false) => (
    <TableRow sx={{ '& td': { fontWeight: fuerte ? 700 : 600, fontSize: fuerte ? '1rem' : undefined } }}>
      <TableCell>{etiqueta}</TableCell>
      <TableCell align="right" sx={{ ...nums, pr: 2 }}>{usd(va)}</TableCell>
      {conCliente && (
        <>
          <TableCell align="right" sx={{ ...nums, pr: 2 }}>{usd(vc)}</TableCell>
          <TableCell align="right" sx={{ ...nums, color: dif && dif < 0 ? 'error.main' : 'success.main' }}>
            {signo(dif, (x) => usd(x))}
          </TableCell>
        </>
      )}
    </TableRow>
  );

  const grupo = (titulo: string, nota?: string) => (
    <TableRow>
      <TableCell colSpan={conCliente ? 4 : 2} sx={{ pt: 2, pb: 0.5 }}>
        <Typography variant="overline" color="text.secondary">
          {titulo}
        </Typography>
        {nota && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {nota}
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );

  const resta = (x: number | null | undefined, y: number | null | undefined) =>
    x === null || x === undefined || y === null || y === undefined ? null : x - y;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 1 }} spacing={1}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Liquidación
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            La ganancia es la diferencia entre lo que se cobra al cliente y lo que cobra la aerolínea.
          </Typography>
          {conCliente && propuestaCliente && (
            <Typography variant="caption" color="text.secondary" component="div">
              Cobro al cliente propuesto (en cursiva) de la última guía de esta marca: {propuestaCliente.numeroGuia ?? '—'} del{' '}
              {formatDate(propuestaCliente.fechaVuelo)}. Revisa sobre todo Transport, que varía.
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          <FormControlLabel
            control={<Switch checked={conCliente} onChange={(e) => onConCliente(e.target.checked)} />}
            label={<Typography variant="body2">Corte extra (cobrar al cliente distinto)</Typography>}
          />
          {onSugerir && (
            <Tooltip title="Vuelve a poner la tarifa y los cargos de la aerolínea">
              <Button size="small" startIcon={<RecalcularIcon />} onClick={onSugerir}>
                Recalcular
              </Button>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      <TableContainer>
        <Table size="small" sx={{ '& td, & th': { borderBottom: 'none', py: 0.5 }, minWidth: conCliente ? 640 : 380 }}>
          <colgroup>
            <col />
            <col style={{ width: conCliente ? '24%' : 220 }} />
            {conCliente && <col style={{ width: '24%' }} />}
            {conCliente && <col style={{ width: '14%' }} />}
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>Concepto</TableCell>
              <TableCell align="right">Guía madre (normal)</TableCell>
              {conCliente && <TableCell align="right">Cliente (extra)</TableCell>}
              {conCliente && <TableCell align="right">Diferencia</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {grupo('Flete')}
            {fila('pesoCobrable', 'Peso cobrable (kg)', {
              ayuda: `Lo da la aerolínea (peso por volumen)${pesoBruto ? ` · mínimo ${num(pesoBruto)} kg` : ''}`,
              fmt: (x) => `${num(x)} kg`,
              error: errorPesoCobrable,
            })}
            {fila('tarifa', 'Tarifa por kg', { auto: liqAuto, fmt: (x) => `${tarifa(x)}/kg` })}
            {calculada('Flete', ra?.flete, rc?.flete, diferencia?.flete)}

            {grupo('Cargos de aerolínea (due carrier)')}
            {conceptos.map((k) =>
              fila(k, abreviatura(k) ? `${NOMBRE_CONCEPTO[k]} (${abreviatura(k)})` : NOMBRE_CONCEPTO[k], {
                auto: liqAuto,
                ayuda: ayudaConcepto(k),
              }),
            )}
            {fila('iva', 'IVA')}
            {calculada('Subtotal aerolínea', ra?.dueCarrier, rc?.dueCarrier, resta(rc?.dueCarrier, ra?.dueCarrier))}

            {grupo('Cargos de agencia (due agent)', conCliente ? '· normalmente van solo en el cobro al cliente' : undefined)}
            {codigosAgencia.map((k) => fila(k, parametros?.etiquetasAgencia[k] ?? k))}
            {(ocultos > 0 || todosLosCargos) && (
              <TableRow>
                <TableCell colSpan={conCliente ? 4 : 2} sx={{ py: 0.25 }}>
                  <Link component="button" type="button" variant="body2" onClick={() => setTodosLosCargos((v) => !v)}>
                    {todosLosCargos ? 'Mostrar solo los cargos usados' : `Mostrar todos los cargos (${ocultos} sin valor)`}
                  </Link>
                </TableCell>
              </TableRow>
            )}
            {calculada('Subtotal agencia', ra?.dueAgent, rc?.dueAgent, resta(rc?.dueAgent, ra?.dueAgent))}

            <TableRow>
              <TableCell colSpan={conCliente ? 4 : 2} sx={{ py: 0.5 }} />
            </TableRow>
            {calculada('Total guía', ra?.total, rc?.total, diferencia?.total, true)}

            {grupo('Aparte')}
            <TableRow>
              <TableCell>
                <Typography variant="body2">Handling al cliente</Typography>
                <Typography variant="caption" color="text.secondary">
                  {handlingAuto && a.aux3Handling ? 'De la ficha del cliente. ' : ''}Se cobra aparte: no suma a la guía.
                </Typography>
              </TableCell>
              {conCliente && <TableCell />}
              <TableCell>
                <Entrada
                  label="Handling al cliente"
                  value={a.aux3Handling}
                  auto={handlingAuto}
                  onChange={(v) => onAerolinea('aux3Handling', v)}
                />
              </TableCell>
              {conCliente && <TableCell />}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
