"use client";

import { DashboardLayout } from '../../features/dashboard';
import ProtectedRoute from '../../features/auth/components/ProtectedRoute';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // Las fincas usan su portal (/portal), no las pantallas de la oficina.
    <ProtectedRoute rolesExcluidos={['FINCA']}>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
