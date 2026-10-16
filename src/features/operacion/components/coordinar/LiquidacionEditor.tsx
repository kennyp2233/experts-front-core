'use client';

import { Box, Button, Divider, Grid, InputAdornment, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { AutoFixHigh as SugerirIcon } from '@mui/icons-material';
import {
  CODIGOS_AGENCIA,
  CONCEPTOS_AEROLINEA,
  type ConceptoAerolineaCampo,
  type ParametrosCoordinacion,
  type ResumenLiquidacion,
  type ValoresLiquidacion,
} from '../../types/coordinacion';
import { usd } from '../../utils/formato';
import type { LiquidacionForm } from './formulario';

type Campo = keyof ValoresLiquidacion;

const NOMBRE_CONCEPTO: Record<ConceptoAerolineaCampo, string> = {
  guiaAerea: 'Guía aérea',
  combustible: 'Combustible',
  seguridad: 'Seguridad',
  otros: 'Otros',
  aux1: 'Aux 1',
  aux2: 'Aux 2',
  calAux: 'Cálculo aux.',
};

interface Props {
  valores: LiquidacionForm;
  onChange: (campo: Campo, valor: string) => void;
  parametros: ParametrosCoordinacion | undefined;
  resumen: ResumenLiquidacion | undefined;
  pesoBruto: number | undefined;
  /** Copia tarifa y conceptos de la aerolínea (ya calculados sobre el peso actual). */
  onSugerir?: () => void;
  liqAuto: boolean;
  cwAuto: boolean;
  /** Muestra el handling de Experts al cliente (no suma al total de la guía). */
  conHandlingCliente?: boolean;
}

function Campo({
  label,
  value,
  onChange,
  ayuda,
  sufijo,
  prefijo = '$',
  auto,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  ayuda?: string;
  sufijo?: string;
  prefijo?: string | null;
  auto?: boolean;
}) {
  return (
    <TextField
      size="small"
      fullWidth
      label={label}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      helperText={ayuda}
      slotProps={{
        htmlInput: { inputMode: 'decimal' },
        input: {
          startAdornment: prefijo ? <InputAdornment position="start">{prefijo}</InputAdornment> : undefined,
          endAdornment: sufijo ? <InputAdornment position="end">{sufijo}</InputAdornment> : undefined,
        },
      }}
      sx={{
        '& input': {
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          fontStyle: auto && value ? 'italic' : undefined,
          color: auto && value ? 'text.secondary' : undefined,
        },
      }}
    />
  );
}

function Linea({ label, valor, fuerte }: { label: string; valor: string; fuerte?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.25 }}>
      <Typography variant={fuerte ? 'subtitle1' : 'body2'} fontWeight={fuerte ? 700 : 400}>
        {label}
      </Typography>
      <Typography variant={fuerte ? 'subtitle1' : 'body2'} fontWeight={fuerte ? 700 : 500} sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {valor}
      </Typography>
    </Stack>
  );
}

/**
 * Liquidación de la guía: flete (peso cobrable × tarifa) + cargos de aerolínea
 * (due carrier) + IVA + cargos de agencia (due agent) = total. Mismas fórmulas
 * que el sistema viejo; el resumen viene calculado del servidor.
 */
