'use client';

import ProtectedRoute from '@/features/auth/components/ProtectedRoute';

/** Hojas para imprimir: sin el menú de la app; solo la oficina. */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute rolesExcluidos={['FINCA', 'CLIENTE']}>{children}</ProtectedRoute>;
}
