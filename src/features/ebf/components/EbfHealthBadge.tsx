'use client';

import { Chip, Tooltip } from '@mui/material';
import { CheckCircle, ErrorOutline, HourglassEmpty } from '@mui/icons-material';
import { getErrorMessage } from '@/shared/utils';
import { useEbfHealth } from '../hooks/useEbf';

export function EbfHealthBadge() {
  const { ok, error, isLoading } = useEbfHealth();

  if (isLoading) {
    return (
      <Chip
        icon={<HourglassEmpty />}
        label="EBF: verificando…"
        size="small"
        color="default"
      />
    );
  }

  if (error || !ok) {
    return (
      <Tooltip
        title={
          error
            ? `No hay conexión con el portal EBF. ${getErrorMessage(error)}`
            : 'No hay sesión activa con el portal EBF.'
        }
      >
        <Chip
          icon={<ErrorOutline />}
          label="EBF: sin sesión"
          size="small"
          color="error"
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Sesión activa con portal.ebfcargo.com">
      <Chip
        icon={<CheckCircle />}
        label="EBF: conectado"
        size="small"
        color="success"
      />
    </Tooltip>
  );
}
