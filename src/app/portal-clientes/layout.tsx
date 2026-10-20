'use client';

import ProtectedRoute from '@/features/auth/components/ProtectedRoute';

/** Portal de los clientes: solo usuarios de cliente (la oficina va a su menú). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute rolesPermitidos={['CLIENTE']}>{children}</ProtectedRoute>;
}
