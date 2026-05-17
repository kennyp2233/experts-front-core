'use client';

import { Box, Stack, Typography } from '@mui/material';
import { CoordinacionesTable, EbfHealthBadge } from '../../../../features/ebf';

export default function EbfCoordinacionesPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={600}>
          Coordinaciones EBF
        </Typography>
        <EbfHealthBadge />
      </Stack>
      <CoordinacionesTable />
    </Box>
  );
}
