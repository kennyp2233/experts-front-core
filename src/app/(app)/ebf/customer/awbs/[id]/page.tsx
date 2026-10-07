'use client';

import { use } from 'react';
import { Alert, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import Link from 'next/link';
import { AppPage } from '@/shared/components/ui';
import { CustomerAwbDetailView } from '../../../../../../features/ebf';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EbfCustomerAwbDetailPage({ params }: Props) {
  const { id } = use(params);
  const awbId = parseInt(id, 10);
  if (!Number.isFinite(awbId)) {
    return (
      <AppPage
        title="AWB"
        actions={
          <Button size="small" component={Link} href="/ebf/customer/awbs" startIcon={<ArrowBack />}>
            AWBs
          </Button>
        }
      >
        <Alert severity="warning">
          El enlace no es válido: «{id}» no es un identificador de AWB. Vuelve a la lista y
          ábrelo desde allí.
        </Alert>
      </AppPage>
    );
  }
  return <CustomerAwbDetailView awbId={awbId} />;
}
