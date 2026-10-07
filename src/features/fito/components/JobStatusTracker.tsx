import React from 'react';
import { Box, LinearProgress, Typography, Alert, Button } from '@mui/material';
import { useFitoJob } from '../hooks/useFito';
import { getErrorMessage } from '../../../shared/utils/errors';
import { formatDateTime } from '../../../shared/utils/format';

interface JobStatusTrackerProps {
    jobId: string;
    onReset: () => void;
}

export const JobStatusTracker: React.FC<JobStatusTrackerProps> = ({ jobId, onReset }) => {
    const { job, isError } = useFitoJob(jobId);

    if (isError) {
        return <Alert severity="error">{getErrorMessage(isError, 'No se pudo consultar el estado de la generación.')}</Alert>;
    }
    if (!job) return <LinearProgress />;

    const progress = job.totalCount > 0 ? (job.processedCount / job.totalCount) * 100 : 0;

    return (
        <Box sx={{ width: '100%', mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
                Estado: {job.status.toUpperCase()} ({job.processedCount}/{job.totalCount})
            </Typography>
            {job.createdAt && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Iniciado: {formatDateTime(job.createdAt)}
                </Typography>
            )}
            <LinearProgress variant="determinate" value={progress} />

            {job.status === 'completed' && (
                <Box mt={2}>
                    <Alert severity="success">Generación completada.</Alert>
                    {/* Download link logic could go here or in parent */}
                    <Button variant="outlined" onClick={onReset} sx={{ mt: 1 }}>
                        Generar Nuevo
                    </Button>
                </Box>
            )}

            {job.status === 'failed' && (
                <Box mt={2}>
                    <Alert severity="error">Proceso fallido: {job.error || 'error desconocido.'}</Alert>
                    <Button variant="outlined" onClick={onReset} sx={{ mt: 1 }}>
                        Intentar de Nuevo
                    </Button>
                </Box>
            )}
        </Box>
    );
};
