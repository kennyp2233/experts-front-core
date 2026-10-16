'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { ArrowBack as VolverIcon } from '@mui/icons-material';
import { useAuth } from '@/features/auth';
import { AppPage } from '@/shared/components/ui';
import { formatDate, formatDateTime, getErrorMessage } from '@/shared/utils';
import { useCoordinacion } from '../hooks/useCoordinaciones';
import type { CoordinacionDetalle, TramoRuta } from '../types/coordinacion';
import { formatoAwb, kg, num } from '../utils/formato';
import { EstadoCoordinacionChip, OrigenChip } from './EstadoCoordinacionChip';
import { AccionesCoordinacion } from './detalle/AccionesCoordinacion';
import { DetalleCoordinadoTabla } from './detalle/DetalleCoordinadoTabla';
import { FichaCoordinacion } from './detalle/FichaCoordinacion';
import { GuiasHijasTabla } from './detalle/GuiasHijasTabla';
import { LiquidacionPanel } from './detalle/LiquidacionPanel';
import { NavegacionDia } from './detalle/NavegacionDia';
import { ValidacionTab } from './detalle/ValidacionTab';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

const ESTADO_GUIA: Record<string, string> = { INGRESADA: 'libre', COORDINADA: 'coordinada', PRESTADA: 'prestada' };

/** Lista "etiqueta: valor" en dos columnas. */
function Campos({ filas }: { filas: Array<[string, React.ReactNode]> }) {
  return (
    <Box
      component="dl"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'max-content 1fr' },
        columnGap: 3,
        rowGap: 1,
        m: 0,
        '& dt': { color: 'text.secondary', typography: 'body2' },
        '& dd': { m: 0, typography: 'body2', fontWeight: 500, mb: { xs: 1, sm: 0 } },
      }}
    >
      {filas.map(([k, v]) => (
        <Box key={k} sx={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v === null || v === undefined || v === '' ? '—' : v}</dd>
        </Box>
      ))}
    </Box>
  );
}

const fechaHora = (iso: string | null, tipo: string | null) => (iso ? `${formatDateTime(iso)} ${tipo ?? ''}`.trim() : '');

/**
 * "Ruta, Vuelos, Manifiesto" como la pestaña vieja: desde dónde sale (From) y
 * hasta tres tramos (To / By, con vuelo, salida y llegada); abajo el manifiesto.
 */
