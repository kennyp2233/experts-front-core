'use client';

import {
  HomeOutlined as HomeIcon,
  Hub as CoordinacionesIcon,
  Inventory2Outlined as AwbsIcon,
  DescriptionOutlined as DaesIcon,
  FactCheckOutlined as FitoIcon,
  CompareArrows as SyncIcon,
  PersonOutline as ProfileIcon,
} from '@mui/icons-material';
import type { MenuSection } from './types';

/**
 * Menú lateral. Las secciones cuyos ítems quedan todos ocultos por rol no se
 * pintan (ver `filterMenuSections`).
 *
 * Coordinaciones no tiene hijos: "Vigentes / Histórico" es un selector dentro
 * de la pantalla y "Nueva" es un botón de la misma. El ítem sigue marcado como
 * activo en /ebf/coordinaciones/nueva y /ebf/coordinaciones/[id] porque
 * `isActive` compara por prefijo.
 */
export const MENU_SECTIONS: MenuSection[] = [
  {
    items: [{ label: 'Inicio', icon: <HomeIcon />, href: '/dashboard' }],
  },
  {
    title: 'Operación',
    items: [
      { label: 'Coordinaciones', icon: <CoordinacionesIcon />, href: '/ebf/coordinaciones' },
      { label: 'AWBs', icon: <AwbsIcon />, href: '/ebf/customer/awbs' },
      { label: 'DAEs', icon: <DaesIcon />, href: '/ebf/daes' },
    ],
  },
  {
    title: 'Agrocalidad',
    items: [
      { label: 'Certificados FITO', icon: <FitoIcon />, href: '/admin/fito', roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Sincronización', icon: <SyncIcon />, href: '/sync/ebf-access' },
    ],
  },
  {
    title: 'Cuenta',
    items: [{ label: 'Mi perfil', icon: <ProfileIcon />, href: '/profile' }],
  },
];
