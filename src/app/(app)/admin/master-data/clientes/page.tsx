'use client';

import { ClientesMasterDataPage } from '@/features/master-data/components/clientes/ClientesMasterDataPage';
import { clientesConfig } from '@/features/master-data/configs';

export default function Page() {
  return <ClientesMasterDataPage config={clientesConfig} />;
}