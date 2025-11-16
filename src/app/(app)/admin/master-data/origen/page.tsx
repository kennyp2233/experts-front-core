'use client';

import { MasterDataPage } from '@/features/master-data/components/common/MasterDataPage';
import { origenConfig } from '@/features/master-data/configs';

export default function Page() {
  return <MasterDataPage config={origenConfig} />;
}