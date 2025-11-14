'use client';

import { MasterDataPage } from '@/features/master-data/components/common/MasterDataPage';
import { agenciaIataConfig } from '@/features/master-data/configs';

export default function Page() {
  return <MasterDataPage config={agenciaIataConfig} />;
}