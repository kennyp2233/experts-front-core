'use client';

import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Chip,
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
  Typography,
} from '@mui/material';
import { ArrowBack as VolverIcon, Print as ImprimirIcon } from '@mui/icons-material';
import { getErrorMessage } from '@/shared/utils';
import { EstadoChip } from './MisGuiasPage';
import { LiquidacionCard } from './LiquidacionCard';
import { fechaCorta, fechaHora, formatoGuia, type GuiaCliente, num, tramosDeRuta, useGuiaCliente } from './portal';

const celdaNum = { textAlign: 'right' as const, whiteSpace: 'nowrap' as const };

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" component="div">
        {etiqueta}
      </Typography>
      <Typography variant="body2" fontWeight={600} component="div">
        {valor || '—'}
      </Typography>
    </Box>
  );
}

function Seccion({ titulo, acciones, children }: { titulo: string; acciones?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box component="section">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
          {titulo}
        </Typography>
        {acciones}
      </Stack>
      {children}
    </Box>
  );
}

const abrirHoja = (ruta: string) => window.open(ruta, '_blank', 'noopener');

function Cabecera({ g }: { g: GuiaCliente }) {
  const destino = [g.destino?.nombre, g.destinoFinal && g.destinoFinal.id !== g.destino?.id ? `con destino final ${g.destinoFinal.nombre}` : null]
    .filter(Boolean)
    .join(' ');
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1" fontWeight={700} sx={{ flex: 1 }}>
          Guía {formatoGuia(g.numeroGuia)}
        </Typography>
        <EstadoChip estado={g.estado} />
      </Stack>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
        <Dato etiqueta="Fecha de vuelo" valor={fechaCorta(g.fechaVuelo)} />
        <Dato etiqueta="Aerolínea" valor={g.aerolinea?.nombre} />
        <Dato etiqueta="Marca" valor={g.marca?.nombre} />
        <Dato etiqueta="Destino" valor={destino} />
        <Dato etiqueta="Fulls" valor={num(g.totales.fulls)} />
        <Dato etiqueta="Cajas" valor={num(g.totales.cajas)} />
        <Dato etiqueta="Kg" valor={num(g.totales.kgs)} />
        <Dato etiqueta="Manifiesto" valor={g.manifiesto} />
      </Box>
    </Paper>
  );
}

