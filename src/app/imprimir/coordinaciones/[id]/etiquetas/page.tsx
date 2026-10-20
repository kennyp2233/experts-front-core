import { EtiquetasImpresion } from '@/features/operacion/components/impresion/EtiquetasImpresion';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EtiquetasImpresion id={Number(id)} />;
}
