'use client';

import React from 'react';
import { MasterDataPage } from '../components/common/MasterDataPage';
import { embarcadoresConfig } from '../configs/embarcadores.config';

export default function EmbarcadoresPage() {
  return <MasterDataPage config={embarcadoresConfig} />;
}