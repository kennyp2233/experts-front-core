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
import { useDestinoMasterData } from '../../hooks/destino/useDestinoMasterData';
import { MasterDataTable } from '../common/MasterDataTable';
import { MasterDataForm } from '../common/MasterDataForm';
import { MasterDataConfig } from '../../types/master-data.types';

interface DestinoMasterDataPageProps {
  config: MasterDataConfig;
}

export function DestinoMasterDataPage({ config }: DestinoMasterDataPageProps) {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Reset page when search changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | undefined>();
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
    paises,
  } = useDestinoMasterData(config.apiEndpoint, {
    search: debouncedSearch,
    sortField: config.defaultSort?.field,
    sortOrder: config.defaultSort?.order,
  });

  // Create dynamic config with FK options
  const dynamicConfig = {
    ...config,
    fields: config.fields.map(field => {
      if (field.name === 'idPais') {
        return { ...field, options: paises };
      }
      return field;
    }),
  };

  const handleCreate = () => {
    setEditingItem(undefined);
    setViewMode(false);
    setFormOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setViewMode(false);
    setFormOpen(true);
  };

  const handleView = (item: any) => {
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

  const handleFormSubmit = async (formData: Partial<any>) => {
    try {
      // Filter formData to only include fields defined in config, excluding the ID field
      const idField = config.idField || 'id';
      const filteredData = config.fields.reduce((acc, field) => {
        if (field.name in formData && field.name !== idField) {
          (acc as any)[field.name] = (formData as any)[field.name];
        }
        return acc;
      }, {} as Partial<any>);

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