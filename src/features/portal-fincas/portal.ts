import useSWR from 'swr';
import api from '@/shared/services/api';

export interface PerfilFinca {
  usuario: string;
  fincas: Array<{ id: number; nombre: string; razonSocial: string; ruc: string | null }>;
  kgPorCaja: number;
}

export interface GuiaAbierta {
  id: number;
  guia: string | null;
  fechaVuelo: string;
  marca: string | null;
  aerolinea: string | null;
  destino: string | null;
  destinoFinal: { codigo: string | null; nombre: string } | null;
  misLineas: number;
  misFulls: number;
  misCajas: number;
}

export interface LineaFinca {
  id: number;
  idFinca: number;
  finca: string | null;
  idProducto: number | null;
  producto: string | null;
  fulls: number | null;
  cantidadCajas: number;
  idTipoCaja: number | null;
  pesoKg: number | null;
  dae: string | null;
  factura: string | null;
  valor: number | null;
  tallos: number | null;
  nota: string | null;
  guiaHija: string;
  registro: string | null;
  editable: boolean;
}

export interface GuiaFinca {
  id: number;
  guia: string | null;
  fechaVuelo: string;
  marca: string | null;
  aerolinea: string | null;
  destino: { codigo: string | null; nombre: string } | null;
  destinoFinal: { codigo: string | null; nombre: string } | null;
  kgPorCaja: number;
  /** Los mismos tipos de caja y parámetros que usa la oficina al coordinar. */
  cajasPorFull: number;
  tiposCaja: Array<{ id: number; codigo: string | null; nombre: string; factorFull: number }>;
  fincas: Array<{
    id: number;
    nombre: string;
    productos: Array<{ id: number; nombre: string }>;
    dae: { dae: string; desde: string; hasta: string } | null;
  }>;
  lineas: LineaFinca[];
}

export interface CargaFinca {
  idFinca: number;
  idProducto: number;
  fulls: number;
  cantidadCajas: number;
  idTipoCaja?: number;
  pesoKg?: number;
  dae: string;
  factura?: string;
  valor?: number;
  tallos?: number;
}

export interface DaeRegistrada {
  id: number;
  idFinca: number | null;
  finca: string | null;
  pais: string;
  nombrePais: string;
  desde: string;
  hasta: string;
  dae: string;
  vigente: boolean;
  editable: boolean;
}

export const portalService = {
  perfil: async (): Promise<PerfilFinca> => (await api.get('/portal-fincas/perfil')).data,
  guias: async (): Promise<GuiaAbierta[]> => (await api.get('/portal-fincas/guias')).data,
  guia: async (id: number): Promise<GuiaFinca> => (await api.get(`/portal-fincas/guias/${id}`)).data,
  cargar: async (id: number, c: CargaFinca): Promise<GuiaFinca> => (await api.post(`/portal-fincas/guias/${id}/lineas`, c)).data,
  corregir: async (id: number, idLinea: number, c: CargaFinca): Promise<GuiaFinca> =>
    (await api.put(`/portal-fincas/guias/${id}/lineas/${idLinea}`, c)).data,
  borrar: async (id: number, idLinea: number): Promise<GuiaFinca> =>
    (await api.delete(`/portal-fincas/guias/${id}/lineas/${idLinea}`)).data,
  daes: async (): Promise<DaeRegistrada[]> => (await api.get('/portal-fincas/daes')).data,
  paises: async (): Promise<Array<{ codigo: string; nombre: string }>> => (await api.get('/portal-fincas/paises')).data,
  registrarDae: async (d: { idFinca: number; pais: string; desde: string; hasta: string; dae: string }) =>
    (await api.post('/portal-fincas/daes', d)).data,
  quitarDae: async (id: number) => (await api.delete(`/portal-fincas/daes/${id}`)).data,
};

const opciones = { revalidateOnFocus: true };
export const usePerfilFinca = () => useSWR<PerfilFinca>('portal/perfil', portalService.perfil, { revalidateOnFocus: false });
export const useGuiasAbiertas = () => useSWR<GuiaAbierta[]>('portal/guias', portalService.guias, opciones);
export const useGuiaFinca = (id: number) => useSWR<GuiaFinca>(['portal/guia', id], () => portalService.guia(id), opciones);
export const useDaesFinca = () => useSWR<DaeRegistrada[]>('portal/daes', portalService.daes, opciones);

/** "Viernes 16 de octubre": el día de vuelo como lo mostraba la web vieja. */
export function diaVuelo(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const t = new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }).format(d).replace(',', '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** "369-1176 3846". */
export const awb = (n: string | null) => {
  const d = (n ?? '').replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)} ${d.slice(7)}` : (n ?? '');
};
