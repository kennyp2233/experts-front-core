'use client';

import Link from 'next/link';
import { Alert, Button } from '@mui/material';
import { useEstadoEbf } from '../../hooks/useEbf';
import { cuandoAbre } from './estadoEbf';

/**
 * Al modificar una coordinación con algo pendiente para EBF: el cambio que
 * espera se recalcula con lo que se grabe (no se envía otro), así que no hay
 * que ir a EBF a hacerlo a mano.
 */
export function AvisoEbfPendiente({ id }: { id: number }) {
  const { estado: e } = useEstadoEbf(id);
  if (!e || !e.enviable) return null;
  const pendientes = e.resumen.porEnviar + e.resumen.errores;
  if (!pendientes && !e.resumen.omitidas) return null;
  const cuando =
    e.modo === 'comparar'
      ? 'el envío a EBF todavía está en modo comparación'
      : e.ventana.abierta
        ? 'EBF está abierto'
        : `EBF abre ${cuandoAbre(e.ventana)}`;
  return (
    <Alert
      severity="info"
      variant="outlined"
      action={
        <Button component={Link} href={`/operacion/coordinaciones/${id}?tab=ebf`} size="small" color="inherit">
          Ver EBF
        </Button>
      }
    >
      {pendientes
        ? `Esta guía tiene ${pendientes} ${pendientes === 1 ? 'cambio' : 'cambios'} por enviar a EBF (${cuando}). Si la modificas, ese cambio se actualiza con lo que grabes: no se envía dos veces ni hace falta hacerlo a mano.`
        : `Hay ${e.resumen.omitidas} ${e.resumen.omitidas === 1 ? 'guía hija marcada' : 'guías hijas marcadas'} para hacer a mano en EBF; si la cambias aquí, vuelven a enviarse.`}
    </Alert>
  );
}
