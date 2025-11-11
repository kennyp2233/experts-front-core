'use client';

import { PaisesMasterDataPage } from '@/features/master-data/components/paises/PaisesMasterDataPage';
import { paisesConfig } from '@/features/master-data/configs';

export default function Page() {
  return <PaisesMasterDataPage config={paisesConfig} />;
}