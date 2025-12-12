'use client';

import { Dashboard as DashboardIcon, People as PeopleIcon, Settings as SettingsIcon, Storage as StorageIcon } from '@mui/icons-material';
import type { MenuSection } from './types';
import { getMasterDataMenuItems } from '../../../master-data/configs';

export const MENU_SECTIONS: MenuSection[] = [
  {
    items: [
      { label: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
    ],
  },
  {
    title: 'Administración',
    items: [
      {
        label: 'Datos Maestros',
        icon: <StorageIcon />,
        href: '/admin/master-data',
        children: getMasterDataMenuItems(),
      },
      { label: 'Certificados FITO', icon: <StorageIcon />, href: '/admin/fito', roles: ['ADMIN'] },
      { label: 'Trabajadores', icon: <PeopleIcon />, href: '/admin/workers', roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Ajustes',
    items: [
      { label: 'Configuración', icon: <SettingsIcon />, href: '/admin/settings', roles: ['ADMIN'] },
      { label: 'Mi Perfil', icon: <PeopleIcon />, href: '/profile' },
    ],
  },
];
