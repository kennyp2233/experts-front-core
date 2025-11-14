// Components
export { MasterDataTable } from './components/common/MasterDataTable';
export { MasterDataForm } from './components/common/MasterDataForm';
export { MasterDataPage } from './components/common/MasterDataPage';
export { AerolineasMasterDataPage } from './components/aerolineas/AerolineasMasterDataPage';
export { PaisesMasterDataPage } from './components/paises/PaisesMasterDataPage';
export { ProductosMasterDataPage } from './components/productos/ProductosMasterDataPage';
export { DestinoMasterDataPage } from './components/destino/DestinoMasterDataPage';
export { OrigenMasterDataPage } from './components/origen/OrigenMasterDataPage';
export { RutasManager } from './components/aerolineas/RutasManager';
export { ConceptosCostoManager } from './components/aerolineas/ConceptosCostoManager';

// Hooks
export { useMasterData, useMasterDataList } from './hooks/common/useMasterData';
export { useAerolineasMasterData } from './hooks/aerolineas/useAerolineasMasterData';

// Services
// masterDataService eliminado - cada feature maneja sus propios servicios

// Types
export type * from './types/master-data.types';

// Configs and Utils (consolidated in configs/index.ts)
export {
  productosConfig,
  paisesConfig,
  aerolineasConfig,
  tipoEmbalajeConfig,
  tipoEmbarqueConfig,
  tipoCargaConfig,
  medidasConfig,
  clientesConfig,
  MASTER_DATA_CONFIGS,
  getMasterDataConfig,
  ALL_MASTER_DATA_CONFIGS,
  MASTER_DATA_ROUTES,
} from './configs';
export { getMasterDataComponent, getConfigKeyFromEndpoint } from './configs/components';