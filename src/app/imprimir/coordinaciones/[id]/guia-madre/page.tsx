import { GuiaMadreImpresion } from '@/features/operacion/components/impresion/GuiaMadreImpresion';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GuiaMadreImpresion id={Number(id)} />;
}
