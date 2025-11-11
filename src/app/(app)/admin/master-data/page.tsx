import { Metadata } from 'next';
import MasterDataPage from '@/features/master-data/pages/index';

export const metadata: Metadata = {
  title: 'Datos Maestros - Experts',
  description: 'Gestión de datos maestros del sistema',
};

export default function Page() {
  return <MasterDataPage />;
}