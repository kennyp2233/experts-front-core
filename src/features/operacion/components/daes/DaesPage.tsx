'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add as AddIcon, DeleteOutline as QuitarIcon, Search as SearchIcon } from '@mui/icons-material';
import { AppPage, DataTable, type DataTableColumn } from '@/shared/components/ui';
import { useToast } from '@/shared/providers';
import { formatDate, getErrorMessage } from '@/shared/utils';
import { useDaes } from '../../hooks/useCuentas';
import { cuentasService } from '../../services/cuentas.service';
import type { DaeRegistro } from '../../types/cuentas';
import { hoyIso, mesDe } from '../../utils/cuentas';
import { OpcionAutocomplete } from '../coordinar/OpcionAutocomplete';

const nums = { fontVariantNumeric: 'tabular-nums' } as const;
/** Lo máximo que devuelve el back por consulta. */
const TOPE = 300;
const FORMATO_DAE = /^055-\d{4}-40-\d{8}$/;

/**
 * Máscara de la DAE "055-AAAA-40-XXXXXXXX": el 055 y el 40 son fijos; se
 * escriben el año y los 8 dígitos. Acepta pegar la DAE completa, con o sin
 * guiones al principio.
 */
export function mascaraDae(raw: string): string {
  const limpio = raw.trim();
  const conPrefijo = limpio.startsWith('055') ? limpio : `055-${limpio}`;
  const partes = conPrefijo.split('-');
  let anio: string;
  let serie: string;
  if (partes.length >= 4) {
    // Ya tiene la forma completa: [055, año, 40, serie]. Lo que sobre del año pasa a la serie.
    const a = partes[1].replace(/\D/g, '');
    anio = a.slice(0, 4);
    serie = (a.slice(4) + partes.slice(3).join('')).replace(/\D/g, '');
  } else {
    const todo = partes.slice(1).join('').replace(/\D/g, '');
    anio = todo.slice(0, 4);
    serie = todo.slice(4);
  }
  serie = serie.slice(0, 8);
  return serie ? `055-${anio}-40-${serie}` : anio ? `055-${anio}` : '055-';
}

