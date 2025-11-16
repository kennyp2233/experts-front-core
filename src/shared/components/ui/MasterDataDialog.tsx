'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogProps,
  SxProps,
  Theme,
  Box,
} from '@mui/material';

export interface MasterDataDialogProps extends Omit<DialogProps, 'title'> {
  /**
   * Título del dialog - puede ser string o componente custom
   */
  title?: React.ReactNode;
  /**
   * Contenido del dialog
   */
  children: React.ReactNode;
  /**
   * Acciones del footer (botones)
   */
  actions?: React.ReactNode;
  /**
   * Header personalizado - si se provee, reemplaza el DialogTitle default
   */
  header?: React.ReactNode;
  /**
   * Footer personalizado - si se provee, reemplaza el DialogActions default
   */
  footer?: React.ReactNode;
  /**
   * Estilos adicionales para el DialogContent
   */
  contentSx?: SxProps<Theme>;
  /**
   * Estilos adicionales para el DialogTitle
   */
  titleSx?: SxProps<Theme>;
  /**
   * Tamaño del dialog
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Componente reutilizable para Dialogs de Master Data
 * Centraliza estilos y estructura consistente
 */
export const MasterDataDialog: React.FC<MasterDataDialogProps> = ({
  title,
  children,
  actions,
  header,
  footer,
  contentSx = {},
  titleSx = {},
  size = 'lg',
  ...dialogProps
}) => {
  return (
    <Dialog
      maxWidth={size}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 24,
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      {...dialogProps}
    >
      {/* Header */}
      {header ? (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, py: 1, flexShrink: 0 }}>
          {header}
        </Box>
      ) : title ? (
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: '1.5rem',
            pb: 2,
            flexShrink: 0,
            ...titleSx,
          }}
        >
          {title}
        </DialogTitle>
      ) : null}

      {/* Content - scrollable */}
      <DialogContent
        sx={{
          px: 2,
          py: 1,
          flex: 1,
          overflow: 'auto',
          minHeight: 0,
          ...contentSx,
        }}
      >
        {children}
      </DialogContent>

      {/* Footer */}
      {footer ? (
        <Box sx={{ px: 2, py: 1, flexShrink: 0 }}>{footer}</Box>
      ) : actions ? (
        <DialogActions sx={{ flexShrink: 0, px: 2, py: 1.5 }}>{actions}</DialogActions>
      ) : null}
    </Dialog>
  );
};
