'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Send as SendIcon, Calculate as CalcIcon } from '@mui/icons-material';
import {
  useCreateForm,
  useCoordinarSubmit,
  useCoordinarDaes,
  useExportadores,
  useMarcaciones,
  useVueloCard,
  useVuelos,
} from '../hooks/useCoordinar';
import type {
  CreateCoordinacionDto,
  ProductoOption,
  SelectOption,
} from '../types/coordinar';
import { ebfCoordinarService } from '../services/ebf-coordinar.service';

interface Numeric {
  fbCoo: number;
  hbCoo: number;
  qbCoo: number;
  ebCoo: number;
}

const ZERO_NUM: Numeric = { fbCoo: 0, hbCoo: 0, qbCoo: 0, ebCoo: 0 };

function toSelectId(opt: SelectOption | null): number | null {
  if (!opt) return null;
  const n = parseInt(opt.value, 10);
  return Number.isFinite(n) ? n : null;
}

export function NuevaCoordinacionForm() {
  // === Cascade state ===
  const [exportador, setExportador] = useState<SelectOption | null>(null);
  const [marcacion, setMarcacion] = useState<SelectOption | null>(null);
  const [vuelo, setVuelo] = useState<SelectOption | null>(null);
  const [dae, setDae] = useState<SelectOption | null>(null);

  const { exportadores, isLoading: loadingExp } = useExportadores();
  const expId = toSelectId(exportador);
  const { marcaciones, isLoading: loadingMarc } = useMarcaciones(expId);
  const marcId = toSelectId(marcacion);
  const { vuelos, isLoading: loadingVue } = useVuelos(expId, marcId);
  const vueloId = toSelectId(vuelo);
  const { daes, isLoading: loadingDae } = useCoordinarDaes(expId, marcId, vueloId);
  const daeId = toSelectId(dae);

  // Reset downstream cuando cambia un upstream
  useEffect(() => { setMarcacion(null); setVuelo(null); setDae(null); }, [expId]);
  useEffect(() => { setVuelo(null); setDae(null); }, [marcId]);
  useEffect(() => { setDae(null); }, [vueloId]);

  const { card } = useVueloCard({
    exportador: expId,
    marcacion: marcId,
    vuelo: vueloId,
    dae: daeId,
  });
  const { spec, isLoading: loadingSpec, error: specError } = useCreateForm({
    exportador: expId,
    marcacion: marcId,
    vuelo: vueloId,
    dae: daeId,
  });

  // === Form state (visible cuando spec está) ===
  const [productoId, setProductoId] = useState<number | null>(null);
  const [compoundProductos, setCompoundProductos] = useState<SelectOption[]>([]);
  const [numeric, setNumeric] = useState<Numeric>(ZERO_NUM);
  const [bxs, setBxs] = useState<number | null>(null);
  const [pcs, setPcs] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);

  const producto: ProductoOption | null = useMemo(() => {
    if (!spec || productoId == null) return null;
    return spec.productos.find((p) => p.value === String(productoId)) ?? null;
  }, [spec, productoId]);

  // Reset producto + numeric cuando cambia el spec (otra DAE/vuelo)
  useEffect(() => {
    if (!spec) {
      setProductoId(null);
      setCompoundProductos([]);
      setNumeric(ZERO_NUM);
      setBxs(null); setPcs(null);
      return;
    }
    setProductoId(null);
    setCompoundProductos([]);
    setNumeric({
      fbCoo: spec.initialNumericValues.fbCoo,
      hbCoo: spec.initialNumericValues.hbCoo,
      qbCoo: spec.initialNumericValues.qbCoo,
      ebCoo: spec.initialNumericValues.ebCoo,
    });
    setBxs(spec.initialNumericValues.bxsCoo || null);
    setPcs(spec.initialNumericValues.pcsCoo || null);
  }, [spec]);

  // Recalcular BXS/PCS con debounce cuando cambian los inputs numéricos
  useEffect(() => {
    if (!spec) return;
    const sum = numeric.fbCoo + numeric.hbCoo + numeric.qbCoo + numeric.ebCoo;
    if (sum === 0) {
      setBxs(0); setPcs(0);
      return;
    }
    setCalculating(true);
    const t = setTimeout(async () => {
      try {
        const r = await ebfCoordinarService.calcBoxWeight({
          fb_coo: producto?.isFullBxs ? numeric.fbCoo : 0,
          hb_coo: numeric.hbCoo,
          qb_coo: numeric.qbCoo,
          eb_coo: numeric.ebCoo,
        });
        setBxs(r.bxs_coo);
        setPcs(r.pcs_coo);
      } finally {
        setCalculating(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [numeric, producto, spec]);

  // === Submit ===
  const { submit, submitting, result, error: submitError, reset } =
    useCoordinarSubmit();

  const canSubmit =
    !!spec &&
    !!producto &&
    !producto.errorMessage &&
    expId != null &&
    marcId != null &&
    vueloId != null &&
    daeId != null &&
    productoId != null &&
    (!producto.isCompoundProduct || compoundProductos.length >= 2) &&
    !submitting;

  const onSubmit = async () => {
    if (!canSubmit || !producto) return;
    const dto: CreateCoordinacionDto = {
      exportadorId: expId!,
      consignatarioMarcacionId: marcId!,
      docCoordinacionId: vueloId!,
      daeId: daeId!,
      productoId: productoId!,
      hbCoo: numeric.hbCoo,
      qbCoo: numeric.qbCoo,
      ebCoo: numeric.ebCoo,
      ...(producto.isFullBxs ? { fbCoo: numeric.fbCoo } : {}),
      ...(producto.isCompoundProduct
        ? {
            compoundProductos: compoundProductos
              .map((o) => parseInt(o.value, 10))
              .filter((n) => Number.isFinite(n)),
          }
        : {}),
    };
    await submit(dto);
  };

  return (
    <Stack spacing={3}>
      {/* === Cascade === */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            1. Selección
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                size="small"
                options={exportadores}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                value={exportador}
                onChange={(_, v) => setExportador(v)}
                loading={loadingExp}
                renderInput={(p) => (
                  <TextField {...p} label="Exportador" required />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                size="small"
                options={marcaciones}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                value={marcacion}
                onChange={(_, v) => setMarcacion(v)}
                loading={loadingMarc}
                disabled={!expId}
                renderInput={(p) => (
                  <TextField {...p} label="Marcación / consignatario" required />
                )}
                noOptionsText={
                  expId ? 'Sin marcaciones para este exportador' : 'Elegí un exportador primero'
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                size="small"
                options={vuelos}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                value={vuelo}
                onChange={(_, v) => setVuelo(v)}
                loading={loadingVue}
                disabled={!marcId}
                renderInput={(p) => (
                  <TextField {...p} label="Vuelo" required />
                )}
                noOptionsText={
                  marcId ? 'Sin vuelos disponibles' : 'Elegí marcación primero'
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                size="small"
                options={daes}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                value={dae}
                onChange={(_, v) => setDae(v)}
                loading={loadingDae}
                disabled={!vueloId}
                renderInput={(p) => (
                  <TextField {...p} label="DAE" required />
                )}
                noOptionsText={
                  vueloId ? 'Sin DAEs disponibles' : 'Elegí vuelo primero'
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* === Vuelo card === */}
      {card && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Detalle del vuelo
            </Typography>
            <Grid container spacing={2}>
              <CardField label="Exportador" value={card.exportador} />
              <CardField label="Cliente" value={card.cliente} />
              <CardField label="Fecha vuelo" value={card.fechaVuelo} />
              <CardField label="Ruta" value={card.ruta} />
              <CardField label="Aerolínea" value={card.aerolinea} />
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* === Form modal === */}
      {specError && (
        <Alert severity="error">
          No se pudo cargar el form de coordinación: {(specError as Error).message}
        </Alert>
      )}
      {loadingSpec && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      {spec && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              2. Crear Detalle De Coordinación
            </Typography>

            <Stack spacing={2}>
              <Autocomplete
                size="small"
                options={spec.productos}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                value={producto}
                onChange={(_, v) =>
                  setProductoId(v ? parseInt(v.value, 10) : null)
                }
                renderInput={(p) => (
                  <TextField {...p} label="Producto" required />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.value}>
                    <span>{option.label}</span>
                    {option.isFullBxs && (
                      <Chip
                        size="small"
                        label="full-bxs"
                        sx={{ ml: 1 }}
                        color="info"
                        variant="outlined"
                      />
                    )}
                    {option.isCompoundProduct && (
                      <Chip
                        size="small"
                        label="compuesto"
                        sx={{ ml: 1 }}
                        color="warning"
                        variant="outlined"
                      />
                    )}
                    {option.errorMessage && (
                      <Chip
                        size="small"
                        label="bloqueado"
                        sx={{ ml: 1 }}
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </li>
                )}
              />

              {producto?.errorMessage && (
                <Alert severity="error">{producto.errorMessage}</Alert>
              )}

              {producto?.isCompoundProduct && (
                <Autocomplete
                  multiple
                  size="small"
                  options={spec.compoundFormset.productoOptions}
                  getOptionLabel={(o) => o.label}
                  isOptionEqualToValue={(a, b) => a.value === b.value}
                  value={compoundProductos}
                  onChange={(_, v) => setCompoundProductos(v)}
                  renderInput={(p) => (
                    <TextField
                      {...p}
                      label={`Variedades del compuesto (mínimo ${spec.compoundFormset.minNumForms})`}
                      required
                      helperText={
                        compoundProductos.length <
                        spec.compoundFormset.minNumForms
                          ? `Faltan ${spec.compoundFormset.minNumForms - compoundProductos.length}`
                          : ' '
                      }
                    />
                  )}
                />
              )}

              <Grid container spacing={2}>
                <NumericField
                  label="FB (1/1)"
                  value={numeric.fbCoo}
                  disabled={!producto?.isFullBxs}
                  onChange={(v) => setNumeric({ ...numeric, fbCoo: v })}
                />
                <NumericField
                  label="HB (1/2)"
                  value={numeric.hbCoo}
                  onChange={(v) => setNumeric({ ...numeric, hbCoo: v })}
                />
                <NumericField
                  label="QB (1/4)"
                  value={numeric.qbCoo}
                  onChange={(v) => setNumeric({ ...numeric, qbCoo: v })}
                />
                <NumericField
                  label="EB (1/8)"
                  value={numeric.ebCoo}
                  onChange={(v) => setNumeric({ ...numeric, ebCoo: v })}
                />
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField
                    size="small"
                    label="BXS (calculado)"
                    value={bxs ?? '—'}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                      endAdornment: calculating ? (
                        <InputAdornment position="end">
                          <CircularProgress size={14} />
                        </InputAdornment>
                      ) : (
                        <InputAdornment position="end">
                          <CalcIcon fontSize="small" color="disabled" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField
                    size="small"
                    label="PCS (calculado)"
                    value={pcs ?? '—'}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* === Submit + result === */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        {result && (
          <Button size="small" onClick={reset}>
            Limpiar
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={submitting ? <CircularProgress size={16} /> : <SendIcon />}
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {submitting ? 'Enviando…' : 'Crear coordinación'}
        </Button>
      </Stack>

      {result && (
        <Alert severity={result.ok ? 'success' : 'error'}>
          <AlertTitle>
            {result.ok
              ? `Coordinación creada (status ${result.status})`
              : `Falló (status ${result.status})`}
          </AlertTitle>
          {result.redirectTo && (
            <Typography variant="caption" component="div">
              Redirect: <code>{result.redirectTo}</code>
            </Typography>
          )}
          {result.errors && result.errors.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Errores reportados por el portal:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {result.errors.map((e, i) => (
                  <li key={i}>
                    <Typography variant="body2">{e}</Typography>
                  </li>
                ))}
              </ul>
            </Box>
          )}
        </Alert>
      )}
      {submitError && (
        <Alert severity="error">
          <AlertTitle>Error de red / back</AlertTitle>
          {submitError.message}
        </Alert>
      )}
    </Stack>
  );
}

function CardField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <Grid size={{ xs: 12, md: 4 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value ?? '—'}
      </Typography>
    </Grid>
  );
}

function NumericField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <Grid size={{ xs: 6, md: 3 }}>
      <TextField
        type="number"
        size="small"
        label={label}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isFinite(n) ? Math.max(0, n) : 0);
        }}
        fullWidth
        disabled={disabled}
        inputProps={{ min: 0 }}
      />
    </Grid>
  );
}
