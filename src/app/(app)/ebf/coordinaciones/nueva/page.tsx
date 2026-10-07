'use client';

import { Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import Link from 'next/link';
import { AppPage } from '@/shared/components/ui';
import {
  EbfHealthBadge,
  NuevaCoordinacionForm,
} from '../../../../../features/ebf';

export default function EbfNuevaCoordinacionPage() {
  return (
    <AppPage
      title="Nueva coordinación"
      subtitle="Registra en el portal EBF las cajas de un exportador para un vuelo y una DAE."
      maxWidth={1100}
      actions={
        <>
          <EbfHealthBadge />
          <Button component={Link} href="/ebf/coordinaciones" startIcon={<ArrowBack />} size="small">
            Coordinaciones
          </Button>
        </>
      }
    >
      <NuevaCoordinacionForm />
    </AppPage>
  );
}
