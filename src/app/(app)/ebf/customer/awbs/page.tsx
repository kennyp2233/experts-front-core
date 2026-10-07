'use client';

import { AppPage } from '@/shared/components/ui';
import { CustomerAwbsListPage } from '../../../../../features/ebf';

export default function EbfCustomerAwbsPage() {
  return (
    <AppPage
      title="AWBs"
      subtitle="Guías aéreas de la cuenta cliente en el portal EBF, filtradas por fecha de salida (ETD)."
    >
      <CustomerAwbsListPage />
    </AppPage>
  );
}
