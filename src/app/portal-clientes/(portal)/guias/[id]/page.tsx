import { GuiaClientePage } from '@/features/portal-clientes';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GuiaClientePage id={Number(id)} />;
}
