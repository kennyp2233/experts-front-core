import React from 'react';
import { MasterDataConfig } from '../types/master-data.types';
import { MasterDataPage } from '../components/common/MasterDataPage';
import { AerolineasMasterDataPage } from '../components/aerolineas/AerolineasMasterDataPage';
import { PaisesMasterDataPage } from '../components/paises/PaisesMasterDataPage';
import { ProductosMasterDataPage } from '../components/productos/ProductosMasterDataPage';

// Mapeo de configuraciones a componentes específicos
export const MASTER_DATA_COMPONENTS: Record<string, React.ComponentType<{ config: MasterDataConfig }>> = {
  aerolineas: AerolineasMasterDataPage,
  paises: PaisesMasterDataPage,
  productos: ProductosMasterDataPage,
};

/**
 * Obtiene el componente apropiado para una configuración
 * Si no hay un componente específico, usa el genérico MasterDataPage
 */
export function getMasterDataComponent(configKey: string) {
  return MASTER_DATA_COMPONENTS[configKey] || MasterDataPage;
}

/**
 * Determina la clave de configuración basada en el endpoint
 */
export function getConfigKeyFromEndpoint(endpoint: string): string {
  if (endpoint.includes('aerolinea')) return 'aerolineas';
  if (endpoint.includes('paises')) return 'paises';
  if (endpoint.includes('productos')) return 'productos';
  return 'default';
}