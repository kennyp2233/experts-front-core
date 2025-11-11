import { MasterDataEntity } from './common.types';

export interface Aerolinea extends MasterDataEntity {
  id: number;
  nombre: string;
  ciRuc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  pais?: string;
  contacto?: string;
  modo?: 'EN_PIEZAS' | 'EN_FULLES';
  maestraGuiasHijas?: boolean;
  codigo?: string;
  prefijoAwb?: string;
  codigoCae?: string;
  estado?: boolean;
  afiliadoCass?: boolean;
  guiasVirtuales?: boolean;
  rutas?: AerolineaRuta[];
  plantilla?: AerolineaPlantilla;
}

export interface AerolineaRuta {
  id?: number;
  tipoRuta: 'ORIGEN' | 'DESTINO1' | 'DESTINO2' | 'DESTINO3' | 'VIA1' | 'VIA2' | 'VIA3';
  origenId?: number;
  destinoId?: number;
  viaAerolineaId?: number;
  orden: number;
  origen?: { id: number; nombre: string };
  destino?: { id: number; nombre: string };
  viaAerolinea?: { id: number; nombre: string };
}

export interface ConceptoCosto {
  id?: number;
  plantillaId?: number;
  tipo: 'COSTO_GUIA' | 'COMBUSTIBLE' | 'SEGURIDAD' | 'AUX_CALCULO' | 'IVA' | 'OTROS' | 'AUX1' | 'AUX2';
  abreviatura?: string;
  valor: number;
  multiplicador?: 'GROSS_WEIGHT' | 'CHARGEABLE_WEIGHT' | null;
}

export interface AerolineaPlantilla {
  idAerolinea?: number;
  plantillaGuiaMadre?: string;
  plantillaFormatoAerolinea?: string;
  plantillaReservas?: string;
  tarifaRate?: number;
  pca?: number;
  conceptos: ConceptoCosto[];
}

export interface CreateAerolineaDto {
  nombre: string;
  ciRuc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  pais?: string;
  contacto?: string;
  modo?: 'EN_PIEZAS' | 'EN_FULLES';
  maestraGuiasHijas?: boolean;
  codigo?: string;
  prefijoAwb?: string;
  codigoCae?: string;
  estado?: boolean;
  afiliadoCass?: boolean;
  guiasVirtuales?: boolean;
  rutas?: CreateAerolineaRutaDto[];
  plantilla?: CreateAerolineaPlantillaDto;
}

export interface UpdateAerolineaDto {
  nombre?: string;
  ciRuc?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  pais?: string;
  contacto?: string;
  modo?: 'EN_PIEZAS' | 'EN_FULLES';
  maestraGuiasHijas?: boolean;
  codigo?: string;
  prefijoAwb?: string;
  codigoCae?: string;
  estado?: boolean;
  afiliadoCass?: boolean;
  guiasVirtuales?: boolean;
  rutas?: CreateAerolineaRutaDto[];
  plantilla?: CreateAerolineaPlantillaDto;
}

export interface CreateAerolineaRutaDto {
  aerolineaId: number;
  tipoRuta: 'ORIGEN' | 'DESTINO1' | 'VIA1' | 'DESTINO2' | 'VIA2' | 'DESTINO3' | 'VIA3';
  origenId?: number;
  destinoId?: number;
  viaAerolineaId?: number;
  orden?: number;
}

export interface UpdateAerolineaRutaDto {
  tipoRuta?: 'ORIGEN' | 'DESTINO1' | 'VIA1' | 'DESTINO2' | 'VIA2' | 'DESTINO3' | 'VIA3';
  origenId?: number;
  destinoId?: number;
  viaAerolineaId?: number;
  orden?: number;
}

export interface CreateConceptoCostoDto {
  plantillaId: number;
  tipo: 'COSTO_GUIA' | 'COMBUSTIBLE' | 'SEGURIDAD' | 'AUX_CALCULO' | 'IVA' | 'OTROS' | 'AUX1' | 'AUX2';
  abreviatura?: string;
  valor?: number;
  multiplicador?: 'GROSS_WEIGHT' | 'CHARGEABLE_WEIGHT' | null;
}

export interface UpdateConceptoCostoDto {
  tipo?: 'COSTO_GUIA' | 'COMBUSTIBLE' | 'SEGURIDAD' | 'AUX_CALCULO' | 'IVA' | 'OTROS' | 'AUX1' | 'AUX2';
  abreviatura?: string;
  valor?: number;
  multiplicador?: 'GROSS_WEIGHT' | 'CHARGEABLE_WEIGHT' | null;
}

export interface CreateAerolineaPlantillaDto {
  idAerolinea: number;
  plantillaGuiaMadre?: string;
  plantillaFormatoAerolinea?: string;
  plantillaReservas?: string;
  tarifaRate?: number;
  pca?: number;
  conceptos?: CreateConceptoCostoDto[];
}

export interface UpdateAerolineaPlantillaDto {
  plantillaGuiaMadre?: string;
  plantillaFormatoAerolinea?: string;
  plantillaReservas?: string;
  tarifaRate?: number;
  pca?: number;
}