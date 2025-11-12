import { MasterDataConfig } from '../types/master-data.types';

export const acuerdosArancelariosConfig: MasterDataConfig = {
  entityName: 'Acuerdo Arancelario',
  entityNamePlural: 'Acuerdos Arancelarios',
  apiEndpoint: '/master-data/acuerdos-arancelarios',
  idField: 'idAcuerdo',
  fields: [
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
          if (value && value.length > 100) {
            return 'El nombre debe tener máximo 100 caracteres';
          }
          return null;
        },
      },
    },
  ],
  tableColumns: [
    { key: 'idAcuerdo', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
};