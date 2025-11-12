import { Metadata } from 'next';
import AcuerdosArancelariosPage from '@/features/master-data/pages/acuerdos-arancelarios';

export const metadata: Metadata = {
  title: 'Acuerdos Arancelarios - Expert Control',
  description: 'Gestión de acuerdos arancelarios y tratados comerciales',
};

export default function Page() {
  return <AcuerdosArancelariosPage />;
}