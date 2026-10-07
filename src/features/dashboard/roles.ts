/** Nombre legible de cada rol (los valores vienen del enum Role del back). */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  USER: 'Usuario',
  FINCA: 'Finca',
  CLIENTE: 'Cliente',
};

export function roleLabel(role?: string | null): string {
  if (!role) return 'Usuario';
  return ROLE_LABELS[role] ?? role;
}
