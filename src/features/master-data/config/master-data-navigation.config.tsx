import {
  Public as PublicIcon,
  Flight as FlightIcon,
  Inventory2 as ProductIcon,
  LocalShipping as ShippingIcon,
  Inventory as PackageIcon,
  Business as BusinessIcon,
  Scale as ScaleIcon,
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
    id: 'paises',
    label: 'Países',
    href: '/admin/master-data/paises',
    icon: <PublicIcon />,
    color: '#f57c00',
    description: 'Mantener lista de países y sus datos',
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
    id: 'medidas',
    label: 'Medidas',
    href: '/admin/master-data/medidas',
    icon: <ScaleIcon />,
    color: '#d32f2f',
    description: 'Configurar unidades de medida',
    category: 'comercial',
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
];

/**
 * Genera los items del menú para el sidebar
 * Solo incluye entidades disponibles
 */
export function getMasterDataMenuItems(): MenuItem[] {
  const availableEntities = MASTER_DATA_ENTITIES.filter(entity => entity.available);

  return availableEntities.map(entity => ({
    label: entity.label,
    icon: entity.icon,
    href: entity.href,
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