import { CoordinarPage } from '@/features/operacion/components/coordinar/CoordinarPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CoordinarPage id={Number(id)} />;
}
