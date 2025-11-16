'use client';

import React from 'react';
import { Box, Typography, SxProps, Theme } from '@mui/material';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /**
   * Aplica gradiente de color al título
   */
  gradient?: boolean;
  /**
   * Acciones que se muestran a la derecha del header
   */
  actions?: React.ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Componente reutilizable para headers de página
 * Proporciona estilos consistentes para títulos y subtítulos
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  gradient = false,
  actions,
  sx = {},
}) => {
  return (
    <Box sx={{ mb: 5, ...sx }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: subtitle ? 1.5 : 0,
              ...(gradient && {
                background: (theme) =>
                  `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }),
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: '1.1rem',
                maxWidth: 700,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ ml: 3 }}>{actions}</Box>}
      </Box>
    </Box>
  );
};
