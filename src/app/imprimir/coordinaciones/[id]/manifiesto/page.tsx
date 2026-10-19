import { ManifiestoImpresion } from '@/features/operacion/components/impresion/ManifiestoImpresion';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ManifiestoImpresion id={Number(id)} />;
}
