"use client";

import { DashboardLayout } from '../../features/dashboard';
import ProtectedRoute from '../../features/auth/components/ProtectedRoute';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // Las fincas y los clientes usan su portal (/portal, /portal-clientes), no las pantallas de la oficina.
    <ProtectedRoute rolesExcluidos={['FINCA', 'CLIENTE']}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
