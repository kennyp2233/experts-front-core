'use client';

import { use } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import Link from 'next/link';
import {
  CoordinacionDetailView,
  EbfHealthBadge,
} from '../../../../../features/ebf';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EbfCoordinacionDetallePage({ params }: Props) {
  const { id } = use(params);
  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Button
          component={Link}
          href="/ebf/coordinaciones"
          startIcon={<ArrowBack />}
          size="small"
        >
          Volver
        </Button>
        <EbfHealthBadge />
      </Stack>
      <CoordinacionDetailView id={id} />
    </Box>
  );
}
