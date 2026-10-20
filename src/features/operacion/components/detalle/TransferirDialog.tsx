'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
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
import { formatDate, getErrorMessage } from '@/shared/utils';
import { operacionService } from '../../services/operacion.service';
import type { CoordinacionDetalle } from '../../types/coordinacion';
import { formatoAwb } from '../../utils/formato';

/**
 * Pasar cajas (líneas) a otra guía abierta, como el asistente de transferencia
 * del sistema viejo ("va a KAM"). Las dos guías se recalculan; en la de
 * destino las líneas quedan con la marca de esa guía.
 */
export function TransferirDialog({
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
  const [elegidas, setElegidas] = useState<Set<number>>(new Set());
  const [destino, setDestino] = useState<number | ''>('');
  const [trabajando, setTrabajando] = useState(false);

  // Guías abiertas del sistema nuevo desde el día de vuelo de esta (las de más adelante también).
  const { data, isLoading } = useSWR(abierto ? ['transferir-destinos', c.fechaVuelo] : null, () =>
    operacionService.listarCoordinaciones({ estado: 'BORRADOR', desde: c.fechaVuelo, pageSize: 100 }),
  );
  const destinos = useMemo(() => (data?.items ?? []).filter((x) => x.id !== c.id && x.origen === 'SISTEMA'), [data, c.id]);

  useEffect(() => {
    if (abierto) {
      setElegidas(new Set());
      setDestino('');
    }
  }, [abierto]);

  const lineas = c.guias.flatMap((g) =>
    g.lineas.map((l) => ({ ...l, finca: g.finca ? g.finca.alias || g.finca.nombre : '', guiaHija: g.numeroGuiaHija })),
  );
  const alternar = (id: number) =>
    setElegidas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const cajas = lineas.filter((l) => elegidas.has(l.id)).reduce((s, l) => s + l.cantidadCajas, 0);

  const pasar = async () => {
    if (!destino || !elegidas.size) return;
    setTrabajando(true);
    try {
      const r = await operacionService.transferirLineas(c.id, destino, [...elegidas]);
      const d = destinos.find((x) => x.id === destino);
      toast.success(`${r.lineas === 1 ? '1 línea pasó' : `${r.lineas} líneas pasaron`} a la guía ${formatoAwb(d?.numeroGuia ?? null)}.`);
      onCerrar();
      onCambio();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <Dialog open={abierto} onClose={trabajando ? undefined : onCerrar} maxWidth="md" fullWidth>
      <DialogTitle>Pasar cajas a otra guía</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            select
            label="Guía de destino (abierta)"
            value={destino}
            onChange={(e) => setDestino(Number(e.target.value))}
            size="small"
            fullWidth
            helperText={isLoading ? 'Buscando guías abiertas…' : destinos.length ? undefined : 'No hay otra guía abierta desde este día de vuelo.'}
          >
            {destinos.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                N° {d.numero} · {formatoAwb(d.numeroGuia)} · {d.aerolinea?.alias || d.aerolinea?.nombre} · {d.consignatario?.nombre} ·
                vuelo {formatDate(d.fechaVuelo)}
              </MenuItem>
            ))}
          </TextField>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Finca</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell align="right">Fulls</TableCell>
                <TableCell align="right">Cajas</TableCell>
                <TableCell align="right">Kg</TableCell>
                <TableCell>Guía hija</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lineas.map((l) => (
                <TableRow key={l.id} hover onClick={() => alternar(l.id)} sx={{ cursor: 'pointer' }}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={elegidas.has(l.id)} size="small" />
                  </TableCell>
                  <TableCell>{l.finca}</TableCell>
                  <TableCell>{l.producto?.nombre ?? l.codigoProducto}</TableCell>
                  <TableCell align="right">{l.fulls}</TableCell>
                  <TableCell align="right">{l.cantidadCajas}</TableCell>
                  <TableCell align="right">{l.pesoKg}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{l.guiaHija}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {elegidas.size > 0 && (
            <Alert severity="info" variant="outlined">
              Pasan {elegidas.size === 1 ? '1 línea' : `${elegidas.size} líneas`} ({cajas} cajas). Las dos guías se recalculan
              (totales, guías hijas y liquidación); revisa el peso cobrable de la de destino antes de cortarla.
            </Alert>
          )}
          <Typography variant="caption" color="text.secondary">
            Solo entre guías abiertas. En la guía de destino las líneas quedan con su marca.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCerrar} disabled={trabajando}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={pasar}
          disabled={trabajando || !destino || !elegidas.size}
          startIcon={trabajando ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Pasar cajas
        </Button>
      </DialogActions>
    </Dialog>
  );
}
