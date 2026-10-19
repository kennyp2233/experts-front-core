"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth.hook';
import { inicioSegunRol } from '../utils/inicio';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Solo estos roles entran; los demás van a su inicio (p. ej. el portal de fincas). */
  rolesPermitidos?: string[];
  /** Estos roles no entran (p. ej. FINCA en las pantallas de la oficina). */
  rolesExcluidos?: string[];
}

/**
 * Gate for /(app)/* routes. Renders the spinner until the *first* profile
 * attempt has settled (axios interceptor finished its single-flight refresh
 * if applicable). Only after that, decides whether to redirect or render.
 *
 * Note: `isMutating` (login/register in-flight) is intentionally ignored —
 * those happen on /auth pages and have their own loading UI.
 */
export default function ProtectedRoute({ children, rolesPermitidos, rolesExcluidos }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isAuthLoading, user } = useAuth();
  const role = user?.role ?? '';
  const fueraDeLugar =
    isAuthenticated && !!user && ((rolesPermitidos && !rolesPermitidos.includes(role)) || rolesExcluidos?.includes(role));

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/auth');
    } else if (fueraDeLugar) {
      router.replace(inicioSegunRol(role));
    }
  }, [isAuthenticated, isAuthLoading, router, fueraDeLugar, role]);

  if (isAuthLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || fueraDeLugar) {
    return null;
  }

  return <>{children}</>;
}
