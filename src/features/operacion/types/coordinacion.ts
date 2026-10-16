/** Tipos del API /operacion/coordinaciones (espejo de coordinaciones.types.ts del back). */

export interface RefMaestro {
  id: number;
  codigo: string | null;
  nombre: string;
}

export type EstadoCoordinacion = 'BORRADOR' | 'CORTADO' | 'ANULADO';
/** ACCESS = viene del sistema viejo (sync); SISTEMA = creada en el sistema nuevo. */
export type OrigenDocumento = 'ACCESS' | 'SISTEMA';

export interface CoordinacionResumen {
  id: number;
  codigoAccess: number | null;
  origen: OrigenDocumento;
  numeroGuia: string | null;
  estado: EstadoCoordinacion;
  fechaVuelo: string;
  fechaAsignacion: string;
  aerolinea: RefMaestro | null;
  consignatario: RefMaestro | null;
  destino: RefMaestro | null;
  destinoFinal: RefMaestro | null;
  totalFulls: number | null;
  totalCajas: number | null;
  totalKgs: number | null;
  guiasHijas: number;
  liqTotal: number | null;
  corteExtra: boolean;
}

export interface CoordinacionPagina {
  items: CoordinacionResumen[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CoordinacionFiltros {
  q?: string;
  estado?: EstadoCoordinacion;
  desde?: string;
  hasta?: string;
  idAerolinea?: number;
  idConsignatario?: number;
  idDestino?: number;
  page?: number;
  pageSize?: number;
}

export interface Liquidacion {
  tipo: 'NORMAL' | 'CORTE_EXTRA';
  pesoCobrable: number | null;
  tarifa: number | null;
  guiaAerea: number | null;
  combustible: number | null;
  seguridad: number | null;
  otros: number | null;
  iva: number | null;
  handling: number | null;
  cargoAwa: number | null;
  cargoCha: number | null;
  cargoPca: number | null;
  cargoTax: number | null;
  cargoMma: number | null;
  cargoHawb: number | null;
  cargoFitos: number | null;
  aux1: number | null;
  aux2: number | null;
  aux3Handling: number | null;
  calAux: number | null;
  auxOtros: number | null;
  tarifaAcordada: number | null;
  calculaPca: boolean | null;
  /** Calculado por el servidor con las fórmulas del sistema viejo. */
  resumen: ResumenLiquidacion;
}

export interface TramoRuta {
  orden: number | null;
  tipoRuta: string;
  codigo: string | null;
  vuelo: string | null;
  fechaHoraSalida: string | null;
  fechaHoraLlegada: string | null;
  salidaTipo: string | null;
  llegadaTipo: string | null;
}

export interface LineaGuiaHija {
  id: number;
  numeroLinea: number | null;
  producto: RefMaestro | null;
  codigoProducto: string | null;
  tipoCaja: { id: number; codigo: string | null; nombre: string } | null;
  cantidadCajas: number;
  fulls: number | null;
  pesoKg: number | null;
  tallos: number | null;
  valor: number | null;
  dae: string | null;
  largo: number | null;
  ancho: number | null;
  alto: number | null;
  nota: string | null;
  usuario: string | null;
  fechaRegistro: string | null;
}

export interface GuiaHija {
  id: number;
  numeroGuiaHija: string;
  dae: string | null;
  finca: RefMaestro | null;
  consignatario: RefMaestro | null;
  pesoBruto: number;
  totalPiezas: number;
  totalFulls: number;
  lineas: LineaGuiaHija[];
}

export interface CoordinacionDetalle extends CoordinacionResumen {
  agencia: RefMaestro | null;
  tipoEmbarque: RefMaestro | null;
  pago: 'PREPAID' | 'COLLECT';
  referencia: string | null;
  nota: string | null;
  totalVolumen: number | null;
  cupoFulls: number | null;
  guiaMadre: {
    id: number;
    numero: string | null;
    estado: string | null;
    virtual: boolean | null;
    lote: { id: number; codigoAccess: number | null; fecha: string | null } | null;
  };
  liquidacion: {
    fulls: number | null;
    piezas: number | null;
    pesoBruto: number | null;
    pesoCobrable: number | null;
    tarifa: number | null;
    flete: number | null;
    dueAgent: number | null;
    dueCarrier: number | null;
    total: number | null;
    comision: number | null;
    incentivo: number | null;
  };
  certificadoOrigen: string | null;
  liquidaciones: Liquidacion[];
  rutas: TramoRuta[];
  manifiesto: {
    origen: string | null;
    aduana: string | null;
    anio: string | null;
    tipo: string | null;
    numero: string | null;
    vuelo: string | null;
    fechaArribo: string | null;
    horaArribo: string | null;
    secuencial: string | null;
    referencia: string | null;
  } | null;
  marcas: Array<{ orden: number; consignatario: RefMaestro | null }>;
  medidas: Array<{
    orden: number;
    largo: number | null;
    ancho: number | null;
    alto: number | null;
    fulls: number | null;
    piezas: number | null;
    kgs: number | null;
  }>;
  guias: GuiaHija[];
  datosLegacy: Record<string, unknown> | null;
  auditoria: {
    creadoPor: string | null;
    creadoEn: string | null;
    actualizadoPor: string | null;
    actualizadoEn: string | null;
  };
}

// ===== Stock de guías AWB =====

export type EstadoGuia = 'INGRESADA' | 'COORDINADA' | 'PRESTADA';

export interface GuiaMadreFila {
  id: number;
  numero: string | null;
  aerolinea: RefMaestro | null;
  estado: EstadoGuia | null;
  virtual: boolean;
  prestada: boolean;
  devuelta: boolean;
  fechaPrestamo: string | null;
  fechaDevolucion: string | null;
  observaciones: string | null;
  lote: { id: number; codigoAccess: number | null; fecha: string | null } | null;
  coordinacion: { id: number; codigoAccess: number | null; fechaVuelo: string } | null;
}

export interface GuiasMadrePagina {
  items: GuiaMadreFila[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GuiasMadreFiltros {
  q?: string;
  estado?: EstadoGuia;
  idAerolinea?: number;
  virtual?: 'true' | 'false';
  page?: number;
  pageSize?: number;
}

export interface ResumenStockAerolinea {
  aerolinea: RefMaestro | null;
  disponibles: number;
  disponiblesVirtuales: number;
  coordinadas: number;
  prestadas: number;
  total: number;
}

// ===== Validación contra el sistema viejo =====

export interface ResultadoRegla {
  ok: boolean;
  esperado: unknown;
  calculado: unknown;
  nota?: string;
}

export interface ResumenRegla {
  id: string;
  nombre: string;
  descripcion: string;
  evaluadas: number;
  coinciden: number;
  porcentaje: number | null;
  diferencias: Array<{
    id: number;
    codigoAccess: number | null;
    numeroGuia: string | null;
    esperado: unknown;
    calculado: unknown;
    nota?: string;
  }>;
}

export interface ReporteValidacion {
  generadoEn: string;
  ms: number;
  coordinaciones: number;
  reglas: ResumenRegla[];
}

export interface ValidacionCoordinacion {
  id: number;
  reglas: Array<{ id: string; nombre: string; descripcion: string; resultado: ResultadoRegla | null }>;
}

export interface IngresoLoteDto {
  idAerolinea: number;
  /** 8 dígitos con verificador o 7 sin él. */
  primeraGuia: string;
  cantidad: number;
  virtual?: boolean;
  fecha?: string;
  referencia?: string;
  nota?: string;
}

export interface PrevisualizacionLote {
  aerolinea: { id: number; nombre: string; codigo: string | null; prefijoAwb: string | null };
  guias: Array<{ numero: string; texto: string }>;
  repetidas: string[];
}

// ===== Coordinar (crear / editar / cortar) =====

/** Opción de los buscadores de /operacion/opciones/:tipo. */
export interface Opcion {
  id: number;
  codigo: string | null;
  nombre: string;
  detalle: string | null;
  extra?: Record<string, unknown>;
}

export type TipoOpcion = 'guias' | 'consignatarios' | 'fincas' | 'productos' | 'agencias' | 'destinos' | 'tipos-embarque';

export const CODIGOS_AGENCIA = ['cargoAwa', 'cargoCha', 'cargoPca', 'cargoTax', 'cargoMma', 'cargoHawb', 'cargoFitos'] as const;
export type CodigoAgencia = (typeof CODIGOS_AGENCIA)[number];
export const CONCEPTOS_AEROLINEA = ['guiaAerea', 'combustible', 'seguridad', 'otros', 'aux1', 'aux2', 'calAux'] as const;
export type ConceptoAerolineaCampo = (typeof CONCEPTOS_AEROLINEA)[number];

export interface ParametrosCoordinacion {
  lineas: { cajasPorFull: number; kgPorCaja: number; tallosPorFull: number; valorPorCaja: number };
  tiposCaja: Array<{ id: number; codigo: string | null; nombre: string; factorFull: number }>;
  etiquetasAgencia: Record<CodigoAgencia, string>;
  aerolinea: {
    id: number;
    tarifa: number | null;
    pca: number | null;
    conceptos: Array<{
      campo: ConceptoAerolineaCampo | 'iva';
      abreviatura: string | null;
      valor: number;
      porPeso: boolean;
      sobrePesoCobrable: boolean;
    }>;
  } | null;
}

/** Valores digitados de una liquidación (juego normal o corte extra). */
export type ValoresLiquidacion = Partial<
  Record<'pesoCobrable' | 'tarifa' | ConceptoAerolineaCampo | 'iva' | CodigoAgencia | 'aux3Handling' | 'auxOtros' | 'tarifaAcordada', number>
>;

export interface LineaCoordinacionDto {
  idFinca: number;
  idProducto: number;
  idConsignatario?: number;
  cantidadCajas: number;
  fulls?: number;
  idTipoCaja?: number;
  pesoKg: number;
  tallos?: number;
  valor?: number;
  dae: string;
  largo?: number;
  ancho?: number;
  alto?: number;
  nota?: string;
}

export interface GuardarCoordinacionDto {
  idGuiaMadre: number;
  idConsignatario: number;
  idAgenciaIata: number;
  idDestinoAwb: number;
  idDestinoFinalDocs?: number;
  idTipoEmbarque?: number;
  pago: 'PREPAID' | 'COLLECT';
  fechaVuelo: string;
  referencia?: string;
  nota?: string;
  lineas: LineaCoordinacionDto[];
  /** Lo que cobra la aerolínea (guía madre). */
  liquidacion?: ValoresLiquidacion;
  /** Lo que se le cobra al cliente, si es distinto (Access: "corte extra"). */
  cobroCliente?: ValoresLiquidacion;
  /** Vuelo y manifiesto (los da la aerolínea). */
  vuelo?: { vuelo?: string; salida?: string; llegada?: string; numeroManifiesto?: string; secuencial?: string };
}

export interface ResumenLiquidacion {
  pesoCobrable: number | null;
  tarifa: number | null;
  flete: number | null;
  dueCarrier: number;
  dueAgent: number;
  iva: number;
  total: number | null;
}

/** Resultado de POST /simular: lo que se guardaría. */
export interface CoordinacionArmada {
  guiasHijas: Array<{
    clave: string;
    numeroGuiaHija: string | null;
    idFinca: number;
    idConsignatario: number;
    dae: string;
    pesoBruto: number;
    totalPiezas: number;
    totalFulls: number;
    lineas: Array<LineaCoordinacionDto & { codigoProducto: string | null; fullsCalculados: number }>;
  }>;
  totales: { cajas: number; fulls: number; kgs: number; volumen: number };
  /** La que vale: la del cliente si se cobra distinto, si no la de la guía madre. */
  liquidacion: ResumenLiquidacion;
  aerolinea: ResumenLiquidacion;
  cliente: ResumenLiquidacion | null;
  /** Ganancia: cobro al cliente − guía madre. */
  diferencia: { tarifa: number | null; flete: number | null; total: number | null } | null;
  sugerida: ValoresLiquidacion;
  /** Cobro al cliente propuesto: lo de la última guía de la misma marca. */
  sugeridaCliente: {
    valores: ValoresLiquidacion;
    desde: { id: number; numeroGuia: string | null; fechaVuelo: string };
  } | null;
  advertencias: string[];
}

/** Vista previa del archivo de manifiesto para FlowerCargo. */
export interface ArchivoFlowerCargo {
  nombreArchivo: string;
  filas: Array<{
    linea: number;
    guiaHija: string;
    /** Guías hijas nuestras que van juntas en la fila (mismo RUC de finca). */
    guiasAgrupadas: string[];
    finca: string;
    ruc: string | null;
    piezas: number;
    kg: number;
    dae: string | null;
  }>;
  advertencias: string[];
}

export interface SugerenciaConsignatario {
  idDestinoFinalDocs: number | null;
  ultima: {
    idAgenciaIata: number | null;
    idDestinoAwb: number | null;
    idDestinoFinalDocs: number | null;
    idTipoEmbarque: number | null;
    pago: 'PREPAID' | 'COLLECT';
    idAerolinea: number | null;
    fechaVuelo: string;
  } | null;
}
