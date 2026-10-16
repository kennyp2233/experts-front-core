'use client';

import { Grid, Paper, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import type { Opcion } from '../../types/coordinacion';
import type { CabeceraForm } from './formulario';
import { OpcionAutocomplete } from './OpcionAutocomplete';

interface Props {
  valor: CabeceraForm;
  onChange: (cambios: Partial<CabeceraForm>) => void;
  /** Al elegir la marca se proponen destino, agencia, etc. */
  onConsignatario: (id: number | null) => void;
  /** Al editar no se cambia de guía libremente si ya tiene guías hijas numeradas. */
  bloquearGuia?: boolean;
}

/** Guía, vuelo y partes de la coordinación. */
export function CabeceraCoordinacion({ valor: c, onChange, onConsignatario, bloquearGuia }: Props) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
        Guía y vuelo
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <OpcionAutocomplete
            tipo="guias"
            label="Guía (AWB)"
            required
            value={c.idGuiaMadre}
            disabled={bloquearGuia}
            placeholder="Número o parte del número"
            helperText="Solo guías disponibles del stock"
            onChange={(id, o: Opcion | null) =>
              onChange({ idGuiaMadre: id, idAerolinea: (o?.extra?.idAerolinea as number | null | undefined) ?? null })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            type="date"
            size="small"
            fullWidth
            required
            label="Fecha de vuelo"
            value={c.fechaVuelo}
            onChange={(e) => onChange({ fechaVuelo: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            fullWidth
            value={c.pago}
            onChange={(_, v) => v && onChange({ pago: v })}
            aria-label="Forma de pago"
          >
            <ToggleButton value="PREPAID">Prepaid</ToggleButton>
            <ToggleButton value="COLLECT">Collect</ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <OpcionAutocomplete
            tipo="consignatarios"
            label="Consignatario (marca)"
            required
            value={c.idConsignatario}
            onChange={(id) => {
              onChange({ idConsignatario: id });
              onConsignatario(id);
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <OpcionAutocomplete
            tipo="agencias"
            label="Agencia IATA"
            required
            value={c.idAgenciaIata}
            onChange={(id) => onChange({ idAgenciaIata: id })}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <OpcionAutocomplete
            tipo="destinos"
            label="Destino de la guía"
            required
            conCodigo
            value={c.idDestinoAwb}
            helperText="Aeropuerto que va en la AWB"
            onChange={(id) => onChange({ idDestinoAwb: id })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <OpcionAutocomplete
            tipo="destinos"
            label="Destino final"
            conCodigo
            value={c.idDestinoFinalDocs}
            helperText="Para los documentos, si es otro"
            onChange={(id) => onChange({ idDestinoFinalDocs: id })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <OpcionAutocomplete
            tipo="tipos-embarque"
            label="Tipo de embarque"
            value={c.idTipoEmbarque}
            onChange={(id) => onChange({ idTipoEmbarque: id })}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            size="small"
            fullWidth
            label="Referencia"
            value={c.referencia}
            onChange={(e) => onChange({ referencia: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            size="small"
            fullWidth
            label="Nota"
            value={c.nota}
            onChange={(e) => onChange({ nota: e.target.value })}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
