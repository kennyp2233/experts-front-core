import { useMemo } from 'react';
import useSWR from 'swr';
import { fitoService } from '../services/fito.service';
import { FitoJob, FitoGuiaHija, RememberedMapping } from '../types/fito.types';

// Simple fetcher wrapper, or rely on service if SWR config differs
const fetcher = () => fitoService.getGuias();

const NO_HIJAS: FitoGuiaHija[] = [];
const NO_MAPEOS: RememberedMapping[] = [];

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
    const { data, error, isLoading, mutate } = useSWR<FitoGuiaHija[]>(
        docNumero ? `/fito/guias/${docNumero}/hijas` : null,
        () => fitoService.getGuiasHijas(docNumero!)
    );

    // Filter out hijas with 0 stems or 0 cajas.
    // Memoizado: devolver un array nuevo en cada render hacía que los efectos
    // que dependían de `hijas` se dispararan en bucle.
    const filteredHijas = useMemo(
        () => (data ? data.filter((hija) => hija.detNumStems > 0 && hija.detCajas > 0) : NO_HIJAS),
        [data]
    );

    return {
        hijas: filteredHijas,
        isLoading,
        isError: error,
        mutate
    };
};

/**
 * Mapeos recordados para los códigos de producto dados. Si el endpoint falla
 * devuelve [] sin error: el usuario simplemente mapea a mano.
 */
export const useRememberedMappings = (codigos: string[], enabled: boolean) => {
    const key = enabled && codigos.length > 0 ? ['/fito/mapeos', codigos.join(',')] : null;
    const { data, isLoading } = useSWR<RememberedMapping[]>(
        key,
        () => fitoService.getMapeos(codigos).catch(() => NO_MAPEOS),
        { shouldRetryOnError: false, revalidateOnFocus: false }
    );

    return {
        remembered: data ?? NO_MAPEOS,
        isLoading
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
