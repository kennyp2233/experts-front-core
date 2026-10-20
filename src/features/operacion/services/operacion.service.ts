import api from '@/shared/services/api';
import type {
  ArchivoFlowerCargo,
  CoordinacionAnulada,
  CoordinacionArmada,
  CoordinacionDetalle,
  CorregirCoordinacionDto,
  GuardarCoordinacionDto,
  Opcion,
  ParametrosCoordinacion,
  SugerenciaConsignatario,
  TipoOpcion,
  CoordinacionFiltros,
  CoordinacionPagina,
  GuiasMadreFiltros,
  GuiasMadrePagina,
  GuardarIngresoDto,
  IngresoDetalle,
  IngresosFiltros,
  IngresosPagina,
  PrevisualizacionIngreso,
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

  // ----- Ingreso de guías (documentos CGU) -----

  listarIngresos: async (filtros: IngresosFiltros): Promise<IngresosPagina> =>
    (await api.get('/operacion/guias-madre/ingresos', { params: params(filtros) })).data,

  ingreso: async (id: number): Promise<IngresoDetalle> => (await api.get(`/operacion/guias-madre/ingresos/${id}`)).data,

  /** Revisa formato, verificador y repetidas (aquí y en el sistema viejo). `id` al modificar. */
  previsualizarIngreso: async (dto: GuardarIngresoDto, id?: number): Promise<PrevisualizacionIngreso> =>
    (await api.post('/operacion/guias-madre/ingresos/previsualizar', dto, { params: params({ id }) })).data,

  crearIngreso: async (dto: GuardarIngresoDto): Promise<{ id: number; numero: number }> =>
    (await api.post('/operacion/guias-madre/ingresos', dto)).data,

  actualizarIngreso: async (id: number, dto: GuardarIngresoDto): Promise<{ id: number; numero: number }> =>
    (await api.put(`/operacion/guias-madre/ingresos/${id}`, dto)).data,

  anularIngreso: async (id: number) => (await api.delete(`/operacion/guias-madre/ingresos/${id}`)).data,

  corregirEstadoIngreso: async (id: number): Promise<IngresoDetalle> =>
    (await api.post(`/operacion/guias-madre/ingresos/${id}/corregir-estado`)).data,

  // ----- Administración de guías -----

  prestarGuia: async (id: number, dto: { fecha?: string; observaciones?: string }) =>
    (await api.post(`/operacion/guias-madre/${id}/prestamo`, dto)).data,

  quitarPrestamo: async (id: number) => (await api.delete(`/operacion/guias-madre/${id}/prestamo`)).data,

  devolverGuia: async (id: number, dto: { fecha?: string; observaciones?: string }) =>
    (await api.post(`/operacion/guias-madre/${id}/devolucion`, dto)).data,

  verificarGuia: async (id: number) => (await api.post(`/operacion/guias-madre/${id}/verificar`)).data,

  reporteValidacion: async (fresco = false): Promise<ReporteValidacion> =>
    (await api.get('/operacion/validacion', { params: fresco ? { fresco: true } : {}, timeout: 300_000 })).data,

  validacionCoordinacion: async (id: number): Promise<ValidacionCoordinacion> =>
    (await api.get(`/operacion/coordinaciones/${id}/validacion`)).data,

  // ----- Coordinar -----

  /** `idAerolinea` (solo guías): las libres de esa aerolínea. */
  opciones: async (tipo: TipoOpcion, q: string, ids?: number[], idAerolinea?: number | null, limite?: number): Promise<Opcion[]> =>
    (await api.get(`/operacion/opciones/${tipo}`, { params: params({ q, ids: ids?.join(','), idAerolinea, limite }) })).data,

  /** DAE vigente de cada finca para el destino y la fecha de vuelo (registro de DAEs, como el F2 del viejo). */
  daesVigentes: async (
    fincas: number[],
    idDestino: number,
    fecha: string,
  ): Promise<Record<number, { dae: string; desde: string; hasta: string } | null>> =>
    (await api.get('/operacion/opciones/daes', { params: { fincas: fincas.join(','), idDestino, fecha } })).data,

  sugerenciaConsignatario: async (id: number): Promise<SugerenciaConsignatario> =>
    (await api.get(`/operacion/opciones/consignatarios/${id}/sugerencia`)).data,

  parametrosCoordinacion: async (idAerolinea?: number | null): Promise<ParametrosCoordinacion> =>
    (await api.get('/operacion/coordinaciones/parametros', { params: params({ idAerolinea }) })).data,

  /** `id` al editar: la vista previa muestra los números de guía hija que se conservan. */
  simular: async (dto: GuardarCoordinacionDto, id?: number): Promise<CoordinacionArmada> =>
    (await api.post('/operacion/coordinaciones/simular', dto, { params: params({ id }) })).data,

  crearCoordinacion: async (dto: GuardarCoordinacionDto): Promise<{ id: number; numero?: number | null }> =>
    (await api.post('/operacion/coordinaciones', dto)).data,

  actualizarCoordinacion: async (id: number, dto: GuardarCoordinacionDto): Promise<{ id: number }> =>
    (await api.put(`/operacion/coordinaciones/${id}`, dto)).data,

  cortarCoordinacion: async (id: number): Promise<{ id: number; estado: 'CORTADO' }> =>
    (await api.post(`/operacion/coordinaciones/${id}/corte`)).data,

  anularCoordinacion: async (id: number, motivo?: string): Promise<{ id: number; anulada: true }> =>
    (await api.delete(`/operacion/coordinaciones/${id}`, { params: params({ motivo }) })).data,

  coordinacionesAnuladas: async (desde?: string, hasta?: string): Promise<CoordinacionAnulada[]> =>
    (await api.get('/operacion/coordinaciones/anuladas', { params: params({ desde, hasta }) })).data,

  /** Factura / nota de las líneas y nota de la guía (también después del corte). */
  corregirCoordinacion: async (id: number, dto: CorregirCoordinacionDto): Promise<{ id: number }> =>
    (await api.patch(`/operacion/coordinaciones/${id}`, dto)).data,

  /** Pasa líneas a otra coordinación abierta (las dos se recalculan). */
  transferirLineas: async (id: number, idDestino: number, idsLinea: number[]) =>
    (await api.post(`/operacion/coordinaciones/${id}/transferir`, { idDestino, idsLinea })).data as {
      idOrigen: number;
      idDestino: number;
      lineas: number;
    },

  archivoFlowerCargo: async (id: number): Promise<ArchivoFlowerCargo> =>
    (await api.get(`/operacion/coordinaciones/${id}/flowercargo`)).data,

  /** Descarga el .txt tal cual lo arma el servidor (sin tocar bytes ni fin de línea). */
  descargarFlowerCargo: async (id: number, nombre: string): Promise<void> => {
    const r = await api.get(`/operacion/coordinaciones/${id}/flowercargo.txt`, { responseType: 'blob' });
    const url = URL.createObjectURL(r.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  },

  /** Excel del día de vuelo, como los botones de la lista vieja. */
  descargarReporteDia: async (
    tipo: 'programacion' | 'antinarcoticos',
    dia: string,
    idAerolinea?: number,
  ): Promise<void> => {
    const r = await api.get(`/operacion/coordinaciones/reportes/${tipo}`, {
      params: params({ dia, idAerolinea }),
      responseType: 'blob',
    });
    const url = URL.createObjectURL(r.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tipo}-${dia}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
