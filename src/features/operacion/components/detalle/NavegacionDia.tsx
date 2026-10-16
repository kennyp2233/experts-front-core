'use client';

import Link from 'next/link';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { ChevronLeft as AnteriorIcon, ChevronRight as SiguienteIcon } from '@mui/icons-material';
import { formatDate } from '@/shared/utils';
import { useCoordinaciones } from '../../hooks/useCoordinaciones';
import type { CoordinacionDetalle, CoordinacionResumen } from '../../types/coordinacion';
import { formatoAwb, ordenDelDia } from '../../utils/formato';

function Boton({ c, children, label }: { c: CoordinacionResumen | undefined; children: React.ReactNode; label: string }) {
  if (!c) {
    return (
      <IconButton size="small" disabled aria-label={label}>
        {children}
      </IconButton>
    );
  }
  return (
    <Tooltip title={`${label}: ${formatoAwb(c.numeroGuia)}`}>
      <IconButton size="small" component={Link} href={`/operacion/coordinaciones/${c.id}`} aria-label={label}>
        {children}
      </IconButton>
    </Tooltip>
  );
}

/**
 * Anterior / siguiente entre las guías del mismo vuelo, en el orden de la
 * lista del día (como los botones Anterior y Siguiente del sistema viejo).
 */
export function NavegacionDia({ c }: { c: CoordinacionDetalle }) {
  const { pagina } = useCoordinaciones({ desde: c.fechaVuelo, hasta: c.fechaVuelo, page: 1, pageSize: 100 });
  const filas = [...(pagina?.items ?? [])].filter((f) => f.estado !== 'ANULADO').sort(ordenDelDia);
  const i = filas.findIndex((f) => f.id === c.id);
  if (i < 0 || filas.length < 2) return null;
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Boton c={filas[i - 1]} label="Guía anterior del vuelo">
        <AnteriorIcon fontSize="small" />
      </Boton>
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {i + 1} de {filas.length} del {formatDate(c.fechaVuelo)}
      </Typography>
      <Boton c={filas[i + 1]} label="Guía siguiente del vuelo">
        <SiguienteIcon fontSize="small" />
      </Boton>
    </Stack>
  );
}
