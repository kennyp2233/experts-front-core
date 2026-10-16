"use client";

import { Box } from '@mui/material';
import Sidebar, { DRAWER_WIDTH, DRAWER_WIDTH_COLAPSADO } from './SidebarContainer';
import { MobileHeader } from './MobileHeader';
import { useSidebarColapsado } from './sidebar/useSidebarColapsado';
import { useMobileNavigation } from '../../../shared/hooks';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isMobile, drawerOpen, toggleDrawer, closeDrawer } = useMobileNavigation();
  const { colapsado, alternar } = useSidebarColapsado();
  const ancho = colapsado ? DRAWER_WIDTH_COLAPSADO : DRAWER_WIDTH;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        // Ancho del menú lateral, para barras fijas que deben empezar donde termina el menú.
        '--ancho-menu': { xs: '0px', md: `${ancho}px` },
      }}
    >
      {/* Mobile Header - only visible on mobile */}
      {isMobile && <MobileHeader onMenuClick={toggleDrawer} />}

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Desktop Sidebar - permanent, hidden on mobile */}
        <Sidebar variant="permanent" colapsado={colapsado} onAlternar={alternar} />

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
            minWidth: 0,
            width: { xs: '100%', md: `calc(100% - ${ancho}px)` },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
