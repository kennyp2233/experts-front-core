'use client';

import { Button, Stack, TextField, Tooltip } from '@mui/material';
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
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5}>
        {ATAJOS_PERIODO.map((a) => {
          const r = a.rango(desde, hoy);
          const activo = r.desde === desde && r.hasta === hasta;
          return (
            <Tooltip key={a.clave} title={a.ayuda}>
              <Button size="small" variant={activo ? 'contained' : 'outlined'} onClick={() => onChange(r)} sx={{ whiteSpace: 'nowrap' }}>
                {a.label}
              </Button>
            </Tooltip>
          );
        })}
      </Stack>
    </Stack>
  );
}
