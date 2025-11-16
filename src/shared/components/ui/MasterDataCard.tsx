'use client';

import React from 'react';
import {
  Card,
  CardActionArea,
  Box,
  Typography,
  alpha,
  SxProps,
  Theme,
} from '@mui/material';

export interface MasterDataCardProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  color?: string;
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

/**
 * Componente reutilizable para cards de Master Data
 * Centraliza estilos y comportamiento de hover
 */
export const MasterDataCard: React.FC<MasterDataCardProps> = ({
  icon,
  label,
  description,
  color,
  onClick,
  sx = {},
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: 1,
        borderColor: 'divider',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
          borderColor: 'primary.main',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
        },
        ...sx,
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          p: 2.5,
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: (theme) => alpha(color || theme.palette.primary.main, 0.1),
              color: color || 'primary.main',
              mb: 2,
              fontSize: '1.75rem',
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 600,
              mb: 1,
              fontSize: '1.1rem',
            }}
          >
            {label}
          </Typography>
          {description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.5,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
};
