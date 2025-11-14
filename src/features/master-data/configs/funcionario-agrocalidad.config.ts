import { MasterDataConfig } from '../types/master-data.types';

export const funcionarioAgrocalidadConfig: MasterDataConfig = {
  entityName: 'Funcionario Agrocalidad',
  entityNamePlural: 'Funcionarios Agrocalidad',
  apiEndpoint: '/master-data/funcionario-agrocalidad',
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
      name: 'telefono',
      label: 'Teléfono',
      type: 'text',
      required: false,
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text',
      required: false,
      validation: {
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
    { key: 'id', label: 'ID', width: 80 },
    { key: 'nombre', label: 'Nombre', width: 200 },
    { key: 'telefono', label: 'Teléfono', width: 120 },
    { key: 'email', label: 'Email', width: 180 },
    { key: 'estado', label: 'Estado', width: 80 },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
  searchFields: ['nombre', 'email'],
};