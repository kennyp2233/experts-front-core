'use client';

import { DestinoMasterDataPage } from '@/features/master-data/components/destino/DestinoMasterDataPage';
import { destinoConfig } from '@/features/master-data/configs';

export default function Page() {
  return <DestinoMasterDataPage config={destinoConfig} />;
}