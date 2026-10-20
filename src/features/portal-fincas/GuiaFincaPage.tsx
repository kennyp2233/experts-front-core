'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Link as EnlaceMui,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { ArrowBack as VolverIcon, DeleteOutline as BorrarIcon, Edit as CorregirIcon } from '@mui/icons-material';
import { useToast } from '@/shared/providers';
import { formatDate, getErrorMessage } from '@/shared/utils';
import { formatearDae } from '@/features/operacion/components/coordinar/formulario';
import { awb, type CargaFinca, diaVuelo, type GuiaFinca, type LineaFinca, portalService, useGuiaFinca } from './portal';

const PATRON_DAE = /^\d{3}-\d{4}-\d{2}-\d{8}$/;
const nf = new Intl.NumberFormat('es-EC', { maximumFractionDigits: 2 });
const n = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(',', '.')));

/**
 * Cajas por tipo, como en el portal de EBF: la finca dice cuántas cajas de cada
 * tamaño manda y el sistema saca los fulls (cajas equivalentes) y las piezas.
 * Los tipos y sus factores son los mismos que usa la oficina al coordinar (FB 1,
 * HB 0,5, QB 0,25, EB 0,125 en la tabla de tipos de caja).
 */
type TipoCaja = GuiaFinca['tiposCaja'][number];
const tiposDe = (g: GuiaFinca): TipoCaja[] => [...g.tiposCaja].sort((a, b) => b.factorFull - a.factorFull);
const etiquetaTipo = (t: TipoCaja) => (t.codigo ? `${t.nombre} (${t.codigo})` : t.nombre);

// La finca carga solo lo físico: factura, valor y tallos normalmente no los sube (tallos y valor
// los calcula el sistema; la factura la pone la oficina en "Facturas y notas").
interface Form {
  idFinca: number | '';
  idProducto: number | '';
  /** Cajas por id de tipo de caja. */
  cajas: Record<number, string>;
  kg: string;
  dae: string;
}

const vacio = (g: GuiaFinca): Form => {
  const f = g.fincas.length === 1 ? g.fincas[0] : undefined;
  return {
    idFinca: f?.id ?? '',
    idProducto: f?.productos.length === 1 ? f.productos[0].id : '',
    cajas: {},
    kg: '',
    dae: f?.dae?.dae ?? '',
  };
};

const entero = (s: string | undefined) => (!s || s.trim() === '' ? 0 : Number(s));

/** Fulls y piezas de las cajas por tipo; el tipo, si todas son de uno solo. */
function totalesCajas(cajasPorTipo: Record<number, string>, tipos: TipoCaja[]) {
  const usados = tipos.filter((t) => entero(cajasPorTipo[t.id]) > 0);
  return {
    cajas: tipos.reduce((s, t) => s + entero(cajasPorTipo[t.id]), 0),
    fulls: Math.round(tipos.reduce((s, t) => s + entero(cajasPorTipo[t.id]) * t.factorFull, 0) * 1000) / 1000,
    idTipoCaja: usados.length === 1 ? usados[0].id : undefined,
  };
}

/**
 * Al corregir una línea (guarda fulls, cajas y el tipo si era uno solo) se
 * reparte en tipos: el suyo, uno que cuadre, o dos (p. ej. tabacos y cuartos);
 * si nada cuadra, el tipo más parecido.
 */
function repartir(fulls: number, cajas: number, idTipoCaja: number | null, tipos: TipoCaja[]): Record<number, string> {
  if (cajas <= 0 || tipos.length === 0) return {};
  if (idTipoCaja && tipos.some((t) => t.id === idTipoCaja)) return { [idTipoCaja]: String(cajas) };
  const cerca = (a: number, b: number) => Math.abs(a - b) < 1e-6;
  const uno = tipos.find((t) => cerca(cajas * t.factorFull, fulls));
  if (uno) return { [uno.id]: String(cajas) };
  for (let i = 0; i < tipos.length; i++) {
    for (let j = i + 1; j < tipos.length; j++) {
      const a = (fulls - cajas * tipos[j].factorFull) / (tipos[i].factorFull - tipos[j].factorFull);
      if (a > 0 && a < cajas && cerca(a, Math.round(a))) {
        return { [tipos[i].id]: String(Math.round(a)), [tipos[j].id]: String(cajas - Math.round(a)) };
      }
    }
  }
  const t = tipos.reduce((m, x) => (Math.abs(x.factorFull - fulls / cajas) < Math.abs(m.factorFull - fulls / cajas) ? x : m));
  return { [t.id]: String(cajas) };
}

