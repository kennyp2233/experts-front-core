'use client';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { ExpandMore as AbrirIcon } from '@mui/icons-material';
import type { Opcion } from '../../types/coordinacion';
import { type CabeceraForm, ID_CAMPO } from './formulario';
import { OpcionAutocomplete } from './OpcionAutocomplete';

interface Props {
  valor: CabeceraForm;
  onChange: (cambios: Partial<CabeceraForm>) => void;
  /** Al elegir la marca se proponen destino, agencia, etc. */
  onConsignatario: (id: number | null) => void;
  /** Al editar no se cambia de guía libremente si ya tiene guías hijas numeradas. */
  bloquearGuia?: boolean;
  /** Ids de los campos que faltan (se marcan en rojo después de intentar grabar). */
  errores: Set<string>;
}

/** Resumen de lo que se cargó en "vuelo, manifiesto…" para verlo sin abrirlo. */
function resumenVuelo(c: CabeceraForm) {
  const partes = [
    c.vuelo.trim() && `vuelo ${c.vuelo.trim().toUpperCase()}`,
    c.numeroManifiesto.trim() && `manifiesto ${c.numeroManifiesto.trim()}`,
    c.secuencial.trim() && `secuencial ${c.secuencial.trim()}`,
    c.referencia.trim() && `ref. ${c.referencia.trim()}`,
    c.nota.trim() && 'con nota',
  ].filter(Boolean);
  return partes.length ? partes.join(' · ') : 'Los da la aerolínea; se pueden completar después.';
}

/** Guía, partes y destino de la coordinación. Vuelo, manifiesto, referencia y nota van plegados. */
export function CabeceraCoordinacion({ valor: c, onChange, onConsignatario, bloquearGuia, errores }: Props) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <OpcionAutocomplete
            id={ID_CAMPO.guia}
            tipo="guias"
            label="Guía madre"
            required
            error={errores.has(ID_CAMPO.guia)}
            value={c.idGuiaMadre}
            disabled={bloquearGuia}
            placeholder="Número o aerolínea (KL, 8469…)"
            mostrarDetalle
            onChange={(id, o: Opcion | null) =>
              onChange({ idGuiaMadre: id, idAerolinea: (o?.extra?.idAerolinea as number | null | undefined) ?? null })
            }
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            id={ID_CAMPO.fecha}
            type="date"
            size="small"
            fullWidth
            required
            error={errores.has(ID_CAMPO.fecha)}
            label="Fecha de vuelo"
            value={c.fechaVuelo}
            onChange={(e) => onChange({ fechaVuelo: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            select
            size="small"
            fullWidth
            label="Pago"
            value={c.pago}
            onChange={(e) => onChange({ pago: e.target.value as CabeceraForm['pago'] })}
          >
            <MenuItem value="PREPAID">Prepaid</MenuItem>
            <MenuItem value="COLLECT">Collect</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <OpcionAutocomplete
            tipo="tipos-embarque"
            label="Tipo de embarque"
            value={c.idTipoEmbarque}
            onChange={(id) => onChange({ idTipoEmbarque: id })}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <OpcionAutocomplete
            id={ID_CAMPO.consignatario}
            tipo="consignatarios"
            label="Consignatario"
            required
            error={errores.has(ID_CAMPO.consignatario)}
            value={c.idConsignatario}
            mostrarDetalle
            onChange={(id) => {
              onChange({ idConsignatario: id });
              onConsignatario(id);
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <OpcionAutocomplete
            id={ID_CAMPO.agencia}
            tipo="agencias"
            label="Agencia IATA"
            required
            error={errores.has(ID_CAMPO.agencia)}
            value={c.idAgenciaIata}
            onChange={(id) => onChange({ idAgenciaIata: id })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
          <OpcionAutocomplete
            id={ID_CAMPO.destino}
            tipo="destinos"
            label="Destino de la guía"
            required
            conCodigo
            error={errores.has(ID_CAMPO.destino)}
            value={c.idDestinoAwb}
            onChange={(id) => onChange({ idDestinoAwb: id })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
          <OpcionAutocomplete
            tipo="destinos"
            label="Destino final"
            conCodigo
            value={c.idDestinoFinalDocs}
            helperText="Si es otro (va en los documentos)"
            onChange={(id) => onChange({ idDestinoFinalDocs: id })}
          />
        </Grid>
      </Grid>

      <Accordion
        disableGutters
        elevation={0}
        sx={{ mt: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, '&::before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<AbrirIcon />} sx={{ minHeight: 44, '& .MuiAccordionSummary-content': { my: 1 } }}>
          <Typography variant="body2" fontWeight={600} sx={{ mr: 1.5, flexShrink: 0 }}>
            Vuelo, manifiesto, referencia y nota
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {resumenVuelo(c)}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <TextField
                size="small"
                fullWidth
                label="N° de vuelo"
                placeholder="5Y9918"
                value={c.vuelo}
                onChange={(e) => onChange({ vuelo: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
              <TextField
                type="datetime-local"
                size="small"
                fullWidth
                label="Salida"
                value={c.salida}
                onChange={(e) => onChange({ salida: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
              <TextField
                type="datetime-local"
                size="small"
                fullWidth
                label="Llegada"
                value={c.llegada}
                onChange={(e) => onChange({ llegada: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <TextField
                size="small"
                fullWidth
                label="N° de manifiesto"
                placeholder="052167"
                helperText="Va en el archivo de FlowerCargo"
                value={c.numeroManifiesto}
                onChange={(e) => onChange({ numeroManifiesto: e.target.value })}
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 1.5 }}>
              <TextField
                size="small"
                fullWidth
                label="Secuencial"
                placeholder="0026"
                helperText="Posición en el manifiesto"
                value={c.secuencial}
                onChange={(e) => onChange({ secuencial: e.target.value })}
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 5 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 1.5 }}>
              <TextField
                size="small"
                fullWidth
                label="Referencia"
                value={c.referencia}
                onChange={(e) => onChange({ referencia: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField size="small" fullWidth label="Nota" value={c.nota} onChange={(e) => onChange({ nota: e.target.value })} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
