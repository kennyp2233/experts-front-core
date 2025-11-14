'use client';

import { MasterDataPage } from '@/features/master-data/components/common/MasterDataPage';
import { caeAduanaConfig } from '@/features/master-data/configs';

export default function Page() {
  return <MasterDataPage config={caeAduanaConfig} />;
}