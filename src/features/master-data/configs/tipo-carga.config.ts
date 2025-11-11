import { MasterDataConfig } from '../types/master-data.types';

export const tipoCargaConfig: MasterDataConfig = {
  entityName: 'Tipo de Carga',
  entityNamePlural: 'Tipos de Carga',
  apiEndpoint: '/master-data/tipo-carga',
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
  ],
  tableColumns: [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
};