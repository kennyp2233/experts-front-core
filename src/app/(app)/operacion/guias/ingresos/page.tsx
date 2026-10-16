import { Suspense } from 'react';
import { IngresosGuiasPage } from '@/features/operacion/components/guias/IngresosGuiasPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <IngresosGuiasPage />
    </Suspense>
  );
}
