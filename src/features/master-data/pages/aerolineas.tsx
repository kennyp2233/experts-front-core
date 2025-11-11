'use client';

import React from 'react';
import { AerolineasMasterDataPage } from '../components/aerolineas/AerolineasMasterDataPage';
import { aerolineasConfig } from '../configs/aerolineas.config';

export default function AerolineasPage() {
  return <AerolineasMasterDataPage config={aerolineasConfig} />;
}