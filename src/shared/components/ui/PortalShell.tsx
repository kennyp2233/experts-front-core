'use client';

import Link from 'next/link';
import { AppBar, Box, Button, Container, type ContainerProps, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import { Logout as SalirIcon } from '@mui/icons-material';
import { MarcaExperts } from './MarcaExperts';

export interface PortalPestana {
  value: string;
  label: string;
  href: string;
}

export interface PortalShellProps {
  /** "Fincas", "Clientes"… */
  portal: string;
  /** Quién entró: nombres de las fincas o del cliente. */
  detalle?: string;
  pestanas: PortalPestana[];
  pestana: string;
  onSalir: () => void;
  maxWidth?: ContainerProps['maxWidth'];
  /** Pestañas a todo el ancho (celular). */
  pestanasAnchas?: boolean;
  children: React.ReactNode;
}

/**
 * Marco común de los portales externos (fincas y clientes): barra blanca con
 * la marca, quién entró y Salir; pestañas debajo. Igual en los dos portales
 * para que se reconozcan como el mismo sistema.
 */
export function PortalShell({
  portal,
  detalle,
  pestanas,
  pestana,
  onSalir,
  maxWidth = 'lg',
  pestanasAnchas = false,
  children,
}: PortalShellProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        className="no-imprimir"
        position="sticky"
        color="inherit"
        sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Container maxWidth={maxWidth} disableGutters sx={{ px: { xs: 1.5, sm: 3 } }}>
          <Toolbar disableGutters sx={{ gap: 1.5, minHeight: { xs: 56, sm: 60 } }}>
            <MarcaExperts />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={700} lineHeight={1.25} noWrap>
                Experts Handling Cargo{' '}
                <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  · {portal}
                </Box>
              </Typography>
              {detalle && (
                <Typography variant="caption" color="text.secondary" noWrap component="div" lineHeight={1.3}>
                  {detalle}
                </Typography>
              )}
            </Box>
            <Button variant="text" startIcon={<SalirIcon />} onClick={onSalir} sx={{ color: 'text.secondary', flexShrink: 0 }}>
              Salir
            </Button>
          </Toolbar>
        </Container>
      </AppBar>
      <Container maxWidth={maxWidth} disableGutters sx={{ py: 2, px: { xs: 1.5, sm: 3 } }}>
        <Tabs
          className="no-imprimir"
          value={pestana}
          variant={pestanasAnchas ? 'fullWidth' : 'scrollable'}
          allowScrollButtonsMobile={!pestanasAnchas}
          sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}
        >
          {pestanas.map((p) => (
            <Tab key={p.value} value={p.value} label={p.label} component={Link} href={p.href} />
          ))}
        </Tabs>
        {children}
      </Container>
    </Box>
  );
}
