'use client';

import { AppPage } from '@/shared/components/ui';
import { DaesTable, EbfHealthBadge } from '../../../../features/ebf';

export default function EbfDaesPage() {
  return (
    <AppPage
      title="DAEs"
      subtitle="Declaraciones Aduaneras de Exportación registradas en el portal EBF. Se marcan las que vencen en los próximos 7 días."
      actions={<EbfHealthBadge />}
    >
      <DaesTable />
    </AppPage>
  );
}
