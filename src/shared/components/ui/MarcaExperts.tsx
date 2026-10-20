'use client';

import { Box } from '@mui/material';

/**
 * Marca de Experts para barras y menús: un cuadro naranja con la "E". El color
 * de la marca vive aquí y en la acción principal, no en barras enteras.
 */
export function MarcaExperts({ size = 32 }: { size?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 1,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 700,
        fontSize: size * 0.5,
        lineHeight: 1,
      }}
    >
      E
    </Box>
  );
}
