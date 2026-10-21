'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  createFilterOptions,
} from '@mui/material';
import { useToast } from '@/shared/providers';
import { getErrorMessage } from '@/shared/utils';
import { ebfService } from '../../services/ebf.service';
import type { OpcionEbf, TipoEquivalenciaEbf } from '../../types/ebf';

export const NOMBRE_TIPO: Record<TipoEquivalenciaEbf, { uno: string; ebf: string }> = {
  FINCA: { uno: 'la finca', ebf: 'exportador' },
  MARCA: { uno: 'la marca', ebf: 'marcación' },
  PRODUCTO: { uno: 'el producto', ebf: 'producto' },
};

// EBF tiene ~3.500 marcaciones: se muestran las primeras 50 que coinciden
const filtrar = createFilterOptions<OpcionEbf | string>({ limit: 50, stringify: (o) => (typeof o === 'string' ? o : o.label) });

/**
 * Enlazar a mano un registro nuestro con el de EBF. Las opciones salen del
 * propio portal (exportadores y marcaciones); el producto se escribe como lo
 * muestra EBF ("SPRAY ROSES").
 */
export function EnlazarEbfDialog({
  tipo,
  idLocal,
  local,
  sugerencia,
  onClose,
  onGuardado,
}: {
  tipo: TipoEquivalenciaEbf;
  idLocal: number;
  local: string;
  /** Lo que EBF parece tener (p. ej. la fila con la misma DAE) */
  sugerencia?: string | null;
  onClose: () => void;
  onGuardado: () => void;
}) {
  const toast = useToast();
  const [opciones, setOpciones] = useState<OpcionEbf[] | null>(null);
  const [valor, setValor] = useState<OpcionEbf | string | null>(sugerencia ?? null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    ebfService
      .opciones(tipo)
      .then((o) => {
        if (!vivo) return;
        setOpciones(o);
        if (sugerencia) setValor(o.find((x) => x.label.toUpperCase() === sugerencia.toUpperCase()) ?? sugerencia);
      })
      .catch((e) => vivo && setError(getErrorMessage(e, 'No se pudieron leer las opciones de EBF.')));
    return () => {
      vivo = false;
    };
  }, [tipo, sugerencia]);

  const nombre = typeof valor === 'string' ? valor.trim() : (valor?.label ?? '');
  const id = typeof valor === 'object' && valor ? Number(valor.value) || undefined : undefined;

  const guardar = async () => {
    if (!nombre) return;
    setGuardando(true);
    setError(null);
    try {
      await ebfService.fijar(tipo, idLocal, nombre, id);
      toast.success(`«${local}» queda enlazado con «${nombre}» de EBF.`);
      onGuardado();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudo guardar el enlace.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onClose={guardando ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Enlazar {NOMBRE_TIPO[tipo].uno} con EBF</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2">
            <strong>{local}</strong> en EBF es el {NOMBRE_TIPO[tipo].ebf}:
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <Autocomplete<OpcionEbf | string, false, false, boolean>
            freeSolo={tipo === 'PRODUCTO'}
            options={opciones ?? []}
            loading={!opciones && !error}
            value={valor}
            onChange={(_, v) => setValor(v)}
            onInputChange={(_, v, reason) => tipo === 'PRODUCTO' && reason === 'input' && setValor(v)}
            filterOptions={filtrar}
            getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
            isOptionEqualToValue={(a, b) => (typeof a === 'string' ? a : a.label) === (typeof b === 'string' ? b : b.label)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={`${NOMBRE_TIPO[tipo].ebf[0].toUpperCase()}${NOMBRE_TIPO[tipo].ebf.slice(1)} en EBF`}
                autoFocus
                helperText={tipo === 'PRODUCTO' ? 'Como lo muestra EBF, p. ej. SPRAY ROSES.' : 'Escribe parte del nombre.'}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {!opciones && !error ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={guardando} color="inherit">
          Cancelar
        </Button>
        <Button variant="contained" onClick={guardar} disabled={!nombre || guardando}>
          {guardando ? 'Guardando…' : 'Enlazar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
