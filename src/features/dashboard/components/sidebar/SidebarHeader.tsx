import { Box, Typography, IconButton } from '@mui/material';
import { LightMode as LightModeIcon, DarkMode as DarkModeIcon } from '@mui/icons-material';
import { useTheme } from '../../../../shared/providers/theme-context';

interface SidebarHeaderProps {
  userRole?: string;
}

export function SidebarHeader({ userRole = 'Usuario' }: SidebarHeaderProps) {
  const { actualMode, toggleTheme } = useTheme();

  return (
    <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Experts
        </Typography>
        <IconButton
          onClick={toggleTheme}
          size="small"
          sx={{
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          {actualMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Box>
      <Typography variant="caption" sx={{ opacity: 0.9 }}>
        {userRole === 'ADMIN' ? 'Administración' : 'Panel de usuario'}
      </Typography>
    </Box>
  );
}
