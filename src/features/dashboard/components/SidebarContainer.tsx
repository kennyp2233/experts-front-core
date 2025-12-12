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

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  variant?: 'permanent' | 'temporary';
}

export default function Sidebar({ open = true, onClose, variant = 'permanent' }: SidebarProps) {
  const { user, logout } = useAuth();
  const sidebarMenuContext = useSidebarMenu(user);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <SidebarHeader userRole={user?.role} />

      {/* Menu */}
      <SidebarMenu sections={MENU_SECTIONS} context={sidebarMenuContext} />

      {/* User Section (at bottom) */}
      <Box sx={{ mt: 'auto' }}>
        <SidebarUserSection
          firstName={user?.firstName}
          lastName={user?.lastName}
          email={user?.email}
          onLogout={logout}
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
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
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

export { DRAWER_WIDTH };
