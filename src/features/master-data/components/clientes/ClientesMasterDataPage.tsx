'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Button,
    Typography,
    Alert,
    Snackbar,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useClientesMasterData } from '../../hooks/clientes/useClientesMasterData';
import { MasterDataTable } from '../common/MasterDataTable';
import { MasterDataForm } from '../common/MasterDataForm';
import { MasterDataConfig, MasterDataEntity } from '../../types/master-data.types';

interface ClientesMasterDataPageProps {
    config: MasterDataConfig;
}

export function ClientesMasterDataPage({ config }: ClientesMasterDataPageProps) {
    const [searchValue, setSearchValue] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MasterDataEntity | undefined>();
    const [viewMode, setViewMode] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const {
        data,
        total,
        page,
        setPage,
        loading,
        create,
        update,
        remove,
    } = useClientesMasterData(config.apiEndpoint);

    // Transform initial data when editing item changes
    const transformedInitialData = useMemo(() => {
        if (editingItem) {
            return editingItem as Record<string, unknown>;
        }
        return undefined;
    }, [editingItem]);

    const handleCreate = () => {
        setEditingItem(undefined);
        setViewMode(false);
        setFormOpen(true);
    };

    const handleView = (item: MasterDataEntity) => {
        setEditingItem(item);
        setViewMode(true);
        setFormOpen(true);
    };

    const handleEdit = (item: MasterDataEntity) => {
        setEditingItem(item);
        setViewMode(false);
        setFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar este cliente?`)) {
            try {
                await remove(id);
                setSnackbar({
                    open: true,
                    message: 'Cliente eliminado exitosamente',
                    severity: 'success',
                });
            } catch {
                setSnackbar({
                    open: true,
                    message: 'Error al eliminar cliente',
                    severity: 'error',
                });
            }
        }
    };

    const handleFormSubmit = async (formData: Partial<MasterDataEntity>) => {
        try {
            if (editingItem) {
                await update(editingItem.id, formData);
                setSnackbar({
                    open: true,
                    message: 'Cliente actualizado exitosamente',
                    severity: 'success',
                });
            } else {
                await create(formData as Omit<any, 'id'>);
                setPage(0); // Reset to first page when creating new item
                setSnackbar({
                    open: true,
                    message: 'Cliente creado exitosamente',
                    severity: 'success',
                });
            }
        } catch {
            setSnackbar({
                open: true,
                message: 'Error al guardar cliente',
                severity: 'error',
            });
            throw new Error('Error al guardar cliente');
        }
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setEditingItem(undefined);
        setViewMode(false);
    };

    const handleSnackbarClose = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gestión de {config.entityNamePlural}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                >
                    Nuevo {config.entityName}
                </Button>
            </Box>

            <MasterDataTable
                config={config}
                data={data}
                total={total}
                page={page}
                pageSize={10}
                onPageChange={setPage}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                loading={loading}
            />

            {config && (
                <MasterDataForm
                    open={formOpen}
                    onClose={handleFormClose}
                    onSubmit={handleFormSubmit}
                    config={config}
                    initialData={transformedInitialData}
                    title={
                        viewMode
                            ? `Ver ${config.entityName}`
                            : editingItem
                            ? `Editar ${config.entityName}`
                            : `Crear ${config.entityName}`
                    }
                    loading={loading}
                    readOnly={viewMode}
                />
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}