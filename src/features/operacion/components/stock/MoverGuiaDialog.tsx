'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Chip,
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
import { formatoAwb } from '../../utils/formato';

export type MovimientoGuia = 'prestar' | 'devolver';

interface Props {
  guia: GuiaMadreFila | null;
  accion: MovimientoGuia;
  onClose: () => void;
  onHecho: (mensaje: string) => void;
}

/** Lo que suele anotar el dueño en el préstamo (notas del sistema viejo). */
const SUGERENCIAS = ['Usa EBF', 'Usa FlowerCargo', 'No se usa', 'Error'];

/**
 * Préstamo de una guía libre (la usó otra agencia, o no se usa) o registro de
 * su devolución. La observación es opcional: en el sistema viejo casi nunca se
 * anotaba.
 */
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
      const numero = formatoAwb(guia.numero);
      onHecho(accion === 'prestar' ? `Guía ${numero} prestada.` : `Devolución de la guía ${numero} registrada.`);
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <Dialog open={guia !== null} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {accion === 'prestar' ? `Prestar la guía ${formatoAwb(guia?.numero)}` : `Devolución de la guía ${formatoAwb(guia?.numero)}`}
      </DialogTitle>
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
            label="Observación (opcional)"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            multiline
            minRows={2}
          />
          {accion === 'prestar' && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {SUGERENCIAS.map((s) => (
                <Chip key={s} size="small" label={s} variant="outlined" onClick={() => setObservaciones(s)} />
              ))}
            </Stack>
          )}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={confirmar} disabled={trabajando}>
          {accion === 'prestar' ? 'Prestar' : 'Registrar devolución'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
