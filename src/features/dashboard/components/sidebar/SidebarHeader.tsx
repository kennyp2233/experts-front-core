import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import {
  LightModeOutlined as LightModeIcon,
  DarkModeOutlined as DarkModeIcon,
  MenuOpen as PlegarIcon,
  Menu as DesplegarIcon,
} from '@mui/icons-material';
import { useTheme } from '../../../../shared/providers/theme-context';
import { MarcaExperts } from '../../../../shared/components/ui/MarcaExperts';
import { roleLabel } from '../../roles';

interface SidebarHeaderProps {
  userRole?: string;
  colapsado?: boolean;
  /** Pliega o despliega el menú (solo escritorio). */
  onAlternar?: () => void;
}

const botonSx = { color: 'text.secondary' } as const;

export function SidebarHeader({ userRole, colapsado = false, onAlternar }: SidebarHeaderProps) {
  const { actualMode, toggleTheme } = useTheme();
  const themeLabel = actualMode === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro';

  if (colapsado) {
    return (
      <Box sx={{ py: 1.5, display: 'flex', justifyContent: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Tooltip title="Mostrar el menú" placement="right">
          <IconButton onClick={onAlternar} size="small" aria-label="Mostrar el menú" sx={botonSx}>
            <DesplegarIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider' }}>
      <MarcaExperts />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2} noWrap>
          Experts
        </Typography>
        <Typography variant="caption" color="text.secondary" lineHeight={1.2} noWrap component="div">
          {roleLabel(userRole)}
        </Typography>
      </Box>
      <Tooltip title={themeLabel}>
        <IconButton onClick={toggleTheme} size="small" aria-label={themeLabel} sx={botonSx}>
          {actualMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      {onAlternar && (
        <Tooltip title="Plegar el menú">
          <IconButton onClick={onAlternar} size="small" aria-label="Plegar el menú" sx={botonSx}>
            <PlegarIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
