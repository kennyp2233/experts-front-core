import { Box, Typography, Divider, ListItemButton, ListItemIcon, ListItemText, Avatar, IconButton, Tooltip } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';

interface SidebarUserSectionProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  onLogout: () => void;
  /** Menú plegado: solo las iniciales y el botón de salir. */
  colapsado?: boolean;
}

export function SidebarUserSection({
  firstName = '',
  lastName = '',
  email = '',
  onLogout,
  colapsado = false,
}: SidebarUserSectionProps) {
  // Generate initials for avatar
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  if (colapsado) {
    return (
      <>
        <Divider />
        <Box sx={{ py: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Tooltip title={`${firstName} ${lastName}`.trim() || email} placement="right">
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', fontWeight: 600, bgcolor: 'primary.main' }}>
              {initials}
            </Avatar>
          </Tooltip>
          <Tooltip title="Cerrar sesión" placement="right">
            <IconButton onClick={onLogout} size="small" aria-label="Cerrar sesión" sx={{ color: 'error.main' }}>
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
      <Box sx={{ p: 2 }}>
        {/* User Info Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: '0.875rem',
              fontWeight: 600,
              mr: 1.5,
              bgcolor: 'primary.main'
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {firstName} {lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {email}
            </Typography>
          </Box>
        </Box>

        {/* Logout Button */}
        <ListItemButton
          onClick={onLogout}
          sx={{
            py: 1,
            px: 1.5,
            color: 'error.main',
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'error.main',
              color: 'error.contrastText',
              '& .MuiListItemIcon-root': {
                color: 'error.contrastText',
              },
            },
          }}
        >
          <ListItemIcon sx={{ color: 'error.main', minWidth: 32 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Cerrar sesión"
            primaryTypographyProps={{ variant: 'body2' }}
          />
        </ListItemButton>
      </Box>
    </>
  );
}