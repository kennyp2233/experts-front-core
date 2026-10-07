import type { ReactNode } from 'react';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  href?: string;
  children?: MenuItem[];
  /** Roles que pueden ver el ítem. Sin `roles` = visible para todos. */
  roles?: string[];
}

export interface MenuSection {
  title?: string;
  items: MenuItem[];
}

/** Lo mínimo que el menú necesita saber del usuario. */
export interface MenuUser {
  role?: string | null;
}

export interface MenuItemContextValue {
  expandedItems: Record<string, boolean>;
  toggleExpand: (key: string) => void;
  isActive: (href?: string) => boolean;
  isChildActive: (children?: MenuItem[]) => boolean;
  user?: MenuUser | null;
}
