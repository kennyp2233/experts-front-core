import { MasterDataConfig } from '../types/master-data.types';
import { ConsignatariosMasterDataPage } from '../components/consignatarios/ConsignatariosMasterDataPage';

export const consignatariosConfig: MasterDataConfig = {
  entityName: 'Consignatario',
  entityNamePlural: 'Consignatarios',
  apiEndpoint: '/master-data/consignatarios',
  idField: 'id',
  customComponent: ConsignatariosMasterDataPage,
  fields: [
    // ===== CAMPOS PRINCIPALES =====
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      tab: 'principal',
      validation: {
        minLength: 2,
        maxLength: 100,
      },
    },
    {
      name: 'ruc',
      label: 'RUC',
      type: 'text',
      required: false,
      tab: 'principal',
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'direccion',
      label: 'Dirección',
      type: 'textarea',
      required: false,
      tab: 'principal',
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'idEmbarcador',
      label: 'Embarcador',
      type: 'select',
      required: true,
      tab: 'principal',
      options: [], // Will be populated dynamically
      validation: {
        min: 1,
      },
    },
    {
      name: 'idCliente',
      label: 'Cliente',
      type: 'select',
      required: true,
      tab: 'principal',
      options: [], // Will be populated dynamically
      validation: {
        min: 1,
      },
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      type: 'text',
      required: false,
      tab: 'principal',
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text',
      required: false,
      tab: 'principal',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'ciudad',
      label: 'Ciudad',
      type: 'text',
      required: false,
      tab: 'principal',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'pais',
      label: 'País',
      type: 'text',
      required: false,
      tab: 'principal',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'boolean',
      required: false,
      tab: 'principal',
      defaultValue: true,
    },

    // ===== CAMPOS CAE SICE =====
    {
      name: 'caeSice.consigneeNombre',
      label: 'Nombre Consignee',
      type: 'text',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'caeSice.consigneeDireccion',
      label: 'Dirección Consignee',
      type: 'textarea',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'caeSice.consigneeDocumento',
      label: 'Documento Consignee',
      type: 'text',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'caeSice.consigneeSiglasPais',
      label: 'Siglas País Consignee',
      type: 'text',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 10,
      },
    },
    {
      name: 'caeSice.consigneeTipoDocumento',
      label: 'Tipo Documento Consignee',
      type: 'text',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'caeSice.notifyNombre',
      label: 'Nombre Notify',
      type: 'text',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'caeSice.notifyDireccion',
      label: 'Dirección Notify',
      type: 'textarea',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'caeSice.notifyDocumento',
      label: 'Documento Notify',
      type: 'text',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'caeSice.notifySiglasPais',
      label: 'Siglas País Notify',
      type: 'text',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 10,
      },
    },
    {
      name: 'caeSice.notifyTipoDocumento',
      label: 'Tipo Documento Notify',
      type: 'text',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'caeSice.hawbNombre',
      label: 'Nombre HAWB',
      type: 'text',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'caeSice.hawbDireccion',
      label: 'Dirección HAWB',
      type: 'textarea',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'caeSice.hawbDocumento',
      label: 'Documento HAWB',
      type: 'text',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'caeSice.hawbSiglasPais',
      label: 'Siglas País HAWB',
      type: 'text',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 10,
      },
    },
    {
      name: 'caeSice.hawbTipoDocumento',
      label: 'Tipo Documento HAWB',
      type: 'text',
      required: false,
      tab: 'cae-sice',
      validation: {
        maxLength: 20,
      },
    },

    // ===== CAMPOS FACTURACIÓN =====
    {
      name: 'facturacion.facturaNombre',
      label: 'Nombre Facturación',
      type: 'text',
      required: false,
      tab: 'facturacion',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'facturacion.facturaRuc',
      label: 'RUC Facturación',
      type: 'text',
      required: false,
      tab: 'facturacion',
      validation: {
        maxLength: 20,
      },
    },
    {
      name: 'facturacion.facturaDireccion',
      label: 'Dirección Facturación',
      type: 'textarea',
      required: false,
      tab: 'facturacion',
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'facturacion.facturaTelefono',
      label: 'Teléfono Facturación',
      type: 'text',
      required: false,
      tab: 'facturacion',
      validation: {
        maxLength: 20,
      },
    },

    // ===== CAMPOS FITO =====
    {
      name: 'fito.fitoDeclaredName',
      label: 'Nombre Declarado FITO',
      type: 'text',
      required: false,
      tab: 'fito',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'fito.fitoFormaA',
      label: 'Forma A FITO',
      type: 'text',
      required: false,
      tab: 'fito',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'fito.fitoNombre',
      label: 'Nombre FITO',
      type: 'text',
      required: false,
      tab: 'fito',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'fito.fitoDireccion',
      label: 'Dirección FITO',
      type: 'textarea',
      required: false,
      tab: 'fito',
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'fito.fitoPais',
      label: 'País FITO',
      type: 'text',
      required: false,
      tab: 'fito',
      validation: {
        maxLength: 50,
      },
    },

    // ===== CAMPOS GUÍA H =====
    {
      name: 'guiaH.guiaHConsignee',
      label: 'Consignee Guía H',
      type: 'text',
      required: false,
      tab: 'guia-h',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'guiaH.guiaHNameAdress',
      label: 'Nombre y Dirección Guía H',
      type: 'textarea',
      required: false,
      tab: 'guia-h',
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'guiaH.guiaHNotify',
      label: 'Notify Guía H',
      type: 'text',
      required: false,
      tab: 'guia-h',
      validation: {
        maxLength: 100,
      },
    },

    // ===== CAMPOS GUÍA M =====
    {
      name: 'guiaM.idDestino',
      label: 'Destino',
      type: 'select',
      required: false,
      tab: 'guia-m',
      options: [], // Will be populated dynamically
    },
    {
      name: 'guiaM.guiaMConsignee',
      label: 'Consignee Guía M',
      type: 'text',
      required: false,
      tab: 'guia-m',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'guiaM.guiaMNameAddress',
      label: 'Nombre y Dirección Guía M',
      type: 'textarea',
      required: false,
      tab: 'guia-m',
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'guiaM.guiaMNotify',
      label: 'Notify Guía M',
      type: 'text',
      required: false,
      tab: 'guia-m',
      validation: {
        maxLength: 100,
      },
    },

    // ===== CAMPOS TRANSMISIÓN =====
    {
      name: 'transmision.consigneeNombreTrans',
      label: 'Nombre Consignee Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'transmision.consigneeDireccionTrans',
      label: 'Dirección Consignee Transmisión',
      type: 'textarea',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'transmision.consigneeCiudadTrans',
      label: 'Ciudad Consignee Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'transmision.consigneeProvinciaTrans',
      label: 'Provincia Consignee Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'transmision.consigneePaisTrans',
      label: 'País Consignee Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'transmision.consigneeEueoriTrans',
      label: 'EUEORI Consignee Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'transmision.notifyNombreTrans',
      label: 'Nombre Notify Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'transmision.notifyDireccionTrans',
      label: 'Dirección Notify Transmisión',
      type: 'textarea',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'transmision.notifyCiudadTrans',
      label: 'Ciudad Notify Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'transmision.notifyProvinciaTrans',
      label: 'Provincia Notify Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'transmision.notifyPaisTrans',
      label: 'País Notify Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'transmision.notifyEueoriTrans',
      label: 'EUEORI Notify Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'transmision.hawbNombreTrans',
      label: 'Nombre HAWB Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 100,
      },
    },
    {
      name: 'transmision.hawbDireccionTrans',
      label: 'Dirección HAWB Transmisión',
      type: 'textarea',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 200,
      },
    },
    {
      name: 'transmision.hawbCiudadTrans',
      label: 'Ciudad HAWB Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'transmision.hawbProvinciaTrans',
      label: 'Provincia HAWB Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'transmision.hawbPaisTrans',
      label: 'País HAWB Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 50,
      },
    },
    {
      name: 'transmision.hawbEueoriTrans',
      label: 'EUEORI HAWB Transmisión',
      type: 'text',
      required: false,
      tab: 'transmision',
      validation: {
        maxLength: 50,
      },
    },
  ],
  tabs: [
    { key: 'principal', label: 'Datos Principales', order: 1 },
    { key: 'cae-sice', label: 'CAE SICE', order: 2 },
    { key: 'facturacion', label: 'Facturación', order: 3 },
    { key: 'fito', label: 'FITO', order: 4 },
    { key: 'guia-h', label: 'Guía H', order: 5 },
    { key: 'guia-m', label: 'Guía M', order: 6 },
    { key: 'transmision', label: 'Transmisión', order: 7 },
  ],
  tableColumns: [
    { key: 'id', label: 'ID', width: 80 },
    { key: 'nombre', label: 'Nombre', width: 200 },
    { key: 'ruc', label: 'RUC', width: 120 },
    {
      key: 'embarcador',
      label: 'Embarcador',
      width: 150,
      render: (value: any, row: any) => value?.nombre || 'Sin embarcador'
    },
    {
      key: 'cliente',
      label: 'Cliente',
      width: 150,
      render: (value: any, row: any) => value?.nombre || 'Sin cliente'
    },
    { key: 'telefono', label: 'Teléfono', width: 120 },
    { key: 'email', label: 'Email', width: 150 },
    { key: 'estado', label: 'Estado', width: 80 },
  ],
  defaultSort: {
    field: 'nombre',
    order: 'asc',
  },
  searchFields: ['nombre', 'ruc', 'telefono', 'email'],
  filterFields: ['estado'],
};