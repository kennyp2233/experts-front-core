export interface MasterDataEntity {
  id: number;
  nombre?: string;
  estado?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
}

export interface MasterDataResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}

export interface MasterDataFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'date' | 'color' | 'file' | string; // Allow custom types
  required?: boolean;
  defaultValue?: any;
  options?: { value: any; label: string }[];
  // Optional tab/group to render the fields in tabs
  tab?: string;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    // allow RegExp or string pattern in configs
    pattern?: string | RegExp;
    custom?: (value: any) => string | null;
  };
}

export interface MasterDataTableColumn {
  key: string;
  label: string;
  width?: number;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface MasterDataTab {
  key: string;
  label: string;
  order?: number;
}

export interface MasterDataConfig {
  entityName: string;
  entityNamePlural: string;
  apiEndpoint: string;
  idField?: string; // The field name for the ID, defaults to 'id'
  customComponent?: React.ComponentType<{ config: MasterDataConfig }>;
  fields: MasterDataFormField[];
  tableColumns: MasterDataTableColumn[];
  searchFields?: string[];
  filterFields?: string[];
  defaultSort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  tabs?: MasterDataTab[];
}