function RutaVuelo({ g }: { g: GuiaCliente }) {
  const tramos = tramosDeRuta(g.ruta);
  if (tramos.length === 0) return <Alert severity="info">Todavía no hay ruta registrada para esta guía.</Alert>;
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Desde</TableCell>
            <TableCell>Hasta</TableCell>
            <TableCell>Aerolínea</TableCell>
            <TableCell>Vuelo</TableCell>
            <TableCell>Salida</TableCell>
            <TableCell>Llegada</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tramos.map((t, i) => (
            <TableRow key={i}>
              <TableCell>{t.desde}</TableCell>
              <TableCell>{t.hasta}</TableCell>
              <TableCell>{t.aerolinea ?? '—'}</TableCell>
              <TableCell>{t.vuelo ?? '—'}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{t.salida ? fechaHora(t.salida) : '—'}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{t.llegada ? fechaHora(t.llegada) : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function GuiasHijas({ g }: { g: GuiaCliente }) {
  const total = g.guiasHijas.reduce((t, h) => ({ piezas: t.piezas + h.piezas, fulls: t.fulls + h.fulls, kgs: t.kgs + h.kgs }), { piezas: 0, fulls: 0, kgs: 0 });
  if (g.guiasHijas.length === 0) return <Alert severity="info">Todavía no hay guías hijas cargadas en esta guía.</Alert>;
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Guía hija</TableCell>
            <TableCell>Finca</TableCell>
            <TableCell>Productos</TableCell>
            <TableCell>DAE</TableCell>
            <TableCell>Facturas</TableCell>
            <TableCell sx={celdaNum}>Piezas</TableCell>
            <TableCell sx={celdaNum}>Fulls</TableCell>
            <TableCell sx={celdaNum}>Kg</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {g.guiasHijas.map((h) => (
            <TableRow key={h.id}>
              <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{h.numero}</TableCell>
              <TableCell sx={{ minWidth: 180 }}>{h.finca ?? '—'}</TableCell>
              <TableCell>
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  {h.productos.map((p) => (
                    <Chip key={p} size="small" label={p} variant="outlined" />
                  ))}
                </Stack>
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{h.dae ?? '—'}</TableCell>
              <TableCell>{h.facturas.length ? h.facturas.join(', ') : '—'}</TableCell>
              <TableCell sx={celdaNum}>{num(h.piezas)}</TableCell>
              <TableCell sx={celdaNum}>{num(h.fulls)}</TableCell>
              <TableCell sx={celdaNum}>{num(h.kgs)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5} sx={{ fontWeight: 700 }}>
              Total · {g.guiasHijas.length} {g.guiasHijas.length === 1 ? 'guía hija' : 'guías hijas'}
            </TableCell>
            <TableCell sx={{ ...celdaNum, fontWeight: 700 }}>{num(total.piezas)}</TableCell>
            <TableCell sx={{ ...celdaNum, fontWeight: 700 }}>{num(total.fulls)}</TableCell>
            <TableCell sx={{ ...celdaNum, fontWeight: 700 }}>{num(total.kgs)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}

/**
 * Detalle de una guía para el cliente: datos y ruta del vuelo, guías hijas por
 * finca y, si la guía ya fue despachada, la liquidación (lo que se le cobra).
 */
export function GuiaClientePage({ id }: { id: number }) {
  const { data: g, error, isLoading, mutate } = useGuiaCliente(id);

  const volver = (
    <Button component={Link} href="/portal-clientes" startIcon={<VolverIcon />} sx={{ alignSelf: 'flex-start' }}>
      Mis guías
    </Button>
  );

  if (error) {
    return (
      <Stack spacing={2}>
        {volver}
        <Alert severity="error" action={<Button onClick={() => mutate()}>Reintentar</Button>}>
          {getErrorMessage(error, 'No se pudo cargar la guía.')}
        </Alert>
      </Stack>
    );
  }
  if (isLoading || !g) {
    return (
      <Stack spacing={2}>
        {volver}
        <Skeleton variant="rounded" height={140} />
        <Skeleton variant="rounded" height={200} />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {volver}
      <Cabecera g={g} />

      <Seccion titulo="Ruta y vuelo">
        <RutaVuelo g={g} />
      </Seccion>

      <Seccion
        titulo="Guías hijas por finca"
        acciones={
          g.guiasHijas.length > 0 ? (
            <Button variant="outlined" startIcon={<ImprimirIcon />} onClick={() => abrirHoja(`/portal-clientes/imprimir/guias/${g.id}/guias-hijas`)}>
              Imprimir guías hijas
            </Button>
          ) : undefined
        }
      >
        <GuiasHijas g={g} />
      </Seccion>

      <Seccion
        titulo="Lo que se le cobra"
        acciones={
          g.liquidacion ? (
            <Button variant="contained" startIcon={<ImprimirIcon />} onClick={() => abrirHoja(`/portal-clientes/imprimir/guias/${g.id}/liquidacion`)}>
              Imprimir liquidación
            </Button>
          ) : undefined
        }
      >
        {g.liquidacion ? (
          <Box sx={{ maxWidth: 720 }}>
            <LiquidacionCard liquidacion={g.liquidacion} />
          </Box>
        ) : (
          <Alert severity="info">
            {g.estado === 'EN_PREPARACION'
              ? 'Esta guía todavía está en preparación. Cuando se despache, aquí verá el detalle de lo que se le cobra.'
              : 'El detalle de lo que se le cobra todavía no está disponible para esta guía.'}
          </Alert>
        )}
      </Seccion>
    </Stack>
  );
}
