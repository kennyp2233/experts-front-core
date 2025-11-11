import { MasterDataConfig } from '../types/master-data.types';

export const paisesConfig: MasterDataConfig = {
  entityName: 'País',
  entityNamePlural: 'Países',
  apiEndpoint: '/master-data/paises',
  fields: [
    {
      name: 'siglasPais',
      label: 'Siglas',
      type: 'text',
      required: true,
      validation: {
        pattern: /^[A-Z]{2,3}$/,
        custom: (value) => {
          if (value && value.length > 3) {
            return 'Las siglas deben tener máximo 3 caracteres';
          }
          return null;
        },
      },
    },
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
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
      name: 'estado',
      label: 'Estado',
      type: 'boolean',
      required: false,
    },
    {
      name: 'paisId',
      label: 'País Padre',
      type: 'number',
      required: false,
      validation: {
        min: 1,
      },
    },
    {
      name: 'idAcuerdo',
      label: 'Acuerdo Arancelario',
      type: 'number',
      required: false,
      validation: {
        min: 1,
      },
    },
  ],
  tableColumns: [
    { key: 'idPais', label: 'ID' },
    { key: 'siglasPais', label: 'Siglas' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'paisId', label: 'País Padre' },
    { key: 'idAcuerdo', label: 'Acuerdo' },
    { key: 'estado', label: 'Estado' },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
};