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
}

export default function Sidebar({ open = true, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const sidebarMenuContext = useSidebarMenu(user);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
        },
      }}
    >
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
    </Drawer>
  );
}

export { DRAWER_WIDTH };
