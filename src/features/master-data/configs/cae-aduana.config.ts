import { MasterDataConfig } from '../types/master-data.types';

export const caeAduanaConfig: MasterDataConfig = {
  entityName: 'CAE Aduana',
  entityNamePlural: 'CAE Aduanas',
  apiEndpoint: '/master-data/cae-aduana',
  idField: 'idCaeAduana',
  fields: [
    {
      name: 'codigoAduana',
      label: 'Código de Aduana',
      type: 'number',
      required: false,
      validation: {
        min: 1,
      },
    },
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
    { key: 'idCaeAduana', label: 'ID', width: 80 },
    { key: 'codigoAduana', label: 'Código', width: 120 },
    { key: 'nombre', label: 'Nombre', width: 300 },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
  searchFields: ['nombre', 'codigoAduana'],
};