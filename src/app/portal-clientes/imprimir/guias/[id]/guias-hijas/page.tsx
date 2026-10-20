import { GuiasHijasImpresion } from '@/features/operacion/components/impresion/GuiasHijasImpresion';

/** Guías hijas por finca de una guía del cliente: la misma hoja de la oficina, con los datos del portal. */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GuiasHijasImpresion id={Number(id)} url={`/portal-clientes/guias/${Number(id)}/guias-hijas/impresion`} />;
}
