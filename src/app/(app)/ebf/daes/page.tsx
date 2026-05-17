'use client';

import { Box, Stack, Typography } from '@mui/material';
import { DaesTable, EbfHealthBadge } from '../../../../features/ebf';

export default function EbfDaesPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={600}>
          DAEs
        </Typography>
        <EbfHealthBadge />
      </Stack>
      <DaesTable />
    </Box>
  );
}
