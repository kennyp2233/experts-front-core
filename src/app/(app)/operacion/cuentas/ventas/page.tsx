import { Suspense } from 'react';
import { VentasPage } from '@/features/operacion/components/cuentas/VentasPage';

export default function Page() {
  // Los filtros viven en la URL (useSearchParams): requiere un límite de Suspense.
  return (
    <Suspense fallback={null}>
      <VentasPage />
    </Suspense>
  );
}
