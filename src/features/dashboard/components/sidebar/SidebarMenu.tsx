'use client';

import { useMemo } from 'react';
import { Box, Divider, List, ListSubheader } from '@mui/material';
import { MenuItemRenderer } from './MenuItemRenderer';
import { filterMenuSections } from './menu.utils';
import type { MenuSection, MenuItemContextValue } from './types';

interface SidebarMenuProps {
  sections: MenuSection[];
  context: MenuItemContextValue;
  /** Se llama al elegir un destino (p. ej. para cerrar el drawer móvil). */
  onNavigate?: () => void;
  /** Solo íconos (con el nombre en un tooltip). */
  colapsado?: boolean;
}

export function SidebarMenu({ sections, context, onNavigate, colapsado = false }: SidebarMenuProps) {
  const role = context.user?.role;
  // Filtra por rol primero: así nunca se pinta un título de sección sin ítems.
  const visibleSections = useMemo(() => filterMenuSections(sections, role), [sections, role]);

  return (
    <List component="nav" aria-label="Menú principal" sx={{ flex: 1, py: 1, overflowY: 'auto' }}>
      {visibleSections.map((section, index) => (
        <Box key={section.title ?? `section-${index}`}>
          {section.title && colapsado && index > 0 && <Divider sx={{ my: 1, mx: 1.5 }} />}
          {section.title && !colapsado && (
            <ListSubheader
              disableSticky
              sx={{
                pl: 2.5,
                mt: index > 0 ? 1 : 0,
                lineHeight: '28px',
                bgcolor: 'transparent',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: 11,
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              {section.title}
            </ListSubheader>
          )}
          {section.items.map((item) => (
            <MenuItemRenderer key={item.label} item={item} context={context} onNavigate={onNavigate} colapsado={colapsado} />
          ))}
        </Box>
      ))}
    </List>
  );
}
