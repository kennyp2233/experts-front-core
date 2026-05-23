'use client';

import { useEffect } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useDeleteSubmit } from '../hooks/useCoordinar';
import type { CoordinacionListItem } from '../types/coordinacion';

interface Props {
  /** Fila a borrar (null cierra el dialog). */
  row: CoordinacionListItem | null;
  onClose: () => void;
  /** Llamado tras un delete exitoso (302) para refrescar listas. */
  onDeleted?: () => void;
}

export function DeleteCoordinacionDialog({ row, onClose, onDeleted }: Props) {
  const { remove, deleting, result, error, reset } = useDeleteSubmit();
  const open = row != null;

  useEffect(() => {
    if (!open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (result?.ok && onDeleted) onDeleted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.ok]);

  const onConfirm = async () => {
    if (!row?.detalleId) return;
    const detalleId = parseInt(row.detalleId, 10);
    if (!Number.isFinite(detalleId)) return;
    await remove(detalleId);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Eliminar coordinación</DialogTitle>
      <DialogContent>
        <DialogContentText>
          ¿Confirmás eliminar la coordinación{' '}
          {row?.hawb && <strong>{row.hawb}</strong>}
          {row?.awb && ` del AWB ${row.awb}`}? Esta acción es{' '}
          <strong>irreversible</strong>.
        </DialogContentText>
        {result && (
          <Alert
            severity={result.ok ? 'success' : 'error'}
            sx={{ mt: 2 }}
          >
            {result.ok
              ? `Eliminada (status ${result.status})`
              : `Falló (status ${result.status})${
                  result.errors?.length ? ': ' + result.errors.join('; ') : ''
                }`}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error.message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {result?.ok ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!result?.ok && (
          <Button
            color="error"
            variant="contained"
            onClick={onConfirm}
            disabled={deleting || !row?.detalleId}
            startIcon={deleting ? <CircularProgress size={14} /> : undefined}
          >
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
