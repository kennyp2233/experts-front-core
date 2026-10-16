'use client';

import { Chip, Tooltip } from '@mui/material';
import type { EstadoCoordinacion, OrigenDocumento } from '../types/coordinacion';

const ESTADOS: Record<EstadoCoordinacion, { label: string; color: 'info' | 'success' | 'error'; ayuda: string }> = {
  BORRADOR: { label: 'Abierta', color: 'info', ayuda: 'Todavía se puede modificar.' },
  CORTADO: { label: 'Cortada', color: 'success', ayuda: 'Guía cortada: ya no se puede modificar.' },
  ANULADO: { label: 'Anulada', color: 'error', ayuda: 'Anulada (en el sistema viejo: eliminada).' },
};

export const ETIQUETA_ESTADO: Record<EstadoCoordinacion, string> = {
  BORRADOR: ESTADOS.BORRADOR.label,
  CORTADO: ESTADOS.CORTADO.label,
  ANULADO: ESTADOS.ANULADO.label,
};

export function EstadoCoordinacionChip({ estado }: { estado: EstadoCoordinacion }) {
  const e = ESTADOS[estado];
  return (
    <Tooltip title={e.ayuda}>
      <Chip size="small" label={e.label} color={e.color} variant="outlined" />
    </Tooltip>
  );
}

/** Solo marca las del sistema viejo: esas se ven aquí pero se modifican allá. */
export function OrigenChip({ origen }: { origen: OrigenDocumento }) {
  if (origen !== 'ACCESS') return null;
  return (
    <Tooltip title="Se modifica en el sistema viejo.">
      <Chip size="small" label="Sistema viejo · solo lectura" variant="outlined" />
    </Tooltip>
  );
}
