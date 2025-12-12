"use client";

import { Box } from '@mui/material';
import Sidebar, { DRAWER_WIDTH } from './SidebarContainer';
import { MobileHeader } from './MobileHeader';
import { useMobileNavigation } from '../../../shared/hooks';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isMobile, drawerOpen, toggleDrawer, closeDrawer } = useMobileNavigation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Mobile Header - only visible on mobile */}
      {isMobile && <MobileHeader onMenuClick={toggleDrawer} />}

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Desktop Sidebar - permanent, hidden on mobile */}
        <Sidebar variant="permanent" />

        {/* Mobile Sidebar - temporary drawer */}
        <Sidebar
          variant="temporary"
          open={drawerOpen}
          onClose={closeDrawer}
        />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
