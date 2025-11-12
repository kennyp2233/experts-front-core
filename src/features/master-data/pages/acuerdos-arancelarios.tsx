'use client';

import React from 'react';
import { MasterDataPage } from '../components/common/MasterDataPage';
import { acuerdosArancelariosConfig } from '../configs/acuerdos-arancelarios.config';

export default function AcuerdosArancelariosPage() {
  return <MasterDataPage config={acuerdosArancelariosConfig} />;
}