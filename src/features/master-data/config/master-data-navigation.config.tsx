import {
  Public as PublicIcon,
  Flight as FlightIcon,
  Inventory2 as ProductIcon,
  LocalShipping as ShippingIcon,
  Inventory as PackageIcon,
  Business as BusinessIcon,
  Scale as ScaleIcon,
  Gavel as GavelIcon,
  AirportShuttle as AirportShuttleIcon,
  Warehouse as WarehouseIcon,
  AccountCircle as AccountCircleIcon,
  DriveEta as DriveEtaIcon,
  Agriculture as AgricultureIcon,
  AssignmentInd as AssignmentIndIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import type { MenuItem } from '../../dashboard/components/sidebar/types';

export interface MasterDataCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  entities: MasterDataEntity[];
}

export interface MasterDataEntity {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  category: string;
  available: boolean;
}

/**
 * Configuración centralizada de entidades de datos maestros
 * Esta configuración se usa tanto para el sidebar como para la página principal
 */
export const MASTER_DATA_ENTITIES: MasterDataEntity[] = [
  // Geográfico
  {
    id: 'acuerdos-arancelarios',
    label: 'Acuerdos Arancelarios',
    href: '/admin/master-data/acuerdos-arancelarios',
    icon: <GavelIcon />,
    color: '#e91e63',
    description: 'Administrar acuerdos arancelarios y tratados comerciales',
    category: 'geográfico',
    available: true,
  },
  {
    id: 'paises',
    label: 'Países',
    href: '/admin/master-data/paises',
    icon: <PublicIcon />,
    color: '#f57c00',
    description: 'Mantener lista de países y sus datos',
    category: 'geográfico',
    available: true,
  },
  {
    id: 'cae-aduana',
    label: 'CAE Aduana',
    href: '/admin/master-data/cae-aduana',
    icon: <WarehouseIcon />,
    color: '#4caf50',
    description: 'Gestionar códigos de aduanas',
    category: 'geográfico',
    available: true,
  },
  {
    id: 'destino',
    label: 'Destino',
    href: '/admin/master-data/destino',
    icon: <PublicIcon />,
    color: '#8bc34a',
    description: 'Administrar destinos disponibles',
    category: 'geográfico',
    available: true,
  },
  {
    id: 'origen',
    label: 'Origen',
    href: '/admin/master-data/origen',
    icon: <PublicIcon />,
    color: '#cddc39',
    description: 'Gestionar orígenes de productos',
    category: 'geográfico',
    available: true,
  },

  // Transporte
  {
    id: 'aerolineas',
    label: 'Aerolíneas',
    href: '/admin/master-data/aerolineas',
    icon: <FlightIcon />,
    color: '#388e3c',
    description: 'Administrar aerolíneas y sus configuraciones',
    category: 'transporte',
    available: true,
  },
  {
    id: 'agencia-iata',
    label: 'Agencias IATA',
    href: '/admin/master-data/agencia-iata',
    icon: <AirportShuttleIcon />,
    color: '#2196f3',
    description: 'Gestionar agencias IATA y sus configuraciones',
    category: 'transporte',
    available: true,
  },

  // Productos
  {
    id: 'productos',
    label: 'Productos',
    href: '/admin/master-data/productos',
    icon: <ProductIcon />,
    color: '#1976d2',
    description: 'Gestionar productos y sus características',
    category: 'productos',
    available: true,
  },

  // Operativo
  {
    id: 'tipos-carga',
    label: 'Tipos de Carga',
    href: '/admin/master-data/tipos-carga',
    icon: <ShippingIcon />,
    color: '#0288d1',
    description: 'Administrar tipos de carga disponibles',
    category: 'operativo',
    available: true,
  },
  {
    id: 'tipo-embalaje',
    label: 'Tipos de Embalaje',
    href: '/admin/master-data/tipo-embalaje',
    icon: <PackageIcon />,
    color: '#ff9800',
    description: 'Configurar tipos de embalaje para productos',
    category: 'operativo',
    available: true,
  },
  {
    id: 'tipo-embarque',
    label: 'Tipos de Embarque',
    href: '/admin/master-data/tipo-embarque',
    icon: <ShippingIcon />,
    color: '#9c27b0',
    description: 'Administrar tipos de embarque y sus características',
    category: 'operativo',
    available: true,
  },
  {
    id: 'bodeguero',
    label: 'Bodegueros',
    href: '/admin/master-data/bodeguero',
    icon: <AccountCircleIcon />,
    color: '#795548',
    description: 'Gestionar bodegueros del sistema',
    category: 'operativo',
    available: true,
  },
  {
    id: 'choferes',
    label: 'Choferes',
    href: '/admin/master-data/choferes',
    icon: <DriveEtaIcon />,
    color: '#607d8b',
    description: 'Administrar información de choferes',
    category: 'operativo',
    available: true,
  },

  // Comercial (futuro)
  {
    id: 'clientes',
    label: 'Clientes',
    href: '/admin/master-data/clientes',
    icon: <BusinessIcon />,
    color: '#7b1fa2',
    description: 'Gestionar información de clientes',
    category: 'comercial',
    available: true,
  },
  {
    id: 'embarcadores',
    label: 'Embarcadores',
    href: '/admin/master-data/embarcadores',
    icon: <BusinessIcon />,
    color: '#5e35b1',
    description: 'Administrar información de embarcadores',
    category: 'comercial',
    available: true,
  },
  {
    id: 'consignatarios',
    label: 'Consignatarios',
    href: '/admin/master-data/consignatarios',
    icon: <GroupIcon />,
    color: '#3949ab',
    description: 'Gestionar consignatarios y sus configuraciones',
    category: 'comercial',
    available: true,
  },
  {
    id: 'sub-agencia',
    label: 'Sub-Agencia',
    href: '/admin/master-data/sub-agencia',
    icon: <BusinessIcon />,
    color: '#ba68c8',
    description: 'Administrar sub-agencias y sucursales',
    category: 'comercial',
    available: true,
  },
  {
    id: 'medidas',
    label: 'Medidas',
    href: '/admin/master-data/medidas',
    icon: <ScaleIcon />,
    color: '#d32f2f',
    description: 'Configurar unidades de medida',
    category: 'comercial',
    available: true,
  },

  // Agrícola
  {
    id: 'finca',
    label: 'Fincas',
    href: '/admin/master-data/fincas',
    icon: <AgricultureIcon />,
    color: '#2e7d32',
    description: 'Administrar fincas y sus configuraciones',
    category: 'agrícola',
    available: true,
  },
  {
    id: 'funcionario-agrocalidad',
    label: 'Funcionarios Agrocalidad',
    href: '/admin/master-data/funcionario-agrocalidad',
    icon: <AssignmentIndIcon />,
    color: '#f57c00',
    description: 'Gestionar funcionarios de agrocalidad',
    category: 'agrícola',
    available: true,
  },
];