const desdeLinea = (l: LineaFinca, tipos: TipoCaja[]): Form => ({
  idFinca: l.idFinca,
  idProducto: l.idProducto ?? '',
  cajas: repartir(l.fulls ?? 0, l.cantidadCajas, l.idTipoCaja, tipos),
  kg: l.pesoKg !== null ? String(l.pesoKg) : '',
  dae: l.dae ?? '',
});

/** Lo que cargó la finca en la guía; las de la oficina (o con nota de la oficina) se ven pero no se tocan. */
function Linea({
  l,
  varias,
  enCorreccion,
  onCorregir,
  onBorrar,
}: {
  l: LineaFinca;
  varias: boolean;
  enCorreccion: boolean;
  onCorregir: () => void;
  onBorrar: () => void;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, ...(enCorreccion ? { borderColor: 'primary.main', borderWidth: 2 } : {}) }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" fontWeight={600}>
            {[varias ? l.finca : null, l.producto].filter(Boolean).join(' · ')}
          </Typography>
          <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {nf.format(l.fulls ?? 0)} fulls · {l.cantidadCajas} cajas · {nf.format(l.pesoKg ?? 0)} kg
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            DAE {l.dae ?? '—'} · guía hija {l.guiaHija}
          </Typography>
          {l.nota && (
            <Alert severity="warning" icon={false} sx={{ mt: 1, py: 0 }}>
              Nota de la oficina: <strong>{l.nota}</strong>
            </Alert>
          )}
          {!l.editable && (
            <Typography variant="caption" color="text.secondary">
              La cargó la oficina.
            </Typography>
          )}
          {enCorreccion && <Chip size="small" color="primary" label="Corrigiendo arriba" sx={{ mt: 1 }} />}
        </Box>
        {l.editable && (
          <Stack direction="row">
            <Tooltip title="Corregir">
              <IconButton onClick={onCorregir} aria-label="Corregir">
                <CorregirIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Borrar">
              <IconButton onClick={onBorrar} aria-label="Borrar" color="error">
                <BorrarIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

/**
 * Cargar en una guía (lo de la web vieja): finca, producto (solo los de la
 * finca), fulls, cajas, kg (si no se ponen, cajas × kg por caja) y la DAE (se
 * propone la vigente del registro de la finca).
 */
export function GuiaFincaPage({ id }: { id: number }) {
  const toast = useToast();
  const { data: g, error, isLoading, mutate } = useGuiaFinca(id);
  const [form, setForm] = useState<Form | null>(null);
  const [editando, setEditando] = useState<number | null>(null);
  const [borrando, setBorrando] = useState<LineaFinca | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [intentado, setIntentado] = useState(false);

  useEffect(() => {
    if (g && !form) setForm(vacio(g));
  }, [g, form]);

  const finca = useMemo(() => g?.fincas.find((f) => f.id === form?.idFinca), [g, form?.idFinca]);
  const formulario = useRef<HTMLFormElement>(null);

  if (error) {
    return (
      <Stack spacing={2}>
        <Alert severity="error">{getErrorMessage(error, 'No se pudo abrir la guía.')}</Alert>
        <Button component={Link} href="/portal" startIcon={<VolverIcon />}>
          Guías abiertas
        </Button>
      </Stack>
    );
  }
  if (isLoading || !g || !form) return <Skeleton variant="rounded" height={320} />;

  const cambiar = (c: Partial<Form>) => setForm((f) => (f ? { ...f, ...c } : f));
  const elegirFinca = (idFinca: number) => {
    const f = g.fincas.find((x) => x.id === idFinca);
    cambiar({
      idFinca,
      idProducto: f?.productos.length === 1 ? f.productos[0].id : '',
      // La DAE vigente de esa finca, si la que había era la propuesta de otra.
      dae: f?.dae?.dae ?? (g.fincas.some((x) => x.dae?.dae === form.dae) ? '' : form.dae),
    });
  };

  const tipos = tiposDe(g);
  const { cajas, fulls, idTipoCaja } = totalesCajas(form.cajas, tipos);
  // Igual que la oficina al coordinar: kg = fulls × cajas por full × kg por caja.
  const kgPorFull = g.cajasPorFull * g.kgPorCaja;
  const kgSugerido = cajas > 0 ? Math.round(fulls * kgPorFull * 100) / 100 : undefined;
  // Qué falta en cada campo (se muestra debajo del campo al intentar grabar).
  const faltan = {
    finca: form.idFinca === '' ? 'Elige la finca.' : null,
    producto: form.idProducto === '' ? (finca ? 'Elige el producto.' : 'Primero elige la finca.') : null,
    cajas: cajas === 0 ? 'Escribe cuántas cajas de cada tipo.' : null,
    dae: PATRON_DAE.test(form.dae) ? null : form.dae ? 'Faltan dígitos: 055-AAAA-40-XXXXXXXX.' : 'Escribe la DAE.',
  };
  const hayFaltantes = Object.values(faltan).some(Boolean);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    if (hayFaltantes) return;
    // Al corregir se conserva la factura que ya tuviera la línea (p. ej. la que puso la oficina). Tallos y
    // valor también, salvo que cambien fulls o cajas: entonces el sistema los vuelve a calcular.
    const previa = editando ? g.lineas.find((l) => l.id === editando) : undefined;
    const mismaCarga = previa && previa.fulls === fulls && previa.cantidadCajas === cajas;
    const carga: CargaFinca = {
      idFinca: form.idFinca as number,
      idProducto: form.idProducto as number,
      fulls,
      cantidadCajas: cajas,
      idTipoCaja,
      pesoKg: n(form.kg),
      dae: form.dae,
      factura: previa?.factura || undefined,
      valor: mismaCarga ? (previa.valor ?? undefined) : undefined,
      tallos: mismaCarga ? (previa.tallos ?? undefined) : undefined,
    };
    setTrabajando(true);
    try {
      const nueva = editando ? await portalService.corregir(id, editando, carga) : await portalService.cargar(id, carga);
      await mutate(nueva, { revalidate: false });
      toast.success(editando ? 'Carga corregida.' : 'Carga registrada.');
      setEditando(null);
      setIntentado(false);
      setForm({ ...vacio(nueva), idFinca: form.idFinca, idProducto: form.idProducto, dae: form.dae });
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo grabar.'));
      // La oficina cortó la guía mientras se cargaba: se muestra que ya no está abierta.
      if (isAxiosError(err) && err.response?.status === 404) mutate();
    } finally {
      setTrabajando(false);
    }
  };

  const borrar = async () => {
    if (!borrando) return;
    setTrabajando(true);
    try {
      const nueva = await portalService.borrar(id, borrando.id);
      await mutate(nueva, { revalidate: false });
      toast.success('Carga borrada.');
      if (editando === borrando.id) {
        setEditando(null);
        setForm(vacio(nueva));
      }
      setBorrando(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo borrar.'));
    } finally {
      setTrabajando(false);
    }
  };

  const tot = g.lineas.reduce((a, l) => ({ fulls: a.fulls + (l.fulls ?? 0), cajas: a.cajas + l.cantidadCajas }), { fulls: 0, cajas: 0 });
  const err = (k: keyof typeof faltan) => intentado && !!faltan[k];
  const ayuda = (k: keyof typeof faltan, normal?: React.ReactNode) => (intentado && faltan[k] ? faltan[k] : normal);

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton component={Link} href="/portal" aria-label="Volver a las guías abiertas">
          <VolverIcon />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
            {g.marca}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {[
              diaVuelo(g.fechaVuelo),
              [g.destino?.codigo, g.destinoFinal?.codigo].filter(Boolean).join(' → '),
              g.aerolinea,
              g.guia ? `guía ${awb(g.guia)}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        </Box>
      </Stack>

      <Card variant="outlined" component="form" ref={formulario} onSubmit={guardar} noValidate sx={{ p: 2, scrollMarginTop: 80 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          {editando ? 'Corregir la carga' : 'Agregar carga'}
        </Typography>
        <Grid container spacing={2}>
          {g.fincas.length > 1 && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                required
                label="Finca"
                value={form.idFinca}
                error={err('finca')}
                helperText={ayuda('finca')}
                onChange={(e) => elegirFinca(Number(e.target.value))}
              >
                {g.fincas.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: g.fincas.length > 1 ? 6 : 12 }}>
            <TextField
              select
              fullWidth
              required
              label="Producto"
              value={form.idProducto}
              error={err('producto') && !!finca}
              disabled={!finca}
              helperText={
                finca && finca.productos.length === 0
                  ? 'Tu finca no tiene productos: avisa a la oficina.'
                  : ayuda('producto', !finca ? 'Primero elige la finca.' : undefined)
              }
              onChange={(e) => cambiar({ idProducto: Number(e.target.value) })}
            >
              {(finca?.productos ?? []).map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
              Cajas por tipo
            </Typography>
            <Grid container spacing={1.5}>
              {tipos.map((t) => (
                <Grid key={t.id} size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    label={etiquetaTipo(t)}
                    value={form.cajas[t.id] ?? ''}
                    error={err('cajas')}
                    placeholder="0"
                    onChange={(e) => cambiar({ cajas: { ...form.cajas, [t.id]: e.target.value.replace(/\D/g, '') } })}
                    slotProps={{ htmlInput: { inputMode: 'numeric' }, inputLabel: { shrink: true } }}
                  />
                </Grid>
              ))}
            </Grid>
            {/* Como EBF: las cajas equivalentes (fulls) y las piezas salen solas. */}
            <Typography
              variant="body2"
              color={err('cajas') ? 'error' : 'text.secondary'}
              sx={{ mt: 1, fontVariantNumeric: 'tabular-nums' }}
            >
              {err('cajas') ? faltan.cajas : `= ${nf.format(fulls)} fulls · ${cajas} ${cajas === 1 ? 'pieza' : 'piezas'}`}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Kg"
              value={form.kg}
              placeholder={kgSugerido !== undefined ? nf.format(kgSugerido) : ''}
              helperText={
                form.kg.trim() === '' && kgSugerido !== undefined
                  ? `Si lo dejas vacío se ponen ${nf.format(kgSugerido)} kg (${nf.format(kgPorFull)} por full).`
                  : `Si lo dejas vacío: ${nf.format(kgPorFull)} kg por full.`
              }
              onChange={(e) => cambiar({ kg: e.target.value })}
              slotProps={{ htmlInput: { inputMode: 'decimal' }, inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              required
              label="DAE"
              value={form.dae}
              error={err('dae')}
              placeholder="055-AAAA-40-XXXXXXXX"
              onChange={(e) => cambiar({ dae: formatearDae(e.target.value, form.dae) })}
              helperText={
                err('dae') ? (
                  faltan.dae
                ) : finca?.dae && finca.dae.dae === form.dae ? (
                  `De tu registro de DAE, vigente hasta ${formatDate(finca.dae.hasta)}.`
                ) : finca && !finca.dae ? (
                  <>
                    No tienes una DAE vigente para este destino: escríbela o{' '}
                    <EnlaceMui component={Link} href="/portal/daes" color="inherit" underline="always">
                      regístrala en Mis DAE
                    </EnlaceMui>
                    .
                  </>
                ) : (
                  ' '
                )
              }
              slotProps={{
                htmlInput: { inputMode: 'numeric', spellCheck: false, style: { fontVariantNumeric: 'tabular-nums' } },
                formHelperText: { sx: { color: finca && !finca.dae && !err('dae') ? 'warning.dark' : undefined } },
              }}
            />
          </Grid>
        </Grid>
        {intentado && hayFaltantes && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Falta completar lo marcado en rojo.
          </Alert>
        )}
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
          {editando && (
            <Button
              size="large"
              sx={{ color: 'text.secondary' }}
              onClick={() => {
                setEditando(null);
                setForm(vacio(g));
                setIntentado(false);
              }}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={trabajando}
            startIcon={trabajando ? <CircularProgress size={18} color="inherit" /> : undefined}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {editando ? 'Guardar cambios' : 'Agregar a la guía'}
          </Button>
        </Stack>
      </Card>

      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Lo que ya cargaste{g.lineas.length ? ` · ${nf.format(tot.fulls)} fulls · ${tot.cajas} cajas` : ''}
        </Typography>
        {g.lineas.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Todavía no cargaste nada en esta guía.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {g.lineas.map((l) => (
              <Linea
                key={l.id}
                l={l}
                varias={g.fincas.length > 1}
                enCorreccion={editando === l.id}
                onCorregir={() => {
                  setEditando(l.id);
                  setForm(desdeLinea(l, tipos));
                  setIntentado(false);
                  formulario.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                onBorrar={() => setBorrando(l)}
              />
            ))}
          </Stack>
        )}
      </Box>

      <Dialog open={borrando !== null} onClose={() => setBorrando(null)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Borrar esta carga?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {borrando
              ? [g.fincas.length > 1 ? borrando.finca : null, borrando.producto, `${nf.format(borrando.fulls ?? 0)} fulls`, `${borrando.cantidadCajas} cajas`]
                  .filter(Boolean)
                  .join(' · ')
              : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBorrando(null)}>Cancelar</Button>
          <Button color="error" variant="contained" disabled={trabajando} onClick={borrar}>
            Borrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
