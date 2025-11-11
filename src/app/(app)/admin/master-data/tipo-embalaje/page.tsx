'use client';

import { TipoEmbalajeMasterDataPage } from '@/features/master-data/components/tipo-embalaje/TipoEmbalajeMasterDataPage';
import { tipoEmbalajeConfig } from '@/features/master-data/configs';

export default function Page() {
  return <TipoEmbalajeMasterDataPage config={tipoEmbalajeConfig} />;
}