export function LiquidacionEditor({
  valores: v,
  onChange,
  parametros,
  resumen,
  pesoBruto,
  onSugerir,
  liqAuto,
  cwAuto,
  conHandlingCliente = true,
}: Props) {
  // En Access hay conceptos sin rótulo guardados como "0".
  const abreviatura = (campo: string) => {
    const a = parametros?.aerolinea?.conceptos.find((c) => c.campo === campo)?.abreviatura?.trim();
    return a && a !== '0' ? a : null;
  };
  const ayudaConcepto = (campo: string) => {
    const c = parametros?.aerolinea?.conceptos.find((x) => x.campo === campo);
    if (!c || !c.valor) return undefined;
    return c.porPeso ? `${c.valor} por kg ${c.sobrePesoCobrable ? 'cobrable' : 'bruto'}` : `fijo ${c.valor}`;
  };
  // Se muestran los conceptos que la aerolínea usa o que ya tienen valor.
  const conceptos = CONCEPTOS_AEROLINEA.filter(
    (k) => ['guiaAerea', 'combustible', 'otros'].includes(k) || abreviatura(k) || (v[k] ?? '') !== '',
  );

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} spacing={1}>
        <Typography variant="subtitle1" fontWeight={600}>
          Liquidación
        </Typography>
        {onSugerir && (
          <Tooltip title="Tarifa y conceptos con los valores actuales de la aerolínea (datos maestros)">
            <Button size="small" startIcon={<SugerirIcon />} onClick={onSugerir}>
              Valores de la aerolínea
            </Button>
          </Tooltip>
        )}
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="overline" color="text.secondary" component="div" sx={{ mb: 1, lineHeight: 1.5 }}>
            Flete
          </Typography>
          <Grid container spacing={1.5} sx={{ mb: 1 }}>
            <Grid size={{ xs: 6 }}>
              <Campo
                label="Peso cobrable"
                prefijo={null}
                sufijo="kg"
                value={v.pesoCobrable}
                auto={cwAuto}
                onChange={(x) => onChange('pesoCobrable', x)}
                ayuda={pesoBruto !== undefined ? `Mínimo: peso bruto ${pesoBruto} kg` : undefined}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Campo
                label="Tarifa por kg"
                value={v.tarifa}
                auto={liqAuto}
                onChange={(x) => onChange('tarifa', x)}
              />
            </Grid>
          </Grid>

          <Typography variant="overline" color="text.secondary" component="div" sx={{ mb: 1, lineHeight: 1.5 }}>
            Cargos de aerolínea (due carrier)
          </Typography>
          <Grid container spacing={1.5} sx={{ mb: 1 }}>
            {conceptos.map((k) => (
              <Grid key={k} size={{ xs: 6, sm: 4 }}>
                <Campo
                  label={abreviatura(k) ? `${NOMBRE_CONCEPTO[k]} (${abreviatura(k)})` : NOMBRE_CONCEPTO[k]}
                  value={v[k]}
                  auto={liqAuto}
                  ayuda={ayudaConcepto(k)}
                  onChange={(x) => onChange(k, x)}
                />
              </Grid>
            ))}
            <Grid size={{ xs: 6, sm: 4 }}>
              <Campo label="IVA" value={v.iva} onChange={(x) => onChange('iva', x)} />
            </Grid>
          </Grid>

          <Typography variant="overline" color="text.secondary" component="div" sx={{ mb: 1, lineHeight: 1.5 }}>
            Cargos de agencia (due agent)
          </Typography>
          <Grid container spacing={1.5}>
            {CODIGOS_AGENCIA.map((k) => (
              <Grid key={k} size={{ xs: 6, sm: 4 }}>
                <Campo
                  label={parametros?.etiquetasAgencia[k] ?? k}
                  value={v[k]}
                  onChange={(x) => onChange(k, x)}
                />
              </Grid>
            ))}
          </Grid>

          {conHandlingCliente && (
            <>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <Campo
                    label="Handling al cliente"
                    value={v.aux3Handling}
                    onChange={(x) => onChange('aux3Handling', x)}
                    ayuda="Se cobra aparte: no suma a la guía"
                  />
                </Grid>
              </Grid>
            </>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'action.hover', position: { md: 'sticky' }, top: { md: 80 } }}>
            <Linea
              label={`Flete${resumen?.pesoCobrable && resumen.tarifa !== null ? ` (${resumen.pesoCobrable} × ${resumen.tarifa})` : ''}`}
              valor={usd(resumen?.flete)}
            />
            <Linea label="+ Cargos aerolínea" valor={usd(resumen?.dueCarrier)} />
            {resumen?.iva ? <Linea label="+ IVA" valor={usd(resumen.iva)} /> : null}
            <Linea label="+ Cargos agencia" valor={usd(resumen?.dueAgent)} />
            <Divider sx={{ my: 1 }} />
            <Linea label="Total guía" valor={usd(resumen?.total)} fuerte />
            {resumen?.flete === null && (
              <Typography variant="caption" color="text.secondary">
                Falta el peso cobrable o la tarifa.
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
