'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useToast } from '@/shared/providers';
import { getErrorMessage } from '@/shared/utils';
import { operacionService } from '../../services/operacion.service';
import type { CoordinacionDetalle } from '../../types/coordinacion';
import { formatoAwb } from '../../utils/formato';

interface FilaEdicion {
  idLinea: number;
  finca: string;
  producto: string;
  cajas: number;
  guiaHija: string;
  factura: string;
  nota: string;
}

/**
 * Factura y nota de cada línea y nota de la guía. Es lo único que se corrige
 * después del corte (el corte fija pesos y valores): las fincas a veces mandan
 * su factura cuando la guía ya se cortó. Factura vacía = el número de guía hija.
 */
export function CorregirDialog({
  c,
  abierto,
  onCerrar,
  onCambio,
}: {
  c: CoordinacionDetalle;
  abierto: boolean;
  onCerrar: () => void;
  onCambio: () => void;
}) {
  const toast = useToast();
  const original = useMemo<FilaEdicion[]>(
    () =>
      c.guias.flatMap((g) =>
        g.lineas.map((l) => ({
          idLinea: l.id,
          finca: g.finca ? g.finca.alias || g.finca.nombre : '',
          producto: l.producto?.nombre ?? l.codigoProducto ?? '',
          cajas: l.cantidadCajas,
          guiaHija: g.numeroGuiaHija,
          factura: l.factura && l.factura !== '0' ? l.factura : '',
          nota: l.nota ?? '',
        })),
      ),
    [c],
  );
  const [filas, setFilas] = useState<FilaEdicion[]>(original);
  const [nota, setNota] = useState(c.nota ?? '');
  const [grabando, setGrabando] = useState(false);

  useEffect(() => {
    if (abierto) {
      setFilas(original);
      setNota(c.nota ?? '');
    }
  }, [abierto, original, c.nota]);

  const cambiar = (i: number, campo: 'factura' | 'nota', valor: string) =>
    setFilas((fs) => fs.map((f, j) => (j === i ? { ...f, [campo]: valor } : f)));

  const grabar = async () => {
    const lineas = filas
      .map((f, i) => ({ f, o: original[i] }))
      .filter(({ f, o }) => f.factura !== o.factura || f.nota !== o.nota)
      .map(({ f, o }) => ({
        idLinea: f.idLinea,
        ...(f.factura !== o.factura ? { factura: f.factura.trim() } : {}),
        ...(f.nota !== o.nota ? { nota: f.nota.trim() } : {}),
      }));
    const cambioNota = nota !== (c.nota ?? '');
    if (!lineas.length && !cambioNota) {
      onCerrar();
      return;
    }
    setGrabando(true);
    try {
      await operacionService.corregirCoordinacion(c.id, { lineas, ...(cambioNota ? { nota } : {}) });
      toast.success('Correcciones grabadas.');
      onCerrar();
      onCambio();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setGrabando(false);
    }
  };

  return (
    <Dialog open={abierto} onClose={grabando ? undefined : onCerrar} maxWidth="md" fullWidth>
      <DialogTitle>Facturas y notas · {formatoAwb(c.numeroGuia)}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {c.estado === 'CORTADO' && (
            <Alert severity="info" variant="outlined">
              La guía está cortada: aquí solo se corrigen facturas y notas (pesos y valores quedan como se cortaron).
            </Alert>
          )}
          <TextField
            label="Nota de la guía"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            size="small"
            fullWidth
            multiline
            maxRows={3}
            inputProps={{ maxLength: 2000 }}
            helperText="P. ej. el termógrafo"
          />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Finca</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell align="right">Cajas</TableCell>
                <TableCell>Guía hija</TableCell>
                <TableCell sx={{ width: 150 }}>Factura</TableCell>
                <TableCell sx={{ width: 220 }}>Nota</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map((f, i) => (
                <TableRow key={f.idLinea}>
                  <TableCell>{f.finca}</TableCell>
                  <TableCell>{f.producto}</TableCell>
                  <TableCell align="right">{f.cajas}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{f.guiaHija}</TableCell>
                  <TableCell>
                    <TextField
                      value={f.factura}
                      onChange={(e) => cambiar(i, 'factura', e.target.value)}
                      placeholder={f.guiaHija}
                      size="small"
                      variant="standard"
                      inputProps={{ maxLength: 20 }}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={f.nota}
                      onChange={(e) => cambiar(i, 'nota', e.target.value)}
                      size="small"
                      variant="standard"
                      inputProps={{ maxLength: 120 }}
                      fullWidth
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Typography variant="caption" color="text.secondary">
            Factura vacía = el número de guía hija, como en el sistema viejo.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCerrar} disabled={grabando}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={grabar} disabled={grabando} startIcon={grabando ? <CircularProgress size={16} color="inherit" /> : undefined}>
          Grabar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
