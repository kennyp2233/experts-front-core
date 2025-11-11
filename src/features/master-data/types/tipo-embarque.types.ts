import { MasterDataEntity } from './master-data.types';

export interface TipoEmbarque extends MasterDataEntity {
  nombre: string;
  idTipoCarga?: number;
  idTipoEmbalaje?: number;
  regimen?: string;
  mercancia?: string;
  harmonisedCommodity?: string;
}

export interface CreateTipoEmbarqueDto {
  nombre: string;
  idTipoCarga?: number;
  idTipoEmbalaje?: number;
  regimen?: string;
  mercancia?: string;
  harmonisedCommodity?: string;
}

export interface UpdateTipoEmbarqueDto {
  nombre?: string;
  idTipoCarga?: number;
  idTipoEmbalaje?: number;
  regimen?: string;
  mercancia?: string;
  harmonisedCommodity?: string;
}