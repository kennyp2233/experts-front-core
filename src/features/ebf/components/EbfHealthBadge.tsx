'use client';

import { Chip, Tooltip } from '@mui/material';
import { CheckCircle, ErrorOutline, HourglassEmpty } from '@mui/icons-material';
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
      <Tooltip title={(error as Error)?.message ?? 'Sin sesión'}>
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
    <Chip
      icon={<CheckCircle />}
      label="EBF: conectado"
      size="small"
      color="success"
    />
  );
}
