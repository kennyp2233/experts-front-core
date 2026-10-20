import { Suspense } from 'react';
import { EstadoCuentaPage } from '@/features/operacion/components/cuentas/EstadoCuentaPage';

export default function Page() {
  // Los filtros viven en la URL (useSearchParams): requiere un límite de Suspense.
  return (
    <Suspense fallback={null}>
      <EstadoCuentaPage />
    </Suspense>
  );
}
