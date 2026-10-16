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
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ContentCut as CortarIcon,
  DeleteOutline as AnularIcon,
  Description as ArchivoIcon,
  Edit as ModificarIcon,
  MoreHoriz as MasIcon,
} from '@mui/icons-material';
import { useToast } from '@/shared/providers';
import { getErrorMessage } from '@/shared/utils';
import { operacionService } from '../../services/operacion.service';
import type { CoordinacionDetalle } from '../../types/coordinacion';
import { formatoAwb, usd } from '../../utils/formato';
import { ArchivoFlowerCargo } from './ArchivoFlowerCargo';

/**
 * Acciones de la coordinación. Abierta (sistema nuevo): Modificar y Cortar
 * guía a la vista; FlowerCargo y Anular en "⋯". Cortada: el archivo de
 * FlowerCargo es lo que sigue. Las del sistema viejo se ven pero no se tocan.
 */
export function AccionesCoordinacion({ c, onCambio }: { c: CoordinacionDetalle; onCambio: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [dialogo, setDialogo] = useState<'cortar' | 'anular' | 'flowercargo' | null>(null);
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const abierta = c.origen === 'SISTEMA' && c.estado === 'BORRADOR';
  const guia = formatoAwb(c.numeroGuia);
  const normal = c.liquidaciones.find((l) => l.tipo === 'NORMAL');
  const cliente = c.corteExtra ? c.liquidaciones.find((l) => l.tipo === 'CORTE_EXTRA') : undefined;

  const ejecutar = async (accion: 'cortar' | 'anular') => {
    setTrabajando(true);
    try {
      if (accion === 'cortar') {
        await operacionService.cortarCoordinacion(c.id);
        toast.success('Guía cortada. Lo que sigue: bajar el archivo de FlowerCargo.');
        setDialogo(null);
        onCambio();
      } else {
        await operacionService.anularCoordinacion(c.id);
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

  return (
    <>
      {abierta ? (
        <>
          <Button component={Link} href={`/operacion/coordinaciones/${c.id}/editar`} startIcon={<ModificarIcon />} variant="outlined">
            Modificar
          </Button>
          <Button startIcon={<CortarIcon />} variant="contained" onClick={() => setDialogo('cortar')}>
            Cortar guía
          </Button>
          <Tooltip title="Más acciones">
            <IconButton aria-label="Más acciones" onClick={(e) => setMenu(e.currentTarget)}>
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
              onClick={() => {
                setMenu(null);
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
        flowerCargo && (
          <Button
            startIcon={<ArchivoIcon />}
            variant={c.origen === 'SISTEMA' ? 'contained' : 'outlined'}
            onClick={() => setDialogo('flowercargo')}
          >
            Archivo FlowerCargo
          </Button>
        )
      )}

      {flowerCargo && <ArchivoFlowerCargo c={c} abierto={dialogo === 'flowercargo'} onCerrar={() => setDialogo(null)} />}

      <Dialog open={dialogo === 'cortar'} onClose={() => setDialogo(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Cortar guía {guia}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Alert severity="warning" variant="outlined">
              El corte es definitivo: después ya no se puede modificar ni anular.
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
            color="warning"
            onClick={() => ejecutar('cortar')}
            disabled={trabajando}
            startIcon={trabajando ? <CircularProgress size={16} color="inherit" /> : <CortarIcon />}
          >
            Cortar guía
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogo === 'anular'} onClose={() => setDialogo(null)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Anular la coordinación?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Se borran sus guías hijas y la guía {guia} vuelve al stock como libre. Los números de guía hija usados no se
            reutilizan.
          </Typography>
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
