import { MasterDataEntity } from './common.types';

export interface Pais extends MasterDataEntity {
  idPais: number;
  siglasPais: string;
  nombre: string;
  paisId?: number; // ID del país padre
  idAcuerdo?: number; // ID del acuerdo arancelario
  estado: boolean;
}

export interface CreatePaisDto {
  siglasPais: string;
  nombre: string;
  paisId?: number;
  idAcuerdo?: number;
  estado?: boolean;
}

export interface UpdatePaisDto {
  siglasPais?: string;
  nombre?: string;
  paisId?: number;
  idAcuerdo?: number;
  estado?: boolean;
}