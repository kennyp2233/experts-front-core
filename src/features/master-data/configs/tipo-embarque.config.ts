import { MasterDataConfig } from '../types/master-data.types';

export const tipoEmbarqueConfig: MasterDataConfig = {
  entityName: 'Tipo de Embarque',
  entityNamePlural: 'Tipos de Embarque',
  apiEndpoint: '/master-data/tipo-embarque',
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
      name: 'idTipoCarga',
      label: 'Tipo de Carga',
      type: 'number',
      required: false,
    },
    {
      name: 'idTipoEmbalaje',
      label: 'Tipo de Embalaje',
      type: 'number',
      required: false,
    },
    {
      name: 'regimen',
      label: 'Régimen',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'mercancia',
      label: 'Mercancía',
      type: 'text',
      required: false,
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'harmonisedCommodity',
      label: 'Código Armonizado',
      type: 'text',
      required: false,
      validation: {
        maxLength: 20,
      },
    },
  ],
  tableColumns: [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'regimen', label: 'Régimen' },
    { key: 'mercancia', label: 'Mercancía' },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
};