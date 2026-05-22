'use client';

import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Storage as StorageIcon,
  Hub as HubIcon,
  FlightTakeoff as FlightIcon,
  History as HistoryIcon,
  Description as DescriptionIcon,
  AddCircleOutline as AddCircleIcon,
  Inventory2 as AwbsIcon,
  CompareArrows as SyncIcon,
} from '@mui/icons-material';
import type { MenuSection } from './types';

export const MENU_SECTIONS: MenuSection[] = [
  {
    items: [
      { label: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Certificados FITO', icon: <StorageIcon />, href: '/admin/fito', roles: ['ADMIN'] },
    ],
  },
  {
    title: 'EBF',
    items: [
      {
        label: 'Coordinaciones (manager)',
        icon: <HubIcon />,
        href: '/ebf/coordinaciones',
        children: [
          { label: 'Vigentes', icon: <FlightIcon />, href: '/ebf/coordinaciones' },
          { label: 'Histórico', icon: <HistoryIcon />, href: '/ebf/coordinaciones/historico' },
          { label: 'Nueva', icon: <AddCircleIcon />, href: '/ebf/coordinaciones/nueva' },
        ],
      },
      { label: 'AWBs (cliente)', icon: <AwbsIcon />, href: '/ebf/customer/awbs' },
      { label: 'DAEs', icon: <DescriptionIcon />, href: '/ebf/daes' },
    ],
  },
  {
    title: 'Sync',
    items: [
      { label: 'EBF ↔ Access', icon: <SyncIcon />, href: '/sync/ebf-access' },
    ],
  },
  {
    title: 'Ajustes',
    items: [
      { label: 'Mi Perfil', icon: <PeopleIcon />, href: '/profile' },
    ],
  },
];
