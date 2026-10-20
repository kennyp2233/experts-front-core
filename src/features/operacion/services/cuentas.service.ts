import api from '@/shared/services/api';
import type {
  DaeFiltros,
  DaeRegistro,
  EstadoCorte,
  EstadoCuenta,
  FiltrosCuentas,
  LiquidacionGuia,
  NuevaDae,
  Ventas,
} from '../types/cuentas';

/** Quita los filtros vacíos para no mandar `?q=&idFinca=`. */
const params = (f: object) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false));

/** Baja un archivo que arma el servidor (Excel) sin tocar los bytes. */
const descargar = async (ruta: string, query: object, nombre: string): Promise<void> => {
  const r = await api.get(ruta, { params: params(query), responseType: 'blob', timeout: 120_000 });
  const url = URL.createObjectURL(r.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
};

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

export const cuentasService = {
  estadoCuenta: async (f: FiltrosCuentas & { idCliente: number }): Promise<EstadoCuenta> =>
    (await api.get('/operacion/cuentas/estado-cuenta', { params: params(f) })).data,

  descargarEstadoCuenta: (f: FiltrosCuentas & { idCliente: number }, cliente: string) =>
    descargar(
      '/operacion/cuentas/estado-cuenta.xlsx',
      f,
      `estado-de-cuenta-${slug(cliente) || f.idCliente}-${f.desde}-${f.hasta}.xlsx`,
    ),

  ventas: async (f: FiltrosCuentas): Promise<Ventas> =>
    (await api.get('/operacion/cuentas/ventas', { params: params(f) })).data,

  descargarVentas: (f: FiltrosCuentas) =>
    descargar('/operacion/cuentas/ventas.xlsx', f, `ventas-${f.desde}-${f.hasta}.xlsx`),

  liquidacionGuia: async (id: number): Promise<LiquidacionGuia> =>
    (await api.get(`/operacion/cuentas/guias/${id}`)).data,

  // ----- DAEs (oficina) -----

  listarDaes: async (f: DaeFiltros): Promise<DaeRegistro[]> =>
    (await api.get('/operacion/daes', { params: params(f) })).data,

  crearDae: async (dto: NuevaDae): Promise<{ id: number }> => (await api.post('/operacion/daes', dto)).data,

  quitarDae: async (id: number): Promise<void> => {
    await api.delete(`/operacion/daes/${id}`);
  },

  // ----- Corte definitivo -----

  estadoCorte: async (): Promise<EstadoCorte> => (await api.get('/operacion/corte-definitivo')).data,

  alinearContadores: async (): Promise<unknown> =>
    (await api.post('/operacion/corte-definitivo/alinear-contadores')).data,
};
