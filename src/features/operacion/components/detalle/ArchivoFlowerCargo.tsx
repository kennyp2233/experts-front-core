'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Alert,
  Button,
  Chip,
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
  Tooltip,
  Typography,
} from '@mui/material';
import { Download as DescargarIcon, Description as ArchivoIcon } from '@mui/icons-material';
import { useToast } from '@/shared/providers';
import { getErrorMessage } from '@/shared/utils';
import { operacionService } from '../../services/operacion.service';
import type { CoordinacionDetalle } from '../../types/coordinacion';
import { num } from '../../utils/formato';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

/**
 * Archivo de manifiesto para FlowerCargo: lo que antes llegaba de ellos y se
 * corregía a mano (columna T con nuestras guías hijas). Una fila por RUC de
 * finca, como lo arma FlowerCargo.
 */
export function ArchivoFlowerCargo({ c }: { c: CoordinacionDetalle }) {
  const toast = useToast();
  const [abierto, setAbierto] = useState(false);
  const [bajando, setBajando] = useState(false);
  const { data, error, isLoading } = useSWR(abierto ? ['operacion/flowercargo', c.id] : null, () =>
    operacionService.archivoFlowerCargo(c.id),
  );

  if (c.estado === 'ANULADO') return null;

  const descargar = async () => {
    if (!data) return;
    setBajando(true);
    try {
      await operacionService.descargarFlowerCargo(c.id, data.nombreArchivo);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBajando(false);
    }
  };

  const piezas = data?.filas.reduce((a, f) => a + f.piezas, 0) ?? 0;
  const kg = data?.filas.reduce((a, f) => a + f.kg, 0) ?? 0;

  return (
    <>
      <Button startIcon={<ArchivoIcon />} onClick={() => setAbierto(true)}>
        FlowerCargo
      </Button>
      <Dialog open={abierto} onClose={() => setAbierto(false)} fullWidth maxWidth="md">
        <DialogTitle>Archivo para FlowerCargo · guía {c.numeroGuia}</DialogTitle>
        <DialogContent>
          {isLoading && <CircularProgress size={24} />}
          {error && <Alert severity="error">{getErrorMessage(error)}</Alert>}
          {data && (
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Una línea por RUC de finca, con nuestros números de guía hija, el peso de nuestro sistema y el consignee
                de la marca. Se descarga listo para enviar: no hace falta abrirlo ni corregirlo.
              </Typography>
              {data.advertencias.map((a) => (
                <Alert key={a} severity="warning" variant="outlined">
                  {a}
                </Alert>
              ))}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Guía hija</TableCell>
                    <TableCell>Finca</TableCell>
                    <TableCell>RUC</TableCell>
                    <TableCell align="right">Piezas</TableCell>
                    <TableCell align="right">Kg</TableCell>
                    <TableCell>DAE</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.filas.map((f) => (
                    <TableRow key={f.linea}>
                      <TableCell>{f.linea}</TableCell>
                      <TableCell sx={{ ...nums, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {f.guiaHija}
                        {f.guiasAgrupadas.length > 1 && (
                          <Tooltip title={`Mismo RUC: ${f.guiasAgrupadas.join(', ')} van juntas (va la de más piezas).`}>
                            <Chip size="small" label={`+${f.guiasAgrupadas.length - 1}`} sx={{ ml: 1 }} />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>{f.finca}</TableCell>
                      <TableCell sx={nums}>{f.ruc ?? '—'}</TableCell>
                      <TableCell align="right" sx={nums}>{num(f.piezas, 0)}</TableCell>
                      <TableCell align="right" sx={nums}>{num(f.kg)}</TableCell>
                      <TableCell sx={{ ...nums, whiteSpace: 'nowrap' }}>{f.dae ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ '& td': { fontWeight: 600, borderBottom: 'none' } }}>
                    <TableCell colSpan={4}>Total ({data.filas.length} líneas)</TableCell>
                    <TableCell align="right" sx={nums}>{num(piezas, 0)}</TableCell>
                    <TableCell align="right" sx={nums}>{num(kg)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAbierto(false)}>Cerrar</Button>
          <Button
            variant="contained"
            startIcon={bajando ? <CircularProgress size={16} color="inherit" /> : <DescargarIcon />}
            disabled={!data || bajando}
            onClick={descargar}
          >
            Descargar .txt
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
