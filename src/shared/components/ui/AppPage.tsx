'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Button, Stack, Typography } from '@mui/material';
import { ArrowBack as VolverIcon } from '@mui/icons-material';

export interface AppPageProps {
  title: React.ReactNode;
  /** Una línea que explica para qué sirve la pantalla. */
  subtitle?: React.ReactNode;
  /**
   * Acciones a la derecha del título. Convención: secundarias en `outlined`
   * (gris), una sola principal en `contained` al final, el resto en un menú "⋯".
   */
  actions?: React.ReactNode;
  /** Navegación sobre el título: volver a la lista, anterior/siguiente… (no van con las acciones). */
  back?: React.ReactNode;
  /** Ancho máximo del contenido; por defecto ocupa todo el ancho. */
  maxWidth?: number;
  children: React.ReactNode;
}

/** "← Lista del día", "← Datos maestros"…: siempre el mismo enlace discreto, sobre el título. */
export function VolverLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button
      component={Link}
      href={href}
      size="small"
      variant="text"
      startIcon={<VolverIcon />}
      sx={{ color: 'text.secondary', ml: -1, '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }}
    >
      {children}
    </Button>
  );
}

/**
 * Contenedor estándar de pantalla: mismo padding, mismo título y misma
 * posición de acciones en todas las páginas de la app.
 */
export function AppPage({ title, subtitle, actions, back, maxWidth, children }: AppPageProps) {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth, mx: maxWidth ? 'auto' : undefined }}>
      {back && (
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 0.5, mt: -0.5 }}>
          {back}
        </Stack>
      )}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" component="h1" fontWeight={600} sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Stack direction="row" spacing={1} alignItems="center" flexShrink={0} flexWrap="wrap" useFlexGap>
            {actions}
          </Stack>
        )}
      </Stack>
      {children}
    </Box>
  );
}
