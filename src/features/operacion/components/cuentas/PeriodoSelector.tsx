'use client';

import { Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { ATAJOS_PERIODO, hoyIso, type Periodo } from '../../utils/cuentas';

interface Props {
  desde: string;
  hasta: string;
  onChange: (p: Periodo) => void;
}

/**
 * Período del cobro: dos fechas (por fecha de vuelo) y los atajos de siempre.
 * Las quincenas son las del mes que se está viendo; "Mes actual" y "Mes
 * anterior" parten de hoy.
 */
export function PeriodoSelector({ desde, hasta, onChange }: Props) {
  const hoy = hoyIso();
  const rangos = ATAJOS_PERIODO.map((a) => ({ ...a, r: a.rango(desde, hoy) }));
  const activo = rangos.find((a) => a.r.desde === desde && a.r.hasta === hasta)?.clave ?? null;
  return (
    <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} alignItems="center">
      <TextField
        type="date"
        size="small"
        label="Vuelos desde"
        value={desde}
        onChange={(e) => e.target.value && onChange({ desde: e.target.value, hasta: hasta < e.target.value ? e.target.value : hasta })}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ width: 160 }}
      />
      <TextField
        type="date"
        size="small"
        label="Hasta"
        value={hasta}
        onChange={(e) => e.target.value && onChange({ desde: desde > e.target.value ? e.target.value : desde, hasta: e.target.value })}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ width: 160 }}
      />
      <ToggleButtonGroup
        exclusive
        value={activo}
        onChange={(_, clave: string | null) => {
          const a = rangos.find((x) => x.clave === clave);
          if (a) onChange(a.r);
        }}
        aria-label="Atajos de período"
      >
        {rangos.map((a) => (
          <Tooltip key={a.clave} title={a.ayuda}>
            <ToggleButton value={a.clave}>{a.label}</ToggleButton>
          </Tooltip>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}
