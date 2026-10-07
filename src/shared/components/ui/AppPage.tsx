'use client';

import React from 'react';
import { Box, Stack, Typography } from '@mui/material';

export interface AppPageProps {
  title: string;
  /** Una línea que explica para qué sirve la pantalla. */
  subtitle?: React.ReactNode;
  /** Acciones a la derecha del título (botón principal, estado de conexión…). */
  actions?: React.ReactNode;
  /** Ancho máximo del contenido; por defecto ocupa todo el ancho. */
  maxWidth?: number;
  children: React.ReactNode;
}

/**
 * Contenedor estándar de pantalla: mismo padding, mismo título y misma
 * posición de acciones en todas las páginas de la app.
 */
export function AppPage({ title, subtitle, actions, maxWidth, children }: AppPageProps) {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth, mx: maxWidth ? 'auto' : undefined }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" component="h1" fontWeight={600}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
            {actions}
          </Stack>
        )}
      </Stack>
      {children}
    </Box>
  );
}
