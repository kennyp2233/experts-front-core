'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add as MasIcon, Close as QuitarIcon, Remove as MenosIcon } from '@mui/icons-material';
import { getErrorMessage, toIsoDate } from '@/shared/utils';
import { operacionService } from '../../services/operacion.service';
import type { GuardarIngresoDto, IngresoDetalle, Opcion } from '../../types/coordinacion';
import { textoIngreso } from '../../utils/formato';
import { OpcionAutocomplete } from '../coordinar/OpcionAutocomplete';
import { SituacionGuiaTexto } from './EstadosGuias';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Al modificar: el ingreso cargado. */
  ingreso?: IngresoDetalle;
  onGrabado: (r: { id: number; numero: number | null }) => void;
}

/** Cómo se cargan las guías: una a mano (lo diario), una secuencia de consecutivas o varias sueltas. */
type Modo = 'una' | 'secuencia' | 'sueltas';

/** Una guía ya revisada en el momento (formato y dígito verificador). */
interface Guia {
  /** 8 dígitos con el verificador, o null si no se pudo leer. */
  numero: string | null;
  /** "369-9805 5252" (o lo escrito, si está mal). */
  texto: string;
  error?: string;
  /** El verificador lo puso la pantalla (se escribieron 7 dígitos). */
  verificadorAgregado?: boolean;
}

/** Guía que ya tiene el ingreso (al modificar). */
interface Existente {
  numero: string;
  estado: IngresoDetalle['guias'][number]['estado'];
  devuelta: boolean;
}

const nums = { fontVariantNumeric: 'tabular-nums' } as const;
const MAX = 500;

/**
 * Lee un número de guía: 8 dígitos (serial + verificador), 7 (se agrega el
 * verificador = serial mod 7) o con el prefijo de la aerolínea adelante.
 */
function leer(entrada: string, prefijo: string | null): Guia {
  let d = entrada.replace(/\D/g, '');
  if (d.length === 11 && prefijo && d.startsWith(prefijo)) d = d.slice(3);
  const pre = prefijo ?? '???';
  const formato = (x: string) => `${pre}-${x.slice(0, 4)} ${x.slice(4)}`;
  if (d.length === 7) {
    const n = `${d}${Number(d) % 7}`;
    return { numero: n, texto: formato(n), verificadorAgregado: true };
  }
  if (d.length !== 8) return { numero: null, texto: entrada.trim(), error: '8 dígitos (o 7, sin el verificador)' };
  const v = Number(d.slice(0, 7)) % 7;
  if (Number(d[7]) !== v) return { numero: null, texto: formato(d), error: `El dígito verificador debería ser ${v}` };
  return { numero: d, texto: formato(d) };
}

/** La secuencia: desde la primera guía, `cantidad` seriales seguidos, cada uno con su verificador. */
function secuencia(primera: string, cantidad: number, prefijo: string | null): { guias: Guia[]; error?: string } {
  if (!primera.trim()) return { guias: [] };
  const g = leer(primera, prefijo);
  if (!g.numero) return { guias: [], error: g.error };
  const serial = Number(g.numero.slice(0, 7));
  return {
    guias: Array.from({ length: cantidad }, (_, i) => {
      const s = String(serial + i).padStart(7, '0');
      return leer(`${s}${(serial + i) % 7}`, prefijo);
    }),
  };
}

