'use client';

import { OrigenMasterDataPage } from '@/features/master-data/components/origen/OrigenMasterDataPage';
import { origenConfig } from '@/features/master-data/configs';

export default function Page() {
  return <OrigenMasterDataPage config={origenConfig} />;
}