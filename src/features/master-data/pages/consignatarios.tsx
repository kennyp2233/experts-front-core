'use client';

import React from 'react';
import { ConsignatariosMasterDataPage } from '../components/consignatarios/ConsignatariosMasterDataPage';
import { consignatariosConfig } from '../configs/consignatarios.config';

export default function ConsignatariosPage() {
  return <ConsignatariosMasterDataPage config={consignatariosConfig} />;
}