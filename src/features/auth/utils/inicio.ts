/** A dónde va cada usuario al entrar: fincas y clientes a su portal; la oficina al inicio. */
export const inicioSegunRol = (role?: string | null): string =>
  role === 'FINCA' ? '/portal' : role === 'CLIENTE' ? '/portal-clientes' : '/dashboard';
