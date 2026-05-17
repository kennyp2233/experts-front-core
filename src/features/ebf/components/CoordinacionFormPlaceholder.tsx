'use client';

import { Alert, AlertTitle, Box, Button, Stack, Typography } from '@mui/material';
import { OpenInNew } from '@mui/icons-material';

const PORTAL = 'https://portal.ebfcargo.com';

export function CoordinacionFormPlaceholder() {
  return (
    <Stack spacing={2}>
      <Alert severity="warning">
        <AlertTitle>Formulario aún no disponible</AlertTitle>
        El form de creación de coordinaciones se mapea desde el HTML del
        portal EBF en horario operativo (Lun–Vie 08:00–13:30 hora EC). Mientras
        tanto, podés crear directamente en el portal.
      </Alert>

      <Box>
        <Button
          variant="contained"
          startIcon={<OpenInNew />}
          component="a"
          href={`${PORTAL}/exportador/coordinacion/lista/`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir portal EBF
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary">
        Una vez mapeados los campos del form, este placeholder será
        reemplazado por el formulario integrado.
      </Typography>
    </Stack>
  );
}
