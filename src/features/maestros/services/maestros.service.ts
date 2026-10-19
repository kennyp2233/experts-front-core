import api from '@/shared/services/api';
import type { EdicionMaestro, EntidadMaestro, FichaMaestro, FormularioMaestro, PaginaMaestro, ValoresMaestro } from '../types';

export const maestrosService = {
  entidades: async (): Promise<EntidadMaestro[]> => (await api.get('/maestros')).data,
  listar: async (entidad: string, q: string | undefined, page: number): Promise<PaginaMaestro> =>
    (await api.get(`/maestros/${entidad}`, { params: { ...(q ? { q } : {}), page } })).data,
  ficha: async (entidad: string, id: string | number): Promise<FichaMaestro> =>
    (await api.get(`/maestros/${entidad}/${encodeURIComponent(String(id))}`)).data,
  formulario: async (entidad: string): Promise<FormularioMaestro> => (await api.get(`/maestros/${entidad}/formulario`)).data,
  edicion: async (entidad: string, id: string | number): Promise<EdicionMaestro> =>
    (await api.get(`/maestros/${entidad}/${encodeURIComponent(String(id))}/edicion`)).data,
  crear: async (entidad: string, valores: ValoresMaestro): Promise<{ id: number }> =>
    (await api.post(`/maestros/${entidad}`, { valores })).data,
  actualizar: async (entidad: string, id: string | number, valores: ValoresMaestro): Promise<{ id: number }> =>
    (await api.put(`/maestros/${entidad}/${encodeURIComponent(String(id))}`, { valores })).data,
};
