'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Download as ExcelIcon, Print as ImprimirIcon } from '@mui/icons-material';
import { useToast } from '@/shared/providers';
import { getErrorMessage } from '@/shared/utils';
import {
  COLUMNAS_COBRO,
  descargarBlob,
  fechaCorta,
  hoyEcuador,
  periodosRapidos,
  portalClientesService,
  quincenaActual,
  useEstadoCuenta,
  usePerfilCliente,
  usd,
} from './portal';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Estado de cuenta: lo que se le cobra por cada guía despachada del período,
 * con totales al pie. Atajos de quincena, Excel e impresión (A4 horizontal).
 */
export function EstadoCuentaPage() {
  const toast = useToast();
  const { data: perfil } = usePerfilCliente();
  const hoy = useMemo(() => hoyEcuador(), []);
  const grupos = useMemo(() => periodosRapidos(hoy), [hoy]);
  const [inicial] = useState(() => quincenaActual(hoy));
  const [desde, setDesde] = useState(inicial.desde);
  const [hasta, setHasta] = useState(inicial.hasta);
  const [idCliente, setIdCliente] = useState<number | null>(null);
  const [bajando, setBajando] = useState(false);

  const clientes = perfil?.clientes ?? [];
  const varios = clientes.length > 1;
  const cliente = varios ? (idCliente ?? clientes[0]?.id) : undefined;
  const periodoValido = ISO.test(desde) && ISO.test(hasta) && desde <= hasta;
  const filtros = periodoValido && perfil ? { desde, hasta, idCliente: cliente } : null;
  const { data, error, isLoading, mutate } = useEstadoCuenta(filtros);

  const imprimir = () => {
    if (!filtros) return;
    const p = new URLSearchParams({ desde, hasta, ...(cliente ? { idCliente: String(cliente) } : {}) });
    window.open(`/portal-clientes/imprimir/estado-cuenta?${p}`, '_blank', 'noopener');
  };

  const bajarExcel = async () => {
    if (!filtros) return;
    setBajando(true);
    try {
      descargarBlob(await portalClientesService.estadoCuentaExcel(filtros), `estado-de-cuenta-${desde}-a-${hasta}.xlsx`);
    } catch (e) {
      toast.error(getErrorMessage(e, 'No se pudo descargar el Excel.'));
    } finally {
      setBajando(false);
    }
  };

  const filas = data?.filas ?? [];

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5" component="h1" fontWeight={600}>
          Estado de cuenta
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Lo que se le cobra por cada guía despachada del período que elija.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          {varios && (
            <TextField select size="small" label="Cliente" value={cliente ?? ''} onChange={(e) => setIdCliente(Number(e.target.value))} sx={{ maxWidth: 420 }}>
              {clientes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nombre}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField size="small" type="date" label="Desde" value={desde} onChange={(e) => setDesde(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField size="small" type="date" label="Hasta" value={hasta} onChange={(e) => setHasta(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
          <Stack spacing={1}>
            {grupos.map((g) => (
              <Stack key={g.titulo} direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                  {g.titulo}
                </Typography>
                {g.periodos.map((p) => {
                  const activo = p.desde === desde && p.hasta === hasta;
                  return (
                    <Chip
                      key={p.etiqueta}
                      label={p.etiqueta}
                      color={activo ? 'primary' : 'default'}
                      variant={activo ? 'filled' : 'outlined'}
                      onClick={() => {
                        setDesde(p.desde);
                        setHasta(p.hasta);
                      }}
                    />
                  );
                })}
              </Stack>
            ))}
          </Stack>
          {!periodoValido && <Alert severity="warning">Elija un período: la fecha “Desde” no puede ser posterior a “Hasta”.</Alert>}
        </Stack>
      </Paper>

      {error ? (
        <Alert severity="error" action={<Button onClick={() => mutate()}>Reintentar</Button>}>
          {getErrorMessage(error, 'No se pudo cargar el estado de cuenta.')}
        </Alert>
      ) : !filtros ? null : isLoading || !data ? (
        <Skeleton variant="rounded" height={220} />
      ) : (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {data.cliente.nombreFactura ?? data.cliente.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {[data.cliente.ruc ? `RUC ${data.cliente.ruc}` : null, `Del ${fechaCorta(data.desde)} al ${fechaCorta(data.hasta)}`].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
            <Button variant="outlined" startIcon={bajando ? <CircularProgress size={16} /> : <ExcelIcon />} disabled={bajando || filas.length === 0} onClick={bajarExcel}>
              Descargar Excel
            </Button>
            <Button variant="contained" startIcon={<ImprimirIcon />} disabled={filas.length === 0} onClick={imprimir}>
              Imprimir
            </Button>
          </Stack>

          {filas.length === 0 ? (
            <Alert severity="info">No hay guías despachadas en este período.</Alert>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" aria-label="Estado de cuenta por guía">
                  <TableHead>
                    <TableRow>
                      {COLUMNAS_COBRO.map((c) => (
                        <TableCell key={c.key} sx={{ textAlign: c.align, whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {c.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filas.map((f) => (
                      <TableRow key={f.id} hover>
                        {COLUMNAS_COBRO.map((c) => (
                          <TableCell key={c.key} sx={{ textAlign: c.align, whiteSpace: c.align === 'right' || c.key === 'fecha' || c.key === 'guia' ? 'nowrap' : undefined }}>
                            {c.celda(f)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      {COLUMNAS_COBRO.map((c, i) => (
                        <TableCell key={c.key} sx={{ textAlign: c.align, whiteSpace: 'nowrap', fontWeight: 700 }}>
                          {i === 0 ? 'Totales' : (c.pie?.(data.totales, filas) ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={700}>Total a pagar del período</Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {usd(data.totales.totalCobrar)}
                  </Typography>
                </Stack>
              </Paper>
              <Typography variant="caption" color="text.secondary">
                Total a pagar = total de la guía + handling (el handling se cobra aparte del total de la guía). Valores en dólares (USD).
              </Typography>
            </>
          )}
        </>
      )}
    </Stack>
  );
}
