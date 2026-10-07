import React from 'react';
import { Alert, Box, Paper, Stack, Typography } from '@mui/material';
import { FitoGuide, FitoXmlConfig, GuiaHijaAgregada, PuertoInternacional } from '../types/fito.types';
import { formatNumber, puertoLabel, sumHijas, usoPrevistoLabel } from '../utils/fito.utils';
import { formatDate } from '../../../shared/utils/format';
import { SummaryItem } from './SummaryItem';

interface FitoSummaryStepProps {
    madre: FitoGuide;
    config: FitoXmlConfig;
    destino: PuertoInternacional | null;
    productCount: number;
    /** Hijas ya agregadas por RUC + producto: exactamente lo que se envía al back. */
    guiasHijas: GuiaHijaAgregada[];
}

export const FitoSummaryStep: React.FC<FitoSummaryStepProps> = ({ madre, config, destino, productCount, guiasHijas }) => {
    const totals = sumHijas(guiasHijas);
    const sinRuc = [...new Set(guiasHijas.filter(h => h.plaRUC === 'SIN_RUC').map(h => h.proCodigo))];

    return (
        <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
                Revisa el resumen. Al generar, el XML se descarga automáticamente cuando esté listo.
            </Typography>
            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
                        gap: 2
                    }}
                >
                    <SummaryItem label="Guía" value={madre.docNumGuia} />
                    <SummaryItem label="Fecha de embarque" value={formatDate(config.fechaEmbarque)} />
                    <SummaryItem label="Uso previsto" value={usoPrevistoLabel(config.codigoUsoPrevisto)} />
                    <SummaryItem
                        label="Destino"
                        value={destino ? puertoLabel(destino) : config.codigoPuertoDestino}
                        wide
                    />
                    <SummaryItem label="Productos" value={formatNumber(productCount)} />
                    <SummaryItem label="Total cajas" value={formatNumber(totals.cajas)} />
                    <SummaryItem label="Total stems" value={formatNumber(totals.stems)} />
                    <SummaryItem label="Consignatario" value={config.nombreConsignatario} wide />
                </Box>
            </Paper>
            {sinRuc.length > 0 && (
                <Alert severity="warning">
                    {sinRuc.length === 1 ? 'El producto' : 'Los productos'} {sinRuc.join(', ')} no{' '}
                    {sinRuc.length === 1 ? 'tiene' : 'tienen'} RUC de plantación en Access. Agrocalidad lo exige, así que la
                    generación va a fallar hasta corregirlo.
                </Alert>
            )}
        </Stack>
    );
};
