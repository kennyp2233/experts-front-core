import React, { useState, useEffect, useRef } from 'react';
import {
    Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Paper,
    Snackbar, Stack, Tab, Tabs, Typography
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Description as GuiaIcon,
    Download as DownloadIcon,
    Error as ErrorIcon,
    FolderOpen as CatalogIcon,
    LockOutlined as LockIcon
} from '@mui/icons-material';
import { AppPage } from '../../../shared/components/ui/AppPage';
import { getErrorMessage } from '../../../shared/utils/errors';
import { logger } from '../../../shared/utils/logger';
import { useAuth } from '../../auth/hooks/useAuth.hook';
import { FitoGuideTable } from './FitoGuideTable';
import { CatalogManager } from './CatalogManager';
import { fitoService } from '../services/fito.service';
import { FitoXmlConfig, FitoJob, ProductMapping, GuiaHijaAgregada } from '../types/fito.types';

const log = logger.createChild('FITO');

const PAGE_TITLE = 'Certificados FITO';
const PAGE_SUBTITLE = 'Genera el XML del certificado fitosanitario para Agrocalidad a partir de una guía madre.';

const JOB_STATUS_LABEL: Record<FitoJob['status'], string> = {
    pending: 'En cola',
    processing: 'Procesando',
    completed: 'Completado',
    failed: 'Error'
};

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2.5 }}>
        {value === index && children}
    </Box>
);

/** Sección solo para administradores (el back también lo exige en /fito y /catalogs). */
export const FitoPage: React.FC = () => {
    const { user } = useAuth();

    if (user?.role !== 'ADMIN') {
        return (
            <AppPage title={PAGE_TITLE}>
                <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
                    <LockIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
                        No tienes permisos para esta sección
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        La generación de certificados FITO está disponible solo para administradores.
                        Si necesitas acceso, pídeselo a un administrador.
                    </Typography>
                </Paper>
            </AppPage>
        );
    }

    return <FitoWorkspace />;
};

const FitoWorkspace: React.FC = () => {
    const [tab, setTab] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    // Job tracking state
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<FitoJob | null>(null);
    const [progressDialogOpen, setProgressDialogOpen] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    const pollJobStatus = async (jobId: string) => {
        try {
            const status = await fitoService.getJobStatus(jobId);
            setJobStatus(status);

            if (status?.status === 'completed' || status?.status === 'failed') {
                stopPolling();
                setGenerating(false);

                if (status.status === 'completed') {
                    setMessage({ type: 'success', text: '¡Generación completada! El archivo XML está listo.' });
                    // Auto-download when completed
                    void downloadJob(jobId);
                } else {
                    setMessage({ type: 'error', text: 'La generación falló. Revisa el detalle en la ventana de progreso.' });
                }
            }
        } catch (error) {
            log.error('Error consultando el estado de la generación', error);
        }
    };

    const handleGenerate = async (docNumero: number, config: FitoXmlConfig, productMappings: ProductMapping[], guiasHijas: GuiaHijaAgregada[]) => {
        setGenerating(true);
        setJobStatus(null);

        try {
            const result = await fitoService.generate({ guias: [docNumero], config, productMappings, guiasHijas });
            setCurrentJobId(result.jobId);
            setProgressDialogOpen(true);
            setMessage({ type: 'info', text: 'Generación iniciada…' });

            // Start polling
            stopPolling();
            pollJobStatus(result.jobId);
            pollingRef.current = setInterval(() => pollJobStatus(result.jobId), 2000);
        } catch (error) {
            log.error('Error al generar el XML', error);
            setMessage({ type: 'error', text: getErrorMessage(error, 'No se pudo generar el archivo FITO.') });
            setGenerating(false);
        }
    };

    const downloadJob = async (jobId: string) => {
        try {
            const count = await fitoService.downloadXmls(jobId);
            if (count === 0) {
                setMessage({ type: 'error', text: 'No se encontró el XML generado para descargar.' });
            }
        } catch (error) {
            log.error('Error descargando el XML', error);
            setMessage({ type: 'error', text: getErrorMessage(error, 'No se pudo descargar el archivo XML.') });
        }
    };

    const handleDownload = () => {
        if (currentJobId) void downloadJob(currentJobId);
    };

    const handleCloseProgress = () => {
        setProgressDialogOpen(false);
        stopPolling();
        // Si se cierra antes de terminar, no dejar el botón "Generar" bloqueado.
        setGenerating(false);
    };

    const progress = jobStatus && jobStatus.totalCount > 0 ? (jobStatus.processedCount / jobStatus.totalCount) * 100 : 0;

    return (
        <AppPage title={PAGE_TITLE} subtitle={PAGE_SUBTITLE}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Secciones de certificados FITO">
                    <Tab icon={<GuiaIcon fontSize="small" />} iconPosition="start" label="Generación" sx={{ minHeight: 48 }} />
                    <Tab icon={<CatalogIcon fontSize="small" />} iconPosition="start" label="Catálogos" sx={{ minHeight: 48 }} />
                </Tabs>
            </Box>

            <TabPanel value={tab} index={0}>
                <FitoGuideTable onGenerate={handleGenerate} disabled={generating} />
            </TabPanel>

            <TabPanel value={tab} index={1}>
                <CatalogManager />
            </TabPanel>

            {/* Progress Dialog */}
            <Dialog open={progressDialogOpen} maxWidth="sm" fullWidth>
                <DialogTitle>Generando archivo FITO</DialogTitle>
                <DialogContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        {jobStatus?.status === 'completed' ? (
                            <Chip icon={<CheckIcon />} label={JOB_STATUS_LABEL.completed} color="success" />
                        ) : jobStatus?.status === 'failed' ? (
                            <Chip icon={<ErrorIcon />} label={JOB_STATUS_LABEL.failed} color="error" />
                        ) : (
                            <Chip label={jobStatus ? JOB_STATUS_LABEL[jobStatus.status] ?? jobStatus.status : 'Iniciando…'} color="info" variant="outlined" />
                        )}
                    </Stack>

                    <LinearProgress
                        variant={jobStatus ? 'determinate' : 'indeterminate'}
                        value={progress}
                        sx={{ mb: 1 }}
                    />

                    <Typography variant="body2" color="text.secondary">
                        {jobStatus ? `${jobStatus.processedCount} de ${jobStatus.totalCount} procesados` : 'Iniciando…'}
                    </Typography>

                    {jobStatus?.error && (
                        <Alert severity="error" sx={{ mt: 2 }}>{jobStatus.error}</Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseProgress} color="inherit">Cerrar</Button>
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
        </AppPage>
    );
};
