import { Suspense } from 'react';
import { MaestroListaPage } from '@/features/maestros/components/MaestrosPages';

export default async function Page({ params }: { params: Promise<{ entidad: string }> }) {
  const { entidad } = await params;
  return (
    <Suspense fallback={null}>
      <MaestroListaPage entidad={entidad} />
    </Suspense>
  );
}
