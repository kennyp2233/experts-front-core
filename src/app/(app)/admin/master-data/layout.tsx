"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Button, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Mostrar el botón de volver solo si no estamos en la página principal de master-data
  const isChildPage = pathname !== '/admin/master-data';

  const handleGoBack = () => {
    router.push('/admin/master-data');
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {isChildPage && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleGoBack}
            sx={{ mb: 1 }}
          >
            Volver a Master Data
          </Button>
        </Box>
      )}
      {children}
    </Box>
  );
}