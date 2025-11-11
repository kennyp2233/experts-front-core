'use client';

import { AerolineasMasterDataPage } from '@/features/master-data/components/aerolineas/AerolineasMasterDataPage';
import { aerolineasConfig } from '@/features/master-data/configs';

export default function Page() {
  return <AerolineasMasterDataPage config={aerolineasConfig} />;
}