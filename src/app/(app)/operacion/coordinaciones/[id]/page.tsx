import { CoordinacionDetallePage } from '@/features/operacion/components/CoordinacionDetallePage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CoordinacionDetallePage id={Number(id)} />;
}
