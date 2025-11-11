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
import { useAerolineasMasterData } from '../../hooks/aerolineas/useAerolineasMasterData';
import { MasterDataTable } from '../common/MasterDataTable';
import { MasterDataForm } from '../common/MasterDataForm';
import { RutasManager } from './RutasManager';
import { ConceptosCostoManager } from './ConceptosCostoManager';
import { MasterDataEntity, MasterDataConfig, MasterDataFormField } from '../../types/master-data.types';

interface AerolineasMasterDataPageProps {
  config: MasterDataConfig;
}

export function AerolineasMasterDataPage({ config }: AerolineasMasterDataPageProps) {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | undefined>();
  const [transformedInitialData, setTransformedInitialData] = useState<any | undefined>();
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
    transformDataForForm,
  } = useAerolineasMasterData(config.apiEndpoint, {
    search: debouncedSearch,
  });

  // Custom field renderers for aerolineas-specific fields
  const customFieldRenderers = {
    rutas: (field: MasterDataFormField, value: any, onChange: (value: any) => void, error?: string) => (
      <Box key={field.name} sx={{ mt: 2, mb: 2 }}>
        <RutasManager
          rutas={value || []}
          onChange={onChange}
          isCreating={!editingItem}
          currentAerolineaId={editingItem?.id}
        />
      </Box>
    ),
    conceptos: (field: MasterDataFormField, value: any, onChange: (value: any) => void, error?: string) => (
      <Box key={field.name} sx={{ mt: 2, mb: 2 }}>
        <ConceptosCostoManager
          conceptos={value || []}
          onChange={onChange}
        />
      </Box>
    ),
  };

  // Transform initial data when editing item changes
  useEffect(() => {
    if (editingItem) {
      setTransformedInitialData(transformDataForForm(editingItem));
    } else {
      setTransformedInitialData(undefined);
    }
  }, [editingItem, transformDataForForm]);

  const handleCreate = () => {
    setEditingItem(undefined);
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
    if (window.confirm(`¿Estás seguro de que quieres eliminar esta aerolínea?`)) {
      try {
        await remove(id);
        setSnackbar({
          open: true,
          message: 'Aerolínea eliminada exitosamente',
          severity: 'success',
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Error al eliminar aerolínea',
          severity: 'error',
        });
      }
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (editingItem) {
        await update(editingItem.id, formData);
        setSnackbar({
          open: true,
          message: 'Aerolínea actualizada exitosamente',
          severity: 'success',
        });
      } else {
        await create(formData);
        setPage(0); // Reset to first page to show newly created item
        setSnackbar({
          open: true,
          message: 'Aerolínea creada exitosamente',
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al guardar aerolínea',
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
          Nueva {config.entityName}
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
        customFieldRenderers={customFieldRenderers}
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