'use client';

import { Box, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse, List, Tooltip } from '@mui/material';
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
  /** Menú plegado: solo el ícono, con el nombre en un tooltip. */
  colapsado?: boolean;
}

// Ítems compactos (36 px) para que el menú completo entre en una pantalla de 768 px de alto.
const selectedSx = {
  mx: 1,
  mb: 0.25,
  '& .MuiListItemIcon-root .MuiSvgIcon-root': { fontSize: 20 },
  '& .MuiListItemText-primary': { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  '&.Mui-selected': {
    color: 'primary.dark',
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
  colapsado = false,
}: MenuItemRendererProps) {
  // Defensa extra: SidebarMenu ya filtra por rol antes de pintar.
  if (!canSeeMenuItem(item, context.user?.role)) {
    return null;
  }

  if (colapsado) {
    const activo = context.isActive(item.href) || context.isChildActive(item.children);
    const destino = item.href ?? item.children?.find((c) => c.href)?.href;
    return (
      <ListItem disablePadding>
        <Tooltip title={item.label} placement="right">
          <ListItemButton
            component={Link}
            href={destino || '#'}
            onClick={onNavigate}
            selected={activo}
            aria-label={item.label}
            aria-current={activo ? 'page' : undefined}
            sx={{ justifyContent: 'center', py: 1, ...selectedSx }}
          >
            <ListItemIcon sx={{ minWidth: 0, color: activo ? 'primary.main' : 'text.secondary' }}>{item.icon}</ListItemIcon>
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
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
              pl: 1.5 + depth * 2,
              py: 0.75,
              bgcolor: !selfActive && childActive ? 'action.hover' : undefined,
              ...selectedSx,
            }}
          >
            {item.icon && (
              <ListItemIcon sx={{ minWidth: 36, color: selfActive ? 'primary.main' : 'text.secondary' }}>
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
            sx={{ pl: 1.5 + depth * 2, py: 0.75, ...selectedSx }}
          >
            {item.icon && (
              <ListItemIcon sx={{ minWidth: 36, color: selfActive ? 'primary.main' : 'text.secondary' }}>
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
