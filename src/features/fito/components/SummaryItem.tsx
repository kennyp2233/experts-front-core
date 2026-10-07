import React from 'react';
import { Box, Typography } from '@mui/material';

interface SummaryItemProps {
    label: string;
    value?: React.ReactNode;
    /** Valor requerido sin completar: se muestra resaltado. */
    missing?: boolean;
    /** Ocupa toda la fila de la grilla. */
    wide?: boolean;
}

/** Par etiqueta / valor de solo lectura para los resúmenes del asistente FITO. */
export const SummaryItem: React.FC<SummaryItemProps> = ({ label, value, missing, wide }) => (
    <Box sx={{ minWidth: 0, gridColumn: wide ? '1 / -1' : undefined }}>
        <Typography variant="caption" color="text.secondary" display="block">
            {label}
        </Typography>
        <Typography
            variant="body2"
            component="div"
            sx={{
                wordBreak: 'break-word',
                color: missing ? 'warning.dark' : 'text.primary',
                fontWeight: missing ? 600 : 400
            }}
        >
            {missing ? 'Falta completar' : value || '—'}
        </Typography>
    </Box>
);
