import { MasterDataConfig } from '../types/master-data.types';
import { DestinoMasterDataPage } from '../components/destino/DestinoMasterDataPage';

export const destinoConfig: MasterDataConfig = {
  entityName: 'Destino',
  entityNamePlural: 'Destinos',
  apiEndpoint: '/master-data/destino',
  idField: 'id',
  customComponent: DestinoMasterDataPage,
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
      required: true,
      options: [], // Will be populated dynamically
      validation: {
        min: 1,
      },
    },
    {
      name: 'sesaId',
      label: 'ID SESA',
      type: 'text',
      required: false,
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'leyendaFito',
      label: 'Leyenda Fito',
      type: 'textarea',
      required: false,
      validation: {
        maxLength: 500,
      },
    },
    {
      name: 'cobroFitos',
      label: 'Cobro de Fitos',
      type: 'boolean',
      required: false,
      defaultValue: false,
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
    { key: 'sesaId', label: 'ID SESA', width: 100 },
    { key: 'cobroFitos', label: 'Fitos', width: 80 },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
  searchFields: ['nombre', 'aeropuerto', 'sesaId'],
  filterFields: ['cobroFitos'],
};