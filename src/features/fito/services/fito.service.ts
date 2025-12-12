import api from '../../../shared/services/api';
import { FitoGuide, FitoGuiaHija, FitoJob, GenerateFitoDto, GenerationResponse } from '../types/fito.types';

export const fitoService = {
    getGuias: async (): Promise<FitoGuide[]> => {
        const { data } = await api.get<FitoGuide[]>('/fito/guias');
        return data;
    },

    getGuiasHijas: async (docNumero: number): Promise<FitoGuiaHija[]> => {
        const { data } = await api.get<FitoGuiaHija[]>(`/fito/guias/${docNumero}/hijas`);
        return data;
    },

    generate: async (dto: GenerateFitoDto): Promise<GenerationResponse> => {
        const { data } = await api.post<GenerationResponse>('/fito/generate', dto);
        return data;
    },

    getJobStatus: async (jobId: string): Promise<FitoJob> => {
        const { data } = await api.get<FitoJob>(`/fito/status/${jobId}`);
        return data;
    },

    downloadXml: async (jobId: string) => {
        return `/api/fito/download/${jobId}`;
    }
};

