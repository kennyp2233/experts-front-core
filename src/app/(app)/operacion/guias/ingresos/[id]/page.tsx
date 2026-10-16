import { IngresoGuiasDetallePage } from '@/features/operacion/components/guias/IngresoGuiasDetallePage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <IngresoGuiasDetallePage id={Number(id)} />;
}
