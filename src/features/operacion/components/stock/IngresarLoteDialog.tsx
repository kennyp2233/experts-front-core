'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { getErrorMessage, toIsoDate } from '@/shared/utils';
import { maestrosService } from '@/features/maestros/services/maestros.service';
import type { FilaMaestro } from '@/features/maestros/types';
import { operacionService } from '../../services/operacion.service';
import type { PrevisualizacionLote } from '../../types/coordinacion';

interface Props {
  open: boolean;
  onClose: () => void;
  onIngresado: (guias: number) => void;
}

/**
 * Ingreso de un lote de guías consecutivas de una aerolínea. Primero muestra
 * el rango que se va a crear (con dígitos verificadores) y avisa si alguna ya
 * está en el stock.
 */
export function IngresarLoteDialog({ open, onClose, onIngresado }: Props) {
  const [aerolinea, setAerolinea] = useState<FilaMaestro | null>(null);
  const [buscar, setBuscar] = useState('');
  const [primeraGuia, setPrimeraGuia] = useState('');
  const [cantidad, setCantidad] = useState('10');
  const [virtual, setVirtual] = useState(false);
  const [fecha, setFecha] = useState(toIsoDate(new Date()));
  const [previa, setPrevia] = useState<PrevisualizacionLote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const { data: aerolineas } = useSWR(open ? ['maestros', 'aerolineas', buscar] : null, () =>
    maestrosService.listar('aerolineas', buscar || undefined, 1),
  );

  // Cualquier cambio invalida la previsualización.
  useEffect(() => setPrevia(null), [aerolinea, primeraGuia, cantidad, virtual]);

  const dto = () => ({
    idAerolinea: Number(aerolinea?.id),
    primeraGuia,
    cantidad: Number(cantidad),
    virtual,
    fecha,
  });

  const previsualizar = async () => {
    setError(null);
    setTrabajando(true);
    try {
      setPrevia(await operacionService.previsualizarLote(dto()));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setTrabajando(false);
    }
  };

  const ingresar = async () => {
    setError(null);
    setTrabajando(true);
    try {
      const r = await operacionService.ingresarLote(dto());
      onIngresado(r.guias);
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setTrabajando(false);
    }
  };

  const listo = aerolinea && primeraGuia.trim() && Number(cantidad) > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Ingresar lote de guías</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Autocomplete
            options={aerolineas?.items ?? []}
            value={aerolinea}
            onChange={(_, v) => setAerolinea(v)}
            onInputChange={(_, v) => setBuscar(v)}
            getOptionLabel={(o) => `${o.codigo ?? ''} · ${o.nombre}${o.detalle ? ` (${o.detalle})` : ''}`}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(p) => <TextField {...p} label="Aerolínea" helperText="Define el prefijo de las guías" />}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Primera guía"
              value={primeraGuia}
              onChange={(e) => setPrimeraGuia(e.target.value)}
              placeholder="8469 5461"
              helperText="8 dígitos (o 7 sin el verificador)"
              sx={{ flex: 2 }}
            />
            <TextField
              label="Cantidad"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              slotProps={{ htmlInput: { min: 1, max: 500 } }}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              type="date"
              label="Fecha de ingreso"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControlLabel
              control={<Checkbox checked={virtual} onChange={(e) => setVirtual(e.target.checked)} />}
              label="Guías virtuales"
            />
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
          {previa && (
            <Box>
              {previa.repetidas.length > 0 ? (
                <Alert severity="warning">
                  {previa.repetidas.length} guía(s) ya están en el stock: {previa.repetidas.slice(0, 5).join(', ')}
                  {previa.repetidas.length > 5 ? '…' : ''}
                </Alert>
              ) : (
                <Alert severity="success">
                  Se ingresarán {previa.guias.length} guías de {previa.aerolinea.nombre}: de{' '}
                  <strong>{previa.guias[0]?.texto}</strong> a <strong>{previa.guias[previa.guias.length - 1]?.texto}</strong>.
                </Alert>
              )}
              <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
                El último dígito de cada guía es el verificador IATA (serial mod 7).
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        {!previa || previa.repetidas.length > 0 ? (
          <Button variant="outlined" onClick={previsualizar} disabled={!listo || trabajando}>
            Revisar
          </Button>
        ) : (
          <Button variant="contained" onClick={ingresar} disabled={trabajando}>
            Ingresar {previa.guias.length} guías
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
