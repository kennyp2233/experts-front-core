'use client';

import {
  HomeOutlined as HomeIcon,
  FlightTakeoffOutlined as CoordinacionesIcon,
  Hub as EbfCoordinacionesIcon,
  Inventory2Outlined as AwbsIcon,
  DescriptionOutlined as DaesIcon,
  FactCheckOutlined as FitoIcon,
  CompareArrows as SyncIcon,
  PersonOutline as ProfileIcon,
  StorageOutlined as MaestrosIcon,
  ConfirmationNumberOutlined as AdministracionGuiasIcon,
  ReceiptLongOutlined as IngresoGuiasIcon,
  RuleOutlined as ValidacionIcon,
} from '@mui/icons-material';
import type { MenuSection } from './types';

/**
 * Menú lateral. Las secciones cuyos ítems quedan todos ocultos por rol no se
 * pintan (ver `filterMenuSections`).
 *
 * "Operación" es el sistema nuevo (reemplazo del sistema viejo de Access);
 * "Integraciones · EBF" es el portal externo EBF (sus coordinaciones son otra
 * cosa: las del agente EBF, no las propias).
 */
export const MENU_SECTIONS: MenuSection[] = [
  {
    items: [{ label: 'Inicio', icon: <HomeIcon />, href: '/dashboard' }],
  },
  {
    title: 'Operación',
    items: [
      // Como el menú del sistema viejo: las guías nacen en el ingreso, antes de coordinar.
      { label: 'Ingreso de guías', icon: <IngresoGuiasIcon />, href: '/operacion/guias/ingresos', roles: ['ADMIN', 'USER'] },
      {
        label: 'Administración de guías',
        icon: <AdministracionGuiasIcon />,
        href: '/operacion/guias/administracion',
        roles: ['ADMIN', 'USER'],
      },
      { label: 'Coordinaciones', icon: <CoordinacionesIcon />, href: '/operacion/coordinaciones', roles: ['ADMIN', 'USER'] },
      { label: 'Validación', icon: <ValidacionIcon />, href: '/operacion/validacion', roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Agrocalidad',
    items: [
      { label: 'Certificados FITO', icon: <FitoIcon />, href: '/admin/fito', roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Integraciones · EBF',
    items: [
      { label: 'Coordinaciones EBF', icon: <EbfCoordinacionesIcon />, href: '/ebf/coordinaciones' },
      { label: 'AWBs', icon: <AwbsIcon />, href: '/ebf/customer/awbs' },
      { label: 'DAEs', icon: <DaesIcon />, href: '/ebf/daes' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Datos maestros', icon: <MaestrosIcon />, href: '/maestros', roles: ['ADMIN', 'USER'] },
      { label: 'Sincronización EBF', icon: <SyncIcon />, href: '/sync/ebf-access' },
    ],
  },
  {
    title: 'Cuenta',
    items: [{ label: 'Mi perfil', icon: <ProfileIcon />, href: '/profile' }],
  },
];
