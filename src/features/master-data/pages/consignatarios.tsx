'use client';

import React from 'react';
import { MasterDataPage } from '../components/common/MasterDataPage';
import { consignatariosConfig } from '../configs/consignatarios.config';

export default function ConsignatariosPage() {
  return <MasterDataPage config={consignatariosConfig} />;
}