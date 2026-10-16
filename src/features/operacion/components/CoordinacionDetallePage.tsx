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
import { AppPage } from '@/shared/components/ui';
import { formatDate, formatDateTime, getErrorMessage } from '@/shared/utils';
import { useCoordinacion } from '../hooks/useCoordinaciones';
import type { CoordinacionDetalle } from '../types/coordinacion';
import { kg, nombreRef, num, usd } from '../utils/formato';
import { EstadoCoordinacionChip, OrigenChip } from './EstadoCoordinacionChip';
import { AccionesCoordinacion } from './detalle/AccionesCoordinacion';
import { ArchivoFlowerCargo } from './detalle/ArchivoFlowerCargo';
import { GuiasHijasTabla } from './detalle/GuiasHijasTabla';
import { LiquidacionPanel } from './detalle/LiquidacionPanel';
import { ValidacionTab } from './detalle/ValidacionTab';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

function Kpi({ label, valor, ayuda }: { label: string; valor: string; ayuda?: string }) {
  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1.5, minWidth: 130, flex: '1 1 130px' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700} sx={nums}>
        {valor}
      </Typography>
      {ayuda && (
        <Typography variant="caption" color="text.secondary">
          {ayuda}
        </Typography>
      )}
    </Paper>
  );
}

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

const TRAMO: Record<string, string> = {
  ORIGEN: 'Origen',
  DESTINO1: 'Destino',
  VIA1: 'Vía',
  DESTINO2: 'Destino 2',
  VIA2: 'Vía 2',
  DESTINO3: 'Destino 3',
  VIA3: 'Vía 3',
};

