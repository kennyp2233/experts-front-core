/** Mirror del type `AwbState` del back EBF cliente. */
export type AwbState = 'IN_PROGRESS' | 'DEPARTED' | 'UNKNOWN';

export interface CustomerAwbListItem {
  id: number;
  awbNumber: string;
  consignee: string | null;
  /** YYYY-MM-DD ISO normalizado por el back. */
  etd: string | null;
  eta: string | null;
  airline: string | null;
  destinoAwb: string | null;
  destinoFinal: string | null;
  bxsCoo: number;
  pcsCoo: number;
  bxsWh: number;
  pcsWh: number;
  grossWeight: number;
  chargeWeight: number;
  state: AwbState;
  stateLabel: string;
}

export interface CustomerAwbListTotals {
  bxsCoo: number;
  pcsCoo: number;
  bxsWh: number;
  pcsWh: number;
  grossWeight: number;
  chargeWeight: number;
}

export interface CustomerAwbListPage {
  items: CustomerAwbListItem[];
  totals: CustomerAwbListTotals;
  page: number;
  hasNextPage: boolean;
  sort?: string;
  retrievedAt: string;
}

export interface CustomerAwbListQuery {
  /** YYYY-MM-DD, required. */
  etdStart: string;
  etdEnd: string;
  aerolinea?: string;
  consignatarios?: number;
  awb?: string;
  page?: number;
  sort?: string;
}

export interface CustomerAwbHeader {
  id: number;
  awbNumber: string;
  airline: string | null;
  etd: string | null;
  eta: string | null;
  consignee: string | null;
  shipper: string | null;
  route: string | null;
  availableTabs: Array<'INFO' | 'CUSTOMERS' | 'DOCUMENTS'>;
  documentCount: number;
}

export interface CustomerAwbCustomerRow {
  index: number;
  consignee: string | null;
  truck: string | null;
  bxsCoo: number;
  pcsCoo: number;
  bxsWh: number;
  pcsWh: number;
}

export interface CustomerAwbCustomersView {
  rows: CustomerAwbCustomerRow[];
}

export interface CustomerAwbDocument {
  index: number;
  fileName: string;
  fileType: string | null;
  /** URL en el portal EBF (no descargable directo). */
  portalUrl: string;
  /** URL del proxy en nuestra API (descargable). */
  downloadUrl: string;
}

export interface CustomerAwbDocumentsView {
  awbId: number;
  documents: CustomerAwbDocument[];
  downloadAllUrl: string;
  hasDocuments: boolean;
}

export interface InfoFilterOption {
  value: string;
  label: string;
}

export interface CustomerAwbDetailsView {
  awbId: number;
  filters: {
    customers: InfoFilterOption[];
    trucks: InfoFilterOption[];
    shippers: InfoFilterOption[];
    onlyDailyCoo: boolean;
  };
  /** URL del proxy XLSX en nuestra API. */
  exportXlsxUrl: string;
  /** HTML raw del contenedor de tablas — render directo. */
  rawTablesHtml: string;
}

export interface CustomerProfile {
  clienteId: number;
  displayName: string;
  email: string | null;
  changePasswordUrl: string;
}
