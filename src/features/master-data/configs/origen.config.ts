import { MasterDataConfig } from '../types/master-data.types';
import { useOrigenMasterData } from '../hooks/origen/useOrigenMasterData';

export const origenConfig: MasterDataConfig = {
  entityName: 'Origen',
  entityNamePlural: 'Orígenes',
  apiEndpoint: '/master-data/origen',
  idField: 'id',
  useCustomHook: useOrigenMasterData,
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
      name: 'aeropuerto',
      label: 'Aeropuerto',
      type: 'text',
      required: false,
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'idPais',
      label: 'País',
      type: 'select',
      required: false,
      options: [], // Will be populated dynamically
      validation: {
        min: 1,
      },
    },
    {
      name: 'idCaeAduana',
      label: 'CAE Aduana',
      type: 'select',
      required: false,
      options: [], // Will be populated dynamically
      validation: {
        min: 1,
      },
    },
  ],
  tableColumns: [
    { key: 'id', label: 'ID', width: 80 },
    { key: 'nombre', label: 'Nombre', width: 200 },
    { key: 'aeropuerto', label: 'Aeropuerto', width: 150 },
    {
      key: 'pais',
      label: 'País',
      width: 120,
      render: (value: any, row: any) => value?.nombre || 'Sin país'
    },
    {
      key: 'caeAduana',
      label: 'CAE Aduana',
      width: 150,
      render: (value: any, row: any) => value?.nombre || 'Sin CAE'
    },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
  searchFields: ['nombre', 'aeropuerto'],
};