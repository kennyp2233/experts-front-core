/** Coordinaciones frente a EBF (back: `operacion/ebf`, ADR 0004). */

export type ModoEnvioEbf = 'comparar' | 'manual' | 'automatico';

export type EstadoLineaEbf =
  | 'EN_EBF'
  | 'POR_ENVIAR'
  | 'CAMBIO_POR_ENVIAR'
  | 'PEDIR_A_EBF'
  | 'FALTA_ENLACE'
  | 'SOLO_EN_EBF'
  | 'ERROR'
  | 'OMITIDA';

export type AccionEbf = 'CREAR' | 'AGREGAR' | 'MODIFICAR' | 'BORRAR' | 'REEMPLAZAR';

export interface VentanaEbf {
  abierta: boolean;
  proximaApertura: string;
  horario: string;
  diaEnvio: string;
}

export interface LineaEstadoEbf {
  id: number | null;
  clave: string;
  estado: EstadoLineaEbf;
  accion: AccionEbf | null;
  motivo: string;
  ultimoError: string | null;
  enviadaEn: string | null;
  idFinca: number | null;
  idProducto: number | null;
  idConsignatario: number | null;
  /** Enlaces con EBF que faltan para esta línea */
  faltan: TipoEquivalenciaEbf[];
  finca: string | null;
  producto: string | null;
  marca: string | null;
  numeroGuiaHija: string | null;
  dae: string | null;
  fulls: number;
  cajas: number;
  cajasPorTipo: string | null;
  ebf: {
    exportador: string;
    producto: string;
    marcacion: string;
    dae: string | null;
    fulls: number;
    cajas: number;
    fullsBodega: number;
    cajasBodega: number;
    hawb: string | null;
    filas: number;
    coordinadaPor: string | null;
    diaCoordinacion: string | null;
  } | null;
}

export interface ResumenEbf {
  lineas: number;
  enEbf: number;
  porEnviar: number;
  pedirAEbf: number;
  faltaEnlace: number;
  soloEnEbf: number;
  errores: number;
  omitidas: number;
}

export interface EstadoEbfCoordinacion {
  idCoordinacion: number;
  numero: number | null;
  numeroGuia: string | null;
  fechaVuelo: string;
  marca: string | null;
  enviable: boolean;
  anulada: boolean;
  modo: ModoEnvioEbf;
  ventana: VentanaEbf;
  ebf: {
    guia: string | null;
    provisional: boolean;
    estado: string | null;
    fulls: number | null;
    cajas: number | null;
    fullsBodega: number | null;
    cajasBodega: number | null;
    pesoBruto: number | null;
    pesoCobrable: number | null;
    leidoEn: string | null;
    errorLectura: string | null;
    avisos: string[];
  };
  resumen: ResumenEbf;
  lineas: LineaEstadoEbf[];
  puedeEnviar: boolean;
  motivoNoEnviar: string | null;
}

export interface ColaEbf {
  modo: ModoEnvioEbf;
  ventana: VentanaEbf;
  coordinaciones: EstadoEbfCoordinacion[];
}

export interface ResultadoEnvioEbf {
  enviadas: number;
  fallidas: number;
  errores: string[];
  estado: EstadoEbfCoordinacion;
}

export interface SimulacionEbf {
  idCoordinacion: number;
  vuelo: string | null;
  pasos: Array<{
    finca: string | null;
    producto: string | null;
    tipo: 'CREAR' | 'MODIFICAR' | 'BORRAR';
    ok: boolean;
    envio?: { exportador?: string; marcacion?: string; vuelo?: string; dae?: string; producto?: string; cajas?: string; detalleId?: number | null };
    error?: string;
  }>;
}

export type TipoEquivalenciaEbf = 'FINCA' | 'MARCA' | 'PRODUCTO';

export interface EquivalenciaEbf {
  tipo: TipoEquivalenciaEbf;
  idLocal: number;
  local: string;
  ebfId: number | null;
  ebfNombre: string;
  /** HISTORIAL | RUC | MANUAL */
  origen: string;
  vecesVista: number;
  confirmada: boolean;
  confirmadaPor: string | null;
  updatedAt: string;
}

export interface OpcionEbf {
  value: string;
  label: string;
}

export interface ResultadoAprenderEbf {
  coordinaciones: number;
  leidas: number;
  pares: number;
  nuevas: number;
  actualizadas: number;
  conflictos: Array<{ tipo: TipoEquivalenciaEbf; idLocal: number; local: string; confirmada: string; historial: string }>;
  errores: string[];
}
