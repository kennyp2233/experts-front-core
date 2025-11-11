// Configuraciones de datos maestros
export { productosConfig } from './productos.config';
export { paisesConfig } from './paises.config';
export { aerolineasConfig } from './aerolineas.config';
export { tipoEmbalajeConfig } from './tipo-embalaje.config';
export { tipoEmbarqueConfig } from './tipo-embarque.config';
export { tipoCargaConfig } from './tipo-carga.config';
export { medidasConfig } from './medidas.config';
export { clientesConfig } from './clientes.config';

// Configuración de navegación centralizada
export * from '../config/master-data-navigation.config';

// Importar para uso interno
import { productosConfig } from './productos.config';
import { paisesConfig } from './paises.config';
import { aerolineasConfig } from './aerolineas.config';
import { tipoEmbalajeConfig } from './tipo-embalaje.config';
import { tipoEmbarqueConfig } from './tipo-embarque.config';
import { tipoCargaConfig } from './tipo-carga.config';
import { medidasConfig } from './medidas.config';
import { clientesConfig } from './clientes.config';

// Tipos de configuraciones disponibles
export const MASTER_DATA_CONFIGS = {
  productos: 'productosConfig',
  paises: 'paisesConfig',
  aerolineas: 'aerolineasConfig',
  tipoCarga: 'tipoCargaConfig',
  tipoEmbalaje: 'tipoEmbalajeConfig',
  tipoEmbarque: 'tipoEmbarqueConfig',
  medidas: 'medidasConfig',
  clientes: 'clientesConfig',
} as const;

export type MasterDataConfigKey = keyof typeof MASTER_DATA_CONFIGS;

/**
 * Helper para obtener una configuración por clave
 */
export function getMasterDataConfig(key: MasterDataConfigKey) {
  const configs = {
    productos: productosConfig,
    paises: paisesConfig,
    aerolineas: aerolineasConfig,
    tipoCarga: tipoCargaConfig,
    tipoEmbalaje: tipoEmbalajeConfig,
    tipoEmbarque: tipoEmbarqueConfig,
    medidas: medidasConfig,
    clientes: clientesConfig,
  };

  return configs[key];
}

/**
 * Lista de todas las configuraciones disponibles (ordenadas lógicamente)
 */
export const ALL_MASTER_DATA_CONFIGS = [
  paisesConfig,           // 1. Geográfico
  aerolineasConfig,       // 2. Transporte
  productosConfig,        // 3. Productos
  tipoCargaConfig,        // 4. Operativo - Carga
  tipoEmbalajeConfig,     // 5. Operativo - Embalaje
  tipoEmbarqueConfig,     // 6. Operativo - Embarque
  medidasConfig,          // 7. Medidas
  clientesConfig,         // 8. Clientes
];

/**
 * Mapeo de rutas a configuraciones para navegación dinámica
 */
export const MASTER_DATA_ROUTES = {
  '/admin/master-data/productos': productosConfig,
  '/admin/master-data/paises': paisesConfig,
  '/admin/master-data/aerolineas': aerolineasConfig,
  '/admin/master-data/tipos-carga': tipoCargaConfig,
  '/admin/master-data/tipo-embalaje': tipoEmbalajeConfig,
  '/admin/master-data/tipo-embarque': tipoEmbarqueConfig,
  '/admin/master-data/medidas': medidasConfig,
  '/admin/master-data/clientes': clientesConfig,
} as const;