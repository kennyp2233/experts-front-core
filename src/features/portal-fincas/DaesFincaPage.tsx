'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DeleteOutline as QuitarIcon } from '@mui/icons-material';
import { useToast } from '@/shared/providers';
import { formatDate, getErrorMessage, toIsoDate } from '@/shared/utils';
import { formatearDae } from '@/features/operacion/components/coordinar/formulario';
import { portalService, useDaesFinca, usePerfilFinca } from './portal';

const PATRON_DAE = /^\d{3}-\d{4}-\d{2}-\d{8}$/;

/** El mes en curso: del 1 al último día (las DAE valen un mes calendario). */
const mesActual = () => {
  const d = new Date();
  return { desde: toIsoDate(new Date(d.getFullYear(), d.getMonth(), 1)), hasta: toIsoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0)) };
};

/**
 * Mis DAE (como el módulo de DAEs de la web vieja): las de sus fincas por país
 * de destino y período. Con ellas se propone la DAE al cargar en una guía.
 */
export function DaesFincaPage() {
  const toast = useToast();
  const { data: perfil } = usePerfilFinca();
  const { data: daes, error, isLoading, mutate } = useDaesFinca();
  const { data: paises } = useSWR('portal/paises', portalService.paises, { revalidateOnFocus: false });
  const [form, setForm] = useState(() => ({ idFinca: '' as number | '', pais: '', dae: '', ...mesActual() }));
  const [intentado, setIntentado] = useState(false);
  const [trabajando, setTrabajando] = useState(false);

  const idFinca = form.idFinca === '' && perfil?.fincas.length === 1 ? perfil.fincas[0].id : form.idFinca;
  const pais = form.pais || paises?.[0]?.codigo || '';
  const vigentes = useMemo(() => (daes ?? []).filter((d) => d.vigente), [daes]);
  const otras = useMemo(() => (daes ?? []).filter((d) => !d.vigente), [daes]);

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    if (idFinca === '' || !pais || !PATRON_DAE.test(form.dae) || !form.desde || !form.hasta) return;
    setTrabajando(true);
    try {
      await portalService.registrarDae({ idFinca, pais, desde: form.desde, hasta: form.hasta, dae: form.dae });
      toast.success('DAE registrada.');
      setForm((f) => ({ ...f, dae: '' }));
      setIntentado(false);
      mutate();
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo registrar.'));
    } finally {
      setTrabajando(false);
    }
  };

  const quitar = async (id: number) => {
    try {
      await portalService.quitarDae(id);
      toast.success('DAE quitada.');
      mutate();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const lista = (titulo: string, items: typeof vigentes) =>
    items.length > 0 && (
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {titulo}
        </Typography>
        <Stack spacing={1}>
          {items.map((d) => (
            <Paper key={d.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {d.dae}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[(perfil?.fincas.length ?? 0) > 1 ? d.finca : null, d.nombrePais, `${formatDate(d.desde)} al ${formatDate(d.hasta)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                </Box>
                {d.vigente && <Chip size="small" color="success" variant="outlined" label="Vigente" />}
                {d.editable && (
                  <Tooltip title="Quitar">
                    <IconButton onClick={() => quitar(d.id)} aria-label="Quitar">
                      <QuitarIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Box>
    );

  return (
    <>
      <Card variant="outlined" component="form" onSubmit={registrar} sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Registrar una DAE
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          La del mes para un país de destino. Al cargar en una guía se propone sola.
        </Typography>
        <Grid container spacing={2}>
          {(perfil?.fincas.length ?? 0) > 1 && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Finca"
                value={idFinca}
                error={intentado && idFinca === ''}
                onChange={(e) => setForm((f) => ({ ...f, idFinca: Number(e.target.value) }))}
              >
                {perfil!.fincas.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth label="País de destino" value={pais} onChange={(e) => setForm((f) => ({ ...f, pais: e.target.value }))}>
              {(paises ?? []).map((p) => (
                <MenuItem key={p.codigo} value={p.codigo}>
                  {p.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              type="date"
              fullWidth
              label="Desde"
              value={form.desde}
              onChange={(e) => setForm((f) => ({ ...f, desde: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              type="date"
              fullWidth
              label="Hasta"
              value={form.hasta}
              onChange={(e) => setForm((f) => ({ ...f, hasta: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="DAE"
              value={form.dae}
              placeholder="055-AAAA-40-XXXXXXXX"
              error={intentado && !PATRON_DAE.test(form.dae)}
              helperText={intentado && !PATRON_DAE.test(form.dae) ? 'Formato 055-AAAA-40-XXXXXXXX' : ' '}
              onChange={(e) => setForm((f) => ({ ...f, dae: formatearDae(e.target.value, f.dae) }))}
              slotProps={{ htmlInput: { inputMode: 'numeric', spellCheck: false } }}
            />
          </Grid>
        </Grid>
        <Stack direction="row" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={trabajando}
            startIcon={trabajando ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            Registrar
          </Button>
        </Stack>
      </Card>

      {error && <Alert severity="error">{getErrorMessage(error, 'No se pudieron cargar tus DAE.')}</Alert>}
      {isLoading && <Skeleton variant="rounded" height={120} />}
      {daes && daes.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No tienes DAE registradas de los últimos dos meses.
        </Typography>
      )}
      {lista('Vigentes', vigentes)}
      {lista('Anteriores', otras)}
    </>
  );
}
