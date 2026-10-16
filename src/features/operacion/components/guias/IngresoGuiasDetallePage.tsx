'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link as MuiLink,
  ListItemText,
  Menu,
  MenuItem,
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
import {
  ArrowBack as VolverIcon,
  CheckCircleOutline as VerificadoIcon,
  ChevronLeft as AnteriorIcon,
  ChevronRight as SiguienteIcon,
  DeleteOutline as AnularIcon,
  Edit as ModificarIcon,
  MoreVert as AccionesIcon,
} from '@mui/icons-material';
import { AppPage } from '@/shared/components/ui';
import { useToast } from '@/shared/providers';
import { formatDate, formatDateTime, getErrorMessage } from '@/shared/utils';
import { useIngreso, useResumenStock } from '../../hooks/useStockGuias';
import { operacionService } from '../../services/operacion.service';
import type { GuiaDeIngreso, GuiaMadreFila, IngresoDetalle } from '../../types/coordinacion';
import { formatoAwb, nombreCorto, textoIngreso } from '../../utils/formato';
import { OrigenChip } from '../EstadoCoordinacionChip';
import { type CampoFicha, FichaCampos } from '../FichaCampos';
import { MoverGuiaDialog, type MovimientoGuia } from '../stock/MoverGuiaDialog';
import { EstadoIngresoChip, ETIQUETA_INGRESO, SituacionGuiaTexto } from './EstadosGuias';
import { IngresoGuiasDialog } from './IngresoGuiasDialog';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

/** Lo que el diálogo de préstamo necesita de la guía. */
const comoFila = (g: GuiaDeIngreso): GuiaMadreFila =>
  ({ id: g.id, numero: g.numero, estado: g.estado, observaciones: g.observaciones }) as GuiaMadreFila;

