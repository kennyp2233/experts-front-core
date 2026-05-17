"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth.hook';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Gate for /(app)/* routes. Renders the spinner until the *first* profile
 * attempt has settled (axios interceptor finished its single-flight refresh
 * if applicable). Only after that, decides whether to redirect or render.
 *
 * Note: `isMutating` (login/register in-flight) is intentionally ignored —
 * those happen on /auth pages and have their own loading UI.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, isAuthLoading, router]);

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

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
