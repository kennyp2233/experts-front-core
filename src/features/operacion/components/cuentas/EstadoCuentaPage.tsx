'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { FileDownloadOutlined as ExcelIcon, Print as ImprimirIcon } from '@mui/icons-material';
import { AppPage, DataTable, type DataTableColumn } from '@/shared/components/ui';
import { useToast } from '@/shared/providers';
import { formatDate, getErrorMessage } from '@/shared/utils';
import { useEstadoCuenta } from '../../hooks/useCuentas';
import { cuentasService } from '../../services/cuentas.service';
import { CODIGOS_AGENCIA, CONCEPTOS_AEROLINEA } from '../../types/coordinacion';
import type { CobroGuia } from '../../types/cuentas';
import { formatoAwb, num } from '../../utils/formato';
import {
  codigosConValor,
  hoyIso,
  mesDe,
  monto,
  montoOVacio,
  NOMBRE_CARGO_AEROLINEA,
  queryCuentas,
  sumar,
  textoCargoAgencia,
} from '../../utils/cuentas';
import { OpcionAutocomplete } from '../coordinar/OpcionAutocomplete';
import { PeriodoSelector } from './PeriodoSelector';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

/** El detalle de los cargos de aerolínea de una guía, para el globo de la celda. */
const detalleCargosAerolinea = (f: CobroGuia) =>
  CONCEPTOS_AEROLINEA.filter((k) => (f.cargosAerolinea?.[k] ?? 0) !== 0)
    .map((k) => `${NOMBRE_CARGO_AEROLINEA[k]}: ${monto(f.cargosAerolinea[k])}`)
    .join('\n');

/**
 * Estado de cuenta de un cliente: lo que se le cobra por cada guía del período
 * (flete, cargos de aerolínea y de agencia, IVA), el handling de Experts y el
 * total a pagar. Filtros en la URL (?cliente=&desde=&hasta=&abiertas=1) para
 * que el botón "Imprimir" y los enlaces funcionen. Usa `useSearchParams`: la
 * página que la monta la envuelve en <Suspense>.
 */
