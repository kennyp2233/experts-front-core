import { MasterDataEntity } from './master-data.types';

export interface TipoEmbalaje extends MasterDataEntity {
  nombre: string;
}

export interface CreateTipoEmbalajeDto {
  nombre: string;
}

export interface UpdateTipoEmbalajeDto {
  nombre?: string;
}