'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import {
  useEditForm,
  useUpdateSubmit,
} from '../hooks/useCoordinar';
import { ebfCoordinarService } from '../services/ebf-coordinar.service';
import type { ProductoOption, SelectOption } from '../types/coordinar';
import type { UpdateCoordinacionDto } from '../types/coordinar-update';

interface Props {
  detalleId: number | null;
  open: boolean;
  onClose: () => void;
  /** Llamado tras un update exitoso (302) para refrescar listas. */
  onUpdated?: () => void;
}

interface Numeric {
  fbCoo: number;
  hbCoo: number;
  qbCoo: number;
  ebCoo: number;
}

export function EditCoordinacionDialog({
  detalleId,
  open,
  onClose,
  onUpdated,
}: Props) {
  const { spec, isLoading, error: loadError } = useEditForm(
    open ? detalleId : null,
  );
  const { submit, submitting, result, error: submitError, reset } =
    useUpdateSubmit();

  const [productoId, setProductoId] = useState<number | null>(null);
  const [compoundProductos, setCompoundProductos] = useState<SelectOption[]>([]);
  const [numeric, setNumeric] = useState<Numeric>({
    fbCoo: 0,
    hbCoo: 0,
    qbCoo: 0,
    ebCoo: 0,
  });
  const [bxs, setBxs] = useState<number | null>(null);
  const [pcs, setPcs] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);

  const producto: ProductoOption | null = useMemo(() => {
    if (!spec || productoId == null) return null;
    return spec.productos.find((p) => p.value === String(productoId)) ?? null;
  }, [spec, productoId]);

  // Inicializar form cuando se carga el spec
  useEffect(() => {
    if (!spec) return;
    setProductoId(spec.currentProductoId);
    setCompoundProductos([]);
    setNumeric({
      fbCoo: spec.currentValues.fbCoo,
      hbCoo: spec.currentValues.hbCoo,
      qbCoo: spec.currentValues.qbCoo,
      ebCoo: spec.currentValues.ebCoo,
    });
    setBxs(spec.currentValues.bxsCoo);
    setPcs(spec.currentValues.pcsCoo);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]);

  // Recalcular bxs/pcs con debounce cuando cambian inputs
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

  // Al cerrar tras éxito: notificar al padre
  useEffect(() => {
    if (result?.ok && onUpdated) onUpdated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.ok]);

  const canSubmit =
    !!spec &&
    !!producto &&
    !producto.errorMessage &&
    detalleId != null &&
    !submitting &&
    (!producto.isCompoundProduct || compoundProductos.length >= 2);

  const onSubmit = async () => {
    if (!canSubmit || !producto || !detalleId) return;
    const dto: UpdateCoordinacionDto = {
      productoId: spec?.productoLocked ? undefined : productoId!,
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
    await submit(detalleId, dto);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="edit-coord-title"
    >
      <DialogTitle id="edit-coord-title" sx={{ pr: 6 }}>
        Editar coordinación
        {spec?.context.awb && (
          <Typography variant="body2" color="text.secondary">
            AWB {spec.context.awb}
            {spec.context.hawb && ` · HAWB ${spec.context.hawb}`}
            {detalleId && ` · id ${detalleId}`}
          </Typography>
        )}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loadError && (
          <Alert severity="error">
            No se pudo cargar el form de edición: {(loadError as Error).message}
          </Alert>
        )}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {spec && (
          <Stack spacing={2}>
            {/* Contexto read-only */}
            <Grid container spacing={1.5}>
              <ContextField label="Exportador" value={spec.context.exportador} />
              <ContextField label="Marcación" value={spec.context.marcacion} />
              <ContextField label="Cliente" value={spec.context.cliente} />
              <ContextField label="Despacho" value={spec.context.despacho} />
              <ContextField label="DAE" value={spec.context.dae} />
              <ContextField label="HAWB EBF" value={spec.context.hawb} />
            </Grid>

            {/* Producto */}
            {spec.productoLocked ? (
              <Alert severity="warning">
                No se puede editar el producto — ya existen transacciones de
                bodega para esta coordinación.
              </Alert>
            ) : null}
            <Autocomplete
              size="small"
              options={spec.productos}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
              value={producto}
              onChange={(_, v) =>
                setProductoId(v ? parseInt(v.value, 10) : null)
              }
              disabled={spec.productoLocked}
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
                    label={`Variedades del compuesto (mín ${spec.compoundFormset.minNumForms})`}
                    required
                  />
                )}
              />
            )}

            {/* Inputs numéricos */}
            <Grid container spacing={2}>
              <NumField
                label="FB"
                value={numeric.fbCoo}
                disabled={!producto?.isFullBxs}
                onChange={(v) => setNumeric({ ...numeric, fbCoo: v })}
              />
              <NumField
                label="HB"
                value={numeric.hbCoo}
                onChange={(v) => setNumeric({ ...numeric, hbCoo: v })}
              />
              <NumField
                label="QB"
                value={numeric.qbCoo}
                onChange={(v) => setNumeric({ ...numeric, qbCoo: v })}
              />
              <NumField
                label="EB"
                value={numeric.ebCoo}
                onChange={(v) => setNumeric({ ...numeric, ebCoo: v })}
              />
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  size="small"
                  label={`BXS${calculating ? ' (calc…)' : ''}`}
                  value={bxs ?? '—'}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  size="small"
                  label="PCS"
                  value={pcs ?? '—'}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>

            {/* Resultado */}
            {result && (
              <Alert severity={result.ok ? 'success' : 'error'}>
                <AlertTitle>
                  {result.ok
                    ? `Guardado (status ${result.status})`
                    : `Falló (status ${result.status})`}
                </AlertTitle>
                {result.errors && result.errors.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {result.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </Alert>
            )}
            {submitError && (
              <Alert severity="error">{submitError.message}</Alert>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={!canSubmit}
          startIcon={submitting ? <CircularProgress size={14} /> : undefined}
        >
          {submitting ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ContextField({
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

function NumField({
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
