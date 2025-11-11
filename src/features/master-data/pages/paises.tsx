'use client';

import React from 'react';
import { MasterDataPage } from '../components/common/MasterDataPage';
import { paisesConfig } from '../configs/paises.config';

export default function PaisesPage() {
  return <MasterDataPage config={paisesConfig} />;
}