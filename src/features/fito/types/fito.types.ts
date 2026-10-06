export interface FitoGuide {
    bodCodigo: number;
    docTipo: string;
    docNumero: number;
    docNumGuia: string;  // The AWB/guide number users see
    marCodigo: number;
    docFecha: string;
    docDestino?: string;
    docFITODestino?: string;
    consignatarioNombre?: string;
    consignatarioDireccion?: string;
}

export interface FitoGuiaHija {
    docNumero: number;
    detNumero: number;
    marCodigo: number;
    plaCodigo: number;
    proCodigo: string;
    detNumStems: number;
    detCajas: number;
    detFecha?: string;
    marNombre?: string;
    marDireccion?: string;
    marPaisSigla?: string;
    marFITO?: string;
    plaRUC?: string;
    plaNombre?: string;
}

export interface FitoJob {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    processedCount: number;
    totalCount: number;
    error?: string;
    createdAt: string;
}

export interface FitoXmlConfig {
    tipoSolicitud: string;
    codigoIdioma: string;
    codigoTipoProduccion: string;
    fechaEmbarque: string;
    codigoPuertoEc: string;
    codigoPuertoDestino: string;
    nombreMarca: string;
    nombreConsignatario: string;
    direccionConsignatario: string;
    codigoUsoPrevisto: string;
    informacionAdicional?: string;
}

// Catálogo "Uso previsto" de Agrocalidad (GUIA), obligatorio desde 2026-10-01
export const USOS_PREVISTOS = [
    { codigo: '0001', nombre: 'Plantación' },
    { codigo: '0002', nombre: 'Consumo' },
    { codigo: '0003', nombre: 'Procesamiento' },
    { codigo: '0004', nombre: 'Decoración' },
    { codigo: '0005', nombre: 'Germinación para consumo' },
    { codigo: '0006', nombre: 'Investigación' },
] as const;

export interface ProductMapping {
    originalCode: string;
    codigoAgrocalidad: string;
    nombreComun: string;
    matched: boolean;
    confidence: number;
}

export interface GuiaHijaAgregada {
    plaRUC: string;
    plaNombre: string;
    proCodigo: string;
    codigoAgrocalidad: string;
    detCajas: number;
    detNumStems: number;
}

export interface GenerateFitoDto {
    guias: number[];
    config: FitoXmlConfig;
    productMappings: ProductMapping[];
    guiasHijas: GuiaHijaAgregada[];
}

export interface GenerationResponse {
    message: string;
    jobId: string;
    count: number;
}

export interface PuertoEcuador {
    codigoPuerto: string;
    nombrePuerto: string;
}

export interface PuertoInternacional {
    codigoPuerto: string;
    nombrePuerto: string;
    nombrePais?: string;
}

export interface ProductCatalogItem {
    codigoAgrocalidad: string;
    nombreComun: string;
    nombreSubtipoProducto?: string;
}

export interface ProductMatchResult {
    originalCode: string;
    matched: boolean;
    confidence: number;
    catalogMatch: ProductCatalogItem | null;
}



