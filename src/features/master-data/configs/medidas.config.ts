import { MasterDataConfig } from '../types/master-data.types';

export const medidasConfig: MasterDataConfig = {
  entityName: 'Medida',
  entityNamePlural: 'Medidas',
  apiEndpoint: '/master-data/medidas',
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
      name: 'estado',
      label: 'Estado',
      type: 'boolean',
      required: false,
      defaultValue: true,
    },
  ],
  tableColumns: [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'estado', label: 'Estado' },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
};