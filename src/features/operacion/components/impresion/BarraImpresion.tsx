'use client';

import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { PrintOutlined as ImprimirIcon } from '@mui/icons-material';
import { getErrorMessage } from '@/shared/utils';

/**
 * Marco de una hoja para imprimir: barra fija (título, opciones, Imprimir,
 * Cerrar) que no sale en papel, el error o la carga, y la hoja centrada sobre
 * fondo gris. `clase` es la clase de la hoja que sí se imprime.
 */
export function HojaImpresion({
  titulo,
  opciones,
  listo,
  error,
  cargando,
  mensajeError,
  aviso,
  css,
  clase,
  children,
}: {
  titulo: React.ReactNode;
  opciones?: React.ReactNode;
  listo: boolean;
  error?: unknown;
  cargando?: boolean;
  mensajeError: string;
  aviso?: React.ReactNode;
  css: string;
  clase: string;
  children?: React.ReactNode;
}) {
  const base = `
@media print {
  body * { visibility: hidden; }
  .${clase}-hojas, .${clase}-hojas * { visibility: visible; }
  .${clase}-hojas { padding: 0 !important; display: block !important; }
  .no-imprimir { display: none !important; }
  .hoja-raiz { min-height: 0 !important; background: #fff !important; }
}`;
  return (
    <Box className="hoja-raiz" sx={{ bgcolor: '#e5e7eb', minHeight: '100vh' }}>
      <style>{css + base}</style>
      <Stack
        className="no-imprimir"
        direction="row"
        spacing={2}
        alignItems="center"
        useFlexGap
        flexWrap="wrap"
        sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', px: 3, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
          {titulo}
        </Typography>
        {opciones}
        <Button variant="contained" startIcon={<ImprimirIcon />} disabled={!listo} onClick={() => window.print()}>
          Imprimir
        </Button>
        <Button onClick={() => window.close()} sx={{ color: 'text.secondary' }}>
          Cerrar
        </Button>
      </Stack>
      {aviso && (
        <Alert severity="info" sx={{ m: 3, mb: 0 }} className="no-imprimir">
          {aviso}
        </Alert>
      )}
      {Boolean(error) && (
        <Alert severity="error" sx={{ m: 3 }} className="no-imprimir">
          {getErrorMessage(error, mensajeError)}
        </Alert>
      )}
      {cargando && <CircularProgress sx={{ m: 4 }} />}
      {children && <div className={`${clase}-hojas`}>{children}</div>}
    </Box>
  );
}
