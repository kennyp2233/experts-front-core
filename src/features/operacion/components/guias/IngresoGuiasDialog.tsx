'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Close as QuitarIcon } from '@mui/icons-material';
import { getErrorMessage, toIsoDate } from '@/shared/utils';
import { operacionService } from '../../services/operacion.service';
import type { GuardarIngresoDto, IngresoDetalle, Opcion } from '../../types/coordinacion';
import { textoIngreso } from '../../utils/formato';
import { OpcionAutocomplete } from '../coordinar/OpcionAutocomplete';
import { SituacionGuiaChip } from './EstadosGuias';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Al modificar: el ingreso cargado. */
  ingreso?: IngresoDetalle;
  onGrabado: (r: { id: number; numero: number | null }) => void;
}

interface Fila {
  /** Número escrito (8 dígitos con verificador, o 7). */
  texto: string;
  /** Guía ya usada (coordinada o prestada): no se toca. */
  usada?: { estado: IngresoDetalle['guias'][number]['estado']; devuelta: boolean };
}

/** Revisión en el momento: "369-8469 5461" si está bien, o el problema. */
function revisar(texto: string, prefijo: string | null): { ok?: string; error?: string; completa?: string } {
  const d = texto.replace(/\D/g, '');
  if (!d) return {};
  const pre = prefijo ?? '???';
  if (d.length === 7) {
    const v = Number(d) % 7;
    return { completa: `${d}${v}`, ok: `${pre}-${d.slice(0, 4)} ${d.slice(4)}${v} (verificador ${v})` };
  }
  if (d.length !== 8) return { error: '8 dígitos (o 7, sin el verificador)' };
  const v = Number(d.slice(0, 7)) % 7;
  if (Number(d[7]) !== v) return { error: `El dígito verificador debería ser ${v}` };
  return { ok: `${pre}-${d.slice(0, 4)} ${d.slice(4)}` };
}

const filasDe = (ing?: IngresoDetalle): Fila[] =>
  ing
    ? ing.guias
        .filter((g) => g.estado !== 'ANULADA' && g.numero)
        .map((g) => ({
          texto: g.numero!.slice(4),
          usada: g.estado === 'INGRESADA' ? undefined : { estado: g.estado, devuelta: g.devuelta },
        }))
    : [{ texto: '' }];

/**
 * Ingreso de guías (menú del sistema viejo Guías › Ingreso): fecha, aerolínea,
 * referencia (agencia IATA con que se reservó), tipo de stock y las guías. Lo
 * habitual es una sola guía escrita a mano; "Generar secuencia" arma varias
 * consecutivas con su dígito verificador.
 */
