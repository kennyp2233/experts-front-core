'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ContentCut as CortarIcon,
  DeleteOutline as AnularIcon,
  PrintOutlined as ImprimirIcon,
  Description as ArchivoIcon,
  Edit as ModificarIcon,
  MoreHoriz as MasIcon,
  KeyboardArrowDown as AbrirIcon,
  LockOpenOutlined as ReabrirIcon,
  ReceiptLongOutlined as FacturaIcon,
  SwapHoriz as TransferirIcon,
} from '@mui/icons-material';
import { useToast } from '@/shared/providers';
import { getErrorMessage } from '@/shared/utils';
import { operacionService } from '../../services/operacion.service';
import type { CoordinacionDetalle } from '../../types/coordinacion';
import { formatoAwb, usd } from '../../utils/formato';
import { ArchivoFlowerCargo } from './ArchivoFlowerCargo';
import { CorregirDialog } from './CorregirDialog';
import { TransferirDialog } from './TransferirDialog';

/** Documentos imprimibles: cada uno abre su hoja en una pestaña nueva. */
const IMPRESIONES = [
  { ruta: 'guia-madre', nombre: 'Guía madre', ayuda: 'Hoja blanca o papel de guía' },
  { ruta: 'guias-hijas', nombre: 'Guías hijas por finca', ayuda: 'Una House Air Waybill por guía hija' },
  { ruta: 'manifiesto', nombre: 'Manifiesto', ayuda: 'Consolidated cargo manifest' },
  { ruta: 'liquidacion-cliente', nombre: 'Liquidación al cliente', ayuda: 'Lo que se le cobra: valores del cliente + handling' },
] as const;
const NECESITA_HIJAS: ReadonlyArray<string> = ['guias-hijas', 'manifiesto'];

/**
 * Acciones de la coordinación, con una sola acción principal (naranja, al
 * final) según el estado:
 * - Abierta (sistema nuevo): Imprimir · Modificar · **Cortar guía** · ⋯
 *   (FlowerCargo, facturas y notas, pasar cajas, anular).
 * - Cortada: Imprimir · Facturas y notas · **Archivo FlowerCargo** (lo que sigue) · ⋯
 *   (reabrir: deshace el corte por si algo salió mal).
 * - Del sistema viejo: se ven pero no se tocan (Imprimir · Archivo FlowerCargo).
 * "Imprimir" (guía madre, guías hijas, manifiesto) está siempre primero, antes y
 * después del corte, como el "Pre-Corte de AWB" del viejo.
 */
