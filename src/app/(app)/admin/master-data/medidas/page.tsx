'use client';

import { MedidasMasterDataPage } from '@/features/master-data/components/medidas/MedidasMasterDataPage';
import { medidasConfig } from '@/features/master-data/configs';

export default function Page() {
  return <MedidasMasterDataPage config={medidasConfig} />;
}