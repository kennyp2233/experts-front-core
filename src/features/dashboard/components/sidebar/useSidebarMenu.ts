'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import type { MenuItem, MenuItemContextValue } from './types';

export function useSidebarMenu(user?: any): MenuItemContextValue {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const isActive = useCallback(
    (href?: string): boolean => {
      if (!href) return false;
      return pathname === href || pathname?.startsWith(href + '/');
    },
    [pathname]
  );

  const isChildActive = useCallback(
    (children?: MenuItem[]): boolean => {
      if (!children) return false;
      return children.some(child => isActive(child.href) || isChildActive(child.children));
    },
    [isActive]
  );

  const toggleExpand = useCallback((key: string) => {
    setExpandedItems(prev => ({
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
