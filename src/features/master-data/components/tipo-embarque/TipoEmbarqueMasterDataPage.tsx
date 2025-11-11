'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useTipoEmbarqueMasterData } from '../../hooks/tipo-embarque/useTipoEmbarqueMasterData';
import { MasterDataTable } from '../common/MasterDataTable';
import { MasterDataForm } from '../common/MasterDataForm';
import { MasterDataConfig } from '../../types/master-data.types';
import { TipoEmbarque } from '../../types/tipo-embarque.types';

interface TipoEmbarqueMasterDataPageProps {
  config: MasterDataConfig;
}

export function TipoEmbarqueMasterDataPage({ config }: TipoEmbarqueMasterDataPageProps) {
  const [searchValue, setSearchValue] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TipoEmbarque | undefined>();
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
    tiposCarga,
    tiposEmbalaje,
  } = useTipoEmbarqueMasterData(config.apiEndpoint);

  // Create dynamic config with FK options
  const dynamicConfig = {
    ...config,
    fields: config.fields.map(field => {
      if (field.name === 'idTipoCarga') {
        return { ...field, type: 'select' as const, options: tiposCarga };
      }
      if (field.name === 'idTipoEmbalaje') {
        return { ...field, type: 'select' as const, options: tiposEmbalaje };
      }
      return field;
    }),
  };

  const handleView = (item: TipoEmbarque) => {
    setEditingItem(item);
    setViewMode(true);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(undefined);
    setViewMode(false);
    setFormOpen(true);
  };

  const handleEdit = (item: TipoEmbarque) => {
    setEditingItem(item);
    setViewMode(false);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar este tipo de embarque?`)) {
      try {
        await remove(id);
        setSnackbar({
          open: true,
          message: 'Tipo de embarque eliminado exitosamente',
          severity: 'success',
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Error al eliminar tipo de embarque',
          severity: 'error',
        });
      }
    }
  };

  const handleFormSubmit = async (formData: Partial<TipoEmbarque>) => {
    try {
      if (editingItem) {
        // Filter out fields that shouldn't be sent to the backend for updates
        const { id, carga, embalaje, ...updateData } = formData;
        await update(editingItem.id!, updateData);
        setSnackbar({
          open: true,
          message: 'Tipo de embarque actualizado exitosamente',
          severity: 'success',
        });
      } else {
        await create(formData as Omit<TipoEmbarque, 'id'>);
        setPage(0); // Reset to first page when creating new item
        setSnackbar({
          open: true,
          message: 'Tipo de embarque creado exitosamente',
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al guardar tipo de embarque',
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
        pageSize={10}
        onPageChange={setPage}
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