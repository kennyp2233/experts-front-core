'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { FileDownloadOutlined as ExcelIcon } from '@mui/icons-material';
import { AppPage, DataTable, type DataTableColumn } from '@/shared/components/ui';
import { useToast } from '@/shared/providers';
import { formatDate, getErrorMessage } from '@/shared/utils';
import { useVentas } from '../../hooks/useCuentas';
import { cuentasService } from '../../services/cuentas.service';
import type { FilaVentas, ResumenVentas } from '../../types/cuentas';
import { formatoAwb, nombreCorto, num } from '../../utils/formato';
import { hoyIso, mesDe, monto } from '../../utils/cuentas';
import { OpcionAutocomplete } from '../coordinar/OpcionAutocomplete';
import { PeriodoSelector } from './PeriodoSelector';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

/** Margen sobre lo cobrado: ganancia / cobrado. */
const margen = (ganancia: number, cobrado: number): number | null => (cobrado > 0 ? (ganancia / cobrado) * 100 : null);
const pct = (v: number | null) => (v === null ? '—' : `${num(v, 1)} %`);
const colorGanancia = (v: number) => (v < 0 ? 'error.main' : undefined);

function Tarjeta({ titulo, valor, ayuda, color }: { titulo: string; valor: string; ayuda?: string; color?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 150px', minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {titulo}
      </Typography>
      <Typography variant="h6" fontWeight={700} color={color} sx={nums} noWrap>
        {valor}
      </Typography>
      {ayuda && (
        <Typography variant="caption" color="text.secondary" noWrap component="div">
          {ayuda}
        </Typography>
      )}
    </Paper>
  );
}

