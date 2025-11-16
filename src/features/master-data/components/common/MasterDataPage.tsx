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
import { useMasterData } from '../../hooks/common/useMasterData';
import { MasterDataTable } from './MasterDataTable';
import { MasterDataForm } from './MasterDataForm';
import { MasterDataEntity, MasterDataConfig } from '../../types/master-data.types';

interface MasterDataPageProps<T extends MasterDataEntity> {
  config: MasterDataConfig;
}

export function MasterDataPage<T extends MasterDataEntity>({ config }: MasterDataPageProps<T>) {
  // If a custom component is defined, use it instead
  if (config.customComponent) {
    const CustomComponent = config.customComponent;
    return <CustomComponent config={config} />;
  }
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchValue]);
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
    pageSize,
    setPageSize,
    loading,
    create,
    update,
    remove,
  } = useMasterData<T>(config.apiEndpoint, {
    search: debouncedSearch,
    sortField: config.defaultSort?.field,
    sortOrder: config.defaultSort?.order,
    idField: config.idField,
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
      // Filter formData to only include fields defined in config, excluding the ID field
      const idField = config.idField || 'id';
      const filteredData = config.fields.reduce((acc, field) => {
        if (field.name in formData && field.name !== idField) {
          (acc as any)[field.name] = (formData as any)[field.name];
        }
        return acc;
      }, {} as Partial<T>);

      if (editingItem) {
        await update((editingItem as any)[idField], filteredData);
        setSnackbar({
          open: true,
          message: `${config.entityName} actualizado exitosamente`,
          severity: 'success',
        });
      } else {
        await create(filteredData);
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