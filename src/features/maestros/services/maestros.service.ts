import api from '@/shared/services/api';
import type { EntidadMaestro, FichaMaestro, PaginaMaestro } from '../types';

export const maestrosService = {
  entidades: async (): Promise<EntidadMaestro[]> => (await api.get('/maestros')).data,
  listar: async (entidad: string, q: string | undefined, page: number): Promise<PaginaMaestro> =>
    (await api.get(`/maestros/${entidad}`, { params: { ...(q ? { q } : {}), page } })).data,
  ficha: async (entidad: string, id: string | number): Promise<FichaMaestro> =>
    (await api.get(`/maestros/${entidad}/${encodeURIComponent(String(id))}`)).data,
};
