import api from '@/shared/services/api';

export interface UsuarioCliente {
  id: string;
  usuario: string;
  nombre: string;
  email: string | null;
  activo: boolean;
  clientes: Array<{ id: number; nombre: string }>;
  creado: string;
}

/** Un cliente del buscador (`/operacion/opciones/clientes`). */
export interface ClienteOpcion {
  id: number;
  codigo: string | null;
  nombre: string;
  detalle: string | null;
}

export interface NuevoUsuarioCliente {
  usuario: string;
  nombre: string;
  email?: string;
  clientes: number[];
}

/** Usuarios del portal de clientes (rol CLIENTE); los administra la oficina (ADMIN). */
export const usuariosClientesService = {
  listar: async (): Promise<UsuarioCliente[]> => (await api.get('/operacion/usuarios-clientes')).data,
  crear: async (d: NuevoUsuarioCliente) =>
    (await api.post('/operacion/usuarios-clientes', d)).data as { id: string; usuario: string; clave: string },
  actualizar: async (id: string, d: { nombre?: string; clientes?: number[]; activo?: boolean }) =>
    (await api.put(`/operacion/usuarios-clientes/${id}`, d)).data,
  clave: async (id: string) => (await api.post(`/operacion/usuarios-clientes/${id}/clave`)).data as { usuario: string; clave: string },
  buscarClientes: async (q: string): Promise<ClienteOpcion[]> =>
    (await api.get('/operacion/opciones/clientes', { params: q ? { q } : {} })).data,
};
