import { MasterDataConfig } from '../types/master-data.types';

export const fincaConfig: MasterDataConfig = {
  entityName: 'Finca',
  entityNamePlural: 'Fincas',
  apiEndpoint: '/master-data/fincas',
  idField: 'id',
  fields: [
    {
      name: 'nombreFinca',
      label: 'Nombre de la Finca',
      type: 'text',
      required: true,
      validation: {
        minLength: 2,
        maxLength: 100,
      },
    },
    {
      name: 'tag',
      label: 'Tag',
      type: 'text',
      required: false,
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'rucFinca',
      label: 'RUC',
      type: 'text',
      required: false,
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'tipoDocumento',
      label: 'Tipo de Documento',
      type: 'text',
      required: true,
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'generaGuiasCertificadas',
      label: 'Genera Guías Certificadas',
      type: 'boolean',
      required: false,
      defaultValue: false,
    },
    {
      name: 'iGeneralTelefono',
      label: 'Teléfono',
      type: 'text',
      required: false,
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'iGeneralEmail',
      label: 'Email',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'iGeneralCiudad',
      label: 'Ciudad',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'iGeneralProvincia',
      label: 'Provincia',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'iGeneralPais',
      label: 'País',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'iGeneralCodSesa',
      label: 'Código SESA',
      type: 'text',
      required: false,
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'iGeneralCodPais',
      label: 'Código País',
      type: 'text',
      required: false,
      validation: {
        maxLength: 10,
      },
    },
    {
      name: 'aNombre',
      label: 'Nombre Administrador',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'aCodigo',
      label: 'Código Administrador',
      type: 'text',
      required: false,
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'aDireccion',
      label: 'Dirección Administrador',
      type: 'text',
      required: false,
      validation: {
        maxLength: 200,
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
    { key: 'nombreFinca', label: 'Nombre', width: 200 },
    { key: 'tag', label: 'Tag', width: 100 },
    { key: 'rucFinca', label: 'RUC', width: 120 },
    { key: 'tipoDocumento', label: 'Tipo Doc', width: 100 },
    { key: 'iGeneralTelefono', label: 'Teléfono', width: 120 },
    { key: 'iGeneralEmail', label: 'Email', width: 180 },
    { key: 'iGeneralCiudad', label: 'Ciudad', width: 120 },
    { key: 'estado', label: 'Estado', width: 80 },
  ],
  defaultSort: {
    field: 'nombreFinca',
    order: 'asc',
  },
  searchFields: ['nombreFinca', 'tag', 'rucFinca', 'iGeneralEmail'],
};