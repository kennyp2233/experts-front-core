export interface FitoGuide {
    bodCodigo: number;
    docTipo: string;
    docNumero: number;
    docNumGuia: string;  // The AWB/guide number users see
    marCodigo: number;
    docFecha: string;
    docDestino?: string;
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
}

export interface ProductMapping {
    originalCode: string;
    codigoAgrocalidad: string;
    nombreComun: string;
    matched: boolean;
    confidence: number;
}

export interface GenerateFitoDto {
    guias: number[];
    config: FitoXmlConfig;
    productMappings: ProductMapping[];
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



