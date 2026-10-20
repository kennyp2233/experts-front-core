import { FormaAImpresion } from '@/features/operacion/components/impresion/FormaAImpresion';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FormaAImpresion id={Number(id)} />;
}
