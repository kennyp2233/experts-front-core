'use client';

import { Box, Stack, Typography } from '@mui/material';
import { CustomerAwbsListPage } from '../../../../../features/ebf';

export default function EbfCustomerAwbsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={600}>
          AWBs (vista cliente EBF)
        </Typography>
      </Stack>
      <CustomerAwbsListPage />
    </Box>
  );
}
