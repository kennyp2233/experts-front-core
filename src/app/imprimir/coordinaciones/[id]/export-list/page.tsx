import { ExportListImpresion } from '@/features/operacion/components/impresion/ExportListImpresion';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ExportListImpresion id={Number(id)} />;
}
