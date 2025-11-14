import { MasterDataConfig } from '../types/master-data.types';

export const subAgenciaConfig: MasterDataConfig = {
  entityName: 'Sub-Agencia',
  entityNamePlural: 'Sub-Agencias',
  apiEndpoint: '/master-data/sub-agencia',
  idField: 'id',
  fields: [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100,
      },
    },
    {
      name: 'ciRuc',
      label: 'CI/RUC',
      type: 'text',
      required: false,
      validation: {
        pattern: /^\d{10,13}$/,
        custom: (value) => {
          if (value && (value.length < 10 || value.length > 13)) {
            return 'CI/RUC debe tener entre 10 y 13 dígitos';
          }
          return null;
        },
      },
    },
    {
      name: 'direccion',
      label: 'Dirección',
      type: 'textarea',
      required: false,
      validation: {
        maxLength: 255,
      },
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'text',
      required: false,
      validation: {
        pattern: /^\+?[\d\s\-\(\)]+$/,
      },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text',
      required: false,
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
    },
    {
      name: 'ciudad',
      label: 'Ciudad',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'pais',
      label: 'País',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'provincia',
      label: 'Provincia',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'representante',
      label: 'Representante',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'comision',
      label: 'Comisión (%)',
      type: 'number',
      required: false,
      validation: {
        min: 0,
        max: 100,
      },
    },
    {
      name: 'estado',
      label: 'Estado Activo',
      type: 'boolean',
      required: false,
      defaultValue: true,
    },
  ],
  tableColumns: [
    { key: 'id', label: 'ID', width: 80 },
    { key: 'nombre', label: 'Nombre', width: 200 },
    { key: 'ciRuc', label: 'CI/RUC', width: 120 },
    { key: 'ciudad', label: 'Ciudad', width: 120 },
    { key: 'pais', label: 'País', width: 120 },
    { key: 'telefono', label: 'Teléfono', width: 130 },
    { key: 'representante', label: 'Representante', width: 150 },
    {
      key: 'comision',
      label: 'Comisión',
      width: 100,
      render: (value: any) => value ? `${value}%` : '-'
    },
    { key: 'estado', label: 'Estado', width: 100 },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
  searchFields: ['nombre', 'ciRuc', 'ciudad', 'pais', 'representante'],
  filterFields: ['estado'],
};