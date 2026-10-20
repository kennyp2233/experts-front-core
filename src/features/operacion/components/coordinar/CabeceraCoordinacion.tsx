'use client';

import Link from 'next/link';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ExpandMore as AbrirIcon } from '@mui/icons-material';
import type { Opcion, TipoTramo } from '../../types/coordinacion';
import { type CabeceraForm, ID_CAMPO, rutaVacia } from './formulario';
import { OpcionAutocomplete } from './OpcionAutocomplete';

interface Props {
  valor: CabeceraForm;
  onChange: (cambios: Partial<CabeceraForm>) => void;
  /** Al elegir la marca se proponen aerolínea, destino, agencia, etc. */
  onConsignatario: (id: number | null) => void;
  /** Ids de los campos que faltan (se marcan en rojo después de intentar grabar). */
  errores: Set<string>;
  /** Ruta por defecto de la aerolínea (se usa si no se cambia). */
  rutaAerolinea?: Array<{ tipoRuta: TipoTramo; codigo: string }>;
}

/** Tramos en el orden de la ventana vieja: From · To1 By1 · To2 By2 · To3 By3. */
const TRAMOS: Array<{ tipo: TipoTramo; label: string; ayuda: string }> = [
  { tipo: 'ORIGEN', label: 'Desde', ayuda: 'Aeropuerto' },
  { tipo: 'DESTINO1', label: 'A', ayuda: 'Aeropuerto' },
  { tipo: 'VIA1', label: 'Por', ayuda: 'Aerolínea que vuela' },
  { tipo: 'DESTINO2', label: 'A', ayuda: '2.º tramo' },
  { tipo: 'VIA2', label: 'Por', ayuda: 'Aerolínea' },
  { tipo: 'DESTINO3', label: 'A', ayuda: '3.er tramo' },
  { tipo: 'VIA3', label: 'Por', ayuda: 'Aerolínea' },
];

const textoRuta = (r: Partial<Record<TipoTramo, string>>) =>
  TRAMOS.map((t) => r[t.tipo]?.trim().toUpperCase())
    .filter(Boolean)
    .join(' / ');

/** Resumen de lo que se cargó en "vuelo, manifiesto…" para verlo sin abrirlo. */
function resumenVuelo(c: CabeceraForm) {
  const ruta = textoRuta(c.ruta);
  const partes = [
    ruta && `ruta ${ruta}`,
    c.vuelo.trim() && `vuelo ${c.vuelo.trim().toUpperCase()}`,
    c.numeroManifiesto.trim() && `manifiesto ${c.numeroManifiesto.trim()}`,
    c.secuencial.trim() && `secuencial ${c.secuencial.trim()}`,
    c.referencia.trim() && `ref. ${c.referencia.trim()}`,
  ].filter(Boolean);
  return partes.length ? partes.join(' · ') : 'Los da la aerolínea; se pueden completar después.';
}

/**
 * Cabecera en el orden del sistema viejo (TabIndex de frmPIN_Coordina):
 * Consignatario → Aerolínea → Guía (la primera libre de esa aerolínea) →
 * Fecha de vuelo; después destinos, agencia, embarque y pago. La nota
 * (termógrafo…) va a la vista; vuelo y manifiesto, plegados.
 */
export function CabeceraCoordinacion({ valor: c, onChange, onConsignatario, errores, rutaAerolinea }: Props) {
  const porDefecto = Object.fromEntries((rutaAerolinea ?? []).map((r) => [r.tipoRuta, r.codigo])) as Partial<Record<TipoTramo, string>>;
  const rutaPropia = TRAMOS.some((t) => c.ruta[t.tipo].trim());
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Grid container spacing={1.5}>
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
            tipo="aerolineas"
            label="Aerolínea"
            value={c.idAerolinea}
            helperText="Propone su primera guía libre"
            onChange={(id) => onChange(id === c.idAerolinea ? {} : { idAerolinea: id, idGuiaMadre: null })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <OpcionAutocomplete
            id={ID_CAMPO.guia}
            tipo="guias"
            label="Guía madre"
            required
            error={errores.has(ID_CAMPO.guia)}
            value={c.idGuiaMadre}
            idAerolinea={c.idAerolinea}
            placeholder="Número de guía"
            mostrarDetalle
            sinResultados={
              <span>
                No hay guías libres. Se ingresan en <Link href="/operacion/guias/ingresos">Ingreso de guías</Link>.
              </span>
            }
            onChange={(id, o: Opcion | null) =>
              onChange({
                idGuiaMadre: id,
                ...(o ? { idAerolinea: (o.extra?.idAerolinea as number | null | undefined) ?? c.idAerolinea } : {}),
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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
            tipo="tipos-embarque"
            label="Tipo de embarque"
            value={c.idTipoEmbarque}
            onChange={(id) => onChange({ idTipoEmbarque: id })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
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
        <Grid size={{ xs: 12 }}>
          <TextField
            size="small"
            fullWidth
            label="Nota"
            placeholder="TERMOGRAFO …"
            value={c.nota}
            onChange={(e) => onChange({ nota: e.target.value })}
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
            Ruta, vuelo, manifiesto y referencia
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {resumenVuelo(c)}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction="row" alignItems="flex-start" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 2 }}>
            {TRAMOS.map((t) => (
              <TextField
                key={t.tipo}
                size="small"
                label={t.label}
                helperText={t.ayuda}
                value={c.ruta[t.tipo]}
                placeholder={porDefecto[t.tipo] ?? ''}
                onChange={(e) => onChange({ ruta: { ...c.ruta, [t.tipo]: e.target.value.toUpperCase() } })}
                slotProps={{ htmlInput: { maxLength: 3 }, inputLabel: { shrink: true } }}
                sx={{ width: 76 }}
              />
            ))}
            <Stack sx={{ pt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {rutaPropia
                  ? 'Ruta propia de esta guía.'
                  : `Vacía = la de la aerolínea${textoRuta(porDefecto) ? ` (${textoRuta(porDefecto)})` : ''}.`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                El manifiesto es de la aerolínea que vuela (&quot;Por&quot;).
              </Typography>
              {rutaPropia ? (
                <Button size="small" sx={{ alignSelf: 'flex-start', px: 0 }} onClick={() => onChange({ ruta: rutaVacia() })}>
                  Usar la de la aerolínea
                </Button>
              ) : (
                rutaAerolinea?.length ? (
                  <Button size="small" sx={{ alignSelf: 'flex-start', px: 0 }} onClick={() => onChange({ ruta: { ...rutaVacia(), ...porDefecto } })}>
                    Cambiar la ruta
                  </Button>
                ) : null
              )}
            </Stack>
          </Stack>
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
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
