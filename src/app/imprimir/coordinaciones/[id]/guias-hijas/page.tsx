import { GuiasHijasImpresion } from '@/features/operacion/components/impresion/GuiasHijasImpresion';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guiaHija?: string }>;
}) {
  const { id } = await params;
  const { guiaHija } = await searchParams;
  return <GuiasHijasImpresion id={Number(id)} guiaHija={guiaHija ? Number(guiaHija) : undefined} />;
}
