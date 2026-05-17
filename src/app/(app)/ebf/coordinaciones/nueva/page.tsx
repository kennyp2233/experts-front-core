'use client';

import { Box, Stack, Typography } from '@mui/material';
import {
  CoordinacionFormPlaceholder,
  EbfHealthBadge,
} from '../../../../../features/ebf';

export default function EbfNuevaCoordinacionPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={600}>
          Nueva coordinación
        </Typography>
        <EbfHealthBadge />
      </Stack>
      <CoordinacionFormPlaceholder />
    </Box>
  );
}
