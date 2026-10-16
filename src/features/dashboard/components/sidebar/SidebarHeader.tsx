import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  MenuOpen as PlegarIcon,
  Menu as DesplegarIcon,
} from '@mui/icons-material';
import { useTheme } from '../../../../shared/providers/theme-context';
import { roleLabel } from '../../roles';

interface SidebarHeaderProps {
  userRole?: string;
  colapsado?: boolean;
  /** Pliega o despliega el menú (solo escritorio). */
  onAlternar?: () => void;
}

const botonSx = { color: 'primary.contrastText', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } } as const;

export function SidebarHeader({ userRole, colapsado = false, onAlternar }: SidebarHeaderProps) {
  const { actualMode, toggleTheme } = useTheme();
  const themeLabel = actualMode === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro';

  if (colapsado) {
    return (
      <Box sx={{ py: 1.5, display: 'flex', justifyContent: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Tooltip title="Mostrar el menú" placement="right">
          <IconButton onClick={onAlternar} size="small" aria-label="Mostrar el menú" sx={botonSx}>
            <DesplegarIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Experts
        </Typography>
        <Box sx={{ display: 'flex' }}>
          <Tooltip title={themeLabel}>
            <IconButton onClick={toggleTheme} size="small" aria-label={themeLabel} sx={botonSx}>
              {actualMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          {onAlternar && (
            <Tooltip title="Plegar el menú">
              <IconButton onClick={onAlternar} size="small" aria-label="Plegar el menú" sx={botonSx}>
                <PlegarIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      <Typography variant="caption" sx={{ opacity: 0.9 }}>
        Logística · {roleLabel(userRole)}
      </Typography>
    </Box>
  );
}
