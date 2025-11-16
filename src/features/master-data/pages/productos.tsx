'use client';

import React from 'react';
import { MasterDataPage } from '../components/common/MasterDataPage';
import { productosConfig } from '../configs/productos.config';

export default function ProductosPage() {
  return <MasterDataPage config={productosConfig} />;
}