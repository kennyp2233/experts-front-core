'use client';

import React from 'react';
import { MasterDataPage } from '../components/common/MasterDataPage';
import { aerolineasConfig } from '../configs/aerolineas.config';

export default function AerolineasPage() {
  return <MasterDataPage config={aerolineasConfig} />;
}