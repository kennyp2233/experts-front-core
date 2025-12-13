import React, { useState, useEffect, useRef } from 'react';
import { Box, Tabs, Tab, Paper, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, LinearProgress, Typography, Chip } from '@mui/material';
import { Description as GuiaIcon, FolderOpen as CatalogIcon, Download as DownloadIcon, CheckCircle as CheckIcon, Error as ErrorIcon } from '@mui/icons-material';
import { FitoGuideTable } from './FitoGuideTable';
import { CatalogManager } from './CatalogManager';
import { fitoService } from '../services/fito.service';
import { FitoXmlConfig, FitoJob, ProductMapping, GuiaHijaAgregada } from '../types/fito.types';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2 }}>
        {value === index && children}
    </Box>
);

export const FitoPage: React.FC = () => {
    const [tab, setTab] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    // Job tracking state
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<FitoJob | null>(null);
    const [progressDialogOpen, setProgressDialogOpen] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const pollJobStatus = async (jobId: string) => {
        try {
            const status = await fitoService.getJobStatus(jobId);
            setJobStatus(status);

            if (status?.status === 'completed' || status?.status === 'failed') {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
                setGenerating(false);

                if (status.status === 'completed') {
                    setMessage({ type: 'success', text: '¡Generación completada! El archivo XML está listo.' });
                    // Auto-download when completed
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                    window.open(`${baseUrl}/api/v1/fito/download/${jobId}`, '_blank');
                } else {
                    setMessage({ type: 'error', text: 'La generación falló. Revise los detalles.' });
                }
            }
        } catch (error) {
            console.error('Error polling job status:', error);
        }
    };

    const handleGenerate = async (docNumero: number, config: FitoXmlConfig, productMappings: ProductMapping[], guiasHijas: GuiaHijaAgregada[]) => {
        setGenerating(true);
        setJobStatus(null);

        try {
            const result = await fitoService.generate({ guias: [docNumero], config, productMappings, guiasHijas });
            setCurrentJobId(result.jobId);
            setProgressDialogOpen(true);
            setMessage({ type: 'info', text: 'Generación iniciada...' });

            // Start polling
            pollJobStatus(result.jobId);
            pollingRef.current = setInterval(() => pollJobStatus(result.jobId), 2000);

        } catch (error: any) {
            console.error('Error generating XML:', error);
            setMessage({ type: 'error', text: error.message || 'Error al generar el archivo FITO' });
            setGenerating(false);
        }
    };

    const handleDownload = () => {
        if (currentJobId) {
            // Open download URL in new tab
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            window.open(`${baseUrl}/api/v1/fito/download/${currentJobId}`, '_blank');
        }
    };

    const handleCloseProgress = () => {
        setProgressDialogOpen(false);
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    const progress = jobStatus ? (jobStatus.processedCount / jobStatus.totalCount) * 100 : 0;

    return (
        <Box>
            <Paper variant="outlined" sx={{ mb: 2 }}>
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="fullWidth"
                    sx={{
                        '& .MuiTab-root': {
                            minWidth: { xs: 0, sm: 160 },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            px: { xs: 1, sm: 2 },
                        }
                    }}
                >
                    <Tab icon={<GuiaIcon />} iconPosition="start" label="Generación de Guías" />
                    <Tab icon={<CatalogIcon />} iconPosition="start" label="Catálogos" />
                </Tabs>
            </Paper>

            <TabPanel value={tab} index={0}>
                <FitoGuideTable onGenerate={handleGenerate} disabled={generating} />
            </TabPanel>

            <TabPanel value={tab} index={1}>
                <CatalogManager />
            </TabPanel>

            {/* Progress Dialog */}
            <Dialog open={progressDialogOpen} maxWidth="sm" fullWidth>
                <DialogTitle>Generando Archivo FITO</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 2 }}>
                        {jobStatus?.status === 'completed' ? (
                            <Chip icon={<CheckIcon />} label="Completado" color="success" />
                        ) : jobStatus?.status === 'failed' ? (
                            <Chip icon={<ErrorIcon />} label="Error" color="error" />
                        ) : (
                            <Chip label={jobStatus?.status || 'Iniciando...'} color="info" variant="outlined" />
                        )}
                    </Box>

                    <LinearProgress
                        variant={jobStatus ? 'determinate' : 'indeterminate'}
                        value={progress}
                        sx={{ mb: 1 }}
                    />

                    <Typography variant="body2" color="text.secondary">
                        {jobStatus ? `${jobStatus.processedCount} de ${jobStatus.totalCount} procesados` : 'Iniciando...'}
                    </Typography>

                    {jobStatus?.error && (
                        <Alert severity="error" sx={{ mt: 2 }}>{jobStatus.error}</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseProgress}>Cerrar</Button>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                        disabled={jobStatus?.status !== 'completed'}
                    >
                        Descargar XML
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!message} autoHideDuration={6000} onClose={() => setMessage(null)}>
                <Alert severity={message?.type || 'info'} onClose={() => setMessage(null)}>
                    {message?.text}
                </Alert>
            </Snackbar>
        </Box>
    );
};
