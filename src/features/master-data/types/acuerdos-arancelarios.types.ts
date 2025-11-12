import { MasterDataEntity } from './common.types';

export interface AcuerdoArancelario extends MasterDataEntity {
  idAcuerdo: number;
  nombre: string;
}

export interface CreateAcuerdoArancelarioDto {
  nombre: string;
}

export interface UpdateAcuerdoArancelarioDto {
  nombre?: string;
}
