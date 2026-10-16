import { Suspense } from 'react';
import { CoordinacionesListPage } from '@/features/operacion/components/CoordinacionesListPage';

export default function Page() {
  // Los filtros viven en la URL (useSearchParams): requiere un límite de Suspense.
  return (
    <Suspense fallback={null}>
      <CoordinacionesListPage />
    </Suspense>
  );
}
