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
import { useTipoEmbalajeMasterData } from '../../hooks/tipo-embalaje/useTipoEmbalajeMasterData';
import { MasterDataTable } from '../common/MasterDataTable';
import { MasterDataForm } from '../common/MasterDataForm';
import { MasterDataConfig } from '../../types/master-data.types';
import { TipoEmbalaje } from '../../types/tipo-embalaje.types';

interface TipoEmbalajeMasterDataPageProps {
  config: MasterDataConfig;
}

export function TipoEmbalajeMasterDataPage({ config }: TipoEmbalajeMasterDataPageProps) {
  const [searchValue, setSearchValue] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TipoEmbalaje | undefined>();
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
  } = useTipoEmbalajeMasterData(config.apiEndpoint);

  const handleCreate = () => {
    setEditingItem(undefined);
    setViewMode(false);
    setFormOpen(true);
  };

  const handleView = (item: TipoEmbalaje) => {
    setEditingItem(item);
    setViewMode(true);
    setFormOpen(true);
  };

  const handleEdit = (item: TipoEmbalaje) => {
    setEditingItem(item);
    setViewMode(false);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar este tipo de embalaje?`)) {
      try {
        await remove(id);
        setSnackbar({
          open: true,
          message: 'Tipo de embalaje eliminado exitosamente',
          severity: 'success',
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Error al eliminar tipo de embalaje',
          severity: 'error',
        });
      }
    }
  };

    const handleFormSubmit = async (formData: Partial<TipoEmbalaje>) => {
        try {
            if (editingItem) {
                await update(editingItem.id!, formData);
                setSnackbar({
                    open: true,
                    message: 'Tipo de embalaje actualizado exitosamente',
                    severity: 'success',
                });
            } else {
                await create(formData as Omit<TipoEmbalaje, 'id'>);
                setPage(0); // Reset to first page when creating new item
                setSnackbar({
                    open: true,
                    message: 'Tipo de embalaje creado exitosamente',
                    severity: 'success',
                });
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Error al guardar tipo de embalaje',
                severity: 'error',
            });
            throw error; // Re-throw to prevent form from closing
        }
    };  const handleFormClose = () => {
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

      <MasterDataForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        config={config}
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