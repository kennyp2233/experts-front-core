import { CoordinacionDetallePage } from '@/features/operacion/components/CoordinacionDetallePage';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  return <CoordinacionDetallePage id={Number(id)} tabInicial={tab} />;
}
