import { Suspense } from 'react';
import { StockGuiasPage } from '@/features/operacion/components/StockGuiasPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <StockGuiasPage />
    </Suspense>
  );
}
