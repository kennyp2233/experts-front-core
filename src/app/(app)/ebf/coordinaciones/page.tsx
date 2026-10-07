'use client';

import { Suspense } from 'react';
import { CoordinacionesListPage } from '../../../../features/ebf';

export default function EbfCoordinacionesPage() {
  // useSearchParams (vista Vigentes | Histórico) requiere un límite de Suspense.
  return (
    <Suspense fallback={null}>
      <CoordinacionesListPage />
    </Suspense>
  );
}