export function AccionesCoordinacion({ c, onCambio }: { c: CoordinacionDetalle; onCambio: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [dialogo, setDialogo] = useState<'cortar' | 'reabrir' | 'anular' | 'flowercargo' | 'corregir' | 'transferir' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const [menuImprimir, setMenuImprimir] = useState<HTMLElement | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const abierta = c.origen === 'SISTEMA' && c.estado === 'BORRADOR';
  const cortadaPropia = c.origen === 'SISTEMA' && c.estado === 'CORTADO';
  const guia = formatoAwb(c.numeroGuia);
  const normal = c.liquidaciones.find((l) => l.tipo === 'NORMAL');
  const cliente = c.corteExtra ? c.liquidaciones.find((l) => l.tipo === 'CORTE_EXTRA') : undefined;

  const ejecutar = async (accion: 'cortar' | 'reabrir' | 'anular') => {
    setTrabajando(true);
    try {
      if (accion === 'cortar') {
        await operacionService.cortarCoordinacion(c.id);
        toast.success('Guía cortada. Lo que sigue: bajar el archivo de FlowerCargo.');
        setDialogo(null);
        onCambio();
      } else if (accion === 'reabrir') {
        await operacionService.reabrirCoordinacion(c.id, motivo.trim() || undefined);
        toast.success(`Guía ${guia} reabierta: se puede modificar otra vez.`);
        setDialogo(null);
        onCambio();
      } else {
        await operacionService.anularCoordinacion(c.id, motivo.trim() || undefined);
        toast.success(`Coordinación anulada: la guía ${guia} vuelve a quedar libre.`);
        router.push('/operacion/coordinaciones');
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setTrabajando(false);
    }
  };

  const flowerCargo = c.estado !== 'ANULADO';
  // La guía madre se imprime siempre (también en pre-corte); guías hijas y manifiesto necesitan guías hijas.
  const imprimir = c.estado !== 'ANULADO';
  const hayHijas = c.guias.length > 0;
  const abrirImpresion = (ruta: string) => {
    setMenuImprimir(null);
    window.open(`/imprimir/coordinaciones/${c.id}/${ruta}`, '_blank');
  };
  const botonImprimir = imprimir && (
    <>
      <Button startIcon={<ImprimirIcon />} endIcon={<AbrirIcon />} variant="outlined" onClick={(e) => setMenuImprimir(e.currentTarget)}>
        Imprimir
      </Button>
      <Menu anchorEl={menuImprimir} open={menuImprimir !== null} onClose={() => setMenuImprimir(null)}>
        {IMPRESIONES.map((x) => {
          const deshabilitado = NECESITA_HIJAS.includes(x.ruta) && !hayHijas;
          return (
            <MenuItem key={x.ruta} disabled={deshabilitado} onClick={() => abrirImpresion(x.ruta)}>
              <ListItemText primary={x.nombre} secondary={deshabilitado ? 'La coordinación no tiene guías hijas' : x.ayuda} />
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );

  return (
    <>
      {abierta ? (
        <>
          {botonImprimir}
          <Button component={Link} href={`/operacion/coordinaciones/${c.id}/editar`} startIcon={<ModificarIcon />} variant="outlined">
            Modificar
          </Button>
          <Button startIcon={<CortarIcon />} variant="contained" onClick={() => setDialogo('cortar')}>
            Cortar guía
          </Button>
          <Tooltip title="Más acciones">
            <IconButton aria-label="Más acciones" onClick={(e) => setMenu(e.currentTarget)} sx={{ border: 1, borderColor: 'divider', width: 36, height: 36 }}>
              <MasIcon />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={menu} open={menu !== null} onClose={() => setMenu(null)}>
            <MenuItem
              onClick={() => {
                setMenu(null);
                setDialogo('flowercargo');
              }}
            >
              <ListItemIcon>
                <ArchivoIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Archivo FlowerCargo</ListItemText>
            </MenuItem>
            <MenuItem
              disabled={!hayHijas}
              onClick={() => {
                setMenu(null);
                setDialogo('corregir');
              }}
            >
              <ListItemIcon>
                <FacturaIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Facturas y notas</ListItemText>
            </MenuItem>
            <MenuItem
              disabled={!hayHijas}
              onClick={() => {
                setMenu(null);
                setDialogo('transferir');
              }}
            >
              <ListItemIcon>
                <TransferirIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Pasar cajas a otra guía</ListItemText>
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={() => {
                setMenu(null);
                setMotivo('');
                setDialogo('anular');
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <AnularIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Anular</ListItemText>
            </MenuItem>
          </Menu>
        </>
      ) : (
        <>
          {botonImprimir}
          {c.origen === 'SISTEMA' && c.estado === 'CORTADO' && hayHijas && (
            <Button startIcon={<FacturaIcon />} variant="outlined" onClick={() => setDialogo('corregir')}>
              Facturas y notas
            </Button>
          )}
          {/* Después del corte lo que sigue es el archivo de FlowerCargo: va al final, como acción principal. */}
          {flowerCargo && (
            <Button
              startIcon={<ArchivoIcon />}
              variant={c.origen === 'SISTEMA' ? 'contained' : 'outlined'}
              onClick={() => setDialogo('flowercargo')}
            >
              Archivo FlowerCargo
            </Button>
          )}
          {/* Reabrir es la red de seguridad (por si algo salió mal): a mano pero no a la vista. */}
          {cortadaPropia && (
            <>
              <Tooltip title="Más acciones">
                <IconButton aria-label="Más acciones" onClick={(e) => setMenu(e.currentTarget)} sx={{ border: 1, borderColor: 'divider', width: 36, height: 36 }}>
                  <MasIcon />
                </IconButton>
              </Tooltip>
              <Menu anchorEl={menu} open={menu !== null} onClose={() => setMenu(null)}>
                <MenuItem
                  onClick={() => {
                    setMenu(null);
                    setMotivo('');
                    setDialogo('reabrir');
                  }}
                >
                  <ListItemIcon>
                    <ReabrirIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Reabrir guía" secondary="Deshace el corte" />
                </MenuItem>
              </Menu>
            </>
          )}
        </>
      )}

      {c.origen === 'SISTEMA' && (
        <>
          <CorregirDialog c={c} abierto={dialogo === 'corregir'} onCerrar={() => setDialogo(null)} onCambio={onCambio} />
          {abierta && <TransferirDialog c={c} abierto={dialogo === 'transferir'} onCerrar={() => setDialogo(null)} onCambio={onCambio} />}
        </>
      )}

      {flowerCargo && <ArchivoFlowerCargo c={c} abierto={dialogo === 'flowercargo'} onCerrar={() => setDialogo(null)} />}

      <Dialog open={dialogo === 'cortar'} onClose={() => setDialogo(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Cortar guía {guia}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Alert severity="info" variant="outlined">
              Cortada, la guía ya no se modifica ni se anula, sale del portal de las fincas y pasa al estado de cuenta del
              cliente. Si algo sale mal, se reabre desde «⋯ → Reabrir guía».
            </Alert>
            <Typography variant="body2">
              Guía madre (aerolínea): <strong>{usd(normal?.resumen.total)}</strong>
            </Typography>
            {cliente && (
              <Typography variant="body2">
                Cobro al cliente (corte extra): <strong>{usd(cliente.resumen.total)}</strong>
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {c.guias.length === 1 ? '1 guía hija' : `${c.guias.length} guías hijas`}. Si falta algún valor, modifica la
              coordinación antes de cortar.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogo(null)} disabled={trabajando}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => ejecutar('cortar')}
            disabled={trabajando}
            startIcon={trabajando ? <CircularProgress size={16} color="inherit" /> : <CortarIcon />}
          >
            Cortar guía
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogo === 'reabrir'} onClose={() => setDialogo(null)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Reabrir la guía {guia}?</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2">
              Vuelve a quedar abierta, como antes del corte: se puede modificar y, si el vuelo es de hoy en adelante, las fincas
              la ven otra vez en su portal. No se borra nada: lo que cargaron las fincas y los valores quedan igual.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mientras esté abierta sale del estado de cuenta del cliente y el cliente la ve «en preparación». Si cambias algo y ya
              mandaste el archivo de FlowerCargo, vuelve a generarlo después del nuevo corte.
            </Typography>
            <TextField
              label="Motivo (opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              size="small"
              fullWidth
              placeholder="P. ej. la aerolínea cambió el peso cobrable"
              inputProps={{ maxLength: 200 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogo(null)} disabled={trabajando}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => ejecutar('reabrir')}
            disabled={trabajando}
            startIcon={trabajando ? <CircularProgress size={16} color="inherit" /> : <ReabrirIcon />}
          >
            Reabrir guía
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogo === 'anular'} onClose={() => setDialogo(null)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Anular la coordinación?</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2">
              Se borran sus guías hijas y la guía {guia} vuelve al stock como libre. Los números de guía hija usados no se
              reutilizan. Queda constancia de quién la anuló, cuándo y lo que tenía.
            </Typography>
            <TextField
              label="Motivo (opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              size="small"
              fullWidth
              placeholder="P. ej. la aerolínea cambió el número de guía"
              inputProps={{ maxLength: 200 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogo(null)} disabled={trabajando}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={() => ejecutar('anular')} disabled={trabajando}>
            Anular
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
