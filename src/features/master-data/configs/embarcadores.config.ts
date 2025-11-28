import { MasterDataConfig } from '../types/master-data.types';

export const embarcadoresConfig: MasterDataConfig = {
  entityName: 'Embarcador',
  entityNamePlural: 'Embarcadores',
  apiEndpoint: '/master-data/embarcadores',
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
      label: 'Cédula',
      type: 'text',
      required: false,
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'direccion',
      label: 'Dirección',
      type: 'textarea',
      required: false,
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'text',
      required: false,
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
      name: 'ciudad',
      label: 'Ciudad',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'provincia',
      label: 'Provincia',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'pais',
      label: 'País',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'embarcadorCodigoPais',
      label: 'Código País',
      type: 'text',
      required: false,
      validation: {
        maxLength: 10,
      },
    },
    {
      name: 'handling',
      label: 'Costo Handling',
      type: 'number',
      required: false,
      validation: {
        min: 0,
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
    { key: 'ci', label: 'Cédula', width: 120 },
    { key: 'telefono', label: 'Teléfono', width: 120 },
    { key: 'email', label: 'Email', width: 180 },
    { key: 'ciudad', label: 'Ciudad', width: 120 },
    { key: 'estado', label: 'Estado', width: 80 },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
  searchFields: ['nombre', 'ci', 'email'],
};