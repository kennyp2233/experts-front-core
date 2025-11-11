import { MasterDataConfig } from '../types/master-data.types';

export const tipoEmbalajeConfig: MasterDataConfig = {
  entityName: 'Tipo de Embalaje',
  entityNamePlural: 'Tipos de Embalaje',
  apiEndpoint: '/master-data/tipo-embalaje',
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