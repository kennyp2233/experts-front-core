"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { inicioSegunRol, useAuth } from '../features/auth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push(inicioSegunRol(user?.role));
      } else {
        router.push('/auth');
      }
    }
  }, [isAuthenticated, isLoading, router, user?.role]);

  return null;
}
