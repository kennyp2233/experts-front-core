import {
    FitoGuiaHija, FitoXmlConfig, GuiaHijaAgregada, ProductMapping, ProductMappingRow,
    PuertoInternacional, RememberedMapping, USOS_PREVISTOS
} from '../types/fito.types';

export const DEFAULT_FITO_CONFIG: FitoXmlConfig = {
    tipoSolicitud: 'ORNAMENTALES',
    codigoIdioma: 'SPA',
    codigoTipoProduccion: 'CONV',
    fechaEmbarque: '',
    codigoPuertoEc: 'AEECUIO',
    codigoPuertoDestino: '',
    nombreMarca: 'LAS DEL EXPORTADOR',
    nombreConsignatario: '',
    direccionConsignatario: '',
    // Consumo por defecto; el usuario puede cambiarlo según el envío (Agrocalidad SHC-2952)
    codigoUsoPrevisto: '0002',
    informacionAdicional: ''
};

export type ConfigGroupKey = 'ruta' | 'consignatario' | 'solicitud';

export const CONFIG_GROUPS: ConfigGroupKey[] = ['ruta', 'consignatario', 'solicitud'];

export const PUERTO_DESTINO_LABEL = 'Puerto destino';

/** Campos requeridos que faltan, por grupo (etiquetas para mostrar al usuario). */
export function getMissingConfigFields(config: FitoXmlConfig): Record<ConfigGroupKey, string[]> {
    const empty = (v: string | undefined) => !v || !v.trim();
    const missing: Record<ConfigGroupKey, string[]> = { ruta: [], consignatario: [], solicitud: [] };
    if (empty(config.codigoPuertoDestino)) missing.ruta.push(PUERTO_DESTINO_LABEL);
    if (empty(config.codigoPuertoEc)) missing.ruta.push('Puerto origen');
    if (empty(config.fechaEmbarque)) missing.ruta.push('Fecha de embarque');
    if (empty(config.nombreConsignatario)) missing.consignatario.push('Nombre');
    if (empty(config.direccionConsignatario)) missing.consignatario.push('Dirección');
    if (empty(config.tipoSolicitud)) missing.solicitud.push('Tipo de solicitud');
    if (empty(config.nombreMarca)) missing.solicitud.push('Nombre marca');
    if (empty(config.codigoUsoPrevisto)) missing.solicitud.push('Uso previsto');
    return missing;
}

/**
 * marFITO de la marca: "CONSIGNATARIO||DIRECCIÓN 1||DIRECCIÓN 2".
 * Nombre = antes del primer ||; dirección = todo lo que sigue.
 */
export function parseMarFito(raw?: string | null): { nombre: string; direccion: string } {
    if (!raw) return { nombre: '', direccion: '' };
    const parts = raw.split('||');
    return {
        nombre: parts[0]?.trim() || '',
        direccion: parts.length > 1 ? parts.slice(1).join(' ').trim() : ''
    };
}

export const puertoLabel = (p: PuertoInternacional) =>
    `${p.nombrePuerto} (${p.codigoPuerto})${p.nombrePais ? ` - ${p.nombrePais}` : ''}`;

export const usoPrevistoLabel = (codigo: string) => {
    const uso = USOS_PREVISTOS.find(u => u.codigo === codigo);
    return uso ? `${uso.nombre} (${uso.codigo})` : codigo;
};

const numberFormat = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 });
export const formatNumber = (n: number) => numberFormat.format(n || 0);

export function distinctProductCodes(hijas: FitoGuiaHija[]): string[] {
    return [...new Set(hijas.map(h => h.proCodigo).filter(Boolean))];
}

export function sumHijas(hijas: { detCajas: number; detNumStems: number }[]) {
    return hijas.reduce(
        (acc, h) => ({ cajas: acc.cajas + (h.detCajas || 0), stems: acc.stems + (h.detNumStems || 0) }),
        { cajas: 0, stems: 0 }
    );
}

export function emptyMappingRow(originalCode: string): ProductMappingRow {
    return {
        originalCode,
        codigoAgrocalidad: '',
        nombreComun: '',
        matched: false,
        confidence: 0,
        subtipo: '',
        source: null,
        autoMatching: false,
        notFound: false
    };
}

export function rememberedMappingRow(m: RememberedMapping): ProductMappingRow {
    return {
        originalCode: m.proCodigo,
        codigoAgrocalidad: m.codigoAgrocalidad,
        nombreComun: m.nombreComun ?? '',
        matched: true,
        confidence: 1,
        subtipo: m.subtipo ?? '',
        source: 'recordado',
        autoMatching: false,
        notFound: false
    };
}

/** Solo los campos que el back acepta en productMappings (whitelist estricta). */
export function toProductMappings(rows: ProductMappingRow[]): ProductMapping[] {
    return rows.map(({ originalCode, codigoAgrocalidad, nombreComun, matched, confidence, subtipo }) => ({
        originalCode,
        codigoAgrocalidad,
        nombreComun,
        matched,
        confidence,
        ...(subtipo ? { subtipo } : {})
    }));
}

/**
 * Hijas con cajas o stems > 0, agregadas por RUC de plantación + producto,
 * con el código Agrocalidad del mapeo (o el código original si no hay mapeo).
 */
export function aggregateHijas(hijas: FitoGuiaHija[], mappings: ProductMapping[]): GuiaHijaAgregada[] {
    const mappingLookup = new Map<string, string>();
    mappings.forEach(m => mappingLookup.set(m.originalCode, m.codigoAgrocalidad));

    const aggregationMap = new Map<string, GuiaHijaAgregada>();
    hijas
        .filter(h => h.detCajas > 0 || h.detNumStems > 0)
        .forEach(h => {
            const key = `${h.plaRUC || 'SIN_RUC'}|${h.proCodigo}`;
            const existing = aggregationMap.get(key);
            if (existing) {
                existing.detCajas += h.detCajas || 0;
                existing.detNumStems += h.detNumStems || 0;
            } else {
                aggregationMap.set(key, {
                    plaRUC: h.plaRUC || 'SIN_RUC',
                    plaNombre: h.plaNombre || '',
                    proCodigo: h.proCodigo,
                    codigoAgrocalidad: mappingLookup.get(h.proCodigo) || h.proCodigo,
                    detCajas: h.detCajas || 0,
                    detNumStems: h.detNumStems || 0
                });
            }
        });
    return Array.from(aggregationMap.values());
}