function RutaPanel({ c }: { c: CoordinacionDetalle }) {
  if (c.rutas.length === 0) return <Typography color="text.secondary">Sin ruta registrada.</Typography>;
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tramo</TableCell>
            <TableCell>Código</TableCell>
            <TableCell>Vuelo</TableCell>
            <TableCell>Salida</TableCell>
            <TableCell>Llegada</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {c.rutas.map((r) => (
            <TableRow key={`${r.tipoRuta}-${r.orden}`}>
              <TableCell>{TRAMO[r.tipoRuta] ?? r.tipoRuta}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{r.codigo ?? '—'}</TableCell>
              <TableCell>{r.vuelo ?? ''}</TableCell>
              <TableCell sx={nums}>
                {r.fechaHoraSalida ? `${formatDateTime(r.fechaHoraSalida)} ${r.salidaTipo ?? ''}` : ''}
              </TableCell>
              <TableCell sx={nums}>
                {r.fechaHoraLlegada ? `${formatDateTime(r.fechaHoraLlegada)} ${r.llegadaTipo ?? ''}` : ''}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ManifiestoPanel({ c }: { c: CoordinacionDetalle }) {
  const m = c.manifiesto;
  if (!m) return <Typography color="text.secondary">Sin manifiesto registrado.</Typography>;
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Campos
        filas={[
          ['Referencia', <span key="r" style={{ fontVariantNumeric: 'tabular-nums' }}>{m.referencia}</span>],
          ['Número de manifiesto', m.numero],
          ['Secuencial de la guía (MSN)', m.secuencial],
          ['Aduana', m.aduana],
          ['Año', m.anio],
          ['Transportista', m.tipo],
          ['Origen', m.origen],
          ['Vuelo', m.vuelo],
          ['Arribo', [formatDate(m.fechaArribo, ''), m.horaArribo].filter(Boolean).join(' ')],
        ]}
      />
    </Paper>
  );
}

function MasDatosPanel({ c }: { c: CoordinacionDetalle }) {
  const legacy = Object.entries(c.datosLegacy ?? {});
  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Campos
          filas={[
            ['Agencia IATA', nombreRef(c.agencia)],
            ['Tipo de embarque', nombreRef(c.tipoEmbarque)],
            ['Pago', c.pago === 'COLLECT' ? 'Collect (CC)' : 'Prepaid (PP)'],
            ['Fecha de coordinación', formatDate(c.fechaAsignacion)],
            ['Guía madre', `${c.guiaMadre.numero ?? '—'} · ${c.guiaMadre.estado ?? ''}${c.guiaMadre.virtual ? ' · virtual' : ''}`],
            ['Lote de guías', c.guiaMadre.lote ? `N° ${c.guiaMadre.lote.codigoAccess ?? c.guiaMadre.lote.id} del ${formatDate(c.guiaMadre.lote.fecha)}` : null],
            ['Volumen', num(c.totalVolumen)],
            ['Comisión (sistema viejo)', c.liquidacion.comision ? `${num(c.liquidacion.comision)} %` : null],
            ['Cupo de fulls', c.cupoFulls ? num(c.cupoFulls) : null],
            ['Certificado de origen', c.certificadoOrigen],
            ['Referencia', c.referencia],
            ['Nota', c.nota],
            ['Marcas adicionales', c.marcas.map((m) => m.consignatario?.nombre ?? '—').join(', ')],
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
                <TableCell align="right">Piezas</TableCell>
                <TableCell align="right">Peso</TableCell>
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
            Columnas de Access cuyo significado todavía no está confirmado; se guardan tal cual.
          </Typography>
          <Campos filas={legacy.map(([k, v]) => [k, String(v)])} />
        </Paper>
      )}
    </Stack>
  );
}

type Pestana = 'guias' | 'liquidacion' | 'ruta' | 'manifiesto' | 'mas' | 'validacion';

export function CoordinacionDetallePage({ id }: { id: number }) {
  const { coordinacion: c, error, isLoading, mutate } = useCoordinacion(id);
  const [tab, setTab] = useState<Pestana>('guias');

  const volver = (
    <Button component={Link} href="/operacion/coordinaciones" startIcon={<VolverIcon />} variant="text">
      Coordinaciones
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
        <Skeleton variant="rounded" height={88} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={320} />
      </AppPage>
    );
  }

  const destino = [c.destino?.codigo, c.destinoFinal?.codigo !== c.destino?.codigo ? c.destinoFinal?.codigo : null]
    .filter(Boolean)
    .join(' → ');

  return (
    <AppPage
      title={`Guía ${c.numeroGuia ?? c.id}`}
      subtitle={
        <>
          {[c.aerolinea?.nombre, `vuelo ${formatDate(c.fechaVuelo)}`, destino, c.consignatario?.nombre]
            .filter(Boolean)
            .join(' · ')}
          {c.codigoAccess !== null && ` · coordinación N° ${c.codigoAccess}`}
        </>
      }
      actions={
        <>
          <OrigenChip origen={c.origen} />
          <EstadoCoordinacionChip estado={c.estado} corteExtra={c.corteExtra} />
          <ArchivoFlowerCargo c={c} />
          <AccionesCoordinacion c={c} onCambio={() => mutate()} />
          {volver}
        </>
      }
    >
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} sx={{ mb: 2 }}>
        <Kpi label="Guías hijas" valor={num(c.guias.length, 0)} />
        <Kpi label="Fulls" valor={num(c.totalFulls)} />
        <Kpi label="Cajas" valor={num(c.totalCajas, 0)} />
        <Kpi label="Peso bruto" valor={kg(c.totalKgs)} />
        <Kpi label="Peso cobrable" valor={kg(c.liquidacion.pesoCobrable)} />
        <Kpi label={c.corteExtra ? 'Cobro al cliente' : 'Total guía'} valor={usd(c.liquidacion.total)} />
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="guias" label={`Guías hijas (${c.guias.length})`} />
        <Tab value="liquidacion" label="Liquidación" />
        <Tab value="ruta" label="Ruta y vuelo" />
        <Tab value="manifiesto" label="Manifiesto" />
        <Tab value="mas" label="Más datos" />
        {c.origen === 'ACCESS' && <Tab value="validacion" label="Validación" />}
      </Tabs>

      {tab === 'guias' && <GuiasHijasTabla guias={c.guias} />}
      {tab === 'liquidacion' && <LiquidacionPanel c={c} />}
      {tab === 'ruta' && <RutaPanel c={c} />}
      {tab === 'manifiesto' && <ManifiestoPanel c={c} />}
      {tab === 'mas' && <MasDatosPanel c={c} />}
      {tab === 'validacion' && <ValidacionTab id={c.id} />}
    </AppPage>
  );
}
