// Configuraciones de datos maestros
export { productosConfig } from './productos.config';
export { paisesConfig } from './paises.config';
export { aerolineasConfig } from './aerolineas.config';
export { tipoEmbalajeConfig } from './tipo-embalaje.config';
export { tipoEmbarqueConfig } from './tipo-embarque.config';
export { tipoCargaConfig } from './tipo-carga.config';
export { medidasConfig } from './medidas.config';
export { clientesConfig } from './clientes.config';
export { acuerdosArancelariosConfig } from './acuerdos-arancelarios.config';
export { agenciaIataConfig } from './agencia-iata.config';
export { bodegueroConfig } from './bodeguero.config';
export { caeAduanaConfig } from './cae-aduana.config';
export { choferesConfig } from './choferes.config';
export { destinoConfig } from './destino.config';
export { origenConfig } from './origen.config';
export { subAgenciaConfig } from './sub-agencia.config';
export { embarcadoresConfig } from './embarcadores.config';
export { fincaConfig } from './finca.config';
export { funcionarioAgrocalidadConfig } from './funcionario-agrocalidad.config';

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
import { acuerdosArancelariosConfig } from './acuerdos-arancelarios.config';
import { agenciaIataConfig } from './agencia-iata.config';
import { bodegueroConfig } from './bodeguero.config';
import { caeAduanaConfig } from './cae-aduana.config';
import { choferesConfig } from './choferes.config';
import { destinoConfig } from './destino.config';
import { origenConfig } from './origen.config';
import { subAgenciaConfig } from './sub-agencia.config';
import { embarcadoresConfig } from './embarcadores.config';
import { fincaConfig } from './finca.config';
import { funcionarioAgrocalidadConfig } from './funcionario-agrocalidad.config';

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
  acuerdosArancelarios: 'acuerdosArancelariosConfig',
  agenciaIata: 'agenciaIataConfig',
  bodeguero: 'bodegueroConfig',
  caeAduana: 'caeAduanaConfig',
  choferes: 'choferesConfig',
  destino: 'destinoConfig',
  origen: 'origenConfig',
  subAgencia: 'subAgenciaConfig',
  embarcadores: 'embarcadoresConfig',
  finca: 'fincaConfig',
  funcionarioAgrocalidad: 'funcionarioAgrocalidadConfig',
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
    acuerdosArancelarios: acuerdosArancelariosConfig,
    agenciaIata: agenciaIataConfig,
    bodeguero: bodegueroConfig,
    caeAduana: caeAduanaConfig,
    choferes: choferesConfig,
    destino: destinoConfig,
    origen: origenConfig,
    subAgencia: subAgenciaConfig,
    embarcadores: embarcadoresConfig,
    finca: fincaConfig,
    funcionarioAgrocalidad: funcionarioAgrocalidadConfig,
  };

  return configs[key];
}

/**
 * Lista de todas las configuraciones disponibles (ordenadas lógicamente)
 */
export const ALL_MASTER_DATA_CONFIGS = [
  acuerdosArancelariosConfig, // 1. Acuerdos Arancelarios (referenciado por países)
  paisesConfig,           // 2. Geográfico
  destinoConfig,          // 3. Destinos
  origenConfig,           // 4. Orígenes
  caeAduanaConfig,        // 5. CAE Aduana
  aerolineasConfig,       // 6. Transporte
  agenciaIataConfig,      // 7. Agencias IATA
  subAgenciaConfig,       // 8. Sub-Agencias
  productosConfig,        // 9. Productos
  tipoCargaConfig,        // 10. Operativo - Carga
  tipoEmbalajeConfig,     // 11. Operativo - Embalaje
  tipoEmbarqueConfig,     // 12. Operativo - Embarque
  bodegueroConfig,        // 13. Bodeguero
  choferesConfig,         // 14. Choferes
  medidasConfig,          // 15. Medidas
  clientesConfig,         // 16. Clientes
  embarcadoresConfig,     // 17. Embarcadores
  fincaConfig,            // 18. Fincas
  funcionarioAgrocalidadConfig, // 19. Funcionarios Agrocalidad
];

/**
 * Mapeo de rutas a configuraciones para navegación dinámica
 */
export const MASTER_DATA_ROUTES = {
  '/admin/master-data/productos': productosConfig,
  '/admin/master-data/paises': paisesConfig,
  '/admin/master-data/aerolineas': aerolineasConfig,
  '/admin/master-data/tipos-carga': tipoCargaConfig,
  '/admin/master-data/tipo-embalaje': tipoEmbarqueConfig,
  '/admin/master-data/tipo-embarque': tipoEmbarqueConfig,
  '/admin/master-data/medidas': medidasConfig,
  '/admin/master-data/clientes': clientesConfig,
  '/admin/master-data/acuerdos-arancelarios': acuerdosArancelariosConfig,
  '/admin/master-data/agencia-iata': agenciaIataConfig,
  '/admin/master-data/bodeguero': bodegueroConfig,
  '/admin/master-data/cae-aduana': caeAduanaConfig,
  '/admin/master-data/choferes': choferesConfig,
  '/admin/master-data/destino': destinoConfig,
  '/admin/master-data/origen': origenConfig,
  '/admin/master-data/sub-agencia': subAgenciaConfig,
  '/admin/master-data/embarcadores': embarcadoresConfig,
  '/admin/master-data/fincas': fincaConfig,
  '/admin/master-data/funcionario-agrocalidad': funcionarioAgrocalidadConfig,
} as const;