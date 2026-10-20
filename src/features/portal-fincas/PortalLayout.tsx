'use client';

import { usePathname } from 'next/navigation';
import { Stack } from '@mui/material';
import { useAuth } from '@/features/auth';
import { PortalShell } from '@/shared/components/ui';
import { usePerfilFinca } from './portal';

const PESTANAS = [
  { value: 'guias', label: 'Guías abiertas', href: '/portal' },
  { value: 'daes', label: 'Mis DAE', href: '/portal/daes' },
];

/**
 * Marco del portal de fincas: arriba la finca y salir; dos pestañas (Guías
 * abiertas · Mis DAE). Pensado también para el celular.
 */
export function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { logout } = useAuth();
  const { data: perfil } = usePerfilFinca();
  const pestana = pathname.startsWith('/portal/daes') ? 'daes' : 'guias';
  const fincas = perfil?.fincas.map((f) => f.nombre).join(' · ');

  return (
    <PortalShell
      portal="Fincas"
      detalle={fincas || perfil?.usuario || ''}
      pestanas={PESTANAS}
      pestana={pestana}
      onSalir={() => logout()}
      maxWidth="md"
      pestanasAnchas
    >
      <Stack spacing={2}>{children}</Stack>
    </PortalShell>
  );
}
