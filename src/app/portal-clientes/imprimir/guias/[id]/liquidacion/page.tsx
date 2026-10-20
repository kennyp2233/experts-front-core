import { LiquidacionImpresion } from '@/features/portal-clientes';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LiquidacionImpresion id={Number(id)} />;
}
