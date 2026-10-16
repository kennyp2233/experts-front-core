'use client';

import { Chip, Tooltip } from '@mui/material';
import type { EstadoCoordinacion, OrigenDocumento } from '../types/coordinacion';

const ESTADOS: Record<EstadoCoordinacion, { label: string; color: 'info' | 'success' | 'error'; ayuda: string }> = {
  BORRADOR: { label: 'Abierta', color: 'info', ayuda: 'Todavía se puede modificar.' },
  CORTADO: { label: 'Cortada', color: 'success', ayuda: 'Guía cortada: ya no se puede modificar.' },
  ANULADO: { label: 'Anulada', color: 'error', ayuda: 'Anulada en el sistema.' },
};

export const ETIQUETA_ESTADO: Record<EstadoCoordinacion, string> = {
  BORRADOR: ESTADOS.BORRADOR.label,
  CORTADO: ESTADOS.CORTADO.label,
  ANULADO: ESTADOS.ANULADO.label,
};

export function EstadoCoordinacionChip({ estado, corteExtra }: { estado: EstadoCoordinacion; corteExtra?: boolean }) {
  const e = ESTADOS[estado];
  const extra = corteExtra && estado === 'CORTADO';
  return (
    <Tooltip title={extra ? `${e.ayuda} Tiene valores de corte extra (la facturación usa esos).` : e.ayuda}>
      <Chip size="small" label={extra ? `${e.label}*` : e.label} color={e.color} variant="outlined" />
    </Tooltip>
  );
}

export function OrigenChip({ origen }: { origen: OrigenDocumento }) {
  return origen === 'ACCESS' ? (
    <Tooltip title="Viene del sistema viejo (Access); se actualiza sola con la sincronización.">
      <Chip size="small" label="Sistema viejo" variant="outlined" />
    </Tooltip>
  ) : (
    <Chip size="small" label="Sistema nuevo" color="primary" variant="outlined" />
  );
}
