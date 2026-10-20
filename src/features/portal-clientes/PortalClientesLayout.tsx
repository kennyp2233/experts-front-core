'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBar, Box, Button, Container, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import { Logout as SalirIcon } from '@mui/icons-material';
import { useAuth } from '@/features/auth';
import { usePerfilCliente } from './portal';

/**
 * Marco del portal de clientes: arriba el nombre del cliente y salir; dos
 * pestañas (Mis guías · Estado de cuenta). Pensado también para el celular.
 */
export function PortalClientesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { logout } = useAuth();
  const { data: perfil } = usePerfilCliente();
  const pestana = pathname.startsWith('/portal-clientes/estado-cuenta') ? 'estado' : 'guias';
  const clientes = perfil?.clientes.map((c) => c.nombre).join(' · ');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar className="no-imprimir" position="sticky" color="primary" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              Experts Handling Cargo · Clientes
            </Typography>
            <Typography variant="caption" noWrap component="div" sx={{ opacity: 0.9 }}>
              {clientes || perfil?.nombre || perfil?.usuario || ''}
            </Typography>
          </Box>
          <Button color="inherit" startIcon={<SalirIcon />} onClick={() => logout()}>
            Salir
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 2, px: { xs: 1.5, sm: 3 } }}>
        <Tabs value={pestana} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} variant="scrollable" allowScrollButtonsMobile>
          <Tab value="guias" label="Mis guías" component={Link} href="/portal-clientes" />
          <Tab value="estado" label="Estado de cuenta" component={Link} href="/portal-clientes/estado-cuenta" />
        </Tabs>
        {children}
      </Container>
    </Box>
  );
}
