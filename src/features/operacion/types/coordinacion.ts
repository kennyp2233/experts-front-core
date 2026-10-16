/** Tipos del API /operacion/coordinaciones (espejo de coordinaciones.types.ts del back). */

export interface RefMaestro {
  id: number;
  codigo: string | null;
  nombre: string;
  /** Nombre corto del sistema viejo (alias de finca o aerolínea), si es distinto del nombre. */
  alias?: string | null;
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
  /** Cliente de la marca ("Embarcador" en el sistema viejo). */
  cliente: RefMaestro | null;
  destino: RefMaestro | null;
  destinoFinal: RefMaestro | null;
  totalFulls: number | null;
  totalCajas: number | null;
  totalKgs: number | null;
  guiasHijas: number;
  liqTotal: number | null;
  /** Peso cobrable que da la aerolínea ("VOL." en la lista vieja). */
  pesoCobrable: number | null;
  corteExtra: boolean;
  /** Nota de la coordinación (p. ej. el termógrafo). */
  nota: string | null;
  /** Manifiesto aduanero, ej. "CEC-2026-5Y-050786-0043". */
  codigoManifiesto: string | null;
}

export interface CoordinacionPagina {
  items: CoordinacionResumen[];
  /** Totales de todo el filtro, como el pie de la lista vieja. */
  totales: { fulls: number; cajas: number; kgs: number; pesoCobrable: number };
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
  factura: string | null;
  /** "E" = la registró la finca por la web; "I" = transferencia interna; null = la oficina. */
  origen: string | null;
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

// ===== Guías AWB (Ingreso y Administración) =====

export type EstadoGuia = 'INGRESADA' | 'COORDINADA' | 'PRESTADA' | 'ANULADA';

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
  /** Ingreso de guías (CGU) con el que nació. */
  lote: { id: number; codigoAccess: number | null; numero: number | null; fecha: string | null } | null;
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

/** Estado del ingreso (catálogo del sistema viejo). CANCELADO = todas sus guías ya se usaron. */
export type EstadoIngreso = 'ANULADO' | 'INGRESADO' | 'GUIAS_COORDINADAS' | 'CANCELADO';
export type PestanaIngreso = 'todos' | 'activos' | 'cancelados' | 'anulados';

export interface GuiaDeIngreso {
  id: number;
  numero: string | null;
  estado: EstadoGuia | null;
  virtual: boolean;
  prestada: boolean;
  devuelta: boolean;
  fechaPrestamo: string | null;
  fechaDevolucion: string | null;
  observaciones: string | null;
  /** Coordinación que la usa: `id` null si todavía no está sincronizada. */
  coordinacion: { id: number | null; numero: number; fechaVuelo: string | null } | null;
}

/** Ingreso de guías: documento CGU del sistema viejo, con el que nace cada guía. */
export interface IngresoResumen {
  id: number;
  numero: number | null;
  origen: OrigenDocumento;
  fecha: string | null;
  aerolinea: RefMaestro | null;
  agencia: RefMaestro | null;
  referencia: string | null;
  tipoStock: 'NORMAL' | 'VIRTUAL' | null;
  estado: EstadoIngreso | null;
  guias: GuiaDeIngreso[];
}

export interface IngresoDetalle extends IngresoResumen {
  nota: string | null;
  conteo: { total: number; libres: number; coordinadas: number; prestamos: number; devoluciones: number; anuladas: number };
  estadoCalculado: EstadoIngreso | null;
  /** "Stock verificado": el estado guardado coincide con sus guías. */
  verificado: boolean;
  editable: boolean;
  auditoria: { creadoPor: string | null; creadoEn: string | null; actualizadoPor: string | null; actualizadoEn: string | null };
  /** Documento anterior / siguiente por N° (Anterior y Siguiente del sistema viejo). */
  anterior: { id: number; numero: number } | null;
  siguiente: { id: number; numero: number } | null;
}

export interface IngresosPagina {
  items: IngresoResumen[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IngresosFiltros {
  q?: string;
  pestana?: PestanaIngreso;
  idAerolinea?: number;
  page?: number;
  pageSize?: number;
}

export interface GuardarIngresoDto {
  fecha?: string;
  idAerolinea: number;
  idAgenciaIata?: number;
  referencia?: string;
  virtual: boolean;
  /** 8 dígitos (con el verificador) o 7. */
  guias: string[];
  nota?: string;
}

export interface PrevisualizacionIngreso {
  aerolinea: { id: number; nombre: string; codigo: string | null; prefijo: string };
  guias: Array<{ entrada: string; numero: string | null; texto: string | null; problema: string | null }>;
  revisadoSistemaViejo: boolean;
  ok: boolean;
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

export type TipoOpcion =
  | 'guias'
  | 'consignatarios'
  | 'fincas'
  | 'productos'
  | 'agencias'
  | 'aerolineas'
  | 'destinos'
  | 'tipos-embarque';

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
  /** Línea que ya existía: conserva quién y cuándo la registró. */
  idLinea?: number;
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
  factura?: string;
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
