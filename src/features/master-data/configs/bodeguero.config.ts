import { MasterDataConfig } from '../types/master-data.types';

export const bodegueroConfig: MasterDataConfig = {
  entityName: 'Bodeguero',
  entityNamePlural: 'Bodegueros',
  apiEndpoint: '/master-data/bodeguero',
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
      name: 'ci',
      label: 'Cédula de Identidad',
      type: 'text',
      required: true,
      validation: {
        pattern: /^\d{10}$/,
        custom: (value) => {
          if (value && value.length !== 10) {
            return 'La cédula debe tener exactamente 10 dígitos';
          }
          return null;
        },
      },
    },
    {
      name: 'claveBodega',
      label: 'Clave de Bodega',
      type: 'text',
      required: true,
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
    { key: 'ci', label: 'Cédula', width: 120 },
    { key: 'claveBodega', label: 'Clave Bodega', width: 150 },
    { key: 'estado', label: 'Estado', width: 100 },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
  searchFields: ['nombre', 'ci', 'claveBodega'],
  filterFields: ['estado'],
};