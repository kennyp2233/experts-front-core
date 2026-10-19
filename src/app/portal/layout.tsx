'use client';

import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import { PortalLayout } from '@/features/portal-fincas';

/** Portal de las fincas: solo usuarios de finca (la oficina va a su menú). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute rolesPermitidos={['FINCA']}>
      <PortalLayout>{children}</PortalLayout>
    </ProtectedRoute>
  );
}
