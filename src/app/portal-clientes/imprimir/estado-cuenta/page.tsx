import { EstadoCuentaImpresion } from '@/features/portal-clientes';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; idCliente?: string }>;
}) {
  const { desde, hasta, idCliente } = await searchParams;
  return <EstadoCuentaImpresion desde={desde ?? ''} hasta={hasta ?? ''} idCliente={idCliente ? Number(idCliente) : undefined} />;
}
