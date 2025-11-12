'use client';

import React from 'react';
import { ProductosMasterDataPage } from '../components/productos/ProductosMasterDataPage';
import { productosConfig } from '../configs/productos.config';

export default function ProductosPage() {
  return <ProductosMasterDataPage config={productosConfig} />;
}