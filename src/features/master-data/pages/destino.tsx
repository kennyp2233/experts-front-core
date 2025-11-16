'use client';

import React from 'react';
import { MasterDataPage } from '../components/common/MasterDataPage';
import { destinoConfig } from '../configs/destino.config';

export default function DestinoPage() {
  return <MasterDataPage config={destinoConfig} />;
}