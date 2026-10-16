'use client';

import { Box, Drawer } from '@mui/material';
import { useAuth } from '../../auth';
import {
  SidebarHeader,
  SidebarUserSection,
  SidebarMenu,
  useSidebarMenu,
  MENU_SECTIONS,
} from './sidebar';

const DRAWER_WIDTH = 240;
/** Ancho del menú plegado a íconos. */
const DRAWER_WIDTH_COLAPSADO = 64;

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  variant?: 'permanent' | 'temporary';
  /** Solo en escritorio: menú plegado a íconos. */
  colapsado?: boolean;
  onAlternar?: () => void;
}

export default function Sidebar({ open = true, onClose, variant = 'permanent', colapsado = false, onAlternar }: SidebarProps) {
  const plegado = variant === 'permanent' && colapsado;
  const ancho = plegado ? DRAWER_WIDTH_COLAPSADO : DRAWER_WIDTH;
  const { user, logout } = useAuth();
  const sidebarMenuContext = useSidebarMenu(user);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <SidebarHeader userRole={user?.role} colapsado={plegado} onAlternar={variant === 'permanent' ? onAlternar : undefined} />

      {/* Menu */}
      {/* En el drawer móvil, elegir un destino cierra el menú */}
      <SidebarMenu
        sections={MENU_SECTIONS}
        context={sidebarMenuContext}
        onNavigate={variant === 'temporary' ? onClose : undefined}
        colapsado={plegado}
      />

      {/* User Section (at bottom) */}
      <Box sx={{ mt: 'auto' }}>
        <SidebarUserSection
          firstName={user?.firstName}
          lastName={user?.lastName}
          email={user?.email}
          onLogout={logout}
          colapsado={plegado}
        />
      </Box>
    </Box>
  );

  // Temporary drawer for mobile
  if (variant === 'temporary') {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  // Permanent drawer for desktop
  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: ancho,
        flexShrink: 0,
        transition: (t) => t.transitions.create('width', { duration: t.transitions.duration.shorter }),
        '& .MuiDrawer-paper': {
          width: ancho,
          overflowX: 'hidden',
          transition: (t) => t.transitions.create('width', { duration: t.transitions.duration.shorter }),
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 12,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { DRAWER_WIDTH, DRAWER_WIDTH_COLAPSADO };
