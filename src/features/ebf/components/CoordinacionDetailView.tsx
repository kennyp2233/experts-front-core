'use client';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import { useCoordinacionDetalle } from '../hooks/useEbf';

interface Props {
  id: string;
}

const PORTAL_BASE = 'https://portal.ebfcargo.com';

export function CoordinacionDetailView({ id }: Props) {
  const { detalle, error, isLoading } = useCoordinacionDetalle(id);

  if (error) {
    return (
      <Alert severity="error">
        No se pudo cargar el detalle: {(error as Error).message}
      </Alert>
    );
  }

  if (isLoading || !detalle) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="h6">Coordinación #{detalle.id}</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<OpenInNew />}
          component="a"
          href={`${PORTAL_BASE}/exportador/detalle_coordinacion/${encodeURIComponent(detalle.id)}/`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir en portal EBF
        </Button>
      </Stack>

      <Alert severity="info">
        Vista de detalle pendiente de descomponer. El backend devuelve el HTML
        crudo mientras se mapea el parser (ver EBF_PORTAL_TOMORROW.md).
      </Alert>

      <Paper variant="outlined" sx={{ p: 2, maxHeight: 600, overflow: 'auto' }}>
        <Typography variant="caption" color="text.secondary">
          HTML crudo (debug)
        </Typography>
        <Box
          component="pre"
          sx={{ fontSize: 12, whiteSpace: 'pre-wrap', m: 0, mt: 1 }}
        >
          {typeof detalle.raw?.html === 'string'
            ? (detalle.raw.html as string).slice(0, 4000)
            : JSON.stringify(detalle.raw, null, 2)}
        </Box>
      </Paper>
    </Stack>
  );
}
