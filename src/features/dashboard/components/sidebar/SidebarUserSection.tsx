import { Box, Typography, Divider, Avatar, IconButton, Tooltip } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';

interface SidebarUserSectionProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  onLogout: () => void;
  /** Menú plegado: solo las iniciales y el botón de salir. */
  colapsado?: boolean;
}

const avatarSx = { width: 32, height: 32, fontSize: '0.8125rem', fontWeight: 600, bgcolor: 'action.selected', color: 'primary.dark' } as const;

/** Usuario y salir en una sola fila (salir en gris: no es una acción de riesgo). */
export function SidebarUserSection({
  firstName = '',
  lastName = '',
  email = '',
  onLogout,
  colapsado = false,
}: SidebarUserSectionProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const nombre = `${firstName} ${lastName}`.trim();

  if (colapsado) {
    return (
      <>
        <Divider />
        <Box sx={{ py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Tooltip title={nombre || email} placement="right">
            <Avatar sx={avatarSx}>{initials}</Avatar>
          </Tooltip>
          <Tooltip title="Cerrar sesión" placement="right">
            <IconButton onClick={onLogout} size="small" aria-label="Cerrar sesión" sx={{ color: 'text.secondary' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </>
    );
  }

  return (
    <>
      <Divider />
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={avatarSx}>{initials}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {nombre}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            {email}
          </Typography>
        </Box>
        <Tooltip title="Cerrar sesión">
          <IconButton onClick={onLogout} size="small" aria-label="Cerrar sesión" sx={{ color: 'text.secondary' }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );
}
