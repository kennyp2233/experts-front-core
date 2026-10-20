'use client';

import { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Refresh as RefrescarIcon } from '@mui/icons-material';
import { AppPage } from '@/shared/components/ui';
import { useToast } from '@/shared/providers';
import { getErrorMessage } from '@/shared/utils';
import { useEstadoCorte } from '../../hooks/useCuentas';
import { cuentasService } from '../../services/cuentas.service';
import type { ContadorCorte } from '../../types/cuentas';
import { num } from '../../utils/formato';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

const entero = (v: number | null | undefined) => (v === null || v === undefined ? '—' : num(v, 0));

/** Ya está alineado si el contador nuevo no es menor que el siguiente al alinear. */
/** Alineado = el contador del sistema nuevo está en el último número del viejo (el siguiente sigue su serie). */
const alineado = (c: ContadorCorte) => c.ultimoAccess !== null && c.actual === c.ultimoAccess;
/** En modo sombra el sistema nuevo numera en su rango propio (900.000, 90.000.000…), lejos del viejo. */
const rangoPropio = (c: ContadorCorte) => c.ultimoAccess !== null && c.actual !== null && c.actual > c.ultimoAccess;

/**
 * Corte definitivo (solo ADMIN): el día que se apaga el sistema viejo, el nuevo
 * pasa de "sombra" a "activo" y sus contadores se alinean con los últimos números
 * que usó Access, para no repetir ni saltarse ninguno.
 */
