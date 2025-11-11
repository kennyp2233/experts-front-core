import { MasterDataConfig } from '../types/master-data.types';

export const aerolineasConfig: MasterDataConfig = {
  entityName: 'Aerolínea',
  entityNamePlural: 'Aerolíneas',
  apiEndpoint: '/master-data/aerolinea',
  tabs: [
    { key: 'Información General', label: 'Información General', order: 1 },
    { key: 'Operación', label: 'Operación', order: 2 },
    { key: 'Contacto', label: 'Contacto', order: 3 },
    { key: 'Finanzas', label: 'Finanzas', order: 4 },
    { key: 'Rutas', label: 'Rutas', order: 5 },
    { key: 'Configuración', label: 'Configuración', order: 6 },
  ],
  fields: [
    // ===== INFORMACIÓN GENERAL =====
    {
      name: 'codigo',
      label: 'Código',
      type: 'text',
      required: false,
      tab: 'Información General',
      validation: {
        maxLength: 10,
      },
    },
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      tab: 'Información General',
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
      tab: 'Información General',
      validation: {
        pattern: /^\d[\d\-]*$/,
      },
    },
    {
      name: 'estado',
      label: 'Estado Activo',
      type: 'boolean',
      required: false,
      defaultValue: true,
      tab: 'Información General',
    },
    // ===== OPERACIÓN =====
    {
      name: 'modo',
      label: 'Modo de Operación',
      type: 'select',
      required: false,
      tab: 'Operación',
      options: [
        { value: 'EN_PIEZAS', label: 'En Piezas' },
        { value: 'EN_FULLES', label: 'En Fulles' },
      ],
    },
    {
      name: 'prefijoAwb',
      label: 'Prefijo AWB',
      type: 'text',
      required: false,
      tab: 'Operación',
      validation: {
        pattern: /^\d{3}$/,
        maxLength: 3,
      },
    },
    {
      name: 'maestraGuiasHijas',
      label: 'Maestra de Guías Hijas',
      type: 'boolean',
      required: false,
      tab: 'Operación',
    },
    {
      name: 'afiliadoCass',
      label: 'Afiliado a CASS',
      type: 'boolean',
      required: false,
      tab: 'Operación',
    },
    {
      name: 'guiasVirtuales',
      label: 'Utiliza Guías Virtuales',
      type: 'boolean',
      required: false,
      tab: 'Operación',
    },
    // ===== CONTACTO =====
    {
      name: 'direccion',
      label: 'Dirección',
      type: 'textarea',
      required: false,
      tab: 'Contacto',
      validation: {
        maxLength: 255,
      },
    },
    {
      name: 'ciudad',
      label: 'Ciudad',
      type: 'text',
      required: false,
      tab: 'Contacto',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'pais',
      label: 'País',
      type: 'text',
      required: false,
      tab: 'Contacto',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'text',
      required: false,
      tab: 'Contacto',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text',
      required: false,
      tab: 'Contacto',
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
    },
    {
      name: 'contacto',
      label: 'Persona de Contacto',
      type: 'text',
      required: false,
      tab: 'Contacto',
      validation: {
        maxLength: 100,
      },
    },
    // ===== FINANZAS =====
    {
      name: 'codigoCae',
      label: 'Código CAE',
      type: 'text',
      required: false,
      tab: 'Finanzas',
      validation: {
        maxLength: 20,
      },
    },
    // ===== RUTAS =====
    {
      name: 'rutas',
      label: 'Rutas de la Aerolínea',
      type: 'rutas',
      required: false,
      tab: 'Rutas',
    },
    // ===== PLANTILLAS Y COSTOS =====
    {
      name: 'plantillaGuiaMadre',
      label: 'Plantilla Guía Madre',
      type: 'text',
      required: false,
      tab: 'Configuración',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'plantillaFormatoAerolinea',
      label: 'Plantilla Formato Aerolínea',
      type: 'text',
      required: false,
      tab: 'Configuración',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'plantillaReservas',
      label: 'Plantilla Reservas',
      type: 'text',
      required: false,
      tab: 'Configuración',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'tarifaRate',
      label: 'Tarifa Rate',
      type: 'number',
      required: false,
      tab: 'Configuración',
      validation: {
        min: 0,
      },
    },
    {
      name: 'pca',
      label: 'PCA (%)',
      type: 'number',
      required: false,
      tab: 'Configuración',
      validation: {
        min: 0,
        max: 100,
      },
    },
    {
      name: 'conceptos',
      label: 'Conceptos de Costo',
      type: 'conceptos',
      required: false,
      tab: 'Configuración',
    },
  ],
  tableColumns: [
    { key: 'id', label: 'ID', width: 80 },
    { key: 'codigo', label: 'Código', width: 100 },
    { key: 'nombre', label: 'Nombre', width: 200 },
    { key: 'modo', label: 'Modo', width: 120 },
    { key: 'prefijoAwb', label: 'AWB', width: 80 },
    { key: 'ciudad', label: 'Ciudad', width: 120 },
    { key: 'pais', label: 'País', width: 120 },
    {
      key: 'rutas',
      label: 'Rutas',
      width: 100,
      render: (value: any, row: any) => {
        const rutasCount = row.rutas?.length || 0;
        return rutasCount > 0 ? `${rutasCount} rutas` : 'Sin rutas';
      }
    },
    {
      key: 'plantilla',
      label: 'Plantilla',
      width: 100,
      render: (value: any, row: any) => {
        return row.aerolineasPlantilla ? 'Configurada' : 'Sin configurar';
      }
    },
    { key: 'estado', label: 'Estado', width: 100 },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
  searchFields: ['codigo', 'nombre', 'ciRuc', 'ciudad', 'pais'],
  filterFields: ['modo', 'estado', 'afiliadoCass', 'guiasVirtuales'],
};