import { LiquidacionClienteImpresion } from '@/features/operacion/components/impresion/LiquidacionClienteImpresion';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LiquidacionClienteImpresion id={Number(id)} />;
}