export function EstadoCuentaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const toast = useToast();

  const mes = useMemo(() => mesDe(hoyIso()), []);
  const idCliente = sp.get('cliente') ? Number(sp.get('cliente')) || null : null;
  const desde = sp.get('desde') ?? mes.desde;
  const hasta = sp.get('hasta') ?? mes.hasta;
  const incluirAbiertas = sp.get('abiertas') === '1';

  const actualizar = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const filtros = useMemo(
    () => ({ idCliente: idCliente ?? undefined, desde, hasta, incluirAbiertas }),
    [idCliente, desde, hasta, incluirAbiertas],
  );
  const { estado, error, isLoading, isValidating, mutate } = useEstadoCuenta(idCliente ? filtros : null);
  const filas = useMemo(() => estado?.filas ?? [], [estado]);

  // Solo los cargos de agencia que tuvieron valor en el período, en el orden de la guía.
  const codigos = useMemo(() => codigosConValor(filas, CODIGOS_AGENCIA), [filas]);

  const columnas = useMemo<DataTableColumn<CobroGuia>[]>(() => {
    const etiquetas = estado?.etiquetasAgencia;
    return [
      { key: 'fecha', label: 'Fecha', description: 'Fecha de vuelo', value: (f) => formatDate(f.fechaVuelo), mobile: 'subtitle' },
      {
        key: 'guia',
        label: 'Guía',
        pinned: true,
        mobile: 'title',
        value: (f) => formatoAwb(f.numeroGuia),
        render: (f) => (
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ whiteSpace: 'nowrap' }}>
            <Typography variant="body2" fontWeight={600} sx={nums}>
              {formatoAwb(f.numeroGuia)}
            </Typography>
            {f.estado !== 'CORTADO' && (
              <Tooltip title="Todavía no se corta: los valores pueden cambiar">
                <Chip size="small" color="warning" variant="outlined" label="Sin cortar" />
              </Tooltip>
            )}
          </Stack>
        ),
      },
      { key: 'marca', label: 'Marca', value: (f) => f.marca?.nombre, maxWidth: 170 },
      { key: 'destino', label: 'Destino', value: (f) => f.destino?.codigo ?? f.destino?.nombre },
      { key: 'piezas', label: 'Piezas', align: 'right', value: (f) => num(f.piezas, 0) },
      { key: 'kg', label: 'Kg', description: 'Peso bruto', align: 'right', value: (f) => num(f.pesoBruto) },
      {
        key: 'cobrable',
        label: 'Peso cobrable',
        description: 'Peso por el que se cobra (el mayor entre el real y el volumétrico)',
        align: 'right',
        value: (f) => num(f.pesoCobrable),
      },
      { key: 'tarifa', label: 'Tarifa', description: 'Valor por kg', align: 'right', value: (f) => monto(f.tarifa) },
      { key: 'flete', label: 'Flete', description: 'Peso cobrable × tarifa', align: 'right', value: (f) => monto(f.flete) },
      {
        key: 'cargosAerolinea',
        label: 'Cargos aerolínea',
        description: 'Guía aérea, combustible, seguridad y otros que cobra la aerolínea (pasa el mouse sobre el valor para ver el detalle)',
        align: 'right',
        value: (f) => monto(f.dueCarrier),
        render: (f) => (
          <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{detalleCargosAerolinea(f) || 'Sin cargos'}</span>}>
            <span>{monto(f.dueCarrier)}</span>
          </Tooltip>
        ),
      },
      ...codigos.map<DataTableColumn<CobroGuia>>((k) => ({
        key: k,
        label: textoCargoAgencia(k, etiquetas),
        description: `Cargo de agencia ${textoCargoAgencia(k, etiquetas)}`,
        align: 'right',
        value: (f) => montoOVacio(f.cargosAgencia?.[k]),
      })),
      { key: 'iva', label: 'IVA', align: 'right', value: (f) => monto(f.iva) },
      { key: 'totalGuia', label: 'Total guía', description: 'Flete + cargos + IVA (sin el handling)', align: 'right', value: (f) => monto(f.totalGuia) },
      { key: 'handling', label: 'Handling', description: 'Handling de Experts al cliente', align: 'right', value: (f) => monto(f.handling) },
      {
        key: 'totalCobrar',
        label: 'Total a pagar',
        description: 'Total de la guía + handling',
        align: 'right',
        value: (f) => monto(f.totalCobrar),
        render: (f) => (
          <Typography variant="body2" fontWeight={700} sx={nums}>
            {monto(f.totalCobrar)}
          </Typography>
        ),
      },
    ];
  }, [codigos, estado?.etiquetasAgencia]);

  const totales = useMemo(() => {
    if (!filas.length) return undefined;
    const t: Record<string, string> = {
      fecha: `Totales · ${filas.length} ${filas.length === 1 ? 'guía' : 'guías'}`,
      piezas: num(sumar(filas, (f) => f.piezas), 0),
      kg: num(sumar(filas, (f) => f.pesoBruto)),
      cobrable: num(sumar(filas, (f) => f.pesoCobrable)),
      flete: monto(sumar(filas, (f) => f.flete)),
      cargosAerolinea: monto(sumar(filas, (f) => f.dueCarrier)),
      iva: monto(sumar(filas, (f) => f.iva)),
      totalGuia: monto(sumar(filas, (f) => f.totalGuia)),
      handling: monto(sumar(filas, (f) => f.handling)),
      totalCobrar: monto(sumar(filas, (f) => f.totalCobrar)),
    };
    for (const k of codigos) t[k] = monto(sumar(filas, (f) => f.cargosAgencia?.[k]));
    return t;
  }, [filas, codigos]);

  const nombreCliente = estado?.cliente?.nombreFactura || estado?.cliente?.nombre || '';
  const [bajando, setBajando] = useState(false);
  const excel = async () => {
    if (!idCliente) return;
    setBajando(true);
    try {
      await cuentasService.descargarEstadoCuenta({ ...filtros, idCliente }, nombreCliente);
    } catch (e) {
      toast.error(getErrorMessage(e, 'No se pudo generar el Excel.'));
    } finally {
      setBajando(false);
    }
  };
  const imprimir = () =>
    window.open(
      `/imprimir/cuentas/estado-cuenta?${queryCuentas({ cliente: idCliente, desde, hasta, abiertas: incluirAbiertas })}`,
      '_blank',
    );

  const sinGuias = !!idCliente && !!estado && filas.length === 0;
  const totalPagar = estado ? sumar(filas, (f) => f.totalCobrar) : 0;

  return (
    <AppPage
      title="Estado de cuenta"
      subtitle="Lo que se le cobra al cliente por cada guía del período: flete, cargos, IVA y el handling de Experts, con el total a pagar."
      actions={
        <>
          <Button
            variant="outlined"
            startIcon={bajando ? <CircularProgress size={14} color="inherit" /> : <ExcelIcon />}
            disabled={!idCliente || bajando || sinGuias}
            onClick={excel}
          >
            Excel
          </Button>
          <Button variant="contained" startIcon={<ImprimirIcon />} disabled={!idCliente || filas.length === 0} onClick={imprimir}>
            Imprimir
          </Button>
        </>
      }
    >
      {estado?.cliente && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" color="text.secondary">
                Datos de facturación
              </Typography>
              <Typography fontWeight={600}>{nombreCliente}</Typography>
              <Typography variant="body2" color="text.secondary">
                {[estado.cliente.ruc && `RUC ${estado.cliente.ruc}`, estado.cliente.direccion, estado.cliente.telefono && `Tel. ${estado.cliente.telefono}`]
                  .filter(Boolean)
                  .join(' · ') || 'Sin RUC ni dirección en la ficha del cliente.'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: { sm: 'right' } }}>
              <Typography variant="caption" color="text.secondary">
                Total a pagar del período
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={nums}>
                $ {monto(totalPagar)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                incluye $ {monto(sumar(filas, (f) => f.handling))} de handling
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}
      <DataTable
        id="operacion-estado-cuenta"
        columns={columnas}
        rows={filas}
        getRowId={(f) => String(f.id)}
        loading={isLoading || isValidating}
        error={error}
        onRetry={() => mutate()}
        onRefresh={idCliente ? () => mutate() : undefined}
        onRowClick={(f) => router.push(`/operacion/coordinaciones/${f.id}`)}
        emptyMessage={
          !idCliente
            ? 'Elige un cliente para ver su estado de cuenta.'
            : incluirAbiertas
              ? 'Este cliente no tiene guías con vuelo en ese período.'
              : 'Este cliente no tiene guías cortadas con vuelo en ese período.'
        }
        dense
        totals={totales}
        filters={
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
            <Box sx={{ width: 300 }}>
              <OpcionAutocomplete
                tipo="clientes"
                label="Cliente"
                value={idCliente}
                onChange={(id) => actualizar({ cliente: id ? String(id) : undefined })}
              />
            </Box>
            <PeriodoSelector desde={desde} hasta={hasta} onChange={(p) => actualizar({ desde: p.desde, hasta: p.hasta })} />
            <Tooltip title="Por defecto solo salen las guías cortadas, con valores definitivos">
              <FormControlLabel
                control={
                  <Switch size="small" checked={incluirAbiertas} onChange={(e) => actualizar({ abiertas: e.target.checked ? '1' : undefined })} />
                }
                label="Incluir sin cortar"
                slotProps={{ typography: { variant: 'body2' } }}
              />
            </Tooltip>
          </Stack>
        }
      />
    </AppPage>
  );
}
