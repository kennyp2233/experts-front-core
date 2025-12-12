import React, { useState, useRef } from 'react';
import {
    Box, Paper, Typography, Button, Card, CardContent, CardActions,
    CircularProgress, Alert, Chip, LinearProgress, Divider, Table,
    TableBody, TableCell, TableHead, TableRow, TableContainer
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Public as WorldIcon,
    Inventory as ProductIcon,
    Flight as FlightIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import useSWR from 'swr';
import api from '../../../shared/services/api';

type CatalogType = 'productos' | 'puertos_internacional' | 'puertos_ecuador';

interface CatalogStats {
    valid: boolean;
    productos: { total: number; recientes: any[] };
    puertos: { total: number; ecuador: number; internacional: number; recientes: any[] };
}

interface CatalogCardProps {
    title: string;
    icon: React.ReactNode;
    catalogType: CatalogType;
    description: string;
    onUploadSuccess: () => void;
}

const CatalogCard: React.FC<CatalogCardProps> = ({ title, icon, catalogType, description, onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; loaded?: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('catalog', catalogType);

            const response = await api.post<{ loaded: number }>('/catalogs/reload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 180000
            });

            setResult({ success: true, message: `Cargados ${response.data.loaded || 0} registros`, loaded: response.data.loaded });
            onUploadSuccess();
        } catch (error: any) {
            setResult({ success: false, message: error.response?.data?.message || error.message || 'Error al cargar' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <Card variant="outlined" sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: { xs: '100%', sm: 220 } }}>
            <CardContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {icon}
                    <Typography variant="subtitle2" fontWeight={600}>{title}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                    {description}
                </Typography>
                {uploading && <LinearProgress sx={{ mt: 1 }} />}
                {result && (
                    <Alert severity={result.success ? 'success' : 'error'} sx={{ mt: 1, py: 0 }}>
                        {result.message}
                    </Alert>
                )}
            </CardContent>
            <CardActions sx={{ pt: 0 }}>
                <input type="file" accept=".xlsx,.xls" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={uploading ? <CircularProgress size={14} /> : <UploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? 'Subiendo...' : 'Subir'}
                </Button>
            </CardActions>
        </Card>
    );
};

const StatsPanel: React.FC<{ stats: CatalogStats | undefined; isLoading: boolean }> = ({ stats, isLoading }) => {
    if (isLoading) return <CircularProgress size={24} />;
    if (!stats) return <Typography color="text.secondary">Sin datos</Typography>;

    return (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' } }}>
            <Paper variant="outlined" sx={{ p: 2, flex: { xs: '1 1 100%', sm: 1 }, minWidth: { xs: '100%', sm: 200 } }}>
                <Typography variant="subtitle2" color="text.secondary">Productos</Typography>
                <Typography variant="h4" fontWeight={700} color="primary.main">{stats.productos.total.toLocaleString()}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, flex: { xs: '1 1 100%', sm: 1 }, minWidth: { xs: '100%', sm: 200 } }}>
                <Typography variant="subtitle2" color="text.secondary">Puertos Internacionales</Typography>
                <Typography variant="h4" fontWeight={700} color="secondary.main">{stats.puertos.internacional.toLocaleString()}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, flex: { xs: '1 1 100%', sm: 1 }, minWidth: { xs: '100%', sm: 200 } }}>
                <Typography variant="subtitle2" color="text.secondary">Puertos Ecuador</Typography>
                <Typography variant="h4" fontWeight={700} color="success.main">{stats.puertos.ecuador.toLocaleString()}</Typography>
            </Paper>
        </Box>
    );
};

export const CatalogManager: React.FC = () => {
    const { data: stats, isLoading, mutate } = useSWR<CatalogStats>('/catalogs/stats',
        () => api.get<CatalogStats>('/catalogs/stats').then(r => r.data)
    );

    const handleUploadSuccess = () => mutate();

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>Gestión de Catálogos</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Suba archivos Excel para actualizar los catálogos
                    </Typography>
                </Box>
                <Button size="small" startIcon={<RefreshIcon />} onClick={() => mutate()}>
                    Actualizar
                </Button>
            </Box>

            <StatsPanel stats={stats} isLoading={isLoading} />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Subir Catálogos</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' } }}>
                <CatalogCard
                    title="Productos"
                    icon={<ProductIcon color="primary" fontSize="small" />}
                    catalogType="productos"
                    description="CatalogoDeProductos"
                    onUploadSuccess={handleUploadSuccess}
                />
                <CatalogCard
                    title="Puertos INT"
                    icon={<WorldIcon color="secondary" fontSize="small" />}
                    catalogType="puertos_internacional"
                    description="CatalogoDePuertospaises"
                    onUploadSuccess={handleUploadSuccess}
                />
                <CatalogCard
                    title="Puertos EC"
                    icon={<FlightIcon color="success" fontSize="small" />}
                    catalogType="puertos_ecuador"
                    description="CatalogoDePuertosEcuador"
                    onUploadSuccess={handleUploadSuccess}
                />
            </Box>
        </Box>
    );
};

