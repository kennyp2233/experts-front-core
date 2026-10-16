import api from '@/shared/services/api';
import type {
  CoordinacionArmada,
  CoordinacionDetalle,
  GuardarCoordinacionDto,
  Opcion,
  ParametrosCoordinacion,
  SugerenciaConsignatario,
  TipoOpcion,
  CoordinacionFiltros,
  CoordinacionPagina,
  GuiasMadreFiltros,
  GuiasMadrePagina,
  IngresoLoteDto,
  PrevisualizacionLote,
  ReporteValidacion,
  ResumenStockAerolinea,
  ValidacionCoordinacion,
} from '../types/coordinacion';

/** Quita los filtros vacíos para no mandar `?q=&estado=`. */
const params = (f: object) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const operacionService = {
  listarCoordinaciones: async (filtros: CoordinacionFiltros): Promise<CoordinacionPagina> =>
    (await api.get('/operacion/coordinaciones', { params: params(filtros) })).data,

  coordinacion: async (id: number): Promise<CoordinacionDetalle> =>
    (await api.get(`/operacion/coordinaciones/${id}`)).data,

  listarGuiasMadre: async (filtros: GuiasMadreFiltros): Promise<GuiasMadrePagina> =>
    (await api.get('/operacion/guias-madre', { params: params(filtros) })).data,

  resumenStock: async (): Promise<ResumenStockAerolinea[]> =>
    (await api.get('/operacion/guias-madre/resumen')).data,

  // Recorre todas las coordinaciones: puede tardar más que el timeout normal.
  previsualizarLote: async (dto: IngresoLoteDto): Promise<PrevisualizacionLote> =>
    (await api.post('/operacion/guias-madre/lotes/previsualizar', dto)).data,

  ingresarLote: async (dto: IngresoLoteDto): Promise<{ lote: { id: number }; guias: number }> =>
    (await api.post('/operacion/guias-madre/lotes', dto)).data,

  prestarGuia: async (id: number, dto: { fecha?: string; observaciones?: string }) =>
    (await api.post(`/operacion/guias-madre/${id}/prestamo`, dto)).data,

  devolverGuia: async (id: number, dto: { fecha?: string; observaciones?: string }) =>
    (await api.post(`/operacion/guias-madre/${id}/devolucion`, dto)).data,

  reporteValidacion: async (fresco = false): Promise<ReporteValidacion> =>
    (await api.get('/operacion/validacion', { params: fresco ? { fresco: true } : {}, timeout: 300_000 })).data,

  validacionCoordinacion: async (id: number): Promise<ValidacionCoordinacion> =>
    (await api.get(`/operacion/coordinaciones/${id}/validacion`)).data,

  // ----- Coordinar -----

  opciones: async (tipo: TipoOpcion, q: string, ids?: number[]): Promise<Opcion[]> =>
    (await api.get(`/operacion/opciones/${tipo}`, { params: params({ q, ids: ids?.join(',') }) })).data,

  sugerenciaConsignatario: async (id: number): Promise<SugerenciaConsignatario> =>
    (await api.get(`/operacion/opciones/consignatarios/${id}/sugerencia`)).data,

  parametrosCoordinacion: async (idAerolinea?: number | null): Promise<ParametrosCoordinacion> =>
    (await api.get('/operacion/coordinaciones/parametros', { params: params({ idAerolinea }) })).data,

  /** `id` al editar: la vista previa muestra los números de guía hija que se conservan. */
  simular: async (dto: GuardarCoordinacionDto, id?: number): Promise<CoordinacionArmada> =>
    (await api.post('/operacion/coordinaciones/simular', dto, { params: params({ id }) })).data,

  crearCoordinacion: async (dto: GuardarCoordinacionDto): Promise<{ id: number }> =>
    (await api.post('/operacion/coordinaciones', dto)).data,

  actualizarCoordinacion: async (id: number, dto: GuardarCoordinacionDto): Promise<{ id: number }> =>
    (await api.put(`/operacion/coordinaciones/${id}`, dto)).data,

  cortarCoordinacion: async (id: number): Promise<{ id: number; estado: 'CORTADO' }> =>
    (await api.post(`/operacion/coordinaciones/${id}/corte`)).data,

  anularCoordinacion: async (id: number): Promise<{ id: number; anulada: true }> =>
    (await api.delete(`/operacion/coordinaciones/${id}`)).data,
};
