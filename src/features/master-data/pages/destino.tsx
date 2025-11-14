'use client';

import React from 'react';
import { DestinoMasterDataPage } from '../components/destino/DestinoMasterDataPage';
import { destinoConfig } from '../configs/destino.config';

export default function DestinoPage() {
  return <DestinoMasterDataPage config={destinoConfig} />;
}