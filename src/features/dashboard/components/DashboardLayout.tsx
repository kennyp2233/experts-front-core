"use client";

import { Box } from '@mui/material';
import Sidebar, { DRAWER_WIDTH } from './SidebarContainer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
         
          overflow: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
