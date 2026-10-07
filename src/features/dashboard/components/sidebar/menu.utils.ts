import type { MenuItem, MenuSection } from './types';

/** Un ítem con `roles` solo se muestra si el rol del usuario está en la lista. */
export function canSeeMenuItem(item: MenuItem, role?: string | null): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  return Boolean(role) && item.roles.includes(role as string);
}

/**
 * Quita los ítems que el rol no puede ver (recursivo). Un ítem agrupador sin
 * `href` cuyos hijos quedaron todos filtrados también desaparece.
 */
export function filterMenuItems(items: MenuItem[], role?: string | null): MenuItem[] {
  return items.flatMap((item) => {
    if (!canSeeMenuItem(item, role)) return [];
    if (!item.children || item.children.length === 0) return [item];
    const children = filterMenuItems(item.children, role);
    if (children.length === 0 && !item.href) return [];
    return [{ ...item, children }];
  });
}

/** Secciones listas para pintar: sin ítems ocultos y sin títulos vacíos. */
export function filterMenuSections(sections: MenuSection[], role?: string | null): MenuSection[] {
  return sections
    .map((section) => ({ ...section, items: filterMenuItems(section.items, role) }))
    .filter((section) => section.items.length > 0);
}
