'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { PortalShell } from '@/shared/components/ui';
import { usePerfilCliente } from './portal';

const PESTANAS = [
  { value: 'guias', label: 'Mis guías', href: '/portal-clientes' },
  { value: 'estado', label: 'Estado de cuenta', href: '/portal-clientes/estado-cuenta' },
];

/**
 * Marco del portal de clientes: arriba el nombre del cliente y salir; dos
 * pestañas (Mis guías · Estado de cuenta). Pensado también para el celular.
 */
export function PortalClientesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { logout } = useAuth();
  const { data: perfil } = usePerfilCliente();
  const pestana = pathname.startsWith('/portal-clientes/estado-cuenta') ? 'estado' : 'guias';
  const clientes = perfil?.clientes.map((c) => c.nombre).join(' · ');

  return (
    <PortalShell
      portal="Clientes"
      detalle={clientes || perfil?.nombre || perfil?.usuario || ''}
      pestanas={PESTANAS}
      pestana={pestana}
      onSalir={() => logout()}
      maxWidth="xl"
    >
      {children}
    </PortalShell>
  );
}
