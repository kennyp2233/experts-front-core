"use client";

import { DashboardLayout } from '../../features/dashboard';
import ProtectedRoute from '../../features/auth/components/ProtectedRoute';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
