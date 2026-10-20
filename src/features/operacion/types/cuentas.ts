import type { CodigoAgencia, ConceptoAerolineaCampo, RefMaestro } from './coordinacion';

/**
 * Cobro al cliente de una guía (GET /operacion/cuentas/*). Los valores son los
 * del cliente (corte extra, si la guía lo tiene); el costo de la aerolínea va
 * aparte y el handling de Experts es un renglón más, fuera del total de la guía.
 */
export interface CobroGuia {
  id: number;
  numero: number;
  numeroGuia: string | null;
  fechaVuelo: string;
  estado: string;
  aerolinea: RefMaestro | null;
  marca: RefMaestro | null;
  cliente: RefMaestro | null;
  destino: RefMaestro | null;
  piezas: number;
  fulls: number;
  pesoBruto: number;
  juego: 'CORTE_EXTRA' | 'NORMAL';
  pesoCobrable: number | null;
  tarifa: number | null;
  flete: number;
  cargosAerolinea: Record<ConceptoAerolineaCampo, number>;
  dueCarrier: number;
  cargosAgencia: Record<CodigoAgencia, number>;
  dueAgent: number;
  iva: number;
  /** Flete + cargos de aerolínea + cargos de agencia + IVA. */
  totalGuia: number;
  handling: number;
  /** Total de la guía + handling. */
  totalCobrar: number;
}

export interface ClienteFactura {
  nombre: string;
  ruc: string | null;
  direccion: string | null;
  telefono: string | null;
  ciudad: string | null;
  pais: string | null;
  email?: string | null;
}

/** Datos del emisor (parámetros EMPRESA.* del sistema viejo). */
export interface EmpresaEmisor {
  nombre: string;
  ruc: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  telefono?: string;
}

export type EtiquetasAgencia = Record<CodigoAgencia, string>;

export interface TotalesEstadoCuenta {
  guias: number;
  piezas: number;
  fulls: number;
  pesoBruto: number;
  flete: number;
  dueCarrier: number;
  dueAgent: number;
  iva: number;
  totalGuia: number;
  handling: number;
  totalCobrar: number;
}

export interface EstadoCuenta {
  cliente: (ClienteFactura & { id: number; nombreFactura: string | null }) | null;
  desde: string;
  hasta: string;
  etiquetasAgencia: EtiquetasAgencia;
  filas: CobroGuia[];
  totales: TotalesEstadoCuenta;
}

export interface FilaVentas extends CobroGuia {
  costoAerolinea: number;
  ganancia: number;
}

export interface ResumenVentas {
  nombre: string;
  guias: number;
  pesoCobrable: number;
  costo: number;
  cobrado: number;
  handling: number;
  ganancia: number;
}

export interface Ventas {
  desde: string;
  hasta: string;
  etiquetasAgencia: EtiquetasAgencia;
  filas: FilaVentas[];
  porAerolinea: ResumenVentas[];
  porCliente: ResumenVentas[];
  totales: {
    guias: number;
    pesoCobrable: number;
    costoAerolinea: number;
    totalGuia: number;
    handling: number;
    totalCobrar: number;
    ganancia: number;
  };
}

/** GET /operacion/cuentas/guias/:id */
export interface LiquidacionGuia extends CobroGuia {
  clienteFactura: ClienteFactura | null;
  etiquetasAgencia: EtiquetasAgencia;
  /** Si el back la manda, no hace falta pedirla aparte. */
  empresa?: EmpresaEmisor;
}

export interface FiltrosCuentas {
  idCliente?: number;
  idAerolinea?: number;
  desde: string;
  hasta: string;
  /** Incluye las guías que aún no se cortan (valores provisorios). */
  incluirAbiertas?: boolean;
}

// ----- DAEs -----

export type OrigenRegistroDae = 'SISTEMA' | 'SISTEMA_VIEJO';

export interface DaeRegistro {
  id: number;
  idFinca: number;
  finca: string;
  pais: string;
  nombrePais: string | null;
  desde: string;
  hasta: string;
  dae: string;
  vigente: boolean;
  registradoPor: string | null;
  origenRegistro: OrigenRegistroDae;
  editable: boolean;
}

export interface DaeFiltros {
  idFinca?: number;
  q?: string;
  vigentes?: boolean;
}

export interface NuevaDae {
  idFinca: number;
  pais: string;
  desde: string;
  hasta: string;
  dae: string;
}

// ----- Corte definitivo -----

export interface ContadorCorte {
  clave: string;
  descripcion: string;
  actual: number;
  ultimoAccess: number | null;
  siguienteAlAlinear: number | null;
}

export interface EstadoCorte {
  modo: 'sombra' | 'activo';
  accessDisponible: boolean;
  contadores: ContadorCorte[];
  pasos: string[];
}
