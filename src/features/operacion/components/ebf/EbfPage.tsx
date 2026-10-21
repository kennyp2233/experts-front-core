'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Button,
  Chip,
  FormControlLabel,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { AppPage } from '@/shared/components/ui';
import { formatDate, getErrorMessage } from '@/shared/utils';
import { useColaEbf } from '../../hooks/useEbf';
import type { EstadoEbfCoordinacion } from '../../types/ebf';
import { formatoAwb } from '../../utils/formato';
import { EnlacesEbf } from './EnlacesEbf';
import { atencion, resumenCorto, textoVentana } from './estadoEbf';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

function ResumenChip({ c }: { c: EstadoEbfCoordinacion }) {
  const r = c.resumen;
  if (!c.ebf.leidoEn) return <Chip size="small" variant="outlined" label={`${r.lineas} guías hijas`} />;
  const color = r.errores ? 'error' : r.pedirAEbf || r.faltaEnlace ? 'warning' : r.porEnviar ? 'info' : 'success';
  return (
    <Tooltip title={resumenCorto(r, c.enviable)}>
      <Chip size="small" variant="outlined" color={color} label={`${r.enEbf} de ${r.lineas} en EBF`} />
    </Tooltip>
  );
}

/**
 * Lo pendiente con EBF: una fila por coordinación que vuela de ayer a 7 días.
 * No es una lista de órdenes: es lo que falta para que EBF tenga lo mismo que
 * la coordinación, una sola cosa por guía hija, y se recalcula cada vez.
 */
function Pendientes() {
  const router = useRouter();
  const { cola, error, isLoading, mutate } = useColaEbf();
  const [soloAtencion, setSoloAtencion] = useState(true);
  const filas = useMemo(
    () =>
      (cola?.coordinaciones ?? []).filter(
        (c) => !soloAtencion || !c.ebf.leidoEn || atencion(c.resumen) || c.ebf.avisos.length > 0,
      ),
    [cola, soloAtencion],
  );

  if (error) {
    return (
      <Alert severity="error" action={<Button onClick={() => mutate()}>Reintentar</Button>}>
        {getErrorMessage(error, 'No se pudo cargar lo pendiente con EBF.')}
      </Alert>
    );
  }
  if (isLoading || !cola) return <Skeleton variant="rounded" height={320} />;
  const v = textoVentana(cola.modo, cola.ventana);

  return (
    <Stack spacing={2}>
      <Alert severity={v.severidad}>{v.texto}</Alert>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap spacing={1}>
        <Typography variant="body2" color="text.secondary">
          Vuelos de ayer a 7 días con agencia EBF. Cada guía hija tiene a lo sumo un cambio pendiente: si la coordinación se vuelve
          a modificar, se recalcula, no se envía dos veces.
        </Typography>
        <FormControlLabel
          control={<Switch checked={soloAtencion} onChange={(e) => setSoloAtencion(e.target.checked)} />}
          label="Solo lo que pide atención"
        />
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Vuelo</TableCell>
              <TableCell>N°</TableCell>
              <TableCell>Guía</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell>En EBF</TableCell>
              <TableCell>Guías hijas</TableCell>
              <TableCell>Qué falta</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filas.map((c) => (
              <TableRow
                key={c.idCoordinacion}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => router.push(`/operacion/coordinaciones/${c.idCoordinacion}?tab=ebf`)}
              >
                <TableCell sx={nums}>{formatDate(c.fechaVuelo)}</TableCell>
                <TableCell sx={nums}>
                  <Link href={`/operacion/coordinaciones/${c.idCoordinacion}?tab=ebf`} onClick={(e) => e.stopPropagation()}>
                    {c.numero ?? '—'}
                  </Link>
                  {!c.enviable && (
                    <Typography variant="caption" color="text.secondary" component="div">
                      sistema viejo
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={nums}>{formatoAwb(c.numeroGuia)}</TableCell>
                <TableCell>{c.marca ?? '—'}</TableCell>
                <TableCell sx={nums}>
                  {c.ebf.guia ?? (
                    <Typography variant="body2" color="text.secondary">
                      {c.ebf.leidoEn ? 'sin guía todavía' : '—'}
                    </Typography>
                  )}
                  {c.ebf.estado && (
                    <Typography variant="caption" color="text.secondary" component="div">
                      {c.ebf.estado}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <ResumenChip c={c} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color={c.ebf.leidoEn ? undefined : 'text.secondary'}>
                    {c.anulada
                      ? 'Anulada: borrar lo que quede en EBF'
                      : !c.ebf.leidoEn
                        ? 'Todavía no se leyó EBF (se lee en el próximo ciclo o al abrirla)'
                        : resumenCorto(c.resumen, c.enviable)}
                  </Typography>
                  {c.ebf.avisos.map((a) => (
                    <Typography key={a} variant="caption" color="warning.main" component="div">
                      {a}
                    </Typography>
                  ))}
                </TableCell>
              </TableRow>
            ))}
            {filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary">
                    {soloAtencion ? 'Nada pendiente con EBF.' : 'No hay vuelos con EBF de ayer a 7 días.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

type Pestana = 'pendientes' | 'enlaces';

/** EBF: lo pendiente de enviar / comparar y los enlaces de fincas, marcas y productos. */
export function EbfPage() {
  const params = useSearchParams();
  const router = useRouter();
  const tab: Pestana = params.get('tab') === 'enlaces' ? 'enlaces' : 'pendientes';
  return (
    <AppPage
      title="EBF"
      subtitle="Lo que falta para que EBF tenga lo mismo que las coordinaciones, y cómo se llaman allá las fincas, marcas y productos."
    >
      <Tabs
        value={tab}
        onChange={(_, v) => router.replace(v === 'enlaces' ? '/operacion/ebf?tab=enlaces' : '/operacion/ebf')}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="pendientes" label="Pendientes" />
        <Tab value="enlaces" label="Enlaces con EBF" />
      </Tabs>
      {tab === 'pendientes' ? <Pendientes /> : <EnlacesEbf />}
    </AppPage>
  );
}
