import { MasterDataEntity } from './common.types';

export interface Producto extends MasterDataEntity {
  id: number;
  nombre: string;
  descripcion?: string;
  nombreBotanico?: string;
  especie?: string;
  medidaId?: number;
  precioUnitario?: string;
  estado: boolean;
  opcionId?: number;
  stemsPorFull?: number;
  sesaId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductosAranceles {
  id?: number;
  arancelesDestino?: string;
  arancelesCodigo?: string;
}

export interface ProductosCompuesto {
  id?: number;
  destino?: string;
  declaracion?: string;
}

export interface ProductosMiPro {
  id?: number;
  acuerdo?: string;
  djoCode?: string;
  tariffCode?: string;
}

export interface CreateProductoDto {
  nombre: string;
  descripcion?: string;
  nombreBotanico?: string;
  especie?: string;
  medidaId: number;
  precioUnitario?: string;
  estado?: boolean;
  opcionId?: number;
  stemsPorFull?: number;
  sesaId?: number;
  productosAranceles?: ProductosAranceles[];
  productosCompuestos?: ProductosCompuesto[];
  productosMiPros?: ProductosMiPro[];
}

export interface UpdateProductoDto {
  nombre?: string;
  descripcion?: string;
  nombreBotanico?: string;
  especie?: string;
  medidaId?: number;
  precioUnitario?: string;
  estado?: boolean;
  opcionId?: number;
  stemsPorFull?: number;
  sesaId?: number;
}