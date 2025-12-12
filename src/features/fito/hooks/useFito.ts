import useSWR from 'swr';
import { fitoService } from '../services/fito.service';
import { FitoJob, FitoGuiaHija } from '../types/fito.types';

// Simple fetcher wrapper, or rely on service if SWR config differs
const fetcher = () => fitoService.getGuias();

export const useFitoGuias = () => {
    const { data, error, isLoading, mutate } = useSWR('/fito/guias', fetcher);

    return {
        guias: data,
        isLoading,
        isError: error,
        mutate
    };
};

export const useFitoGuiasHijas = (docNumero: number | null) => {
    const { data, error, isLoading } = useSWR<FitoGuiaHija[]>(
        docNumero ? `/fito/guias/${docNumero}/hijas` : null,
        () => fitoService.getGuiasHijas(docNumero!)
    );

    // Filter out hijas with 0 stems or 0 cajas
    const filteredHijas = (data || []).filter(
        (hija) => hija.detNumStems > 0 && hija.detCajas > 0
    );

    return {
        hijas: filteredHijas,
        isLoading,
        isError: error
    };
};

export const useFitoJob = (jobId: string | null) => {
    const { data, error, isLoading } = useSWR<FitoJob>(
        jobId ? `/fito/status/${jobId}` : null,
        () => fitoService.getJobStatus(jobId!),
        {
            refreshInterval: (data) => {
                // Stop polling if completed or failed
                if (data && (data.status === 'completed' || data.status === 'failed')) return 0;
                return 1000; // Poll every 1s
            }
        }
    );

    return {
        job: data,
        isLoading,
        isError: error
    };
};

