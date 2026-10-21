import { Suspense } from 'react';
import { EbfPage } from '@/features/operacion/components/ebf/EbfPage';

export default function Page() {
  // La pestaña vive en la URL (useSearchParams): requiere un límite de Suspense.
  return (
    <Suspense fallback={null}>
      <EbfPage />
    </Suspense>
  );
}
