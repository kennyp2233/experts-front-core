'use client';

import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';

export interface CategorySectionProps {
  icon?: React.ReactNode;
  title: string;
  itemCount?: number;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Componente reutilizable para secciones de categorías
 * Muestra un título con icono y contenido agrupado
 */
export const CategorySection: React.FC<CategorySectionProps> = ({
  icon,
  title,
  itemCount,
  children,
  sx = {},
}) => {
  return (
    <Box sx={{ mb: 6, ...sx }}>
      {/* Header de la categoría */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 3,
          pb: 2,
          borderBottom: 2,
          borderColor: 'divider',
        }}
      >
        {icon && (
          <Box
            sx={{
              mr: 2.5,
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              fontSize: '2rem',
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          {itemCount !== undefined && (
            <Typography variant="body2" color="text.secondary">
              {itemCount} {itemCount === 1 ? 'elemento' : 'elementos'}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Grid de contenido */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2.5,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
