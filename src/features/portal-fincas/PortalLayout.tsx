'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBar, Box, Button, Container, Stack, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import { Logout as SalirIcon } from '@mui/icons-material';
import { useAuth } from '@/features/auth';
import { usePerfilFinca } from './portal';

/**
 * Marco del portal de fincas: arriba la finca y salir; dos pestañas (Guías
 * abiertas · Mis DAE). Pensado también para el celular.
 */
export function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { logout } = useAuth();
  const { data: perfil } = usePerfilFinca();
  const pestana = pathname.startsWith('/portal/daes') ? 'daes' : 'guias';
  const fincas = perfil?.fincas.map((f) => f.nombre).join(' · ');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="primary" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              Experts Handling Cargo · Fincas
            </Typography>
            <Typography variant="caption" noWrap component="div" sx={{ opacity: 0.9 }}>
              {fincas || perfil?.usuario || ''}
            </Typography>
          </Box>
          <Button color="inherit" startIcon={<SalirIcon />} onClick={() => logout()}>
            Salir
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 2, px: { xs: 1.5, sm: 3 } }}>
        <Tabs value={pestana} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} variant="fullWidth">
          <Tab value="guias" label="Guías abiertas" component={Link} href="/portal" />
          <Tab value="daes" label="Mis DAE" component={Link} href="/portal/daes" />
        </Tabs>
        <Stack spacing={2}>{children}</Stack>
      </Container>
    </Box>
  );
}
