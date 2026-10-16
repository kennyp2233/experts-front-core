'use client';

import { Box, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

export type CampoFicha = [label: string, valor: React.ReactNode];

/** Etiqueta y valor; vacío → "—" en gris. */
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  const vacio = children === null || children === undefined || children === '';
  return (
    <>
      <Typography component="dt" variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
      <Typography
        component="dd"
        variant="body2"
        fontWeight={vacio ? 400 : 500}
        color={vacio ? 'text.disabled' : undefined}
        sx={{ m: 0, minWidth: 0, overflowWrap: 'anywhere' }}
      >
        {vacio ? '—' : children}
      </Typography>
    </>
  );
}

function Lista({ campos }: { campos: CampoFicha[] }) {
  return (
    <Box
      component="dl"
      sx={{ display: 'grid', gridTemplateColumns: 'max-content minmax(0, 1fr)', columnGap: 2, rowGap: 0.75, m: 0, alignContent: 'start' }}
    >
      {campos.map(([k, v]) => (
        <Campo key={k} label={k}>
          {v}
        </Campo>
      ))}
    </Box>
  );
}

/**
 * La cabecera de un documento como en las ventanas del sistema viejo: los
 * campos en dos columnas, en el mismo orden que allá, y una nota a todo el
 * ancho al pie (termógrafo, observación…).
 */
export function FichaCampos({ izquierda, derecha, nota }: { izquierda: CampoFicha[]; derecha: CampoFicha[]; nota?: string | null }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, columnGap: 4, rowGap: 0.75 }}>
        <Lista campos={izquierda} />
        <Lista campos={derecha} />
      </Box>
      {nota && (
        <Box
          sx={{
            mt: 1.5,
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: (t) => alpha(t.palette.warning.main, 0.08),
            border: 1,
            borderColor: 'warning.light',
          }}
        >
          <Typography variant="body2">
            <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
              Nota
            </Box>
            <strong>{nota}</strong>
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
