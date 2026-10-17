/** A dónde va cada usuario al entrar: las fincas a su portal; la oficina al inicio. */
export const inicioSegunRol = (role?: string | null): string => (role === 'FINCA' ? '/portal' : '/dashboard');
