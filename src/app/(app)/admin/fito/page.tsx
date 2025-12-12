'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { FitoPage as FitoPageComponent } from '../../../../features/fito';

export default function FitoPage() {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
                Certificados FITO
            </Typography>
            <FitoPageComponent />
        </Box>
    );
}
