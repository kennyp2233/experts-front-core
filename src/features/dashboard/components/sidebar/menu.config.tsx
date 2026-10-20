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
  AgricultureOutlined as UsuariosFincasIcon,
  BadgeOutlined as DaesOficinaIcon,
  RequestQuoteOutlined as EstadoCuentaIcon,
  QueryStatsOutlined as VentasIcon,
  SupervisedUserCircleOutlined as UsuariosClientesIcon,
  PowerSettingsNewOutlined as CorteIcon,
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
      // Como "Administración de DAEs" / F4 del viejo (las fincas registran las suyas en su portal).
      { label: 'DAEs', icon: <DaesOficinaIcon />, href: '/operacion/daes', roles: ['ADMIN', 'USER'] },
      { label: 'Validación', icon: <ValidacionIcon />, href: '/operacion/validacion', roles: ['ADMIN'] },
    ],
  },
  {
    // Lo que se le cobra al cliente: valores del cliente + handling (el viejo los sacaba incompletos).
    title: 'Cobro',
    items: [
      { label: 'Estado de cuenta', icon: <EstadoCuentaIcon />, href: '/operacion/cuentas/estado-cuenta', roles: ['ADMIN', 'USER'] },
      { label: 'Ventas y liquidación', icon: <VentasIcon />, href: '/operacion/cuentas/ventas', roles: ['ADMIN', 'USER'] },
    ],
  },
  {
    title: 'Portales',
    items: [
      // Como "WEB Usuarios" del viejo: las fincas entran al portal con estos usuarios.
      { label: 'Usuarios de fincas', icon: <UsuariosFincasIcon />, href: '/operacion/usuarios-fincas', roles: ['ADMIN'] },
      { label: 'Usuarios de clientes', icon: <UsuariosClientesIcon />, href: '/operacion/usuarios-clientes', roles: ['ADMIN'] },
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
      { label: 'Corte definitivo', icon: <CorteIcon />, href: '/operacion/corte-definitivo', roles: ['ADMIN'] },
      { label: 'Sincronización EBF', icon: <SyncIcon />, href: '/sync/ebf-access' },
    ],
  },
  {
    title: 'Cuenta',
    items: [{ label: 'Mi perfil', icon: <ProfileIcon />, href: '/profile' }],
  },
];
