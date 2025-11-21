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

export interface SelectOption {
  value: any;
  label: string;
}

export interface UseMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  idField?: string;
}

export interface UseMasterDataReturn<T> {
  data: T[];
  total: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  loading: boolean;
  create: (data: Partial<T>) => Promise<void>;
  update: (id: number, data: Partial<T>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  // Optional: Foreign key options para poblar selects dinámicamente
  foreignKeyOptions?: Record<string, SelectOption[]>;
  // Optional: Transform data for form (e.g., nested objects)
  transformDataForForm?: (data: Record<string, unknown>) => Record<string, unknown>;
}

export interface MasterDataConfig {
  entityName: string;
  entityNamePlural: string;
  apiEndpoint: string;
  idField?: string; // The field name for the ID, defaults to 'id'
  customComponent?: React.ComponentType<{ config: MasterDataConfig }>;
  /**
   * Hook personalizado para casos con foreign keys o lógica especial.
   * Si se provee, se usará en lugar de useMasterData genérico.
   * Debe retornar la misma estructura que useMasterData más foreignKeyOptions opcional.
   */
  useCustomHook?: (endpoint: string, options: UseMasterDataOptions) => UseMasterDataReturn<any>;
  /**
   * Custom field renderers for complex form fields (e.g., nested arrays/objects)
   */
  customFieldRenderers?: Record<string, (field: MasterDataFormField, value: unknown, onChange: (value: unknown) => void, error?: string, formData?: Record<string, unknown>, readOnly?: boolean) => React.ReactElement>;
  fields: MasterDataFormField[];
  tableColumns: MasterDataTableColumn[];
  searchFields?: string[];
  filterFields?: string[];
  defaultSort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  tabs?: MasterDataTab[];
  validationSchema?: any; // Yup schema
}