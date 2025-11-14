'use client';

import React from 'react';
import { OrigenMasterDataPage } from '../components/origen/OrigenMasterDataPage';
import { origenConfig } from '../configs/origen.config';

export default function OrigenPage() {
  return <OrigenMasterDataPage config={origenConfig} />;
}