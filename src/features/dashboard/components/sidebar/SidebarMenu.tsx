'use client';

import { Box, List, ListSubheader } from '@mui/material';
import { MenuItemRenderer } from './MenuItemRenderer';
import type { MenuSection, MenuItemContextValue } from './types';

interface SidebarMenuProps {
  sections: MenuSection[];
  context: MenuItemContextValue;
}

export function SidebarMenu({ sections, context }: SidebarMenuProps) {
  return (
    <List sx={{ flex: 1, py: 1, overflowY: 'auto' }}>
      {sections.map((section) => (
        <Box key={(section.title || 'main') as string}>
          {section.title && (
            <ListSubheader
              sx={{
                pl: 2,
                bgcolor: 'transparent',
                textTransform: 'uppercase',
                fontSize: 12,
                fontWeight: 700,
                color: 'text.secondary',
              }}
            >
              {section.title}
            </ListSubheader>
          )}
          {section.items.map((item) => (
            <MenuItemRenderer key={item.label} item={item} context={context} />
          ))}
        </Box>
      ))}
    </List>
  );
}
