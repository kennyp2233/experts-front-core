'use client';

import { TipoEmbarqueMasterDataPage } from '@/features/master-data/components/tipo-embarque/TipoEmbarqueMasterDataPage';
import { tipoEmbarqueConfig } from '@/features/master-data/configs';

export default function Page() {
  return <TipoEmbarqueMasterDataPage config={tipoEmbarqueConfig} />;
}