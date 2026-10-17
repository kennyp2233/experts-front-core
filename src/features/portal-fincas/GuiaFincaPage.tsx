'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
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

interface Form {
  idFinca: number | '';
  idProducto: number | '';
  fulls: string;
  cajas: string;
  kg: string;
  dae: string;
  factura: string;
  valor: string;
  tallos: string;
}

const vacio = (g: GuiaFinca): Form => {
  const f = g.fincas.length === 1 ? g.fincas[0] : undefined;
  return {
    idFinca: f?.id ?? '',
    idProducto: f?.productos.length === 1 ? f.productos[0].id : '',
    fulls: '',
    cajas: '',
    kg: '',
    dae: f?.dae?.dae ?? '',
    factura: '',
    valor: '',
    tallos: '',
  };
};

const desdeLinea = (l: LineaFinca): Form => ({
  idFinca: l.idFinca,
  idProducto: l.idProducto ?? '',
  fulls: l.fulls !== null ? String(l.fulls) : '',
  cajas: String(l.cantidadCajas),
  kg: l.pesoKg !== null ? String(l.pesoKg) : '',
  dae: l.dae ?? '',
  factura: l.factura ?? '',
  valor: l.valor !== null ? String(l.valor) : '',
  tallos: l.tallos !== null ? String(l.tallos) : '',
});

/** Lo que cargó la finca en la guía; las de la oficina (o con nota de la oficina) se ven pero no se tocan. */
function Linea({ l, varias, onCorregir, onBorrar }: { l: LineaFinca; varias: boolean; onCorregir: () => void; onBorrar: () => void }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
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
            {l.factura ? ` · factura ${l.factura}` : ''}
            {l.valor !== null ? ` · $ ${nf.format(l.valor)}` : ''}
            {l.tallos !== null ? ` · ${l.tallos} tallos` : ''}
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
 * finca), fulls, cajas, kg (si no se ponen, cajas × kg por caja), la DAE (se
 * propone la vigente del registro de la finca), factura, valor y tallos.
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

  const cajas = n(form.cajas);
  const kgSugerido = cajas !== undefined ? Math.round(cajas * g.kgPorCaja * 100) / 100 : undefined;
  const faltan = {
    finca: form.idFinca === '',
    producto: form.idProducto === '',
    fulls: n(form.fulls) === undefined,
    cajas: cajas === undefined || !Number.isInteger(cajas),
    dae: !PATRON_DAE.test(form.dae),
  };
  const hayFaltantes = Object.values(faltan).some(Boolean);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    if (hayFaltantes) return;
    const carga: CargaFinca = {
      idFinca: form.idFinca as number,
      idProducto: form.idProducto as number,
      fulls: n(form.fulls)!,
      cantidadCajas: cajas!,
      pesoKg: n(form.kg),
      dae: form.dae,
      factura: form.factura.trim() || undefined,
      valor: n(form.valor),
      tallos: n(form.tallos),
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
  const err = (k: keyof typeof faltan) => intentado && faltan[k];

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton component={Link} href="/portal" aria-label="Volver a las guías abiertas">
          <VolverIcon />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
            {diaVuelo(g.fechaVuelo)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {g.marca} · {[g.destino?.codigo, g.destinoFinal?.codigo].filter(Boolean).join(' → ')}
            {g.aerolinea ? ` · ${g.aerolinea}` : ''}
            {g.guia ? ` · guía ${awb(g.guia)}` : ''}
          </Typography>
        </Box>
      </Stack>

      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          Tu carga en esta guía{g.lineas.length ? ` · ${nf.format(tot.fulls)} fulls · ${tot.cajas} cajas` : ''}
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
                onCorregir={() => {
                  setEditando(l.id);
                  setForm(desdeLinea(l));
                  setIntentado(false);
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }}
                onBorrar={() => setBorrando(l)}
              />
            ))}
          </Stack>
        )}
      </Box>

      <Card variant="outlined" component="form" onSubmit={guardar} sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          {editando ? 'Corregir la carga' : 'Agregar carga'}
        </Typography>
        <Grid container spacing={2}>
          {g.fincas.length > 1 && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Finca"
                value={form.idFinca}
                error={err('finca')}
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
              label="Producto"
              value={form.idProducto}
              error={err('producto')}
              disabled={!finca}
              helperText={finca && finca.productos.length === 0 ? 'Tu finca no tiene productos: avisa a la oficina.' : undefined}
              onChange={(e) => cambiar({ idProducto: Number(e.target.value) })}
            >
              {(finca?.productos ?? []).map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              fullWidth
              label="Fulls"
              value={form.fulls}
              error={err('fulls')}
              onChange={(e) => cambiar({ fulls: e.target.value })}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              fullWidth
              label="Cajas"
              value={form.cajas}
              error={err('cajas')}
              onChange={(e) => cambiar({ cajas: e.target.value.replace(/\D/g, '') })}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Kg"
              value={form.kg}
              placeholder={kgSugerido !== undefined ? nf.format(kgSugerido) : ''}
              helperText={`Si lo dejas vacío: ${g.kgPorCaja} kg por caja`}
              onChange={(e) => cambiar({ kg: e.target.value })}
              slotProps={{ htmlInput: { inputMode: 'decimal' }, inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="DAE"
              value={form.dae}
              error={err('dae')}
              placeholder="055-AAAA-40-XXXXXXXX"
              onChange={(e) => cambiar({ dae: formatearDae(e.target.value, form.dae) })}
              helperText={
                finca?.dae && finca.dae.dae === form.dae
                  ? `De tu registro de DAE, vigente hasta ${formatDate(finca.dae.hasta)}`
                  : finca && !finca.dae
                    ? 'No tienes una DAE vigente para este destino: regístrala en "Mis DAE".'
                    : err('dae')
                      ? 'Formato 055-AAAA-40-XXXXXXXX'
                      : ' '
              }
              slotProps={{
                htmlInput: { inputMode: 'numeric', spellCheck: false, style: { fontVariantNumeric: 'tabular-nums' } },
                formHelperText: { sx: { color: finca && !finca.dae && !err('dae') ? 'warning.dark' : undefined } },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth label="Factura" value={form.factura} onChange={(e) => cambiar({ factura: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              fullWidth
              label="Valor"
              value={form.valor}
              onChange={(e) => cambiar({ valor: e.target.value })}
              slotProps={{ htmlInput: { inputMode: 'decimal' }, input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField
              fullWidth
              label="Tallos"
              value={form.tallos}
              onChange={(e) => cambiar({ tallos: e.target.value.replace(/\D/g, '') })}
              slotProps={{ htmlInput: { inputMode: 'numeric' } }}
            />
          </Grid>
        </Grid>
        {intentado && hayFaltantes && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Completa los campos en rojo.
          </Alert>
        )}
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
          {editando && (
            <Button
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
          >
            {editando ? 'Guardar cambios' : 'Agregar'}
          </Button>
        </Stack>
      </Card>

      <Dialog open={borrando !== null} onClose={() => setBorrando(null)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Borrar esta carga?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {borrando ? `${borrando.producto} · ${nf.format(borrando.fulls ?? 0)} fulls · ${borrando.cantidadCajas} cajas` : ''}
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
