'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useProductosMasterData } from '../../hooks/productos/useProductosMasterData';
import { MasterDataTable } from '../common/MasterDataTable';
import { MasterDataForm } from '../common/MasterDataForm';
import { ProductosArancelesManager } from './managers/ProductosArancelesManager';
import { ProductosCompuestosManager } from './managers/ProductosCompuestosManager';
import { ProductosMiProManager } from './managers/ProductosMiProManager';
import { MasterDataConfig, Producto, MasterDataFormField } from '../../types/master-data.types';

interface ProductosMasterDataPageProps {
  config: MasterDataConfig;
}

export function ProductosMasterDataPage({ config }: ProductosMasterDataPageProps) {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Producto | undefined>();
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
    medidas,
  } = useProductosMasterData<Producto>(config.apiEndpoint, {
    search: debouncedSearch,
  });

  // Create dynamic config with FK options
  const dynamicConfig = useMemo(() => ({
    ...config,
    fields: config.fields.map(field => {
      if (field.name === 'medidaId') {
        return { ...field, type: 'select' as const, options: medidas };
      }
      return field;
    }),
    tableColumns: config.tableColumns.map(column => {
      if (column.key === 'medidaId') {
        return {
          ...column,
          render: (value: any, row: any) => {
            const medida = medidas.find(m => m.value === value);
            return medida ? medida.label : 'Sin medida';
          }
        };
      }
      if (column.key === 'opcionId') {
        return {
          ...column,
          render: (value: any, row: any) => {
            return value === 'simple' ? 'Simple' : value === 'compuesto' ? 'Compuesto' : value || 'Sin opción';
          }
        };
      }
      return column;
    }),
  }), [config, medidas]);

  // Custom field renderers for productos-specific fields
  const customFieldRenderers: Record<string, (field: MasterDataFormField, value: unknown, onChange: (value: unknown) => void) => React.ReactElement> = {
    productosAranceles: (field: MasterDataFormField, value: unknown, onChange: (value: unknown) => void) => (
      <Box key={field.name} sx={{ mt: 2, mb: 2 }}>
        <ProductosArancelesManager
          aranceles={(value as Array<Record<string, unknown>>) || []}
          onChange={onChange}
        />
      </Box>
    ),
    productosCompuestos: (field: MasterDataFormField, value: unknown, onChange: (value: unknown) => void) => (
      <Box key={field.name} sx={{ mt: 2, mb: 2 }}>
        <ProductosCompuestosManager
          compuestos={(value as Array<Record<string, unknown>>) || []}
          onChange={onChange}
        />
      </Box>
    ),
    productosMiPros: (field: MasterDataFormField, value: unknown, onChange: (value: unknown) => void) => (
      <Box key={field.name} sx={{ mt: 2, mb: 2 }}>
        <ProductosMiProManager
          miPros={(value as Array<Record<string, unknown>>) || []}
          onChange={onChange}
        />
      </Box>
    ),
  };

  // Transform initial data when editing item changes
  const transformedInitialData = useMemo(() => {
    if (editingItem) {
      return transformDataForForm(editingItem as Record<string, unknown>);
    }
    return undefined;
  }, [editingItem, transformDataForForm]);

  const handleCreate = () => {
    setEditingItem(undefined);
    setViewMode(false);
    setFormOpen(true);
  };

  const handleView = (item: Producto) => {
    setEditingItem(item);
    setViewMode(true);
    setFormOpen(true);
  };

  const handleEdit = (item: Producto) => {
    setEditingItem(item);
    setViewMode(false);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar este producto?`)) {
      try {
        await remove(id);
        setSnackbar({
          open: true,
          message: 'Producto eliminado exitosamente',
          severity: 'success',
        });
      } catch {
        setSnackbar({
          open: true,
          message: 'Error al eliminar producto',
          severity: 'error',
        });
      }
    }
  };

  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    try {
      // Filter out system fields that shouldn't be sent to the API
      const { id, createdAt, updatedAt, ...filteredData } = formData;

      if (editingItem) {
        await update(editingItem.id, filteredData);
        setSnackbar({
          open: true,
          message: 'Producto actualizado exitosamente',
          severity: 'success',
        });
      } else {
        await create(filteredData as Omit<Producto, 'id'>);
        setPage(0); // Reset to first page when creating new item
        setSnackbar({
          open: true,
          message: 'Producto creado exitosamente',
          severity: 'success',
        });
      }
    } catch {
      setSnackbar({
        open: true,
        message: 'Error al guardar producto',
        severity: 'error',
      });
      throw new Error('Error al guardar producto');
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
        initialData={transformedInitialData}
        title={
          viewMode
            ? `Ver ${config.entityName}`
            : editingItem
            ? `Editar ${config.entityName}`
            : `Crear ${config.entityName}`
        }
        loading={loading}
        customFieldRenderers={customFieldRenderers}
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