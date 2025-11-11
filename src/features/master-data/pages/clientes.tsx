'use client';

import React from 'react';
import { MasterDataPage } from '../components/common/MasterDataPage';
import { clientesConfig } from '../configs/clientes.config';

export default function ClientesPage() {
  return <MasterDataPage config={clientesConfig} />;
}