export function IngresoGuiasDialog({ open, onClose, ingreso, onGrabado }: Props) {
  const [fecha, setFecha] = useState(ingreso?.fecha ?? toIsoDate(new Date()));
  const [idAerolinea, setIdAerolinea] = useState<number | null>(ingreso?.aerolinea?.id ?? null);
  const [prefijo, setPrefijo] = useState<string | null>(ingreso?.guias.find((g) => g.numero)?.numero?.slice(0, 3) ?? null);
  const [idAgencia, setIdAgencia] = useState<number | null>(ingreso?.agencia?.id ?? null);
  const [virtual, setVirtual] = useState(ingreso ? ingreso.tipoStock !== 'NORMAL' : true);
  const [filas, setFilas] = useState<Fila[]>(() => filasDe(ingreso));
  const [nota, setNota] = useState(ingreso?.nota ?? '');
  const [generador, setGenerador] = useState(false);
  const [inicio, setInicio] = useState('');
  const [cantidad, setCantidad] = useState('2');
  const [problemas, setProblemas] = useState<Record<number, string>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  /** Si el sistema viejo no respondió, se avisa y el segundo "Grabar" sigue igual. */
  const [sinRevisarOk, setSinRevisarOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const hayUsadas = filas.some((f) => f.usada);

  const cambiarFila = (i: number, texto: string) => {
    setFilas((fs) => fs.map((f, j) => (j === i ? { ...f, texto } : f)));
    setProblemas((p) => {
      const resto = { ...p };
      delete resto[i];
      return resto;
    });
  };

  const elegirAerolinea = (id: number | null, o: Opcion | null) => {
    setIdAerolinea(id);
    const extra = o?.extra as { prefijoAwb?: string | null; guiasVirtuales?: boolean } | undefined;
    setPrefijo(extra?.prefijoAwb ?? null);
    // Como el sistema viejo (aerVirtual): la aerolínea define el tipo de stock por defecto.
    if (extra && typeof extra.guiasVirtuales === 'boolean' && !hayUsadas) setVirtual(extra.guiasVirtuales);
  };

  const generar = () => {
    const r = revisar(inicio, prefijo);
    const n = Number(cantidad);
    if (r.error || !(n >= 1 && n <= 500)) {
      setError(r.error ? `Número inicial: ${r.error}` : 'La cantidad va de 1 a 500.');
      return;
    }
    const serial = Number((r.completa ?? inicio.replace(/\D/g, '')).slice(0, 7));
    const nuevas = Array.from({ length: n }, (_, i) => {
      const s = serial + i;
      return { texto: `${String(s).padStart(7, '0')}${s % 7}` };
    });
    setFilas((fs) => [...fs.filter((f) => f.usada || f.texto.trim()), ...nuevas]);
    setProblemas({});
    setError(null);
    setGenerador(false);
  };

  const grabar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!idAerolinea) {
      setError('El campo aerolínea es obligatorio.');
      return;
    }
    const conTexto = filas.map((f, i) => ({ ...f, i })).filter((f) => f.texto.trim());
    if (conTexto.length === 0) {
      setError('No hay números de guía para grabar.');
      return;
    }
    const locales = Object.fromEntries(
      conTexto.map((f) => [f.i, revisar(f.texto, prefijo).error]).filter(([, err]) => err),
    ) as Record<number, string>;
    if (Object.keys(locales).length) {
      setProblemas(locales);
      return;
    }
    const dto: GuardarIngresoDto = {
      fecha,
      idAerolinea,
      idAgenciaIata: idAgencia ?? undefined,
      virtual,
      guias: conTexto.map((f) => revisar(f.texto, prefijo).completa ?? f.texto.replace(/\D/g, '')),
      nota: nota.trim() || undefined,
    };
    setTrabajando(true);
    try {
      const p = await operacionService.previsualizarIngreso(dto, ingreso?.id);
      if (!p.ok) {
        setProblemas(
          Object.fromEntries(p.guias.map((g, k) => [conTexto[k].i, g.problema]).filter(([, x]) => x)) as Record<number, string>,
        );
        return;
      }
      if (!p.revisadoSistemaViejo && !sinRevisarOk) {
        setAviso('No se pudo revisar el sistema viejo. Confirma allá que la guía no esté ingresada y vuelve a Grabar.');
        setSinRevisarOk(true);
        return;
      }
      const r = ingreso ? await operacionService.actualizarIngreso(ingreso.id, dto) : await operacionService.crearIngreso(dto);
      onGrabado(r);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTrabajando(false);
    }
  };

  const titulo = ingreso ? `Modificar ingreso ${textoIngreso(ingreso.numero)}` : 'Ingreso de guías';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { component: 'form', onSubmit: grabar } }}>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
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
              conCodigo
              value={idAerolinea}
              disabled={hayUsadas}
              helperText={hayUsadas ? 'No se cambia: el ingreso tiene guías usadas' : prefijo ? `Prefijo de las guías: ${prefijo}` : undefined}
              onChange={elegirAerolinea}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <OpcionAutocomplete
              tipo="agencias"
              label="Referencia (agencia IATA)"
              value={idAgencia}
              helperText={
                ingreso?.referencia && !ingreso.agencia
                  ? `Antes: ${ingreso.referencia}`
                  : 'Agencia con la que se reservó la guía (EBF, FlowerCargo…)'
              }
              onChange={(id) => setIdAgencia(id)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl>
              <FormLabel sx={{ typography: 'caption' }}>Tipo de stock</FormLabel>
              <RadioGroup row value={virtual ? 'virtual' : 'normal'} onChange={(e) => setVirtual(e.target.value === 'virtual')}>
                <FormControlLabel value="virtual" control={<Radio size="small" />} label="Virtual" />
                <FormControlLabel value="normal" control={<Radio size="small" />} label="Normal" />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          {filas.length === 1 ? 'Número de guía' : 'Números de guía'}
        </Typography>
        <Stack spacing={1}>
          {filas.map((f, i) => {
            const r = revisar(f.texto, prefijo);
            const problema = problemas[i] ?? (f.texto.replace(/\D/g, '').length >= 7 ? r.error : undefined);
            return (
              <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  size="small"
                  value={f.texto}
                  disabled={!!f.usada}
                  placeholder="8469 5461"
                  onChange={(e) => cambiarFila(i, e.target.value)}
                  error={!!problema}
                  helperText={problema ?? r.ok ?? ' '}
                  sx={{ width: 260, '& input': { fontVariantNumeric: 'tabular-nums' } }}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">{prefijo ? `${prefijo}-` : '???-'}</InputAdornment>,
                    },
                    htmlInput: { inputMode: 'numeric', 'aria-label': `Número de guía ${i + 1}` },
                    formHelperText: { sx: { color: !problema && r.ok ? 'success.main' : undefined } },
                  }}
                />
                {f.usada ? (
                  <Box sx={{ pt: 0.75 }}>
                    <SituacionGuiaChip guia={{ estado: f.usada.estado, devuelta: f.usada.devuelta }} />
                  </Box>
                ) : (
                  filas.length > 1 && (
                    <Tooltip title="Quitar esta guía">
                      <IconButton size="small" sx={{ mt: 0.5 }} onClick={() => setFilas((fs) => fs.filter((_, j) => j !== i))}>
                        <QuitarIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )
                )}
              </Stack>
            );
          })}
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
          <Button size="small" startIcon={<AddIcon />} onClick={() => setFilas((fs) => [...fs, { texto: '' }])}>
            Agregar otra guía
          </Button>
          <Link component="button" type="button" variant="body2" onClick={() => setGenerador((v) => !v)}>
            Generar secuencia…
          </Link>
        </Stack>
        <Collapse in={generador}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <TextField
              size="small"
              label="Número inicial"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              placeholder="8469 5461"
              helperText="Con o sin el verificador"
              sx={{ width: 170 }}
            />
            <TextField
              size="small"
              label="Cantidad"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              slotProps={{ htmlInput: { min: 1, max: 500 } }}
              sx={{ width: 100 }}
            />
            <Button variant="outlined" onClick={generar} sx={{ mt: 0.25 }}>
              Generar
            </Button>
          </Stack>
        </Collapse>

        <TextField size="small" fullWidth label="Nota" value={nota} onChange={(e) => setNota(e.target.value)} sx={{ mt: 2 }} />
        {aviso && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {aviso}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          type="submit"
          variant="contained"
          disabled={trabajando}
          startIcon={trabajando ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Grabar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
