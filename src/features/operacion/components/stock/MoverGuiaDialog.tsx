'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { getErrorMessage, toIsoDate } from '@/shared/utils';
import { operacionService } from '../../services/operacion.service';
import type { GuiaMadreFila } from '../../types/coordinacion';

export type MovimientoGuia = 'prestar' | 'devolver';

interface Props {
  guia: GuiaMadreFila | null;
  accion: MovimientoGuia;
  onClose: () => void;
  onHecho: (mensaje: string) => void;
}

/** Préstamo de una guía disponible a otra agencia, o registro de su devolución. */
export function MoverGuiaDialog({ guia, accion, onClose, onHecho }: Props) {
  const [fecha, setFecha] = useState(toIsoDate(new Date()));
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    if (guia) {
      setFecha(toIsoDate(new Date()));
      setObservaciones('');
      setError(null);
    }
  }, [guia]);

  const confirmar = async () => {
    if (!guia) return;
    setTrabajando(true);
    setError(null);
    try {
      const dto = { fecha, observaciones: observaciones.trim() || undefined };
      if (accion === 'prestar') await operacionService.prestarGuia(guia.id, dto);
      else await operacionService.devolverGuia(guia.id, dto);
      onHecho(accion === 'prestar' ? `Guía ${guia.numero} prestada.` : `Devolución de la guía ${guia.numero} registrada.`);
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <Dialog open={guia !== null} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{accion === 'prestar' ? `Prestar la guía ${guia?.numero ?? ''}` : `Devolución de la guía ${guia?.numero ?? ''}`}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            type="date"
            label={accion === 'prestar' ? 'Fecha del préstamo' : 'Fecha de devolución'}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label={accion === 'prestar' ? 'A quién se presta' : 'Observaciones'}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            minRows={2}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={confirmar} disabled={trabajando || (accion === 'prestar' && !observaciones.trim())}>
          {accion === 'prestar' ? 'Prestar' : 'Registrar devolución'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
