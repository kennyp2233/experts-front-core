'use client';

import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { CampoMaestro, FormularioMaestro, ValoresMaestro } from '../types';

const nf = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 4 });

export const vacio = (v: unknown) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

/** Un valor como se lee: Sí/No, la etiqueta de la opción, el número con su unidad. */
export function textoCampo(c: CampoMaestro, v: unknown): string {
  if (c.tipo === 'si-no') return v ? 'Sí' : 'No';
  if (vacio(v)) return '—';
  if (c.tipo === 'opciones') {
    const o = c.opciones?.find((x) => String(x.valor) === String(v));
    return o ? o.etiqueta : String(v);
  }
  if (c.tipo === 'numero' || c.tipo === 'entero') {
    const n = nf.format(Number(v));
    if (!c.unidad) return n;
    return c.unidad === '$' ? `$ ${n}` : `${n} ${c.unidad}`;
  }
  return String(v);
}

/** Columnas de una fila de 6 (en celular, todo a lo ancho). */
export const columna = (c: CampoMaestro) => ({ xs: '1 / -1', sm: `span ${c.ancho ?? 3}` });

function TablaVista({ c, filas }: { c: CampoMaestro; filas: ValoresMaestro[] }) {
  if (filas.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled">
        Ninguno.
      </Typography>
    );
  }
  return (
    <Table size="small" sx={{ '& td, & th': { px: 1, py: 0.5 } }}>
      <TableHead>
        <TableRow>
          {c.columnas?.map((col) => (
            <TableCell key={col.clave} sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {col.etiqueta}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {filas.map((f, i) => (
          <TableRow key={i}>
            {c.columnas?.map((col) => (
              <TableCell key={col.clave}>{textoCampo(col, f[col.clave])}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Ficha de lectura de un dato maestro con las mismas secciones y nombres del
 * formulario. Las secciones plegadas sin datos no se muestran.
 */
export function VistaMaestro({ formulario, valores }: { formulario: FormularioMaestro; valores: ValoresMaestro }) {
  return (
    <Stack spacing={2.5}>
      {formulario.secciones.map((s) => {
        const conDatos = s.campos.some((c) => c.tipo !== 'si-no' && !vacio(valores[c.clave]));
        if (s.plegada && !conDatos) return null;
        return (
          <Box key={s.titulo}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 2 }}>
              {s.titulo}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', columnGap: 2, rowGap: 1.25 }}>
              {s.campos.map((c) => (
                <Box key={c.clave} sx={{ gridColumn: c.tipo === 'tabla' ? '1 / -1' : columna(c), minWidth: 0 }}>
                  {c.tipo === 'tabla' ? (
                    <TablaVista c={c} filas={(valores[c.clave] as ValoresMaestro[] | null) ?? []} />
                  ) : (
                    <>
                      <Typography variant="caption" color="text.secondary" component="div">
                        {c.etiqueta}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-line',
                          overflowWrap: 'anywhere',
                          fontWeight: vacio(valores[c.clave]) ? 400 : 500,
                          color: vacio(valores[c.clave]) && c.tipo !== 'si-no' ? 'text.disabled' : 'text.primary',
                        }}
                      >
                        {textoCampo(c, valores[c.clave])}
                      </Typography>
                    </>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}
