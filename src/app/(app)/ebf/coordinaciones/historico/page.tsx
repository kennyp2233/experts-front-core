'use client';

import { Box, Stack, Typography } from '@mui/material';
import { CoordinacionesTable, EbfHealthBadge } from '../../../../../features/ebf';

export default function EbfHistoricoPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={600}>
          Histórico de coordinaciones
        </Typography>
        <EbfHealthBadge />
      </Stack>
      <CoordinacionesTable includeHistorico />
    </Box>
  );
}