/** Resumen por aerolínea o por cliente: una fila por nombre con su costo, lo cobrado y la ganancia. */
function TablaResumen({ titulo, columna, filas }: { titulo: string; columna: string; filas: ResumenVentas[] }) {
  return (
    <Paper variant="outlined" sx={{ flex: '1 1 460px', minWidth: 0 }}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
        {titulo}
      </Typography>
      <TableContainer sx={{ maxHeight: 320 }}>
        <Table size="small" stickyHeader sx={{ '&& .MuiTableCell-root': { px: 1.25, py: 0.5 } }}>
          <TableHead>
            <TableRow>
              <TableCell>{columna}</TableCell>
              <TableCell align="right">Guías</TableCell>
              <TableCell align="right">Costo</TableCell>
              <TableCell align="right">Cobrado</TableCell>
              <TableCell align="right">Handling</TableCell>
              <TableCell align="right">Ganancia</TableCell>
              <TableCell align="right">Margen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ color: 'text.secondary' }}>
                  Sin guías en el período.
                </TableCell>
              </TableRow>
            )}
            {filas.map((r) => (
              <TableRow key={r.nombre} hover>
                <TableCell sx={{ maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.nombre}>
                  {r.nombre}
                </TableCell>
                <TableCell align="right" sx={nums}>{num(r.guias, 0)}</TableCell>
                <TableCell align="right" sx={nums}>{monto(r.costo)}</TableCell>
                <TableCell align="right" sx={nums}>{monto(r.cobrado)}</TableCell>
                <TableCell align="right" sx={nums}>{monto(r.handling)}</TableCell>
                <TableCell align="right" sx={{ ...nums, fontWeight: 600, color: colorGanancia(r.ganancia) }}>
                  {monto(r.ganancia)}
                </TableCell>
                <TableCell align="right" sx={{ ...nums, color: colorGanancia(r.ganancia) }}>
                  {pct(margen(r.ganancia, r.cobrado))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

const columnas: DataTableColumn<FilaVentas>[] = [
  { key: 'numero', label: 'N°', description: 'N° de coordinación', value: (f) => f.numero, mobile: 'hidden' },
  {
    key: 'guia',
    label: 'Guía',
    pinned: true,
    mobile: 'title',
    value: (f) => formatoAwb(f.numeroGuia),
    render: (f) => (
      <Typography variant="body2" fontWeight={600} sx={{ ...nums, whiteSpace: 'nowrap' }}>
        {formatoAwb(f.numeroGuia)}
      </Typography>
    ),
  },
  { key: 'fecha', label: 'Vuelo', description: 'Fecha de vuelo', value: (f) => formatDate(f.fechaVuelo), mobile: 'subtitle' },
  { key: 'aerolinea', label: 'Aerolínea', value: (f) => (f.aerolinea ? nombreCorto(f.aerolinea) : null), maxWidth: 130 },
  { key: 'cliente', label: 'Cliente', value: (f) => f.cliente?.nombre, maxWidth: 170 },
  { key: 'costo', label: 'Costo aerolínea', description: 'Lo que cobra la aerolínea (total de la guía madre)', align: 'right', value: (f) => monto(f.costoAerolinea) },
  { key: 'totalGuia', label: 'Total guía cliente', description: 'Flete + cargos + IVA que se le cobra al cliente (sin handling)', align: 'right', value: (f) => monto(f.totalGuia) },
  { key: 'handling', label: 'Handling', description: 'Handling de Experts al cliente', align: 'right', value: (f) => monto(f.handling) },
  { key: 'cobrado', label: 'Cobrado', description: 'Total de la guía + handling', align: 'right', value: (f) => monto(f.totalCobrar) },
  {
    key: 'ganancia',
    label: 'Ganancia',
    description: 'Cobrado − costo aerolínea',
    align: 'right',
    value: (f) => monto(f.ganancia),
    render: (f) => (
      <Typography variant="body2" fontWeight={600} color={colorGanancia(f.ganancia)} sx={nums}>
        {monto(f.ganancia)}
      </Typography>
    ),
  },
];

/**
 * Ventas y liquidación: por guía, lo que cobra la aerolínea contra lo que se
 * cobró al cliente (con el handling), y la ganancia que queda. Filtros en la
 * URL (?desde=&hasta=&aerolinea=&cliente=&abiertas=1). Usa `useSearchParams`:
 * la página que la monta la envuelve en <Suspense>.
 */
export function VentasPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const toast = useToast();

  const mes = useMemo(() => mesDe(hoyIso()), []);
  const desde = sp.get('desde') ?? mes.desde;
  const hasta = sp.get('hasta') ?? mes.hasta;
  const idAerolinea = sp.get('aerolinea') ? Number(sp.get('aerolinea')) || undefined : undefined;
  const idCliente = sp.get('cliente') ? Number(sp.get('cliente')) || undefined : undefined;
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
    () => ({ desde, hasta, idAerolinea, idCliente, incluirAbiertas }),
    [desde, hasta, idAerolinea, idCliente, incluirAbiertas],
  );
  const { ventas, error, isLoading, isValidating, mutate } = useVentas(filtros);
  const t = ventas?.totales;
  const mg = t ? margen(t.ganancia, t.totalCobrar) : null;

  const [bajando, setBajando] = useState(false);
  const excel = async () => {
    setBajando(true);
    try {
      await cuentasService.descargarVentas(filtros);
    } catch (e) {
      toast.error(getErrorMessage(e, 'No se pudo generar el Excel.'));
    } finally {
      setBajando(false);
    }
  };

  const filas = ventas?.filas ?? [];
  const totales = t
    ? {
        numero: `Totales · ${t.guias} ${t.guias === 1 ? 'guía' : 'guías'}`,
        costo: monto(t.costoAerolinea),
        totalGuia: monto(t.totalGuia),
        handling: monto(t.handling),
        cobrado: monto(t.totalCobrar),
        ganancia: (
          <Box component="span" sx={{ color: colorGanancia(t.ganancia) }}>
            {monto(t.ganancia)}
          </Box>
        ),
      }
    : undefined;

  return (
    <AppPage
      title="Ventas y liquidación"
      subtitle="Por guía: lo que cobra la aerolínea contra lo que se le cobró al cliente (con el handling) y la ganancia que queda."
      actions={
        <Button
          variant="outlined"
          startIcon={bajando ? <CircularProgress size={14} color="inherit" /> : <ExcelIcon />}
          disabled={bajando || filas.length === 0}
          onClick={excel}
        >
          Excel
        </Button>
      }
    >
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <PeriodoSelector desde={desde} hasta={hasta} onChange={(p) => actualizar({ desde: p.desde, hasta: p.hasta })} />
        <Box sx={{ width: 200 }}>
          <OpcionAutocomplete
            tipo="aerolineas"
            label="Aerolínea"
            value={idAerolinea ?? null}
            onChange={(id) => actualizar({ aerolinea: id ? String(id) : undefined })}
          />
        </Box>
        <Box sx={{ width: 260 }}>
          <OpcionAutocomplete
            tipo="clientes"
            label="Cliente"
            value={idCliente ?? null}
            onChange={(id) => actualizar({ cliente: id ? String(id) : undefined })}
          />
        </Box>
        <Tooltip title="Por defecto solo salen las guías cortadas, con valores definitivos">
          <FormControlLabel
            control={<Switch size="small" checked={incluirAbiertas} onChange={(e) => actualizar({ abiertas: e.target.checked ? '1' : undefined })} />}
            label="Incluir sin cortar"
            slotProps={{ typography: { variant: 'body2' } }}
          />
        </Tooltip>
      </Stack>

      {error && (
        <Alert severity="error" action={<Button onClick={() => mutate()}>Reintentar</Button>} sx={{ mb: 2 }}>
          {getErrorMessage(error, 'No se pudieron calcular las ventas.')}
        </Alert>
      )}
      {isValidating && ventas && <LinearProgress sx={{ mb: 1 }} />}

      {isLoading && !ventas ? (
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} sx={{ mb: 2 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={76} sx={{ flex: '1 1 150px' }} />
          ))}
        </Stack>
      ) : (
        t && (
          <>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} sx={{ mb: 2 }}>
              <Tarjeta titulo="Guías" valor={num(t.guias, 0)} ayuda={`${num(t.pesoCobrable, 0)} kg cobrables`} />
              <Tarjeta titulo="Costo aerolínea" valor={`$ ${monto(t.costoAerolinea)}`} ayuda="Lo que cobran las aerolíneas" />
              <Tarjeta titulo="Cobrado" valor={`$ ${monto(t.totalCobrar)}`} ayuda="Guías al cliente + handling" />
              <Tarjeta titulo="Handling" valor={`$ ${monto(t.handling)}`} ayuda="Incluido en lo cobrado" />
              <Tarjeta
                titulo="Ganancia"
                valor={`$ ${monto(t.ganancia)}`}
                ayuda={`Margen ${pct(mg)} sobre lo cobrado`}
                color={colorGanancia(t.ganancia)}
              />
            </Stack>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} sx={{ mb: 2.5 }}>
              <TablaResumen titulo="Por aerolínea" columna="Aerolínea" filas={ventas.porAerolinea} />
              <TablaResumen titulo="Por cliente" columna="Cliente" filas={ventas.porCliente} />
            </Stack>
          </>
        )
      )}

      <DataTable
        id="operacion-ventas"
        columns={columnas}
        rows={filas}
        getRowId={(f) => String(f.id)}
        loading={isLoading || isValidating}
        error={undefined}
        onRefresh={() => mutate()}
        onRowClick={(f) => router.push(`/operacion/coordinaciones/${f.id}`)}
        emptyMessage="No hay guías con vuelo en ese período con esos filtros."
        dense
        totals={totales}
        searchable
        searchPlaceholder="Buscar guía, aerolínea o cliente"
      />
    </AppPage>
  );
}
