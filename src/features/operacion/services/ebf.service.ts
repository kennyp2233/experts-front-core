import api from '@/shared/services/api';
import type {
  ColaEbf,
  EquivalenciaEbf,
  EstadoEbfCoordinacion,
  OpcionEbf,
  ResultadoAprenderEbf,
  ResultadoEnvioEbf,
  SimulacionEbf,
  TipoEquivalenciaEbf,
} from '../types/ebf';

/** Leer EBF y enviar pueden tardar (el portal es lento): sin el timeout corto por defecto. */
const LENTO = { timeout: 5 * 60_000 };

export const ebfService = {
  cola: async (): Promise<ColaEbf> => (await api.get('/operacion/ebf/cola', LENTO)).data,

  estado: async (id: number, fresco = false): Promise<EstadoEbfCoordinacion> =>
    (await api.get(`/operacion/ebf/coordinaciones/${id}`, { ...LENTO, params: fresco ? { fresco: 1 } : {} })).data,

  /** "Revisar EBF" / "Ya lo hice en EBF": relee en vivo. */
  revisar: async (id: number): Promise<EstadoEbfCoordinacion> =>
    (await api.post(`/operacion/ebf/coordinaciones/${id}/revisar`, {}, LENTO)).data,

  simular: async (id: number): Promise<SimulacionEbf> =>
    (await api.post(`/operacion/ebf/coordinaciones/${id}/simular`, {}, LENTO)).data,

  enviar: async (id: number): Promise<ResultadoEnvioEbf> =>
    (await api.post(`/operacion/ebf/coordinaciones/${id}/enviar`, {}, LENTO)).data,

  omitir: async (idLinea: number): Promise<EstadoEbfCoordinacion> =>
    (await api.post(`/operacion/ebf/lineas/${idLinea}/omitir`, {}, LENTO)).data,

  reactivar: async (idLinea: number): Promise<EstadoEbfCoordinacion> =>
    (await api.delete(`/operacion/ebf/lineas/${idLinea}/omitir`, LENTO)).data,

  equivalencias: async (tipo?: TipoEquivalenciaEbf): Promise<EquivalenciaEbf[]> =>
    (await api.get('/operacion/ebf/equivalencias', { params: tipo ? { tipo } : {} })).data,

  opciones: async (tipo: TipoEquivalenciaEbf): Promise<OpcionEbf[]> =>
    (await api.get(`/operacion/ebf/equivalencias/opciones/${tipo}`, LENTO)).data,

  fijar: async (tipo: TipoEquivalenciaEbf, idLocal: number, ebfNombre: string, ebfId?: number): Promise<void> => {
    await api.put(`/operacion/ebf/equivalencias/${tipo}/${idLocal}`, { ebfNombre, ...(ebfId ? { ebfId } : {}) }, LENTO);
  },

  confirmar: async (tipo: TipoEquivalenciaEbf, idLocal: number): Promise<void> => {
    await api.post(`/operacion/ebf/equivalencias/${tipo}/${idLocal}/confirmar`, {}, LENTO);
  },

  quitar: async (tipo: TipoEquivalenciaEbf, idLocal: number): Promise<void> => {
    await api.delete(`/operacion/ebf/equivalencias/${tipo}/${idLocal}`);
  },

  aprender: async (dias = 45): Promise<ResultadoAprenderEbf> =>
    (await api.post('/operacion/ebf/equivalencias/aprender', { dias }, { timeout: 15 * 60_000 })).data,
};
