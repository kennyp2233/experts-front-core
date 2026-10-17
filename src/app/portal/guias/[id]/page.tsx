import { GuiaFincaPage } from '@/features/portal-fincas';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GuiaFincaPage id={Number(id)} />;
}
