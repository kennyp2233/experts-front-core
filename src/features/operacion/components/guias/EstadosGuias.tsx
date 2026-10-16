'use client';

import { Chip, Tooltip } from '@mui/material';
import type { EstadoIngreso, GuiaDeIngreso } from '../../types/coordinacion';

const INGRESO: Record<EstadoIngreso, { label: string; color: 'info' | 'warning' | 'success' | 'error'; ayuda: string }> = {
  INGRESADO: { label: 'Ingresado', color: 'info', ayuda: 'Ninguna guía coordinada todavía.' },
  GUIAS_COORDINADAS: { label: 'Guías coordinadas', color: 'warning', ayuda: 'Algunas guías coordinadas; quedan por usar.' },
  CANCELADO: { label: 'Cancelado', color: 'success', ayuda: 'Todas sus guías ya se usaron (coordinadas, o prestadas y devueltas).' },
  ANULADO: { label: 'Anulado', color: 'error', ayuda: 'Ingreso anulado: sus guías no se usan.' },
};

export const ETIQUETA_INGRESO: Record<EstadoIngreso, string> = Object.fromEntries(
  Object.entries(INGRESO).map(([k, v]) => [k, v.label]),
) as Record<EstadoIngreso, string>;

/** Estado del documento de ingreso, con los nombres del sistema viejo. */
export function EstadoIngresoChip({ estado }: { estado: EstadoIngreso | null }) {
  if (!estado) return null;
  const e = INGRESO[estado];
  return (
    <Tooltip title={e.ayuda}>
      <Chip size="small" variant="outlined" color={e.color} label={e.label} />
    </Tooltip>
  );
}

type Situacion = { label: string; color: 'success' | 'default' | 'warning' | 'error' };

/** Situación de una guía: libre, coordinada, prestada (y devuelta) o anulada. */
export function situacionGuia(g: Pick<GuiaDeIngreso, 'estado' | 'devuelta'>): Situacion {
  switch (g.estado) {
    case 'INGRESADA':
      return { label: 'Libre', color: 'success' };
    case 'COORDINADA':
      return { label: 'Coordinada', color: 'default' };
    case 'PRESTADA':
      return { label: g.devuelta ? 'Prestada y devuelta' : 'Prestada', color: 'warning' };
    case 'ANULADA':
      return { label: 'Anulada', color: 'error' };
    default:
      return { label: '—', color: 'default' };
  }
}

export function SituacionGuiaChip({ guia }: { guia: Pick<GuiaDeIngreso, 'estado' | 'devuelta'> }) {
  const s = situacionGuia(guia);
  return <Chip size="small" variant="outlined" color={s.color} label={s.label} />;
}
