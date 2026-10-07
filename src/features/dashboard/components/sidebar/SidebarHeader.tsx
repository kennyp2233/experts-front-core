import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { LightMode as LightModeIcon, DarkMode as DarkModeIcon } from '@mui/icons-material';
import { useTheme } from '../../../../shared/providers/theme-context';
import { roleLabel } from '../../roles';

interface SidebarHeaderProps {
  userRole?: string;
}

export function SidebarHeader({ userRole }: SidebarHeaderProps) {
  const { actualMode, toggleTheme } = useTheme();
  const themeLabel = actualMode === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro';

  return (
    <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Experts
        </Typography>
        <Tooltip title={themeLabel}>
          <IconButton
            onClick={toggleTheme}
            size="small"
            aria-label={themeLabel}
            sx={{
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            {actualMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      <Typography variant="caption" sx={{ opacity: 0.9 }}>
        Logística · {roleLabel(userRole)}
      </Typography>
    </Box>
  );
}