function RegistrarDaeDialog({ onClose, onGuardada }: { onClose: () => void; onGuardada: () => void }) {
  const toast = useToast();
  const [idFinca, setIdFinca] = useState<number | null>(null);
  const [pais, setPais] = useState<{ id: number; sigla: string } | null>(null);
  const hoy = hoyIso();
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(mesDe(hoy).hasta);
  const [dae, setDae] = useState('055-');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daeValida = FORMATO_DAE.test(dae);
  const fechasOk = !!desde && !!hasta && hasta >= desde;
  const completo = !!idFinca && !!pais && fechasOk && daeValida;

  const guardar = async () => {
    if (!completo) return;
    setGuardando(true);
    setError(null);
    try {
      await cuentasService.crearDae({ idFinca, pais: pais.sigla, desde, hasta, dae });
      toast.success(`DAE ${dae} registrada.`);
      onGuardada();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudo registrar la DAE.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onClose={guardando ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Registrar DAE</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            La DAE vale para una finca y un país de destino entre dos fechas. Al coordinar se propone la que esté vigente el día del vuelo.
          </Typography>
          <OpcionAutocomplete tipo="fincas" label="Finca" value={idFinca} onChange={(id) => setIdFinca(id)} required />
          <OpcionAutocomplete
            tipo="paises"
            label="País de destino"
            value={pais?.id ?? null}
            onChange={(id, o) => setPais(id && o?.codigo ? { id, sigla: o.codigo } : null)}
            conCodigo
            required
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              type="date"
              label="Vigente desde"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              required
            />
            <TextField
              type="date"
              label="Hasta"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              error={!!desde && !!hasta && hasta < desde}
              helperText={!!desde && !!hasta && hasta < desde ? 'Es anterior a "desde".' : undefined}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              required
            />
          </Stack>
          <TextField
            label="Número de DAE"
            value={dae}
            onChange={(e) => setDae(mascaraDae(e.target.value))}
            placeholder="055-AAAA-40-XXXXXXXX"
            required
            error={dae.length > 4 && !daeValida && dae.length >= 20}
            helperText={
              dae.length >= 20 && !daeValida
                ? 'Formato 055-AAAA-40-XXXXXXXX (año y 8 dígitos).'
                : 'Escribe el año y los 8 dígitos; el 055 y el 40 se ponen solos.'
            }
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 20, style: { fontVariantNumeric: 'tabular-nums' } } }}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={guardando}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={guardar}
          disabled={!completo || guardando}
          startIcon={guardando ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Registrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * DAE desde la oficina (el "Actualizar FUE" del sistema viejo): las fincas
 * registran las suyas en su portal; aquí se consultan todas y se registra la que
 * falta. Las que vienen del sistema viejo se ven pero no se desactivan mientras
 * ese sistema mande.
 */
export function DaesPage() {
  const toast = useToast();
  const [idFinca, setIdFinca] = useState<number | null>(null);
  const [texto, setTexto] = useState('');
  const [q, setQ] = useState('');
  const [soloVigentes, setSoloVigentes] = useState(true);
  const [nueva, setNueva] = useState(false);
  const [aQuitar, setAQuitar] = useState<DaeRegistro | null>(null);
  const [quitando, setQuitando] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQ(texto.trim()), 350);
    return () => clearTimeout(t);
  }, [texto]);

  const filtros = useMemo(
    () => ({ idFinca: idFinca ?? undefined, q: q || undefined, vigentes: soloVigentes }),
    [idFinca, q, soloVigentes],
  );
  const { daes, error, isLoading, isValidating, mutate } = useDaes(filtros);
  const filas = daes ?? [];

  const quitar = async () => {
    if (!aQuitar) return;
    setQuitando(true);
    try {
      await cuentasService.quitarDae(aQuitar.id);
      toast.success(`DAE ${aQuitar.dae} desactivada.`);
      setAQuitar(null);
      mutate();
    } catch (e) {
      toast.error(getErrorMessage(e, 'No se pudo desactivar la DAE.'));
      setAQuitar(null);
    } finally {
      setQuitando(false);
    }
  };

  const columnas: DataTableColumn<DaeRegistro>[] = [
    { key: 'finca', label: 'Finca', pinned: true, mobile: 'title', value: (d) => d.finca, maxWidth: 240 },
    { key: 'pais', label: 'País', value: (d) => d.nombrePais ?? d.pais, render: (d) => `${d.nombrePais ?? d.pais} (${d.pais})`, maxWidth: 200 },
    { key: 'desde', label: 'Desde', value: (d) => formatDate(d.desde) },
    { key: 'hasta', label: 'Hasta', value: (d) => formatDate(d.hasta), mobile: 'subtitle' },
    {
      key: 'dae',
      label: 'DAE',
      value: (d) => d.dae,
      render: (d) => (
        <Typography variant="body2" fontWeight={600} sx={{ ...nums, whiteSpace: 'nowrap' }}>
          {d.dae}
        </Typography>
      ),
    },
    {
      key: 'vigente',
      label: 'Estado',
      value: (d) => (d.vigente ? 'Vigente' : d.hasta < hoyIso() ? 'Vencida' : 'Futura'),
      render: (d) => (
        <Chip
          size="small"
          variant={d.vigente ? 'filled' : 'outlined'}
          color={d.vigente ? 'success' : 'default'}
          label={d.vigente ? 'Vigente' : d.hasta < hoyIso() ? 'Vencida' : 'Futura'}
        />
      ),
    },
    { key: 'por', label: 'Registrada por', value: (d) => d.registradoPor, maxWidth: 160 },
    {
      key: 'origen',
      label: 'Origen',
      description: 'Del sistema viejo: llega por la sincronización y se cambia allá hasta el corte definitivo',
      value: (d) => (d.origenRegistro === 'SISTEMA_VIEJO' ? 'Sistema viejo' : 'Creada aquí'),
      render: (d) =>
        d.origenRegistro === 'SISTEMA_VIEJO' ? (
          <Tooltip title={d.editable ? 'Viene del sistema viejo' : 'Viene del sistema viejo: mientras ese sistema mande, se cambia allá'}>
            <Chip size="small" variant="outlined" label="Sistema viejo" />
          </Tooltip>
        ) : (
          <Chip size="small" variant="outlined" color="primary" label="Creada aquí" />
        ),
    },
  ];

  return (
    <AppPage
      title="DAEs"
      subtitle="Registro de DAE por finca y país de destino. Al coordinar se propone la que esté vigente el día del vuelo."
      actions={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNueva(true)}>
          Registrar DAE
        </Button>
      }
    >
      <DataTable
        id="operacion-daes"
        columns={columnas}
        rows={filas}
        getRowId={(d) => String(d.id)}
        loading={isLoading || isValidating}
        error={error}
        onRetry={() => mutate()}
        onRefresh={() => mutate()}
        dense
        emptyMessage={
          soloVigentes ? 'No hay DAE vigentes con esos filtros. Quita "Solo vigentes" para ver las vencidas.' : 'No hay DAE con esos filtros.'
        }
        actions={[
          {
            label: 'Desactivar',
            icon: <QuitarIcon fontSize="small" />,
            color: 'error',
            hidden: (d) => !d.editable,
            onClick: (d) => setAQuitar(d),
          },
        ]}
        filters={
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
            <Box sx={{ width: 280 }}>
              <OpcionAutocomplete tipo="fincas" label="Finca" value={idFinca} onChange={(id) => setIdFinca(id)} />
            </Box>
            <TextField
              size="small"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Número de DAE"
              sx={{ width: 220 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Tooltip title='Sin esto salen también las que vencieron hace menos de dos meses'>
              <FormControlLabel
                control={<Switch size="small" checked={soloVigentes} onChange={(e) => setSoloVigentes(e.target.checked)} />}
                label="Solo vigentes"
                slotProps={{ typography: { variant: 'body2' } }}
              />
            </Tooltip>
          </Stack>
        }
      />
      {filas.length >= TOPE && (
        <Alert severity="info" sx={{ mt: 1.5 }}>
          Se muestran las {TOPE} más recientes. Filtra por finca o por número de DAE para ver las demás.
        </Alert>
      )}
      {nueva && <RegistrarDaeDialog onClose={() => setNueva(false)} onGuardada={() => mutate()} />}
      <Dialog open={!!aQuitar} onClose={quitando ? undefined : () => setAQuitar(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Desactivar DAE</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Desactivar la DAE <b>{aQuitar?.dae}</b> de {aQuitar?.finca} ({aQuitar?.nombrePais ?? aQuitar?.pais})? Deja de proponerse al coordinar.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAQuitar(null)} disabled={quitando}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={quitar} disabled={quitando}>
            Desactivar
          </Button>
        </DialogActions>
      </Dialog>
    </AppPage>
  );
}
