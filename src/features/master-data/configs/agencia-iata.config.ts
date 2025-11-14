import { MasterDataConfig } from '../types/master-data.types';

export const agenciaIataConfig: MasterDataConfig = {
  entityName: 'Agencia IATA',
  entityNamePlural: 'Agencias IATA',
  apiEndpoint: '/master-data/agencia-iata',
  idField: 'id',
  tabs: [
    { key: 'Shipper', label: 'Shipper', order: 1 },
    { key: 'Carrier', label: 'Carrier', order: 2 },
    { key: 'Configuracion', label: 'Configuración', order: 3 },
  ],
  fields: [
    // ===== SHIPPER =====
    {
      name: 'nombreShipper',
      label: 'Nombre del Shipper',
      type: 'text',
      required: true,
      tab: 'Shipper',
      validation: {
        minLength: 2,
        maxLength: 100,
      },
    },
    {
      name: 'rucShipper',
      label: 'RUC del Shipper',
      type: 'text',
      required: false,
      tab: 'Shipper',
      validation: {
        pattern: /^\d{13}$/,
        custom: (value) => {
          if (value && value.length !== 13) {
            return 'El RUC debe tener exactamente 13 dígitos';
          }
          return null;
        },
      },
    },
    {
      name: 'direccionShipper',
      label: 'Dirección del Shipper',
      type: 'textarea',
      required: false,
      tab: 'Shipper',
      validation: {
        maxLength: 255,
      },
    },
    {
      name: 'telefonoShipper',
      label: 'Teléfono del Shipper',
      type: 'text',
      required: false,
      tab: 'Shipper',
      validation: {
        pattern: /^\+?[\d\s\-\(\)]+$/,
      },
    },
    {
      name: 'ciudadShipper',
      label: 'Ciudad del Shipper',
      type: 'text',
      required: false,
      tab: 'Shipper',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'paisShipper',
      label: 'País del Shipper',
      type: 'text',
      required: false,
      tab: 'Shipper',
      validation: {
        maxLength: 100,
      },
    },
    // ===== CARRIER =====
    {
      name: 'nombreCarrier',
      label: 'Nombre del Carrier',
      type: 'text',
      required: false,
      tab: 'Carrier',
      validation: {
        minLength: 2,
        maxLength: 100,
      },
    },
    {
      name: 'rucCarrier',
      label: 'RUC del Carrier',
      type: 'text',
      required: false,
      tab: 'Carrier',
      validation: {
        pattern: /^\d{13}$/,
        custom: (value) => {
          if (value && value.length !== 13) {
            return 'El RUC debe tener exactamente 13 dígitos';
          }
          return null;
        },
      },
    },
    {
      name: 'direccionCarrier',
      label: 'Dirección del Carrier',
      type: 'textarea',
      required: false,
      tab: 'Carrier',
      validation: {
        maxLength: 255,
      },
    },
    {
      name: 'telefonoCarrier',
      label: 'Teléfono del Carrier',
      type: 'text',
      required: false,
      tab: 'Carrier',
      validation: {
        pattern: /^\+?[\d\s\-\(\)]+$/,
      },
    },
    {
      name: 'ciudadCarrier',
      label: 'Ciudad del Carrier',
      type: 'text',
      required: false,
      tab: 'Carrier',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'paisCarrier',
      label: 'País del Carrier',
      type: 'text',
      required: false,
      tab: 'Carrier',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'iataCodeCarrier',
      label: 'Código IATA del Carrier',
      type: 'text',
      required: false,
      tab: 'Carrier',
      validation: {
        pattern: /^[A-Z]{2,3}$/,
        maxLength: 3,
        custom: (value) => {
          if (value && value.length > 3) {
            return 'El código IATA debe tener máximo 3 caracteres';
          }
          return null;
        },
      },
    },
    // ===== CONFIGURACIÓN =====
    {
      name: 'registroExportador',
      label: 'Registro del Exportador',
      type: 'text',
      required: false,
      tab: 'Configuracion',
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'codigoOperador',
      label: 'Código del Operador',
      type: 'text',
      required: false,
      tab: 'Configuracion',
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'codigoConsolidador',
      label: 'Código del Consolidador',
      type: 'text',
      required: false,
      tab: 'Configuracion',
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'comision',
      label: 'Comisión (%)',
      type: 'number',
      required: false,
      tab: 'Configuracion',
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
      tab: 'Configuracion',
    },
  ],
  tableColumns: [
    { key: 'id', label: 'ID', width: 80 },
    { key: 'nombreShipper', label: 'Shipper', width: 200 },
    { key: 'rucShipper', label: 'RUC Shipper', width: 120 },
    { key: 'nombreCarrier', label: 'Carrier', width: 200 },
    { key: 'iataCodeCarrier', label: 'IATA', width: 80 },
    { key: 'ciudadShipper', label: 'Ciudad', width: 120 },
    { key: 'paisShipper', label: 'País', width: 120 },
    { key: 'estado', label: 'Estado', width: 100 },
  ],
  defaultSort: {
    field: 'nombreShipper',
    order: 'asc',
  },
  searchFields: ['nombreShipper', 'rucShipper', 'nombreCarrier', 'iataCodeCarrier', 'ciudadShipper', 'paisShipper'],
  filterFields: ['estado'],
};