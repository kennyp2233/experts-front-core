import { MasterDataConfig } from '../types/master-data.types';

export const clientesConfig: MasterDataConfig = {
  entityName: 'Cliente',
  entityNamePlural: 'Clientes',
  apiEndpoint: '/master-data/clientes',
  tabs: [
    { key: 'Información General', label: 'Información General', order: 1 },
    { key: 'Dirección', label: 'Dirección', order: 2 },
    { key: 'Costos y Tarifas', label: 'Costos y Tarifas', order: 3 },
    { key: 'Facturación', label: 'Facturación', order: 4 },
    { key: 'Estado', label: 'Estado', order: 5 },
  ],
  fields: [
    // ===== INFORMACIÓN GENERAL =====
    {
      name: 'nombre',
      label: 'Nombre del Cliente',
      type: 'text',
      required: true,
      tab: 'Información General',
      validation: {
        minLength: 2,
        maxLength: 200,
      },
    },
    {
      name: 'ruc',
      label: 'RUC',
      type: 'text',
      required: false,
      tab: 'Información General',
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: false,
      tab: 'Información General',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'text',
      required: false,
      tab: 'Información General',
      validation: {
        maxLength: 20,
      },
    },

    // ===== DIRECCIÓN =====
    {
      name: 'direccion',
      label: 'Dirección',
      type: 'textarea',
      required: false,
      tab: 'Dirección',
      validation: {
        maxLength: 500,
      },
    },
    {
      name: 'ciudad',
      label: 'Ciudad',
      type: 'text',
      required: false,
      tab: 'Dirección',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'pais',
      label: 'País',
      type: 'text',
      required: false,
      tab: 'Dirección',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'clienteCodigoPais',
      label: 'Código de País',
      type: 'text',
      required: false,
      tab: 'Dirección',
      validation: {
        maxLength: 5,
      },
    },

    // ===== COSTOS Y TARIFAS =====
    {
      name: 'fitosValor',
      label: 'Valor Fitosanitarios',
      type: 'number',
      required: false,
      tab: 'Costos y Tarifas',
      validation: {
        min: 0,
      },
    },
    {
      name: 'formA',
      label: 'Costo Formulario A',
      type: 'number',
      required: false,
      tab: 'Costos y Tarifas',
      validation: {
        min: 0,
      },
    },
    {
      name: 'transport',
      label: 'Costo Transporte',
      type: 'number',
      required: false,
      tab: 'Costos y Tarifas',
      validation: {
        min: 0,
      },
    },
    {
      name: 'termo',
      label: 'Costo Termo',
      type: 'number',
      required: false,
      tab: 'Costos y Tarifas',
      validation: {
        min: 0,
      },
    },
    {
      name: 'mica',
      label: 'Costo Mica',
      type: 'number',
      required: false,
      tab: 'Costos y Tarifas',
      validation: {
        min: 0,
      },
    },
    {
      name: 'handling',
      label: 'Costo Handling',
      type: 'number',
      required: false,
      tab: 'Costos y Tarifas',
      validation: {
        min: 0,
      },
    },

    // ===== FACTURACIÓN =====
    {
      name: 'cuentaContable',
      label: 'Cuenta Contable',
      type: 'text',
      required: false,
      tab: 'Facturación',
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'nombreFactura',
      label: 'Nombre para Facturación',
      type: 'text',
      required: false,
      tab: 'Facturación',
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'rucFactura',
      label: 'RUC para Facturación',
      type: 'text',
      required: false,
      tab: 'Facturación',
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'direccionFactura',
      label: 'Dirección para Facturación',
      type: 'textarea',
      required: false,
      tab: 'Facturación',
      validation: {
        maxLength: 500,
      },
    },
    {
      name: 'telefonoFactura',
      label: 'Teléfono para Facturación',
      type: 'text',
      required: false,
      tab: 'Facturación',
      validation: {
        maxLength: 20,
      },
    },

    // ===== ESTADO =====
    {
      name: 'estado',
      label: 'Estado',
      type: 'boolean',
      required: false,
      tab: 'Estado',
      defaultValue: true,
    },
  ],
  tableColumns: [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'ruc', label: 'RUC' },
    { key: 'email', label: 'Email' },
    { key: 'ciudad', label: 'Ciudad' },
    { key: 'pais', label: 'País' },
    { key: 'estado', label: 'Estado' },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
};