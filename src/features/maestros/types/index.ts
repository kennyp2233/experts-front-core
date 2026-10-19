export interface EntidadMaestro {
  clave: string;
  titulo: string;
  descripcion: string;
  grupo: string;
  total: number;
  /** Tiene formulario: se crean y cambian registros. */
  editable?: boolean;
}

export interface FilaMaestro {
  id: number | string;
  codigo: string | null;
  nombre: string;
  detalle: string | null;
  activo: boolean | null;
  /** Creado en el sistema nuevo (no viene del sistema viejo). */
  nuevo?: boolean;
}

export interface PaginaMaestro {
  titulo: string;
  descripcion: string;
  items: FilaMaestro[];
  total: number;
  page: number;
  pageSize: number;
  /** Si la entidad se edita: cómo nombrarla y en qué modo está el sistema. */
  edicion: { singular: string; femenino: boolean; modo: ModoOperacion } | null;
}

export interface FichaMaestro {
  titulo: string;
  fila: FilaMaestro;
  registro: Record<string, unknown>;
}

export type ModoOperacion = 'sombra' | 'activo';

export type TipoCampo = 'texto' | 'parrafo' | 'numero' | 'entero' | 'si-no' | 'opciones' | 'tabla';

export interface OpcionCampo {
  valor: string | number;
  etiqueta: string;
  detalle?: string | null;
  /** Desactivado: se muestra si ya estaba elegido, pero no se ofrece. */
  inactivo?: boolean;
}

export interface CampoMaestro {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  ayuda?: string;
  max?: number;
  mayusculas?: boolean;
  /** Columnas de 6: 6 = toda la fila, 3 = media, 2 = un tercio. */
  ancho?: 1 | 2 | 3 | 4 | 6;
  soloAlCrear?: boolean;
  inicial?: unknown;
  unidad?: string;
  opciones?: OpcionCampo[];
  columnas?: CampoMaestro[];
}

export interface SeccionMaestro {
  titulo: string;
  descripcion?: string;
  plegada?: boolean;
  campos: CampoMaestro[];
}

export interface FormularioMaestro {
  entidad: string;
  singular: string;
  femenino: boolean;
  modo: ModoOperacion;
  secciones: SeccionMaestro[];
}

export type ValoresMaestro = Record<string, unknown>;

export interface EdicionMaestro {
  id: number;
  valores: ValoresMaestro;
  delSistemaViejo: boolean;
  editable: boolean;
}
