export interface EntidadMaestro {
  clave: string;
  titulo: string;
  descripcion: string;
  grupo: string;
  total: number;
}

export interface FilaMaestro {
  id: number | string;
  codigo: string | null;
  nombre: string;
  detalle: string | null;
  activo: boolean | null;
}

export interface PaginaMaestro {
  titulo: string;
  descripcion: string;
  items: FilaMaestro[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FichaMaestro {
  titulo: string;
  fila: FilaMaestro;
  registro: Record<string, unknown>;
}
