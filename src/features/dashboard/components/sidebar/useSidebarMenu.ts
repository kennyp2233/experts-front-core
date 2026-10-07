'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import type { MenuItem, MenuItemContextValue, MenuUser } from './types';

export function useSidebarMenu(user?: MenuUser | null): MenuItemContextValue {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Activo si es la ruta exacta o una subruta (/ebf/coordinaciones/nueva, /[id]…).
  const isActive = useCallback(
    (href?: string): boolean => {
      if (!href || !pathname) return false;
      return pathname === href || pathname.startsWith(href + '/');
    },
    [pathname]
  );

  const isChildActive = useCallback(
    (children?: MenuItem[]): boolean => {
      const walk = (items?: MenuItem[]): boolean =>
        Boolean(items?.some((child) => isActive(child.href) || walk(child.children)));
      return walk(children);
    },
    [isActive]
  );

  const toggleExpand = useCallback((key: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  return {
    expandedItems,
    toggleExpand,
    isActive,
    isChildActive,
    user,
  };
}
