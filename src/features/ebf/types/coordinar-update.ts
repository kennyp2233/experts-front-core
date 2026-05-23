import type { CompoundFormsetConfig, ProductoOption } from './coordinar';

/** Read-only context que el modal de update muestra. */
export interface UpdateFormContext {
  exportador: string | null;
  marcacion: string | null;
  cliente: string | null;
  despacho: string | null;
  awb: string | null;
  hawb: string | null;
  dae: string | null;
}

export interface UpdateFormSpec {
  detalleId: number;
  csrfToken: string;
  context: UpdateFormContext;
  productos: ProductoOption[];
  currentProductoId: number | null;
  /** Si true el portal bloquea el cambio de producto (transacciones WH ya). */
  productoLocked: boolean;
  compoundFormset: CompoundFormsetConfig;
  currentValues: {
    fbCoo: number;
    hbCoo: number;
    qbCoo: number;
    ebCoo: number;
    bxsCoo: number;
    pcsCoo: number;
  };
}

export interface UpdateCoordinacionDto {
  /** Ignorado si productoLocked === true. */
  productoId?: number;
  fbCoo?: number;
  hbCoo: number;
  qbCoo: number;
  ebCoo: number;
  /** Required (≥2) si producto.isCompoundProduct === true. */
  compoundProductos?: number[];
}

export interface UpdateCoordinacionResult {
  ok: boolean;
  status: number;
  redirectTo?: string | null;
  errors?: string[];
  rawHtml?: string;
}

export interface DeleteCoordinacionResult {
  ok: boolean;
  status: number;
  redirectTo?: string | null;
  errors?: string[];
}