/** Acciones de una guía del ingreso (Administración de guías del sistema viejo). */
function AccionesGuia({ g, onAccion }: { g: GuiaDeIngreso; onAccion: (a: MovimientoGuia | 'quitar' | 'verificar') => void }) {
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const items: Array<{ a: MovimientoGuia | 'quitar' | 'verificar'; label: string; visible: boolean }> = [
    { a: 'prestar', label: 'Prestar', visible: g.estado === 'INGRESADA' },
    { a: 'quitar', label: 'Quitar préstamo', visible: g.estado === 'PRESTADA' },
    { a: 'devolver', label: 'Registrar devolución', visible: g.estado === 'PRESTADA' && !g.devuelta },
    { a: 'verificar', label: 'Verificar estado', visible: g.estado !== 'ANULADA' },
  ];
  const visibles = items.filter((x) => x.visible);
  if (!visibles.length) return null;
  return (
    <>
      <IconButton size="small" aria-label="Acciones de la guía" onClick={(e) => setMenu(e.currentTarget)}>
        <AccionesIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={menu} open={menu !== null} onClose={() => setMenu(null)}>
        {visibles.map((x) => (
          <MenuItem
            key={x.a}
            onClick={() => {
              setMenu(null);
              onAccion(x.a);
            }}
          >
            <ListItemText>{x.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/** Anterior / siguiente por N°, como los botones del sistema viejo. */
function Navegacion({ i }: { i: IngresoDetalle }) {
  const boton = (v: IngresoDetalle['anterior'], label: string, icono: React.ReactNode) =>
    v ? (
      <Tooltip title={`${label}: ${textoIngreso(v.numero)}`}>
        <IconButton size="small" component={Link} href={`/operacion/guias/ingresos/${v.id}`} aria-label={label}>
          {icono}
        </IconButton>
      </Tooltip>
    ) : (
      <IconButton size="small" disabled aria-label={label}>
        {icono}
      </IconButton>
    );
  if (!i.anterior && !i.siguiente) return null;
  return (
    <Stack direction="row" alignItems="center">
      {boton(i.anterior, 'Ingreso anterior', <AnteriorIcon fontSize="small" />)}
      {boton(i.siguiente, 'Ingreso siguiente', <SiguienteIcon fontSize="small" />)}
    </Stack>
  );
}

/**
 * Un ingreso de guías: cabecera, resumen ("Total guías · Coordinadas ·
 * Préstamos · Devoluciones · Libres", como el sistema viejo), sus guías con la
 * coordinación que las usa y, si el ingreso es del sistema nuevo, modificar,
 * anular y mover cada guía.
 */
export function IngresoGuiasDetallePage({ id }: { id: number }) {
  const toast = useToast();
  const { ingreso: i, error, isLoading, mutate } = useIngreso(id);
  const { mutate: mutateResumen } = useResumenStock();
  const [modificando, setModificando] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [moviendo, setMoviendo] = useState<{ guia: GuiaDeIngreso; accion: MovimientoGuia } | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const volver = (
    <Button component={Link} href="/operacion/guias/ingresos" startIcon={<VolverIcon />}>
      Ingresos
    </Button>
  );

  if (error) {
    return (
      <AppPage title="Ingreso de guías" actions={volver}>
        <Alert severity="error">{getErrorMessage(error)}</Alert>
      </AppPage>
    );
  }
  if (isLoading || !i) {
    return (
      <AppPage title="Ingreso de guías" actions={volver}>
        <Skeleton variant="rounded" height={260} />
      </AppPage>
    );
  }

  const refrescar = () => {
    mutate();
    mutateResumen();
  };

  const accion = async (g: GuiaDeIngreso, a: MovimientoGuia | 'quitar' | 'verificar') => {
    if (a === 'prestar' || a === 'devolver') {
      setMoviendo({ guia: g, accion: a });
      return;
    }
    setTrabajando(true);
    try {
      if (a === 'quitar') await operacionService.quitarPrestamo(g.id);
      else await operacionService.verificarGuia(g.id);
      toast.success(a === 'quitar' ? `Guía ${formatoAwb(g.numero)} libre otra vez.` : `Estado de la guía ${formatoAwb(g.numero)} verificado.`);
      refrescar();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setTrabajando(false);
    }
  };

  const anular = async () => {
    setTrabajando(true);
    try {
      await operacionService.anularIngreso(i.id);
      toast.success(`Ingreso ${textoIngreso(i.numero)} anulado.`);
      setAnulando(false);
      refrescar();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setTrabajando(false);
    }
  };

  const corregir = async () => {
    try {
      await operacionService.corregirEstadoIngreso(i.id);
      toast.success('Estado corregido.');
      refrescar();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const c = i.conteo;
  const usadas = c.coordinadas + c.prestamos;
  const puedeModificar = i.editable && i.estado !== 'ANULADO' && i.estado !== 'CANCELADO';
  const puedeAnular = i.editable && i.estado !== 'ANULADO' && usadas === 0;
  const guias = i.estado === 'ANULADO' ? i.guias : i.guias.filter((g) => g.estado !== 'ANULADA');

  return (
    <AppPage
      title={`Ingreso de guías ${textoIngreso(i.numero)}`}
      subtitle={
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <EstadoIngresoChip estado={i.estado} />
          <OrigenChip origen={i.origen} />
        </Stack>
      }
      actions={
        <>
          <Navegacion i={i} />
          {i.editable && i.estado !== 'ANULADO' && (
            <>
              <Tooltip title={puedeModificar ? '' : 'Un ingreso cancelado (todas sus guías usadas) no se modifica.'}>
                <span>
                  <Button variant="outlined" startIcon={<ModificarIcon />} disabled={!puedeModificar} onClick={() => setModificando(true)}>
                    Modificar
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={puedeAnular ? '' : 'No se anula: tiene guías usadas (coordinadas o prestadas).'}>
                <span>
                  <Button color="error" startIcon={<AnularIcon />} disabled={!puedeAnular} onClick={() => setAnulando(true)}>
                    Anular
                  </Button>
                </span>
              </Tooltip>
            </>
          )}
          {volver}
        </>
      }
    >
      {!i.verificado && i.estado !== 'ANULADO' && i.estadoCalculado && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            i.editable ? (
              <Button color="inherit" size="small" onClick={corregir}>
                Corregir
              </Button>
            ) : undefined
          }
        >
          El estado del documento no coincide con sus guías: debería ser {ETIQUETA_INGRESO[i.estadoCalculado]}.
        </Alert>
      )}

      {/* La cabecera de la ventana vieja: Fecha · Aerolínea · Referencia · Tipo de Stock | Estado · Stock verificado. */}
      <FichaCampos
        izquierda={[
          ['Fecha', formatDate(i.fecha)],
          ['Aerolínea', i.aerolinea ? nombreCorto(i.aerolinea) : null],
          ['Referencia', [i.agencia?.nombre, i.referencia].filter(Boolean).join(' · ')],
          ['Tipo de stock', i.tipoStock === 'NORMAL' ? 'Normal' : i.tipoStock === 'VIRTUAL' ? 'Virtual' : null],
        ]}
        derecha={[
          [
            'Stock verificado',
            i.estado === 'ANULADO' ? null : i.verificado ? (
              <Stack component="span" direction="row" spacing={0.5} alignItems="center">
                <VerificadoIcon color="success" sx={{ fontSize: 16 }} />
                <span>Sí, el estado coincide con sus guías</span>
              </Stack>
            ) : (
              'No: el estado no coincide con sus guías'
            ),
          ],
          ['Registrado', [i.auditoria.creadoPor, formatDateTime(i.auditoria.creadoEn, '')].filter(Boolean).join(' · ')],
          ...(i.auditoria.actualizadoEn
            ? [['Modificado', [i.auditoria.actualizadoPor, formatDateTime(i.auditoria.actualizadoEn, '')].filter(Boolean).join(' · ')] as CampoFicha]
            : []),
        ]}
        nota={i.nota}
      />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, ...nums }}>
        Total guías: <strong>{c.total}</strong> · Coordinadas: <strong>{c.coordinadas}</strong> · Préstamos:{' '}
        <strong>{c.prestamos}</strong> · Devoluciones: <strong>{c.devoluciones}</strong> · Libres: <strong>{c.libres}</strong>
        {c.anuladas > 0 && i.estado !== 'ANULADO' ? ` · Anuladas: ${c.anuladas}` : ''}
      </Typography>
      {/* "Secuencia de Guías" del viejo: Número · Coordinación · Préstamo · Observaciones · Devolución. */}
      <TableContainer component={Paper} variant="outlined">
        <Table
          size="small"
          sx={{
            '&& .MuiTableCell-root': { px: 1, py: 0.5, fontSize: 13 },
            '&& .MuiTableCell-head': { textTransform: 'none', letterSpacing: 0, fontSize: 12.5 },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>Número de guía</TableCell>
              <TableCell>Situación</TableCell>
              <TableCell>Coordinación</TableCell>
              <TableCell>Préstamo</TableCell>
              <TableCell>Observaciones</TableCell>
              <TableCell>Devolución</TableCell>
              {i.editable && <TableCell width={48} />}
            </TableRow>
          </TableHead>
          <TableBody>
            {guias.map((g) => (
              <TableRow key={g.id} hover>
                <TableCell sx={{ ...nums, fontWeight: 600, whiteSpace: 'nowrap' }}>{formatoAwb(g.numero)}</TableCell>
                <TableCell>
                  <SituacionGuiaTexto guia={g} />
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {g.coordinacion ? (
                    g.coordinacion.id ? (
                      <MuiLink component={Link} href={`/operacion/coordinaciones/${g.coordinacion.id}`}>
                        N° {g.coordinacion.numero}
                        {g.coordinacion.fechaVuelo ? ` · vuelo ${formatDate(g.coordinacion.fechaVuelo)}` : ''}
                      </MuiLink>
                    ) : (
                      `N° ${g.coordinacion.numero}`
                    )
                  ) : (
                    ''
                  )}
                </TableCell>
                <TableCell sx={nums}>{formatDate(g.fechaPrestamo, '')}</TableCell>
                <TableCell>{g.observaciones ?? ''}</TableCell>
                <TableCell sx={nums}>{formatDate(g.fechaDevolucion, '')}</TableCell>
                {i.editable && (
                  <TableCell>
                    {i.estado !== 'ANULADO' && !trabajando && <AccionesGuia g={g} onAccion={(a) => accion(g, a)} />}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {!i.editable && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
          Este ingreso es del sistema viejo: mientras se usen los dos sistemas, se modifica allá.
        </Typography>
      )}

      {modificando && (
        <IngresoGuiasDialog
          open
          ingreso={i}
          onClose={() => setModificando(false)}
          onGrabado={() => {
            toast.success(`Ingreso ${textoIngreso(i.numero)} modificado.`);
            refrescar();
          }}
        />
      )}
      <MoverGuiaDialog
        guia={moviendo ? comoFila(moviendo.guia) : null}
        accion={moviendo?.accion ?? 'prestar'}
        onClose={() => setMoviendo(null)}
        onHecho={(m) => {
          toast.success(m);
          refrescar();
        }}
      />
      <Dialog open={anulando} onClose={() => setAnulando(false)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Anular el ingreso {textoIngreso(i.numero)}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Sus {c.total === 1 ? 'guía queda anulada' : `${c.total} guías quedan anuladas`} y ya no se ofrecen al coordinar. Se
            pueden volver a ingresar.
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={() => setAnulando(false)}>Cancelar</Button>
          <Button color="error" variant="contained" disabled={trabajando} onClick={anular}>
            Anular
          </Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}
