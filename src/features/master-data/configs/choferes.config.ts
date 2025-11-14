import { MasterDataConfig } from '../types/master-data.types';

export const choferesConfig: MasterDataConfig = {
  entityName: 'Chofer',
  entityNamePlural: 'Choferes',
  apiEndpoint: '/master-data/choferes',
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
      name: 'ruc',
      label: 'RUC',
      type: 'text',
      required: true,
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
      name: 'placasCamion',
      label: 'Placas del Camión',
      type: 'text',
      required: false,
      validation: {
        maxLength: 20,
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
      name: 'camion',
      label: 'Camión',
      type: 'text',
      required: false,
      validation: {
        maxLength: 50,
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
    { key: 'ruc', label: 'RUC', width: 130 },
    { key: 'placasCamion', label: 'Placas', width: 120 },
    { key: 'telefono', label: 'Teléfono', width: 130 },
    { key: 'camion', label: 'Camión', width: 150 },
    { key: 'estado', label: 'Estado', width: 100 },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
  searchFields: ['nombre', 'ruc', 'placasCamion', 'camion'],
  filterFields: ['estado'],
};