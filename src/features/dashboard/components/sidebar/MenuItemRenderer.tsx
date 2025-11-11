'use client';

import { Box, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse, List } from '@mui/material';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import Link from 'next/link';
import type { MenuItem, MenuItemContextValue } from './types';

interface MenuItemRendererProps {
  item: MenuItem;
  context: MenuItemContextValue;
  depth?: number;
  parentKey?: string;
}

export function MenuItemRenderer({
  item,
  context,
  depth = 0,
  parentKey = '',
}: MenuItemRendererProps) {
  // Role check
  if (item.roles && context.user && !item.roles.includes(context.user.role)) {
    return null;
  }

  const itemKey = parentKey ? `${parentKey}-${item.label}` : item.label;
  const isExpanded = context.expandedItems[itemKey];
  const hasChildren = item.children && item.children.length > 0;
  const childActive = hasChildren && context.isChildActive(item.children);

  return (
    <Box key={itemKey}>
      {hasChildren ? (
        // Collapsible item that can also be a link
        <ListItem disablePadding>
          <ListItemButton
            component={item.href ? Link : 'button'}
            href={item.href}
            onClick={item.href ? undefined : () => context.toggleExpand(itemKey)}
            selected={item.href ? context.isActive(item.href) : false}
            sx={{
              pl: 2 + depth * 2,
              py: 1.25,
              bgcolor: (item.href && context.isActive(item.href)) || childActive ? 'action.hover' : 'transparent',
              '&.Mui-selected': {
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            {item.icon && (
              <ListItemIcon sx={{
                minWidth: 40,
                color: (item.href && context.isActive(item.href)) ? 'primary.main' : 'text.primary'
              }}>
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
            />
            <Box
              component="span"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                context.toggleExpand(itemKey);
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                ml: 1,
                cursor: 'pointer',
              }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </ListItemButton>
        </ListItem>
      ) : (
        // Regular link item
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            href={item.href || '#'}
            selected={context.isActive(item.href)}
            sx={{
              pl: 2 + depth * 2,
              py: 1.25,
              '&.Mui-selected': {
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            {item.icon && (
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: context.isActive(item.href) ? 'primary.main' : 'text.primary',
                }}
              >
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ variant: 'body2' }}
            />
          </ListItemButton>
        </ListItem>
      )}

      {/* Collapsed children */}
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
              />
            ))}
          </List>
        </Collapse>
      )}
    </Box>
  );
}
