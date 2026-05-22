'use client';

import { use } from 'react';
import { Box } from '@mui/material';
import { CustomerAwbDetailView } from '../../../../../../features/ebf';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EbfCustomerAwbDetailPage({ params }: Props) {
  const { id } = use(params);
  const awbId = parseInt(id, 10);
  if (!Number.isFinite(awbId)) {
    return <Box sx={{ p: 3 }}>AWB id inválido: {id}</Box>;
  }
  return (
    <Box sx={{ p: 3 }}>
      <CustomerAwbDetailView awbId={awbId} />
    </Box>
  );
}
