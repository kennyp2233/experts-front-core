// Mirror de los types del back en services/coordinacion-create.types.ts.
// Este file describe el flujo Coordinar (manager): cascade + form modal + submit.

export interface SelectOption {
  value: string;
  label: string;
  data?: Record<string, string>;
}

export interface VueloCard {
  exportador: string | null;
  cliente: string | null;
  id: string | null;
  fechaVuelo: string | null;
  ruta: string | null;
  aerolinea: string | null;
}

export interface ProductoOption {
  value: string;
  label: string;
  isFullBxs: boolean;
  isCompoundProduct: boolean;
  errorMessage: string | null;
}

export interface CreateFormHidden {
  exportador: string;
  consignatarioMarcacion: string;
  docCoordinacion: string;
  dae: string;
}

export interface CompoundFormsetConfig {
  prefix: string;
  totalForms: number;
  initialForms: number;
  minNumForms: number;
  maxNumForms: number;
  productoOptions: SelectOption[];
}

export interface CreateFormSpec {
  csrfToken: string;
  hidden: CreateFormHidden;
  productos: ProductoOption[];
  compoundFormset: CompoundFormsetConfig;
  initialNumericValues: {
    fbCoo: number;
    hbCoo: number;
    qbCoo: number;
    ebCoo: number;
    bxsCoo: number;
    pcsCoo: number;
  };
}

export interface BoxWeightInput {
  fb_coo: number;
  hb_coo: number;
  qb_coo: number;
  eb_coo: number;
}

export interface BoxWeightResult {
  bxs_coo: number;
  pcs_coo: number;
}

/** DTO enviado a POST /coordinar — mirror de CreateCoordinacionDto del back. */
export interface CreateCoordinacionDto {
  exportadorId: number;
  consignatarioMarcacionId: number;
  docCoordinacionId: number;
  daeId: number;
  productoId: number;
  /** Solo si producto.isFullBxs === true. */
  fbCoo?: number;
  hbCoo: number;
  qbCoo: number;
  ebCoo: number;
  /** Required (≥2) si producto.isCompoundProduct === true. */
  compoundProductos?: number[];
}

export interface CreateCoordinacionResult {
  ok: boolean;
  status: number;
  redirectTo?: string | null;
  errors?: string[];
  rawHtml?: string;
}