/** Varias sueltas: una por línea (o separadas por coma o punto y coma). */
const sueltas = (texto: string, prefijo: string | null): Guia[] =>
  texto
    .split(/[\n,;]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => leer(x, prefijo));

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Ingreso de guías (menú Guías › Ingreso del sistema viejo), en dos bloques:
 * 1 · los datos del ingreso (fecha, aerolínea — pone el prefijo y el tipo de
 * stock —, referencia, tipo de stock) y 2 · las guías: una a mano (lo de todos
 * los días), una secuencia (primera guía + cantidad, como el "Generador de
 * Secuencia" del viejo) o varias sueltas. Antes de grabar se ve la lista
 * revisada (verificador y si ya está ingresada, también en el sistema viejo) y
 * un resumen. Al modificar, arriba quedan las guías del ingreso.
 */
export function IngresoGuiasDialog({ open, onClose, ingreso, onGrabado }: Props) {
  const [fecha, setFecha] = useState(ingreso?.fecha ?? toIsoDate(new Date()));
  const [idAerolinea, setIdAerolinea] = useState<number | null>(ingreso?.aerolinea?.id ?? null);
  const [aerolinea, setAerolinea] = useState<string | null>(ingreso?.aerolinea?.nombre ?? null);
  const [prefijo, setPrefijo] = useState<string | null>(ingreso?.guias.find((g) => g.numero)?.numero?.slice(0, 3) ?? null);
  const [idAgencia, setIdAgencia] = useState<number | null>(ingreso?.agencia?.id ?? null);
  const [virtual, setVirtual] = useState(ingreso ? ingreso.tipoStock !== 'NORMAL' : true);
  const [nota, setNota] = useState(ingreso?.nota ?? '');
  const [existentes, setExistentes] = useState<Existente[]>(() =>
    (ingreso?.guias ?? [])
      .filter((g) => g.estado !== 'ANULADA' && g.numero)
      .map((g) => ({ numero: g.numero!.slice(4).replace(/\D/g, ''), estado: g.estado, devuelta: g.devuelta })),
  );

  const [modo, setModo] = useState<Modo>('una');
  const [una, setUna] = useState('');
  const [primera, setPrimera] = useState('');
  const [cantidad, setCantidad] = useState(2);
  const [lista, setLista] = useState('');

  /** Lo que respondió el servidor por número: null = libre; texto = el problema ("Ya se ingresó…"). */
  const [revision, setRevision] = useState<Record<string, string | null>>({});
  const [revisando, setRevisando] = useState(false);
  const [viejoRevisado, setViejoRevisado] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intentado, setIntentado] = useState(false);
  const [trabajando, setTrabajando] = useState(false);

  const hayUsadas = existentes.some((g) => g.estado !== 'INGRESADA');

  const sec = useMemo(() => secuencia(primera, cantidad, prefijo), [primera, cantidad, prefijo]);
  const nuevas: Guia[] = useMemo(() => {
    if (modo === 'una') return una.trim() ? [leer(una, prefijo)] : [];
    if (modo === 'secuencia') return sec.guias;
    return sueltas(lista, prefijo);
  }, [modo, una, sec, lista, prefijo]);

  // Repetidas dentro de lo que se está cargando o con las que ya tiene el ingreso.
  const conRepetidas: Guia[] = useMemo(() => {
    const vistas = new Set(existentes.map((g) => g.numero));
    return nuevas.map((g) => {
      if (!g.numero) return g;
      if (vistas.has(g.numero)) return { ...g, error: 'Está repetida' };
      vistas.add(g.numero);
      return g;
    });
  }, [nuevas, existentes]);

  const validas = conRepetidas.filter((g) => g.numero && !g.error).map((g) => g.numero!);
  const todas = [...existentes.map((g) => g.numero), ...validas];
  const hayErrores = conRepetidas.some((g) => g.error) || (modo === 'secuencia' && !!sec.error);

  const dto = (): GuardarIngresoDto => ({
    fecha,
    idAerolinea: idAerolinea!,
    idAgenciaIata: idAgencia ?? undefined,
    virtual,
    guias: todas,
    nota: nota.trim() || undefined,
  });

  // Revisión en el servidor (ya ingresada aquí o en el sistema viejo), 600 ms después de dejar de escribir.
  const turno = useRef(0);
  const claveRevision = `${idAerolinea}|${validas.join(',')}`;
  useEffect(() => {
    if (!idAerolinea || validas.length === 0) return;
    const yo = ++turno.current;
    const t = setTimeout(async () => {
      setRevisando(true);
      try {
        const p = await operacionService.previsualizarIngreso(dto(), ingreso?.id);
        if (yo !== turno.current) return;
        setRevision(Object.fromEntries(p.guias.filter((g) => g.numero).map((g) => [g.numero!.slice(-8), g.problema])));
        setViejoRevisado(p.revisadoSistemaViejo);
      } catch {
        // Sin revisión previa: se revisa igual al grabar.
      } finally {
        if (yo === turno.current) setRevisando(false);
      }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveRevision]);

  const elegirAerolinea = (id: number | null, o: Opcion | null) => {
    setIdAerolinea(id);
    setAerolinea(o?.nombre ?? null);
    const extra = o?.extra as { prefijoAwb?: string | null; guiasVirtuales?: boolean } | undefined;
    setPrefijo(extra?.prefijoAwb ?? null);
    // Como el sistema viejo (aerVirtual): la aerolínea define el tipo de stock por defecto.
    if (extra && typeof extra.guiasVirtuales === 'boolean' && !hayUsadas) setVirtual(extra.guiasVirtuales);
  };

  const problemaServidor = (g: Guia) => (g.numero ? revision[g.numero] : undefined);
  const hayRepetidasServidor = conRepetidas.some((g) => problemaServidor(g));

  const grabar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIntentado(true);
    if (!idAerolinea) return setError('El campo aerolínea es obligatorio.');
    if (hayErrores) return setError('Revisa las guías marcadas en rojo.');
    if (todas.length === 0) return setError('No hay números de guía para grabar.');
    setTrabajando(true);
    try {
      const p = await operacionService.previsualizarIngreso(dto(), ingreso?.id);
      setRevision(Object.fromEntries(p.guias.filter((g) => g.numero).map((g) => [g.numero!.slice(-8), g.problema])));
      if (!p.ok) return setError('Hay guías que ya se ingresaron: quítalas de la lista.');
      if (!p.revisadoSistemaViejo && viejoRevisado) {
        setViejoRevisado(false);
        return setError('No se pudo revisar el sistema viejo. Confirma allá que las guías no estén ingresadas y vuelve a Grabar.');
      }
      const r = ingreso ? await operacionService.actualizarIngreso(ingreso.id, dto()) : await operacionService.crearIngreso(dto());
      onGrabado(r);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTrabajando(false);
    }
  };

  /** Texto de revisión de una guía: error local, ya ingresada, revisando o libre. */
  const estado = (g: Guia): { texto: string; color: string } => {
    if (g.error) return { texto: g.error, color: 'error.main' };
    const p = problemaServidor(g);
    if (p) return { texto: p, color: 'error.main' };
    const v = `verificador ${g.numero!.slice(-1)}${g.verificadorAgregado ? ' (agregado)' : ''}`;
    if (p === null) return { texto: `✓ ${v} · no está ingresada`, color: 'success.main' };
    return { texto: revisando ? `${v} · revisando…` : `✓ ${v}`, color: revisando ? 'text.secondary' : 'success.main' };
  };

  const titulo = ingreso ? `Modificar ingreso ${textoIngreso(ingreso.numero)}` : 'Ingreso de guías';
  const tipo = virtual ? 'virtual' : 'normal';
  const tipos = virtual ? 'virtuales' : 'normales';
  const resumen = ingreso
    ? `El ingreso queda con ${plural(todas.length, 'guía', 'guías')}${validas.length ? ` (${validas.length} nueva${validas.length === 1 ? '' : 's'})` : ''}`
    : validas.length
      ? `Se ${validas.length === 1 ? 'ingresa' : 'ingresan'} ${plural(validas.length, `guía ${tipo}`, `guías ${tipos}`)}${aerolinea ? ` de ${aerolinea}` : ''}`
      : '';

  const seccion = (t: string) => (
    <Typography variant="overline" color="text.secondary" component="div" sx={{ fontWeight: 700, lineHeight: 1.6, mt: 2, mb: 1 }}>
      {t}
    </Typography>
  );

  const tablaGuias = (guias: Guia[]) => (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260, mt: 1.5 }}>
      <Table
        size="small"
        stickyHeader
        sx={{ '&& .MuiTableCell-root': { py: 0.5, px: 1, fontSize: 13 }, '&& .MuiTableCell-head': { textTransform: 'none', letterSpacing: 0 } }}
      >
        <TableHead>
          <TableRow>
            <TableCell width={36}>#</TableCell>
            <TableCell>Número de guía</TableCell>
            <TableCell>Revisión</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {guias.map((g, i) => {
            const e = estado(g);
            return (
              <TableRow key={`${g.texto}-${i}`}>
                <TableCell sx={{ color: 'text.secondary', ...nums }}>{i + 1}</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', ...nums }}>{g.texto}</TableCell>
                <TableCell>
                  <Typography component="span" variant="body2" color={e.color} sx={{ fontSize: 'inherit' }}>
                    {e.texto}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const prefijoAdorno = (
    <InputAdornment position="start">
      <Box component="span" sx={{ color: 'text.secondary', ...nums }}>
        {prefijo ? `${prefijo}-` : '???-'}
      </Box>
    </InputAdornment>
  );

  const unaGuia = conRepetidas[0];
  const ultima = sec.guias[sec.guias.length - 1];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { component: 'form', onSubmit: grabar } }}>
      <DialogTitle sx={{ pb: 0 }}>{titulo}</DialogTitle>
      <DialogContent>
        {seccion('1 · Datos del ingreso')}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              type="date"
              size="small"
              fullWidth
              label="Fecha"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <OpcionAutocomplete
              tipo="aerolineas"
              label="Aerolínea"
              required
              error={intentado && !idAerolinea}
              value={idAerolinea}
              disabled={hayUsadas}
              helperText={
                hayUsadas
                  ? 'No se cambia: el ingreso tiene guías usadas'
                  : prefijo
                    ? `Prefijo de las guías: ${prefijo} · stock por defecto: ${virtual ? 'virtual' : 'normal'}`
                    : 'Pone el prefijo de las guías y el tipo de stock'
              }
              onChange={elegirAerolinea}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <OpcionAutocomplete
              tipo="agencias"
              label="Referencia (agencia IATA)"
              value={idAgencia}
              mostrarDetalle
              helperText={ingreso?.referencia && !ingreso.agencia ? `Antes: ${ingreso.referencia}` : undefined}
              onChange={(id) => setIdAgencia(id)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              color="primary"
              value={virtual ? 'virtual' : 'normal'}
              onChange={(_, v) => v && setVirtual(v === 'virtual')}
              aria-label="Tipo de stock"
              sx={{ height: 40 }}
            >
              <ToggleButton value="virtual">Virtual</ToggleButton>
              <ToggleButton value="normal">Normal</ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>

        {seccion(ingreso ? `2 · Guías del ingreso (${existentes.length})` : '2 · Guías')}
        {ingreso && existentes.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200, mb: 2 }}>
            <Table size="small" sx={{ '&& .MuiTableCell-root': { py: 0.25, px: 1, fontSize: 13 } }}>
              <TableBody>
                {existentes.map((g) => (
                  <TableRow key={g.numero}>
                    <TableCell sx={{ fontWeight: 600, ...nums }}>{leer(g.numero, prefijo).texto}</TableCell>
                    <TableCell>
                      <SituacionGuiaTexto guia={g} />
                    </TableCell>
                    <TableCell align="right" width={40}>
                      {g.estado === 'INGRESADA' && (
                        <Tooltip title="Quitar esta guía del ingreso">
                          <IconButton size="small" onClick={() => setExistentes((xs) => xs.filter((x) => x.numero !== g.numero))}>
                            <QuitarIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {ingreso && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Agregar guías:
          </Typography>
        )}

        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          value={modo}
          onChange={(_, v: Modo | null) => v && setModo(v)}
          aria-label="Cómo cargar las guías"
          sx={{ mb: 1.5 }}
        >
          <ToggleButton value="una">Una guía</ToggleButton>
          <ToggleButton value="secuencia">Secuencia</ToggleButton>
          <ToggleButton value="sueltas">Varias sueltas</ToggleButton>
        </ToggleButtonGroup>

        {modo === 'una' && (
          <TextField
            fullWidth
            autoFocus
            value={una}
            onChange={(e) => setUna(e.target.value)}
            placeholder="8469 5461"
            error={!!unaGuia && estado(unaGuia).color === 'error.main'}
            helperText={
              unaGuia
                ? unaGuia.numero
                  ? `${unaGuia.texto} · ${estado(unaGuia).texto}`
                  : estado(unaGuia).texto
                : 'Los 8 dígitos (o 7: el verificador lo pone el sistema)'
            }
            slotProps={{
              input: { startAdornment: prefijoAdorno, sx: { fontSize: 22, fontWeight: 600, ...nums } },
              htmlInput: { inputMode: 'numeric', 'aria-label': 'Número de guía' },
              formHelperText: { sx: { color: unaGuia ? estado(unaGuia).color : undefined } },
            }}
          />
        )}

        {modo === 'secuencia' && (
          <>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <TextField
                size="small"
                autoFocus
                label="Primera guía"
                value={primera}
                onChange={(e) => setPrimera(e.target.value)}
                placeholder="8469 5461"
                error={!!sec.error}
                helperText={sec.error ?? ' '}
                sx={{ flex: 1 }}
                slotProps={{ input: { startAdornment: prefijoAdorno, sx: nums }, htmlInput: { inputMode: 'numeric' } }}
              />
              <Stack direction="row" alignItems="center" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, height: 40 }}>
                <IconButton
                  size="small"
                  aria-label="Una guía menos"
                  disabled={cantidad <= 1}
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                >
                  <MenosIcon fontSize="small" />
                </IconButton>
                <TextField
                  variant="standard"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.min(MAX, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1)))}
                  slotProps={{
                    input: { disableUnderline: true },
                    htmlInput: { inputMode: 'numeric', 'aria-label': 'Cantidad', style: { textAlign: 'center', width: 44, fontWeight: 700 } },
                  }}
                />
                <IconButton
                  size="small"
                  aria-label="Una guía más"
                  disabled={cantidad >= MAX}
                  onClick={() => setCantidad((c) => Math.min(MAX, c + 1))}
                >
                  <MasIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
            {sec.guias.length > 0 && ultima && (
              <Box sx={{ px: 1.5, py: 1, border: 1, borderStyle: 'dashed', borderColor: 'divider', borderRadius: 1, bgcolor: 'action.hover' }}>
                <Typography variant="body2" sx={nums}>
                  Del <strong>{sec.guias[0].texto}</strong> al <strong>{ultima.texto}</strong> ·{' '}
                  <strong>{plural(sec.guias.length, 'guía', 'guías')}</strong> seguidas
                </Typography>
              </Box>
            )}
            {conRepetidas.length > 0 && tablaGuias(conRepetidas)}
          </>
        )}

        {modo === 'sueltas' && (
          <>
            <TextField
              fullWidth
              multiline
              minRows={3}
              autoFocus
              label="Números de guía"
              value={lista}
              onChange={(e) => setLista(e.target.value)}
              placeholder={'8469 5461\n8469 5472'}
              helperText="Una por línea (o separadas por coma). Con o sin el prefijo de la aerolínea."
              slotProps={{ htmlInput: { style: { fontVariantNumeric: 'tabular-nums' } } }}
            />
            {conRepetidas.length > 0 && tablaGuias(conRepetidas)}
          </>
        )}

        <TextField size="small" fullWidth label="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} sx={{ mt: 2 }} />

        {!viejoRevisado && !error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            No se pudo revisar el sistema viejo: confirma allá que las guías no estén ingresadas.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, borderTop: 1, borderColor: 'divider', justifyContent: 'space-between' }}>
        <Typography variant="body2" color={hayRepetidasServidor ? 'error.main' : 'text.secondary'} sx={nums}>
          {hayRepetidasServidor ? 'Hay guías que ya se ingresaron' : resumen}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={trabajando}
            startIcon={trabajando ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Grabar
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
