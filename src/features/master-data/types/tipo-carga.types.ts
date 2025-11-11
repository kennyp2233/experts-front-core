import { MasterDataEntity } from './master-data.types';

export interface TipoCarga extends MasterDataEntity {
  nombre: string;
}

export interface CreateTipoCargaDto {
  nombre: string;
}

export interface UpdateTipoCargaDto {
  nombre?: string;
}
