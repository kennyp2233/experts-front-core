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
import { useMasterData } from '../../hooks/common/useMasterData';
import { MasterDataTable } from './MasterDataTable';
import { MasterDataForm } from './MasterDataForm';
import { MasterDataEntity, MasterDataConfig } from '../../types/master-data.types';

interface MasterDataPageProps<T extends MasterDataEntity> {
  config: MasterDataConfig;
}

export function MasterDataPage<T extends MasterDataEntity>({ config }: MasterDataPageProps<T>) {
  const [searchValue, setSearchValue] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | undefined>();
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
  } = useMasterData<T>(config.apiEndpoint, {
    pageSize: 10,
    search: searchValue,
    sortField: config.defaultSort?.field,
    sortOrder: config.defaultSort?.order,
  });

  const handleCreate = () => {
    setEditingItem(undefined);
    setFormOpen(true);
  };

  const handleEdit = (item: T) => {
    setEditingItem(item);
    setViewMode(false);
    setFormOpen(true);
  };

  const handleView = (item: T) => {
    setEditingItem(item);
    setViewMode(true);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar este ${config.entityName.toLowerCase()}?`)) {
      try {
        await remove(id);
        setSnackbar({
          open: true,
          message: `${config.entityName} eliminado exitosamente`,
          severity: 'success',
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error al eliminar ${config.entityName.toLowerCase()}`,
          severity: 'error',
        });
      }
    }
  };

  const handleFormSubmit = async (formData: Partial<T>) => {
    try {
      if (editingItem) {
        await update(editingItem.id, formData);
        setSnackbar({
          open: true,
          message: `${config.entityName} actualizado exitosamente`,
          severity: 'success',
        });
      } else {
        await create(formData);
        setPage(0); // Reset to first page to show newly created item
        setSnackbar({
          open: true,
          message: `${config.entityName} creado exitosamente`,
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error al guardar ${config.entityName.toLowerCase()}`,
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