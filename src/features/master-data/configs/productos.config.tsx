import React from 'react';
import { Box } from '@mui/material';
import { MasterDataConfig, MasterDataFormField } from '../types/master-data.types';
import { useProductosMasterData } from '../hooks/productos/useProductosMasterData';
import { ProductosArancelesManager } from '../components/productos/managers/ProductosArancelesManager';
import { ProductosCompuestosManager } from '../components/productos/managers/ProductosCompuestosManager';
import { ProductosMiProManager } from '../components/productos/managers/ProductosMiProManager';

export const productosConfig: MasterDataConfig = {
  entityName: 'Producto',
  entityNamePlural: 'Productos',
  apiEndpoint: '/master-data/productos',
  useCustomHook: useProductosMasterData,
  customFieldRenderers: {
    productosAranceles: (field: MasterDataFormField, value: unknown, onChange: (value: unknown) => void, error?: string, formData?: Record<string, unknown>, readOnly?: boolean) => (
      <Box key={field.name} sx={{ mt: 2, mb: 2 }}>
        <ProductosArancelesManager
          aranceles={(value as Array<Record<string, unknown>>) || []}
          onChange={onChange}
          readOnly={readOnly}
        />
      </Box>
    ),
    productosCompuestos: (field: MasterDataFormField, value: unknown, onChange: (value: unknown) => void, error?: string, formData?: Record<string, unknown>, readOnly?: boolean) => (
      <Box key={field.name} sx={{ mt: 2, mb: 2 }}>
        <ProductosCompuestosManager
          compuestos={(value as Array<Record<string, unknown>>) || []}
          onChange={onChange}
          readOnly={readOnly}
        />
      </Box>
    ),
    productosMiPros: (field: MasterDataFormField, value: unknown, onChange: (value: unknown) => void, error?: string, formData?: Record<string, unknown>, readOnly?: boolean) => (
      <Box key={field.name} sx={{ mt: 2, mb: 2 }}>
        <ProductosMiProManager
          miPros={(value as Array<Record<string, unknown>>) || []}
          onChange={onChange}
          readOnly={readOnly}
        />
      </Box>
    ),
  },
  tabs: [
    { key: 'Información General', label: 'Información General', order: 1 },
    { key: 'Configuración', label: 'Configuración', order: 2 },
    { key: 'Aranceles', label: 'Aranceles', order: 3 },
    { key: 'Compuestos', label: 'Compuestos', order: 4 },
    { key: 'MiPro', label: 'MiPro', order: 5 },
  ],
  fields: [
    // Información General
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      tab: 'Información General',
      validation: {
        custom: (value) => {
          if (value && value.length < 2) {
            return 'El nombre debe tener al menos 2 caracteres';
          }
          return null;
        },
      },
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      required: false,
      tab: 'Información General',
    },
    {
      name: 'nombreBotanico',
      label: 'Nombre Botánico',
      type: 'text',
      required: false,
      tab: 'Información General',
    },
    {
      name: 'especie',
      label: 'Especie',
      type: 'text',
      required: false,
      tab: 'Información General',
    },
    {
      name: 'medidaId',
      label: 'Medida',
      type: 'select',
      required: true,
      tab: 'Información General',
      options: [], // Will be populated dynamically
      validation: {
        min: 1,
      },
    },
    {
      name: 'precioUnitario',
      label: 'Precio Unitario',
      type: 'number',
      required: false,
      tab: 'Información General',
      validation: {
        min: 0,
      },
    },
    {
      name: 'stemsPorFull',
      label: 'Stems por Full',
      type: 'number',
      required: false,
      tab: 'Información General',
      validation: {
        min: 0,
      },
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'boolean',
      required: false,
      tab: 'Información General',
    },

    // Configuración
    {
      name: 'opcionId',
      label: 'Opción',
      type: 'select',
      required: false,
      tab: 'Configuración',
      options: [
        { value: 'simple', label: 'Simple' },
        { value: 'compuesto', label: 'Compuesto' },
      ],
    },
    {
      name: 'sesaId',
      label: 'SESA',
      type: 'number',
      required: false,
      tab: 'Configuración',
      validation: {
        min: 1,
      },
    },

    // Arrays complejos
    {
      name: 'productosAranceles',
      label: 'Aranceles',
      type: 'productosAranceles',
      required: false,
      tab: 'Aranceles',
    },
    {
      name: 'productosCompuestos',
      label: 'Productos Compuestos',
      type: 'productosCompuestos',
      required: false,
      tab: 'Compuestos',
    },
    {
      name: 'productosMiPros',
      label: 'MiPro',
      type: 'productosMiPros',
      required: false,
      tab: 'MiPro',
    },
  ],
  tableColumns: [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'especie', label: 'Especie' },
    {
      key: 'medida',
      label: 'Medida',
      render: (value) => (value as { nombre: string })?.nombre || '-'
    },
    { key: 'precioUnitario', label: 'Precio Unitario' },
    { key: 'stemsPorFull', label: 'Stems/Full' },
    { key: 'estado', label: 'Estado' },
  ],
  defaultSort: {
    field: 'createdAt',
    order: 'desc',
  },
};