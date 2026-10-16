import { Suspense } from 'react';
import { AdministracionGuiasPage } from '@/features/operacion/components/guias/AdministracionGuiasPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdministracionGuiasPage />
    </Suspense>
  );
}
