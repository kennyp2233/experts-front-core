import { MasterDataConfig } from '../types/master-data.types';
import { useTipoEmbarqueMasterData } from '../hooks/tipo-embarque/useTipoEmbarqueMasterData';

export const tipoEmbarqueConfig: MasterDataConfig = {
  entityName: 'Tipo de Embarque',
  entityNamePlural: 'Tipos de Embarque',
  apiEndpoint: '/master-data/tipo-embarque',
  useCustomHook: useTipoEmbarqueMasterData,
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
      type: 'select',
      required: false,
      options: [], // Will be populated dynamically by hook
    },
    {
      name: 'idTipoEmbalaje',
      label: 'Tipo de Embalaje',
      type: 'select',
      required: false,
      options: [], // Will be populated dynamically by hook
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