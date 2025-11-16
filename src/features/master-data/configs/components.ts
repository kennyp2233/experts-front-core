import React from 'react';
import { MasterDataConfig } from '../types/master-data.types';
import { MasterDataPage } from '../components/common/MasterDataPage';

// All master data now uses the generic MasterDataPage with hook injection pattern
export const MASTER_DATA_COMPONENTS: Record<string, React.ComponentType<{ config: MasterDataConfig }>> = {};

/**
 * Obtiene el componente apropiado para una configuración
 * All master data now uses the generic MasterDataPage component
 */
export function getMasterDataComponent(configKey: string) {
  return MasterDataPage;
}

/**
 * Determina la clave de configuración basada en el endpoint
 */
export function getConfigKeyFromEndpoint(endpoint: string): string {
  return 'default';
}