'use client';

import { ProductosMasterDataPage } from '@/features/master-data/components/productos/ProductosMasterDataPage';
import { productosConfig } from '@/features/master-data/configs';

export default function Page() {
  return <ProductosMasterDataPage config={productosConfig} />;
}