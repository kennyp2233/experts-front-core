'use client';

import { Box, Stack, Typography } from '@mui/material';
import { SyncDashboard } from '../../../../features/ebf';

export default function EbfAccessSyncPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={600}>
          Sync EBF ↔ Access
        </Typography>
      </Stack>
      <SyncDashboard />
    </Box>
  );
}
