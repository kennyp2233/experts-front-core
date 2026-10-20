'use client';

import Link from 'next/link';
import { Box, Button, Card, Divider, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import {
  Add as AddIcon,
  BadgeOutlined as DaesIcon,
  ChevronRight as IrIcon,
  FactCheckOutlined as FitoIcon,
  ReceiptLongOutlined as IngresoIcon,
  RequestQuoteOutlined as EstadoCuentaIcon,
} from '@mui/icons-material';

interface QuickActionsProps {
  isAdmin: boolean;
}

/** Una acción principal (coordinar) y el resto como lista de enlaces, no como botones grandes. */
export function QuickActions({ isAdmin }: QuickActionsProps) {
  const enlaces = [
    { href: '/operacion/guias/ingresos', label: 'Ingreso de guías', icon: <IngresoIcon /> },
    { href: '/operacion/daes', label: 'DAEs', icon: <DaesIcon /> },
    { href: '/operacion/cuentas/estado-cuenta', label: 'Estado de cuenta', icon: <EstadoCuentaIcon /> },
    ...(isAdmin ? [{ href: '/admin/fito', label: 'Certificados FITO', icon: <FitoIcon /> }] : []),
  ];
  return (
    <Card>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" component="h2" fontWeight={600}>
          Accesos rápidos
        </Typography>
      </Box>
      <Divider />
      <Stack sx={{ p: 1.5 }} spacing={1}>
        <Button component={Link} href="/operacion/coordinaciones/nueva" variant="contained" startIcon={<AddIcon />} fullWidth>
          Nueva coordinación
        </Button>
      </Stack>
      <List disablePadding sx={{ px: 1, pb: 1 }}>
        {enlaces.map((e) => (
          <ListItemButton key={e.href} component={Link} href={e.href} sx={{ py: 0.75 }}>
            <ListItemIcon sx={{ color: 'text.secondary', '& .MuiSvgIcon-root': { fontSize: 20 } }}>{e.icon}</ListItemIcon>
            <ListItemText primary={e.label} slotProps={{ primary: { variant: 'body2' } }} />
            <IrIcon fontSize="small" sx={{ color: 'text.disabled' }} />
          </ListItemButton>
        ))}
      </List>
    </Card>
  );
}
