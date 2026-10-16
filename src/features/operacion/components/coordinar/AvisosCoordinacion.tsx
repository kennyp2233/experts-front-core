'use client';

import { Alert, Box, Link, Stack, Typography } from '@mui/material';
import type { Faltante } from './formulario';

interface Props {
  /** Error del servidor al calcular (regla incumplida). */
  error: string | null;
  /** Lo que falta para grabar (solo después de intentar grabar). */
  faltantes: Faltante[];
  advertencias: string[];
  /** Lleva la pantalla al campo que falta. */
  onIr: (campo: string) => void;
}

/** Errores, datos que faltan y advertencias del cálculo, juntos y arriba del detalle por finca. */
export function AvisosCoordinacion({ error, faltantes, advertencias, onIr }: Props) {
  if (!error && faltantes.length === 0 && advertencias.length === 0) return null;
  return (
    <Stack spacing={1}>
      {error && <Alert severity="error">{error}</Alert>}
      {faltantes.length > 0 && (
        <Alert severity="warning">
          <Typography variant="body2" fontWeight={600}>
            Para grabar falta:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {faltantes.slice(0, 8).map((f) => (
              <li key={`${f.campo}-${f.mensaje}`}>
                <Link component="button" type="button" variant="body2" color="inherit" onClick={() => onIr(f.campo)}>
                  {f.mensaje}
                </Link>
              </li>
            ))}
            {faltantes.length > 8 && (
              <li>
                <Typography variant="body2">… y {faltantes.length - 8} más</Typography>
              </li>
            )}
          </Box>
        </Alert>
      )}
      {advertencias.map((a) => (
        <Alert key={a} severity="info" variant="outlined">
          {a}
        </Alert>
      ))}
    </Stack>
  );
}
