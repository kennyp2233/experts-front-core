'use client';

import React from 'react';
import { MasterDataPage } from '../components/common/MasterDataPage';
import { origenConfig } from '../configs/origen.config';

export default function OrigenPage() {
  return <MasterDataPage config={origenConfig} />;
}