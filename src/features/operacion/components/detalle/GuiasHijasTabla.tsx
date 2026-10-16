'use client';

import { Fragment, useState } from 'react';
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { KeyboardArrowDown as AbrirIcon, KeyboardArrowUp as CerrarIcon } from '@mui/icons-material';
import type { GuiaHija } from '../../types/coordinacion';
import { kg, nombreCorto, num, plural, usd } from '../../utils/formato';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

function Lineas({ guia }: { guia: GuiaHija }) {
  return (
    <Table size="small" sx={{ '& td, & th': { borderBottom: 'none', py: 0.5 } }}>
      <TableHead>
        <TableRow>
          <TableCell>Producto</TableCell>
          <TableCell>Tipo caja</TableCell>
          <TableCell align="right">Cajas</TableCell>
          <TableCell align="right">Fulls</TableCell>
          <TableCell align="right">Kg</TableCell>
          <TableCell align="right">Tallos</TableCell>
          <TableCell align="right">Valor</TableCell>
          <TableCell>Medidas (cm)</TableCell>
          <TableCell>Nota</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {guia.lineas.map((l) => (
          <TableRow key={l.id}>
            <TableCell>{l.producto?.nombre ?? l.codigoProducto ?? '—'}</TableCell>
            <TableCell>
              {l.tipoCaja ? (
                <Tooltip title={l.tipoCaja.nombre}>
                  <span>{l.tipoCaja.codigo}</span>
                </Tooltip>
              ) : null}
            </TableCell>
            <TableCell align="right" sx={nums}>{num(l.cantidadCajas, 0)}</TableCell>
            <TableCell align="right" sx={nums}>{num(l.fulls)}</TableCell>
            <TableCell align="right" sx={nums}>{num(l.pesoKg)}</TableCell>
            <TableCell align="right" sx={nums}>{num(l.tallos, 0)}</TableCell>
            <TableCell align="right" sx={nums}>{l.valor ? usd(l.valor) : ''}</TableCell>
            <TableCell sx={nums}>
              {l.largo || l.ancho || l.alto ? `${num(l.largo, 0)} × ${num(l.ancho, 0)} × ${num(l.alto, 0)}` : '—'}
            </TableCell>
            <TableCell>{l.nota ?? ''}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Guías hijas (HAWB) de la coordinación; cada fila se despliega en sus líneas. */
export function GuiasHijasTabla({ guias }: { guias: GuiaHija[] }) {
  const [abiertas, setAbiertas] = useState<Record<number, boolean>>({});
  const tot = guias.reduce(
    (a, g) => ({ cajas: a.cajas + g.totalPiezas, fulls: a.fulls + g.totalFulls, kg: a.kg + g.pesoBruto }),
    { cajas: 0, fulls: 0, kg: 0 },
  );

  if (guias.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        Esta coordinación no tiene guías hijas.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={40} />
            <TableCell>Guía hija</TableCell>
            <TableCell>Finca</TableCell>
            <TableCell>DAE</TableCell>
            <TableCell align="right">Cajas</TableCell>
            <TableCell align="right">Fulls</TableCell>
            <TableCell align="right">Kg</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {guias.map((g) => {
            const abierta = !!abiertas[g.id];
            return (
              <Fragment key={g.id}>
                <TableRow
                  hover
                  onClick={() => setAbiertas((s) => ({ ...s, [g.id]: !abierta }))}
                  sx={{ cursor: 'pointer', '& > td': { borderBottom: abierta ? 'none' : undefined } }}
                >
                  <TableCell>
                    <IconButton size="small" aria-label={abierta ? 'Ocultar líneas' : 'Ver líneas'}>
                      {abierta ? <CerrarIcon fontSize="small" /> : <AbrirIcon fontSize="small" />}
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ ...nums, fontWeight: 600 }}>{g.numeroGuiaHija}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{nombreCorto(g.finca)}</Typography>
                    {(g.finca?.alias || g.finca?.codigo) && (
                      <Typography variant="caption" color="text.secondary">
                        {[g.finca.alias ? g.finca.nombre : null, g.finca.codigo ? `RUC ${g.finca.codigo}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={nums}>{g.dae ?? '—'}</TableCell>
                  <TableCell align="right" sx={nums}>{num(g.totalPiezas, 0)}</TableCell>
                  <TableCell align="right" sx={nums}>{num(g.totalFulls)}</TableCell>
                  <TableCell align="right" sx={nums}>{num(g.pesoBruto)}</TableCell>
                </TableRow>
                {abierta && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ pt: 0 }}>
                      <Collapse in appear>
                        <Box sx={{ py: 1, pl: 5, bgcolor: 'action.hover', borderRadius: 1, mb: 1 }}>
                          <Lineas guia={g} />
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
          <TableRow sx={{ '& td': { fontWeight: 600, borderBottom: 'none' } }}>
            <TableCell />
            <TableCell colSpan={3}>Total ({plural(guias.length, 'guía hija', 'guías hijas')})</TableCell>
            <TableCell align="right" sx={nums}>{num(tot.cajas, 0)}</TableCell>
            <TableCell align="right" sx={nums}>{num(tot.fulls)}</TableCell>
            <TableCell align="right" sx={nums}>{kg(tot.kg)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
