'use client';

import { Box, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse, List } from '@mui/material';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import Link from 'next/link';
import type { MenuItem, MenuItemContextValue } from './types';
import { canSeeMenuItem } from './menu.utils';

interface MenuItemRendererProps {
  item: MenuItem;
  context: MenuItemContextValue;
  depth?: number;
  parentKey?: string;
  /** Se llama al elegir un destino (p. ej. para cerrar el drawer móvil). */
  onNavigate?: () => void;
}

const selectedSx = {
  '&.Mui-selected': {
    color: 'primary.main',
    '& .MuiListItemIcon-root': { color: 'primary.main' },
    '& .MuiListItemText-primary': { fontWeight: 600 },
  },
} as const;

export function MenuItemRenderer({
  item,
  context,
  depth = 0,
  parentKey = '',
  onNavigate,
}: MenuItemRendererProps) {
  // Defensa extra: SidebarMenu ya filtra por rol antes de pintar.
  if (!canSeeMenuItem(item, context.user?.role)) {
    return null;
  }

  const itemKey = parentKey ? `${parentKey}-${item.label}` : item.label;
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const childActive = hasChildren && context.isChildActive(item.children);
  const isExpanded = Boolean(context.expandedItems[itemKey]);
  const selfActive = context.isActive(item.href);

  return (
    <Box>
      {hasChildren ? (
        // Ítem agrupador (puede ser también un enlace)
        <ListItem disablePadding>
          <ListItemButton
            component={item.href ? Link : 'button'}
            href={item.href}
            onClick={item.href ? onNavigate : () => context.toggleExpand(itemKey)}
            selected={selfActive}
            sx={{
              pl: 2 + depth * 2,
              py: 1.25,
              bgcolor: !selfActive && childActive ? 'action.hover' : undefined,
              ...selectedSx,
            }}
          >
            {item.icon && (
              <ListItemIcon sx={{ minWidth: 40, color: selfActive ? 'primary.main' : 'text.primary' }}>
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText primary={item.label} slotProps={{ primary: { variant: 'body2', fontWeight: 500 } }} />
            <Box
              component="span"
              role="button"
              aria-label={isExpanded ? `Contraer ${item.label}` : `Expandir ${item.label}`}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                context.toggleExpand(itemKey);
              }}
              sx={{ display: 'flex', alignItems: 'center', ml: 1, cursor: 'pointer' }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </ListItemButton>
        </ListItem>
      ) : (
        // Enlace simple
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href={item.href || '#'}
            onClick={onNavigate}
            selected={selfActive}
            aria-current={selfActive ? 'page' : undefined}
            sx={{ pl: 2 + depth * 2, py: 1.25, ...selectedSx }}
          >
            {item.icon && (
              <ListItemIcon sx={{ minWidth: 40, color: selfActive ? 'primary.main' : 'text.primary' }}>
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText primary={item.label} slotProps={{ primary: { variant: 'body2' } }} />
          </ListItemButton>
        </ListItem>
      )}

      {hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {item.children!.map((child) => (
              <MenuItemRenderer
                key={`${itemKey}-${child.label}`}
                item={child}
                context={context}
                depth={depth + 1}
                parentKey={itemKey}
                onNavigate={onNavigate}
              />
            ))}
          </List>
        </Collapse>
      )}
    </Box>
  );
}
