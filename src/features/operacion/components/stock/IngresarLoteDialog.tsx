'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
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
  onIngresado: (guias: number, idAerolinea: number) => void;
}

/** Cuántas guías de la secuencia se muestran antes del "…" (como la grilla del sistema viejo). */
const MUESTRA = 5;

/**
 * Ingreso de guías consecutivas de una aerolínea (menú viejo: Guías › Ingreso).
 * "Generar secuencia" muestra las guías con su dígito verificador y avisa si
 * alguna ya está en el stock; después se graban.
 */
export function IngresarLoteDialog({ open, onClose, onIngresado }: Props) {
  const [aerolinea, setAerolinea] = useState<FilaMaestro | null>(null);
  const [buscar, setBuscar] = useState('');
  const [numeroInicial, setNumeroInicial] = useState('');
  const [cantidad, setCantidad] = useState('10');
  const [virtual, setVirtual] = useState(false);
  const [fecha, setFecha] = useState(toIsoDate(new Date()));
  const [referencia, setReferencia] = useState('');
  const [secuencia, setSecuencia] = useState<PrevisualizacionLote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const { data: aerolineas } = useSWR(open ? ['maestros', 'aerolineas', buscar] : null, () =>
    maestrosService.listar('aerolineas', buscar || undefined, 1),
  );

  // Cualquier cambio obliga a generar la secuencia de nuevo.
  useEffect(() => setSecuencia(null), [aerolinea, numeroInicial, cantidad, virtual]);

  const dto = () => ({
    idAerolinea: Number(aerolinea?.id),
    primeraGuia: numeroInicial,
    cantidad: Number(cantidad),
    virtual,
    fecha,
    referencia: referencia.trim() || undefined,
  });

  const generar = async () => {
    setError(null);
    setTrabajando(true);
    try {
      setSecuencia(await operacionService.previsualizarLote(dto()));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setTrabajando(false);
    }
  };

  const grabar = async () => {
    setError(null);
    setTrabajando(true);
    try {
      const r = await operacionService.ingresarLote(dto());
      onIngresado(r.guias, Number(aerolinea?.id));
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setTrabajando(false);
    }
  };

  const listo = aerolinea && numeroInicial.trim() && Number(cantidad) > 0;
  const puedeGrabar = secuencia && secuencia.repetidas.length === 0;

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (trabajando) return;
    if (puedeGrabar) void grabar();
    else if (listo) void generar();
  };

  const guias = secuencia?.guias ?? [];
  const muestra = guias.length > MUESTRA + 1 ? [...guias.slice(0, MUESTRA), null, guias[guias.length - 1]] : guias;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { component: 'form', onSubmit: enviar } }}>
      <DialogTitle>Ingreso de guías</DialogTitle>
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
              label="Número inicial"
              value={numeroInicial}
              onChange={(e) => setNumeroInicial(e.target.value)}
              placeholder="8469 5461"
              helperText="8 dígitos (o 7, sin el dígito verificador)"
              sx={{ flex: 2 }}
            />
            <TextField
              label="Cantidad de guías"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              slotProps={{ htmlInput: { min: 1, max: 500 } }}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <TextField
              type="date"
              label="Fecha de ingreso"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl>
              <FormLabel sx={{ typography: 'caption' }}>Tipo de stock</FormLabel>
              <RadioGroup row value={virtual ? 'virtual' : 'normal'} onChange={(e) => setVirtual(e.target.value === 'virtual')}>
                <FormControlLabel value="normal" control={<Radio size="small" />} label="Normal" />
                <FormControlLabel value="virtual" control={<Radio size="small" />} label="Virtual" />
              </RadioGroup>
            </FormControl>
          </Stack>
          <TextField label="Referencia" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
          {error && <Alert severity="error">{error}</Alert>}
          {secuencia && (
            <Box>
              {secuencia.repetidas.length > 0 ? (
                <Alert severity="warning">
                  {secuencia.repetidas.length === 1 ? '1 guía ya está' : `${secuencia.repetidas.length} guías ya están`} en el
                  stock: {secuencia.repetidas.slice(0, 5).join(', ')}
                  {secuencia.repetidas.length > 5 ? '…' : ''}
                </Alert>
              ) : (
                <Alert severity="success" icon={false}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {guias.length === 1 ? '1 guía' : `${guias.length} guías`} de {secuencia.aerolinea.nombre}:
                  </Typography>
                  <Box component="ol" sx={{ m: 0, pl: 3, fontVariantNumeric: 'tabular-nums' }}>
                    {muestra.map((g, i) =>
                      g ? (
                        <li key={g.numero} value={g === guias[guias.length - 1] ? guias.length : i + 1}>
                          <strong>{g.texto}</strong>
                        </li>
                      ) : (
                        <Box component="li" key="…" sx={{ listStyle: 'none', ml: -3 }}>
                          …
                        </Box>
                      ),
                    )}
                  </Box>
                </Alert>
              )}
              <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
                El último dígito de cada guía es el dígito verificador.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        {puedeGrabar ? (
          <Button
            type="submit"
            variant="contained"
            disabled={trabajando}
            startIcon={trabajando ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Grabar {guias.length === 1 ? '1 guía' : `${guias.length} guías`}
          </Button>
        ) : (
          <Button type="submit" variant="outlined" disabled={!listo || trabajando}>
            Generar secuencia
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