/**
 * Categorías de datos maestros con sus iconos representativos
 */
export const MASTER_DATA_CATEGORIES: MasterDataCategory[] = [
  {
    id: 'geográfico',
    title: 'Geográfico',
    icon: <PublicIcon />,
    entities: MASTER_DATA_ENTITIES.filter(e => e.category === 'geográfico' && e.available),
  },
  {
    id: 'transporte',
    title: 'Transporte',
    icon: <FlightIcon />,
    entities: MASTER_DATA_ENTITIES.filter(e => e.category === 'transporte' && e.available),
  },
  {
    id: 'productos',
    title: 'Productos',
    icon: <ProductIcon />,
    entities: MASTER_DATA_ENTITIES.filter(e => e.category === 'productos' && e.available),
  },
  {
    id: 'operativo',
    title: 'Operativo',
    icon: <ShippingIcon />,
    entities: MASTER_DATA_ENTITIES.filter(e => e.category === 'operativo' && e.available),
  },
  {
    id: 'comercial',
    title: 'Comercial',
    icon: <BusinessIcon />,
    entities: MASTER_DATA_ENTITIES.filter(e => e.category === 'comercial' && e.available),
  },
  {
    id: 'agrícola',
    title: 'Agrícola',
    icon: <AgricultureIcon />,
    entities: MASTER_DATA_ENTITIES.filter(e => e.category === 'agrícola' && e.available),
  },
];

/**
 * Genera los items del menú para el sidebar organizados por categorías
 * Solo incluye entidades disponibles
 */
export function getMasterDataMenuItems(): MenuItem[] {
  return MASTER_DATA_CATEGORIES
    .filter(category => category.entities.length > 0)
    .map(category => ({
      label: category.title,
      icon: category.icon,
      children: category.entities.map(entity => ({
        label: entity.label,
        icon: entity.icon,
        href: entity.href,
      })),
    }));
}

/**
 * Obtiene todas las entidades disponibles agrupadas por categoría
 */
export function getAvailableEntitiesByCategory() {
  return MASTER_DATA_CATEGORIES.reduce((acc, category) => {
    acc[category.id] = category.entities;
    return acc;
  }, {} as Record<string, MasterDataEntity[]>);
}

/**
 * Busca una entidad por su ID
 */
export function getEntityById(id: string): MasterDataEntity | undefined {
  return MASTER_DATA_ENTITIES.find(entity => entity.id === id);
}

/**
 * Obtiene todas las entidades disponibles
 */
export function getAvailableEntities(): MasterDataEntity[] {
  return MASTER_DATA_ENTITIES.filter(entity => entity.available);
}