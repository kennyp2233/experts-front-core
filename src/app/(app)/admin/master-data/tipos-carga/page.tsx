'use client';

import { TipoCargaMasterDataPage } from '@/features/master-data/components/tipo-carga/TipoCargaMasterDataPage';
import { tipoCargaConfig } from '@/features/master-data/configs';

export default function Page() {
  return <TipoCargaMasterDataPage config={tipoCargaConfig} />;
}