function RutaPanel({ c }: { c: CoordinacionDetalle }) {
  const por = (tipo: string): TramoRuta | undefined => c.rutas.find((r) => r.tipoRuta === tipo);
  const tramos = [1, 2, 3]
    .map((n) => ({ n, to: por(`DESTINO${n}`), by: por(`VIA${n}`) }))
    .filter((t) => t.to?.codigo || t.by?.codigo);
  const m = c.manifiesto;
  return (
    <Stack spacing={2}>
      <Paper variant="outlined">
        <Stack direction="row" spacing={1} sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Sale de (From)
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            {por('ORIGEN')?.codigo ?? '—'}
          </Typography>
        </Stack>
        {tramos.length === 0 ? (
          <Typography color="text.secondary" sx={{ px: 2, pb: 2 }}>
            Sin vuelos registrados.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tramo</TableCell>
                  <TableCell>Hasta (To)</TableCell>
                  <TableCell>Aerolínea (By)</TableCell>
                  <TableCell>Vuelo</TableCell>
                  <TableCell>Salida</TableCell>
                  <TableCell>Llegada</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tramos.map(({ n, to, by }) => (
                  <TableRow key={n}>
                    <TableCell>{n}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{to?.codigo ?? '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{by?.codigo ?? '—'}</TableCell>
                    <TableCell sx={nums}>{by?.vuelo ?? to?.vuelo ?? ''}</TableCell>
                    <TableCell sx={nums}>
                      {fechaHora(by?.fechaHoraSalida ?? to?.fechaHoraSalida ?? null, by?.salidaTipo ?? to?.salidaTipo ?? null)}
                    </TableCell>
                    <TableCell sx={nums}>
                      {fechaHora(by?.fechaHoraLlegada ?? to?.fechaHoraLlegada ?? null, by?.llegadaTipo ?? to?.llegadaTipo ?? null)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Manifiesto
        </Typography>
        {m ? (
          <Campos
            filas={[
              ['Manifiesto', <span key="r" style={nums}>{m.referencia}</span>],
              ['Aduana · año · transportista', [m.aduana, m.anio, m.tipo].filter(Boolean).join(' · ')],
              ['Número · secuencial', [m.numero, m.secuencial].filter(Boolean).join(' · ')],
              ['N° de vuelo', m.vuelo],
              ['Arribo', [formatDate(m.fechaArribo, ''), m.horaArribo].filter(Boolean).join(' ')],
            ]}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Todavía no tiene manifiesto (llega después del corte).
          </Typography>
        )}
      </Paper>
    </Stack>
  );
}

function MasDatosPanel({ c, admin }: { c: CoordinacionDetalle; admin: boolean }) {
  const legacy = admin ? Object.entries(c.datosLegacy ?? {}) : [];
  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Campos
          filas={[
            [
              'Guía madre',
              [formatoAwb(c.guiaMadre.numero), ESTADO_GUIA[c.guiaMadre.estado ?? ''], c.guiaMadre.virtual ? 'virtual' : null]
                .filter(Boolean)
                .join(' · '),
            ],
            [
              'Ingreso de guías',
              c.guiaMadre.lote
                ? `N° ${c.guiaMadre.lote.codigoAccess ?? c.guiaMadre.lote.id} (${formatDate(c.guiaMadre.lote.fecha)})`
                : null,
            ],
            ['Guías hijas', num(c.guias.length, 0)],
            ['Volumen', c.totalVolumen !== null ? `${num(c.totalVolumen)} kg vol.` : null],
            ['Reserva (cupo de fulls)', c.cupoFulls ? num(c.cupoFulls) : null],
            ['Certificado de origen', c.certificadoOrigen],
            ['Otros consignatarios', c.marcas.map((m) => m.consignatario?.nombre ?? '—').join(', ')],
            ['Creada por', [c.auditoria.creadoPor, formatDateTime(c.auditoria.creadoEn, '')].filter(Boolean).join(' · ')],
            ['Modificada por', [c.auditoria.actualizadoPor, formatDateTime(c.auditoria.actualizadoEn, '')].filter(Boolean).join(' · ')],
          ]}
        />
      </Paper>
      {c.medidas.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Medidas (cm)</TableCell>
                <TableCell align="right">Fulls</TableCell>
                <TableCell align="right">Cajas</TableCell>
                <TableCell align="right">Kg</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {c.medidas.map((m) => (
                <TableRow key={m.orden}>
                  <TableCell sx={nums}>{`${num(m.largo, 0)} × ${num(m.ancho, 0)} × ${num(m.alto, 0)}`}</TableCell>
                  <TableCell align="right" sx={nums}>{num(m.fulls)}</TableCell>
                  <TableCell align="right" sx={nums}>{num(m.piezas, 0)}</TableCell>
                  <TableCell align="right" sx={nums}>{m.kgs ? kg(m.kgs) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {legacy.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Otros valores del sistema viejo
          </Typography>
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1 }}>
            Solo administradores: columnas de Access cuyo significado todavía no está confirmado; se guardan tal cual.
          </Typography>
          <Campos filas={legacy.map(([k, v]) => [k, String(v)])} />
        </Paper>
      )}
    </Stack>
  );
}

type Pestana = 'detalle' | 'valores' | 'ruta' | 'guias' | 'mas' | 'validacion';

/**
 * Una coordinación, como el documento de la ventana vieja: la cabecera
 * (ficha) arriba y debajo las pestañas en el mismo orden (Detalle de
 * Coordinación · Valores · Ruta, Vuelos, Manifiesto), más las guías hijas.
 */
export function CoordinacionDetallePage({ id }: { id: number }) {
  const { coordinacion: c, error, isLoading, mutate } = useCoordinacion(id);
  const [tab, setTab] = useState<Pestana>('detalle');
  const { user } = useAuth();
  const admin = user?.role === 'ADMIN';

  const volver = (
    <Button
      component={Link}
      href={c ? `/operacion/coordinaciones?dia=${c.fechaVuelo}` : '/operacion/coordinaciones'}
      startIcon={<VolverIcon />}
      variant="text"
    >
      {c ? 'Lista del día' : 'Coordinaciones'}
    </Button>
  );

  if (error) {
    return (
      <AppPage title="Coordinación" actions={volver}>
        <Alert severity="error" action={<Button onClick={() => mutate()}>Reintentar</Button>}>
          {getErrorMessage(error, 'No se pudo cargar la coordinación.')}
        </Alert>
      </AppPage>
    );
  }
  if (isLoading || !c) {
    return (
      <AppPage title="Coordinación" actions={volver}>
        <Skeleton variant="rounded" height={170} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={320} />
      </AppPage>
    );
  }

  return (
    <AppPage
      title={`Coordinación N° ${c.codigoAccess ?? c.id} · ${formatoAwb(c.numeroGuia)}`}
      subtitle={
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <EstadoCoordinacionChip estado={c.estado} />
          <OrigenChip origen={c.origen} />
          <span>Coordinada el {formatDate(c.fechaAsignacion)}</span>
        </Stack>
      }
      actions={
        <>
          <NavegacionDia c={c} />
          <AccionesCoordinacion c={c} onCambio={() => mutate()} />
          {volver}
        </>
      }
    >
      <FichaCoordinacion c={c} />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="detalle" label="Detalle de coordinación" />
        <Tab value="valores" label="Valores" />
        <Tab value="ruta" label="Ruta, vuelos y manifiesto" />
        <Tab value="guias" label={`Guías hijas (${c.guias.length})`} />
        <Tab value="mas" label="Más datos" />
        {admin && c.origen === 'ACCESS' && <Tab value="validacion" label="Validación" />}
      </Tabs>

      {tab === 'detalle' && <DetalleCoordinadoTabla guias={c.guias} />}
      {tab === 'valores' && <LiquidacionPanel c={c} />}
      {tab === 'ruta' && <RutaPanel c={c} />}
      {tab === 'guias' && <GuiasHijasTabla guias={c.guias} />}
      {tab === 'mas' && <MasDatosPanel c={c} admin={admin} />}
      {tab === 'validacion' && admin && <ValidacionTab id={c.id} />}
    </AppPage>
  );
}
