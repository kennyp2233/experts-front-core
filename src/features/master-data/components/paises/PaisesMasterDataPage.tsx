'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    Alert,
    Snackbar,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { usePaisesMasterData } from '../../hooks/paises/usePaisesMasterData';
import { MasterDataTable } from '../common/MasterDataTable';
import { MasterDataForm } from '../common/MasterDataForm';
import { MasterDataConfig, Pais } from '../../types/master-data.types';

interface PaisesMasterDataPageProps {
    config: MasterDataConfig;
}

export function PaisesMasterDataPage({ config }: PaisesMasterDataPageProps) {
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchValue);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchValue]);
    const [formOpen, setFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Pais | undefined>();
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
        pageSize,
        setPageSize,
        loading,
        create,
        update,
        remove,
        paisesPadre,
        acuerdos,
    } = usePaisesMasterData(config.apiEndpoint, {
        search: debouncedSearch,
    });

    // Create dynamic config with FK options
    const dynamicConfig = {
        ...config,
        fields: config.fields.map(field => {
            if (field.name === 'paisId') {
                return { ...field, type: 'select' as const, options: paisesPadre };
            }
            if (field.name === 'idAcuerdo') {
                return { ...field, type: 'select' as const, options: acuerdos };
            }
            return field;
        }),
    };

    const handleCreate = () => {
        setEditingItem(undefined);
        setViewMode(false);
        setFormOpen(true);
    };

    const handleView = (item: Pais) => {
        setEditingItem(item);
        setViewMode(true);
        setFormOpen(true);
    };

    const handleEdit = (item: Pais) => {
        setEditingItem(item);
        setViewMode(false);
        setFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar este país?`)) {
            try {
                await remove(id);
                setSnackbar({
                    open: true,
                    message: 'País eliminado exitosamente',
                    severity: 'success',
                });
            } catch (error) {
                setSnackbar({
                    open: true,
                    message: 'Error al eliminar país',
                    severity: 'error',
                });
            }
        }
    };

    const handleFormSubmit = async (formData: Partial<Pais>) => {
        try {
            if (editingItem) {
                await update(editingItem.idPais!, formData);
                setSnackbar({
                    open: true,
                    message: 'País actualizado exitosamente',
                    severity: 'success',
                });
            } else {
                await create(formData as Omit<Pais, 'idPais'>);
                setPage(0); // Reset to first page when creating new item
                setSnackbar({
                    open: true,
                    message: 'País creado exitosamente',
                    severity: 'success',
                });
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Error al guardar país',
                severity: 'error',
            });
            throw error; // Re-throw to prevent form from closing
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
                config={dynamicConfig}
                data={data}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                loading={loading}
            />

            <MasterDataForm
                open={formOpen}
                onClose={handleFormClose}
                onSubmit={handleFormSubmit}
                config={dynamicConfig}
                initialData={editingItem}
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