'use client';

import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

/** Campos técnicos que no aportan en la ficha. */
const OCULTOS = new Set(['createdAt', 'updatedAt']);

/** "consigneeNombreTrans" → "Consignee nombre trans". */
export const humanizar = (k: string) => {
  const t = k
    .replace(/^id(?=[A-Z])/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const esObjeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function Valor({ v }: { v: unknown }) {
  if (v === null || v === undefined || v === '') return <Typography variant="body2" color="text.disabled">—</Typography>;
  if (typeof v === 'boolean') return <Chip size="small" variant="outlined" label={v ? 'Sí' : 'No'} color={v ? 'success' : 'default'} />;
  if (typeof v === 'number') return <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>{v.toLocaleString('es-EC')}</Typography>;
  return (
    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
      {String(v)}
    </Typography>
  );
}

function Campos({ obj }: { obj: Record<string, unknown> }) {
  const entradas = Object.entries(obj).filter(([k, v]) => !OCULTOS.has(k) && !esObjeto(v) && !Array.isArray(v));
  return (
    <Box
      component="dl"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'minmax(140px, max-content) 1fr' },
        columnGap: 2,
        rowGap: 0.75,
        m: 0,
        '& dt': { color: 'text.secondary', typography: 'body2' },
        '& dd': { m: 0, mb: { xs: 1, sm: 0 } },
      }}
    >
      {entradas.map(([k, v]) => (
        <Box key={k} sx={{ display: 'contents' }}>
          <dt>{humanizar(k)}</dt>
          <dd>
            <Valor v={v} />
          </dd>
        </Box>
      ))}
    </Box>
  );
}

function TablaHijos({ filas }: { filas: Record<string, unknown>[] }) {
  // Columnas = unión de claves simples; los objetos anidados se resumen.
  const cols = [...new Set(filas.flatMap((f) => Object.keys(f)))].filter(
    (k) => !OCULTOS.has(k) && !k.startsWith('id') && k !== 'id',
  );
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {cols.map((c) => (
              <TableCell key={c}>{humanizar(c)}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filas.slice(0, 100).map((f, i) => (
            <TableRow key={i}>
              {cols.map((c) => {
                const v = f[c];
                return (
                  <TableCell key={c}>
                    {esObjeto(v) ? String(v.nombre ?? v.codigo ?? '…') : <Valor v={v} />}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * Ficha genérica de un registro de datos maestros: campos simples arriba y
 * cada relación (objeto o lista) en su propia sección.
 */
export function FichaRegistro({ registro }: { registro: Record<string, unknown> }) {
  const secciones = Object.entries(registro).filter(([, v]) => esObjeto(v) || (Array.isArray(v) && v.length > 0));
  return (
    <Stack spacing={2.5}>
      <Campos obj={registro} />
      {secciones.map(([k, v]) => (
        <Box key={k}>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="subtitle2" gutterBottom>
            {humanizar(k)}
          </Typography>
          {Array.isArray(v) ? (
            <TablaHijos filas={v as Record<string, unknown>[]} />
          ) : (
            <Stack spacing={1.5}>
              <Campos obj={v as Record<string, unknown>} />
              {Object.entries(v as Record<string, unknown>)
                .filter(([, x]) => Array.isArray(x) && x.length > 0)
                .map(([kk, x]) => (
                  <Box key={kk}>
                    <Typography variant="caption" color="text.secondary">
                      {humanizar(kk)}
                    </Typography>
                    <TablaHijos filas={x as Record<string, unknown>[]} />
                  </Box>
                ))}
            </Stack>
          )}
        </Box>
      ))}
    </Stack>
  );
}
