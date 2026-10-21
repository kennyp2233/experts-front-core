'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
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
import { MoreHoriz as MasIcon, Refresh as RevisarIcon } from '@mui/icons-material';
import { useToast } from '@/shared/providers';
import { formatDate, getErrorMessage } from '@/shared/utils';
import { useEstadoEbf } from '../../hooks/useEbf';
import { ebfService } from '../../services/ebf.service';
import type { EstadoEbfCoordinacion, LineaEstadoEbf, SimulacionEbf, TipoEquivalenciaEbf } from '../../types/ebf';
import { kg, num } from '../../utils/formato';
import { EnlazarEbfDialog, NOMBRE_TIPO } from './EnlazarEbfDialog';
import { EstadoLineaEbfChip, leidoHace, resumenCorto, textoVentana } from './estadoEbf';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;
const PENDIENTE = ['POR_ENVIAR', 'CAMBIO_POR_ENVIAR', 'PEDIR_A_EBF', 'ERROR'];

const cajasTxt = (cajas: number, fulls: number) => `${num(cajas, 0)} cj · ${num(fulls)} fulls`;

/** La guía en EBF: cajas coordinadas y recibidas en bodega, pesos. */
function GuiaEnEbf({ e }: { e: EstadoEbfCoordinacion }) {
  const g = e.ebf;
  const filas: Array<[string, React.ReactNode]> = [
    [
      'Guía en EBF',
      g.guia ? (
        <span>
          <span style={nums}>{g.guia}</span>
          {g.provisional && (
            <Typography component="span" variant="caption" color="text.secondary">
              {' '}
              (provisional: EBF pone la guía real cuando la asigna)
            </Typography>
          )}
        </span>
      ) : (
        'Todavía no'
      ),
    ],
    ['Estado en EBF', g.estado],
    ['Coordinado en EBF', g.cajas !== null ? cajasTxt(g.cajas, g.fulls ?? 0) : null],
    ['Recibido en bodega', g.cajasBodega ? cajasTxt(g.cajasBodega, g.fullsBodega ?? 0) : null],
    ['Peso bruto · cobrable', g.pesoBruto ? `${kg(g.pesoBruto)} · ${kg(g.pesoCobrable ?? 0)}` : null],
  ];
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box
        component="dl"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'max-content 1fr' },
          columnGap: 3,
          rowGap: 0.75,
          m: 0,
          '& dt': { color: 'text.secondary', typography: 'body2' },
          '& dd': { m: 0, typography: 'body2', fontWeight: 500 },
        }}
      >
        {filas.map(([k, v]) => (
          <Box key={k} sx={{ display: 'contents' }}>
            <dt>{k}</dt>
            <dd>{v === null || v === undefined || v === '' ? '—' : v}</dd>
          </Box>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
        {leidoHace(g.leidoEn)} · {resumenCorto(e.resumen, e.enviable)}
      </Typography>
    </Paper>
  );
}

function LineaMenu({
  l,
  enviable,
  onEnlazar,
  onCambio,
}: {
  l: LineaEstadoEbf;
  enviable: boolean;
  onEnlazar: (tipo: TipoEquivalenciaEbf) => void;
  onCambio: (e: EstadoEbfCoordinacion) => void;
}) {
  const toast = useToast();
  const [ancla, setAncla] = useState<HTMLElement | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const puedeOmitir = enviable && l.id !== null && PENDIENTE.includes(l.estado);
  const puedeReactivar = l.id !== null && l.estado === 'OMITIDA';
  if (!l.faltan.length && !puedeOmitir && !puedeReactivar) return null;

  const accion = async (fn: () => Promise<EstadoEbfCoordinacion>, ok: string) => {
    setAncla(null);
    setOcupado(true);
    try {
      onCambio(await fn());
      toast.success(ok);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <>
      <IconButton size="small" aria-label="Más acciones" onClick={(ev) => setAncla(ev.currentTarget)} disabled={ocupado}>
        <MasIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={ancla} open={!!ancla} onClose={() => setAncla(null)}>
        {l.faltan.map((t) => (
          <MenuItem
            key={t}
            onClick={() => {
              setAncla(null);
              onEnlazar(t);
            }}
          >
            Enlazar {NOMBRE_TIPO[t].uno} con EBF…
          </MenuItem>
        ))}
        {puedeOmitir && (
          <MenuItem onClick={() => accion(() => ebfService.omitir(l.id!), 'No se enviará: queda para hacerlo a mano en EBF.')}>
            No enviar: lo hago a mano en EBF
          </MenuItem>
        )}
        {puedeReactivar && (
          <MenuItem onClick={() => accion(() => ebfService.reactivar(l.id!), 'Se vuelve a enviar con lo pendiente.')}>
            Volver a enviar
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

function SimulacionDialog({ s, onClose }: { s: SimulacionEbf; onClose: () => void }) {
  const VERBO = { CREAR: 'Coordinar', MODIFICAR: 'Corregir la fila', BORRAR: 'Borrar la fila' } as const;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Lo que se enviaría a EBF</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Resuelto contra EBF ahora mismo (vuelo, DAE registrada, producto), sin enviar nada.
          {s.vuelo ? ` Vuelo de EBF: ${s.vuelo}.` : ''}
        </Typography>
        {s.pasos.length === 0 ? (
          <Alert severity="success">No hay nada por enviar.</Alert>
        ) : (
          <List dense disablePadding>
            {s.pasos.map((p, i) => (
              <ListItem key={i} divider disableGutters>
                <ListItemText
                  primary={`${VERBO[p.tipo]}: ${p.finca ?? '—'} · ${p.producto ?? '—'}`}
                  secondary={
                    p.ok ? (
                      [p.envio?.exportador, p.envio?.marcacion, p.envio?.dae && `DAE ${p.envio.dae}`, p.envio?.producto, p.envio?.cajas]
                        .filter(Boolean)
                        .join(' · ')
                    ) : (
                      <Typography component="span" variant="body2" color="error">
                        EBF lo rechazaría: {p.error}
                      </Typography>
                    )
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Pestaña EBF de una coordinación (ADR 0004): qué tiene EBF de cada guía
 * hija, qué falta enviar y por qué. Lo pendiente es uno solo por guía hija: si
 * se vuelve a modificar la coordinación, se recalcula (no se envía dos veces),
 * y si alguien lo hizo a mano en EBF, "Revisar EBF" lo detecta.
 */
export function EbfTab({ id }: { id: number }) {
  const toast = useToast();
  const { estado: e, error, isLoading, isValidating, mutate } = useEstadoEbf(id);
  const [ocupado, setOcupado] = useState<'revisar' | 'simular' | 'enviar' | null>(null);
  const [simulacion, setSimulacion] = useState<SimulacionEbf | null>(null);
  const [enlazar, setEnlazar] = useState<{ tipo: TipoEquivalenciaEbf; l: LineaEstadoEbf } | null>(null);

  if (error) {
    return (
      <Alert severity="error" action={<Button onClick={() => mutate()}>Reintentar</Button>}>
        {getErrorMessage(error, 'No se pudo leer EBF.')}
      </Alert>
    );
  }
  if (isLoading || !e) {
    return (
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Leyendo EBF… (el portal tarda unos segundos)
        </Typography>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={240} />
      </Stack>
    );
  }

  const ventana = textoVentana(e.modo, e.ventana);
  const correr = async <T,>(que: 'revisar' | 'simular' | 'enviar', fn: () => Promise<T>, despues: (r: T) => void) => {
    setOcupado(que);
    try {
      despues(await fn());
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setOcupado(null);
    }
  };
  const pendientes = e.resumen.porEnviar + e.resumen.errores;

  return (
    <Stack spacing={2}>
      <Alert severity={ventana.severidad}>
        {ventana.texto}
        {!e.enviable && ' Esta coordinación viene del sistema viejo: la oficina la tipeó en EBF; aquí solo se compara.'}
      </Alert>
      {e.anulada && (
        <Alert severity="warning">Se anuló o ya no va con EBF: lo que quede en EBF de esta guía se tiene que borrar.</Alert>
      )}
      {e.ebf.errorLectura && <Alert severity="error">{e.ebf.errorLectura}</Alert>}
      {e.ebf.avisos.map((a) => (
        <Alert key={a} severity="warning">
          {a}
        </Alert>
      ))}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <GuiaEnEbf e={e} />
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ md: 'flex-end' }}>
          <Tooltip title="Vuelve a leer EBF ahora. Si ya lo hiciste a mano en EBF, aquí aparece como hecho.">
            <span>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<RevisarIcon />}
                disabled={!!ocupado || isValidating}
                onClick={() => correr('revisar', () => ebfService.revisar(id), (r) => mutate(r, { revalidate: false }))}
              >
                {ocupado === 'revisar' ? 'Leyendo EBF…' : 'Revisar EBF'}
              </Button>
            </span>
          </Tooltip>
          {e.enviable && pendientes > 0 && (
            <Tooltip title="Pregunta a EBF el vuelo, la DAE y el producto de cada cambio, sin enviar nada.">
              <span>
                <Button
                  variant="outlined"
                  color="inherit"
                  disabled={!!ocupado}
                  onClick={() => correr('simular', () => ebfService.simular(id), setSimulacion)}
                >
                  {ocupado === 'simular' ? 'Consultando EBF…' : 'Ver lo que se enviaría'}
                </Button>
              </span>
            </Tooltip>
          )}
          {e.enviable && e.modo !== 'comparar' && (
            <Tooltip title={e.motivoNoEnviar ?? ''}>
              <span>
                <Button
                  variant="contained"
                  disabled={!e.puedeEnviar || !!ocupado}
                  onClick={() =>
                    correr('enviar', () => ebfService.enviar(id), (r) => {
                      mutate(r.estado, { revalidate: false });
                      if (r.fallidas) toast.error(`${r.enviadas} enviadas, ${r.fallidas} con error: ${r.errores.join(' · ')}`);
                      else toast.success(r.enviadas ? `${r.enviadas} guías hijas enviadas a EBF.` : 'Ya estaba todo en EBF.');
                    })
                  }
                >
                  {ocupado === 'enviar' ? 'Enviando…' : `Enviar a EBF${pendientes ? ` (${pendientes})` : ''}`}
                </Button>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Estado</TableCell>
              <TableCell>Finca</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell align="right">Coordinación</TableCell>
              <TableCell align="right">En EBF</TableCell>
              <TableCell>DAE</TableCell>
              <TableCell>Qué pasa</TableCell>
              <TableCell width={40} />
            </TableRow>
          </TableHead>
          <TableBody>
            {e.lineas.map((l) => {
              const daeDistinta = !!l.ebf?.dae && !!l.dae && l.ebf.dae !== l.dae;
              return (
                <TableRow key={l.clave} sx={l.estado === 'EN_EBF' ? { '& td': { color: 'text.secondary' } } : undefined}>
                  <TableCell>
                    <EstadoLineaEbfChip estado={l.estado} enviable={e.enviable} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="inherit">
                      {l.finca ?? l.ebf?.exportador ?? '—'}
                    </Typography>
                    {l.finca && l.ebf && l.ebf.exportador.toUpperCase() !== l.finca.toUpperCase() && (
                      <Typography variant="caption" color="text.secondary">
                        en EBF: {l.ebf.exportador}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{l.producto ?? l.ebf?.producto ?? '—'}</TableCell>
                  <TableCell align="right" sx={nums}>
                    {l.finca ? (
                      <>
                        {cajasTxt(l.cajas, l.fulls)}
                        {l.cajasPorTipo && (
                          <Typography variant="caption" color="text.secondary" component="div">
                            {l.cajasPorTipo}
                          </Typography>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell align="right" sx={nums}>
                    {l.ebf ? (
                      <>
                        {cajasTxt(l.ebf.cajas, l.ebf.fulls)}
                        {l.ebf.cajasBodega > 0 && (
                          <Typography variant="caption" color="text.secondary" component="div">
                            bodega {cajasTxt(l.ebf.cajasBodega, l.ebf.fullsBodega)}
                          </Typography>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell sx={{ ...nums, whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" color="inherit">
                      {l.dae ?? l.ebf?.dae ?? '—'}
                    </Typography>
                    {daeDistinta && (
                      <Typography variant="caption" color="warning.main">
                        en EBF: {l.ebf!.dae}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 420 }}>
                    <Typography variant="body2" color="inherit">
                      {l.estado === 'EN_EBF' ? (l.motivo === 'Coincide con EBF.' ? '' : l.motivo) : l.motivo}
                    </Typography>
                    {l.ebf?.coordinadaPor && l.estado !== 'EN_EBF' && (
                      <Typography variant="caption" color="text.secondary">
                        En EBF la coordinó {l.ebf.coordinadaPor}
                        {l.ebf.diaCoordinacion ? ` el ${formatDate(l.ebf.diaCoordinacion)}` : ''}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <LineaMenu
                      l={l}
                      enviable={e.enviable}
                      onEnlazar={(tipo) => setEnlazar({ tipo, l })}
                      onCambio={(r) => mutate(r, { revalidate: false })}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {e.lineas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography variant="body2" color="text.secondary">
                    La coordinación no tiene cajas para EBF todavía.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {simulacion && <SimulacionDialog s={simulacion} onClose={() => setSimulacion(null)} />}
      {enlazar && (
        <EnlazarEbfDialog
          tipo={enlazar.tipo}
          idLocal={
            (enlazar.tipo === 'FINCA' ? enlazar.l.idFinca : enlazar.tipo === 'MARCA' ? enlazar.l.idConsignatario : enlazar.l.idProducto) ?? 0
          }
          local={
            (enlazar.tipo === 'FINCA' ? enlazar.l.finca : enlazar.tipo === 'MARCA' ? enlazar.l.marca : enlazar.l.producto) ?? '—'
          }
          sugerencia={
            enlazar.tipo === 'FINCA' ? enlazar.l.ebf?.exportador : enlazar.tipo === 'PRODUCTO' ? enlazar.l.ebf?.producto : enlazar.l.ebf?.marcacion
          }
          onClose={() => setEnlazar(null)}
          onGuardado={() => mutate()}
        />
      )}
    </Stack>
  );
}
