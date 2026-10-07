import api from '../../../shared/services/api';
import {
    FitoDestino, FitoGuide, FitoGuiaHija, FitoJob, GenerateFitoDto, GenerationResponse,
    ProductCatalogItem, PuertoEcuador, PuertoInternacional, RememberedMapping
} from '../types/fito.types';

export const fitoService = {
    getGuias: async (): Promise<FitoGuide[]> => {
        const { data } = await api.get<FitoGuide[]>('/fito/guias');
        return data;
    },

    getGuiasHijas: async (docNumero: number): Promise<FitoGuiaHija[]> => {
        const { data } = await api.get<FitoGuiaHija[]>(`/fito/guias/${docNumero}/hijas`);
        return data;
    },

    /** Destino de PIN_auxDestinos por código (docFITODestino de la guía). */
    getDestino: async (codigo: string): Promise<FitoDestino | null> => {
        const { data } = await api.get<FitoDestino | null>(`/fito/destino/${encodeURIComponent(codigo)}`);
        return data;
    },

    /** Mapeo recomendado por producto: recordado de generaciones anteriores o sugerido por el catálogo. */
    getSugerencias: async (codigos: string[]): Promise<RememberedMapping[]> => {
        const { data } = await api.get<RememberedMapping[]>(
            `/fito/mapeos/sugerencias?codigos=${encodeURIComponent(codigos.join(','))}`
        );
        return Array.isArray(data) ? data : [];
    },

    generate: async (dto: GenerateFitoDto): Promise<GenerationResponse> => {
        const { data } = await api.post<GenerationResponse>('/fito/generate', dto);
        return data;
    },

    getJobStatus: async (jobId: string): Promise<FitoJob> => {
        const { data } = await api.get<FitoJob>(`/fito/status/${jobId}`);
        return data;
    },

    /**
     * Descarga los XML del job como archivos. Pasa por axios (no window.open)
     * para que el interceptor renueve la sesión si el access token expiró, y
     * para que el navegador no lo bloquee como popup.
     */
    downloadXmls: async (jobId: string): Promise<number> => {
        const { data } = await api.get<{ filename: string; xmlContent: string }[]>(
            `/fito/xmls/${encodeURIComponent(jobId)}`
        );
        const files = Array.isArray(data) ? data : [];
        files.forEach(({ filename, xmlContent }) =>
            saveFile(new Blob([xmlContent], { type: 'application/xml' }), filename)
        );
        return files.length;
    }
};

function saveFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export const fitoCatalogService = {
    getPuertosEcuador: async (): Promise<PuertoEcuador[]> => {
        const { data } = await api.get<PuertoEcuador[]>('/catalogs/puertos?esEcuador=true');
        return data;
    },

    searchPuertosInternacionales: async (q: string): Promise<PuertoInternacional[]> => {
        const { data } = await api.get<PuertoInternacional[]>(
            `/catalogs/puertos/search?q=${encodeURIComponent(q)}&esEcuador=false`
        );
        return data;
    },

    getSubtipos: async (): Promise<string[]> => {
        const { data } = await api.get<string[]>('/catalogs/productos/subtipos');
        return data;
    },

    autocompleteProductos: async (q: string, subtipo: string): Promise<ProductCatalogItem[]> => {
        const { data } = await api.get<ProductCatalogItem[]>(
            `/catalogs/productos/autocomplete?q=${encodeURIComponent(q)}&subtipo=${encodeURIComponent(subtipo)}`
        );
        return data;
    }
};