export function CorteDefinitivoPage() {
  const toast = useToast();
  const { corte, error, isLoading, isValidating, mutate } = useEstadoCorte();
  const [confirmar, setConfirmar] = useState(false);
  const [alineando, setAlineando] = useState(false);

  const sombra = corte?.modo === 'sombra';
  const sinAccess = !!corte && !corte.accessDisponible;
  // Por qué no se puede alinear (se muestra junto al botón).
  const motivo = !corte
    ? null
    : sombra
      ? 'Solo se alinea el día del corte, con el sistema en modo activo. En modo sombra el sistema viejo sigue numerando y los números chocarían.'
      : sinAccess
        ? 'No se pudo leer el sistema viejo, así que no se conocen sus últimos números.'
        : null;
  const todosAlineados = !!corte && corte.contadores.length > 0 && corte.contadores.every(alineado);

  const alinear = async () => {
    setAlineando(true);
    try {
      await cuentasService.alinearContadores();
      toast.success('Contadores alineados con el sistema viejo.');
      setConfirmar(false);
      await mutate();
    } catch (e) {
      toast.error(getErrorMessage(e, 'No se pudieron alinear los contadores.'));
      setConfirmar(false);
    } finally {
      setAlineando(false);
    }
  };

  return (
    <AppPage
      title="Corte definitivo"
      subtitle="El día que se apaga el sistema viejo: pasar a modo activo y alinear los contadores con los últimos números que usó."
      maxWidth={1100}
      actions={
        <Button startIcon={<RefrescarIcon />} onClick={() => mutate()} disabled={isValidating}>
          Actualizar
        </Button>
      }
    >
      {isValidating && corte && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" action={<Button onClick={() => mutate()}>Reintentar</Button>} sx={{ mb: 2 }}>
          {getErrorMessage(error, 'No se pudo leer el estado del corte.')}
        </Alert>
      )}
      {isLoading && !corte && (
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={96} />
          <Skeleton variant="rounded" height={200} />
        </Stack>
      )}

      {corte && (
        <Stack spacing={3}>
          <Alert
            severity={sombra ? 'info' : 'warning'}
            icon={false}
            sx={{ alignItems: 'center', '& .MuiAlert-message': { width: '100%' } }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <Chip
                label={sombra ? 'MODO SOMBRA' : 'MODO ACTIVO'}
                color={sombra ? 'info' : 'warning'}
                sx={{ fontWeight: 700, fontSize: '1rem', height: 40, px: 1 }}
              />
              <Box>
                <AlertTitle sx={{ mb: 0.25 }}>
                  {sombra ? 'El sistema viejo sigue mandando' : 'El sistema nuevo manda'}
                </AlertTitle>
                <Typography variant="body2">
                  {sombra
                    ? 'Lo que viene del sistema viejo se ve pero no se modifica aquí, y lo nuevo se numera aparte, en rangos altos que no chocan con los del viejo. El modo se cambia en el servidor (OPERACION_MODO), no desde esta pantalla.'
                    : 'Todo se puede modificar aquí y el sync con el sistema viejo está apagado. Si todavía no lo hiciste, alinea los contadores.'}
                </Typography>
              </Box>
            </Stack>
          </Alert>

          {sinAccess && (
            <Alert severity="warning">
              No se pudo leer el sistema viejo (Access): los últimos números no están disponibles y no se puede alinear hasta que vuelva la conexión.
            </Alert>
          )}

          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Contadores
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Contador</TableCell>
                    <TableCell align="right">Actual (sistema nuevo)</TableCell>
                    <TableCell align="right">Último en el sistema viejo</TableCell>
                    <TableCell align="right">Siguiente al alinear</TableCell>
                    <TableCell align="center">Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {corte.contadores.map((c) => (
                    <TableRow key={c.clave}>
                      <TableCell sx={{ maxWidth: 380 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {c.clave}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.descripcion}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={nums}>{entero(c.actual)}</TableCell>
                      <TableCell align="right" sx={nums}>{entero(c.ultimoAccess)}</TableCell>
                      <TableCell align="right" sx={{ ...nums, fontWeight: 600 }}>{entero(c.siguienteAlAlinear)}</TableCell>
                      <TableCell align="center">
                        {c.siguienteAlAlinear === null ? (
                          <Chip size="small" variant="outlined" label="Sin dato" />
                        ) : alineado(c) ? (
                          <Chip size="small" color="success" variant="outlined" label="Alineado" />
                        ) : rangoPropio(c) ? (
                          <Chip size="small" color="info" variant="outlined" label="Rango propio (sombra)" />
                        ) : (
                          <Chip size="small" color="warning" variant="outlined" label="Por alinear" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mt: 2 }}>
              <Tooltip title={motivo ?? ''} disableHoverListener={!motivo}>
                <span>
                  <Button
                    variant="contained"
                    color="warning"
                    disabled={!!motivo || todosAlineados}
                    onClick={() => setConfirmar(true)}
                  >
                    Alinear contadores
                  </Button>
                </span>
              </Tooltip>
              <Typography variant="body2" color="text.secondary">
                {motivo ?? (todosAlineados ? 'Los contadores ya están alineados.' : 'Cada contador pasa a su número siguiente al alinear.')}
              </Typography>
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Pasos del corte
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack component="ol" spacing={1.25} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                {corte.pasos.map((p, i) => (
                  <Stack key={i} component="li" direction="row" spacing={1.5} alignItems="flex-start">
                    <Box
                      sx={{
                        flexShrink: 0,
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </Box>
                    <Typography variant="body2" sx={{ pt: 0.4 }}>
                      {p}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Box>
        </Stack>
      )}

      <Dialog open={confirmar} onClose={alineando ? undefined : () => setConfirmar(false)} maxWidth="sm" fullWidth>
        <DialogTitle>¿Alinear los contadores?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            Los números nuevos seguirán a los últimos del sistema viejo. Esto no se puede deshacer desde aquí.
            <Box component="ul" sx={{ mt: 1.5, mb: 0, pl: 2.5 }}>
              {corte?.contadores.map((c) => (
                <li key={c.clave}>
                  <b>{c.clave}</b>: {entero(c.actual)} → siguiente {entero(c.siguienteAlAlinear)}
                </li>
              ))}
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmar(false)} disabled={alineando}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={alinear}
            disabled={alineando}
            startIcon={alineando ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            Alinear contadores
          </Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}
