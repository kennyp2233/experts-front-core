import { Suspense } from 'react';
import { EstadoCuentaImpresion } from '@/features/operacion/components/impresion/EstadoCuentaImpresion';

export default function Page() {
  // Los filtros viven en la URL (useSearchParams): requiere un límite de Suspense.
  return (
    <Suspense fallback={null}>
      <EstadoCuentaImpresion />
    </Suspense>
  );
}
