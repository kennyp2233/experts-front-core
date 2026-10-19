'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add as AgregarIcon, DeleteOutline as QuitarIcon, ExpandMore as AbrirIcon } from '@mui/icons-material';
import type { CampoMaestro, FormularioMaestro, OpcionCampo, ValoresMaestro } from '../types';
import { columna, vacio } from './VistaMaestro';

type Errores = Record<string, string>;

/** Valores de partida: los del registro, o los iniciales de cada campo si es nuevo. */
export function valoresIniciales(formulario: FormularioMaestro, actuales: ValoresMaestro | null): ValoresMaestro {
  const v: ValoresMaestro = {};
  for (const s of formulario.secciones) {
    for (const c of s.campos) {
      v[c.clave] = actuales ? actuales[c.clave] ?? (c.tipo === 'tabla' ? [] : null) : (c.inicial ?? (c.tipo === 'tabla' ? [] : c.tipo === 'si-no' ? false : null));
    }
  }
  return v;
}

const esNumero = (v: unknown) => Number.isFinite(typeof v === 'number' ? v : Number(String(v).replace(',', '.')));

/** Las mismas reglas que valida el servidor, para marcar antes de grabar. */
function validar(formulario: FormularioMaestro, valores: ValoresMaestro, nuevo: boolean): Errores {
  const e: Errores = {};
  const uno = (c: CampoMaestro, v: unknown, clave: string) => {
    if (c.tipo === 'si-no' || (!nuevo && c.soloAlCrear)) return;
    if (vacio(v) || (typeof v === 'string' && v.trim() === '')) {
      if (c.requerido) e[clave] = `Falta ${c.etiqueta.toLowerCase()}.`;
      return;
    }
    if ((c.tipo === 'numero' || c.tipo === 'entero') && !esNumero(v)) e[clave] = 'Escribe un número.';
    else if (c.tipo === 'entero' && !Number.isInteger(Number(String(v).replace(',', '.')))) e[clave] = 'Sin decimales.';
    else if (c.max && String(v).trim().length > c.max) e[clave] = `Máximo ${c.max} caracteres.`;
  };
  for (const s of formulario.secciones) {
    for (const c of s.campos) {
      if (c.tipo === 'tabla') {
        ((valores[c.clave] as ValoresMaestro[] | null) ?? []).forEach((f, i) =>
          c.columnas?.forEach((col) => uno(col, f[col.clave], `${c.clave}.${i}.${col.clave}`)),
        );
      } else uno(c, valores[c.clave], c.clave);
    }
  }
  return e;
}

const idCampo = (clave: string) => `campo-${clave.replace(/\./g, '-')}`;

const sinKey = <T extends object>(props: T): Omit<T, 'key'> => {
  const resto = { ...props } as T & { key?: unknown };
  delete resto.key;
  return resto;
};

interface CampoProps {
  c: CampoMaestro;
  valor: unknown;
  error?: string;
  nuevo: boolean;
  onChange: (v: unknown) => void;
  /** Dentro de una tabla: sin etiqueta visible. */
  enTabla?: boolean;
  clave: string;
}

function CampoOpciones({ c, valor, error, onChange, enTabla, clave }: CampoProps) {
  const opciones = c.opciones ?? [];
  const elegida = opciones.find((o) => String(o.valor) === String(valor)) ?? null;
  const visibles = opciones.filter((o) => !o.inactivo || o === elegida);
  const ayuda = error ?? (enTabla ? undefined : c.ayuda);
  // Listas cortas sin detalle: un desplegable simple.
  if (visibles.length <= 8 && !visibles.some((o) => o.detalle)) {
    return (
      <TextField
        id={idCampo(clave)}
        select
        size="small"
        fullWidth
        label={enTabla ? undefined : c.etiqueta}
        slotProps={{ htmlInput: { 'aria-label': c.etiqueta } }}
        required={c.requerido}
        value={elegida ? String(elegida.valor) : ''}
        onChange={(e) => onChange(opciones.find((o) => String(o.valor) === e.target.value)?.valor ?? null)}
        error={!!error}
        helperText={ayuda}
      >
        {!c.requerido && (
          <MenuItem value="">
            <em>Ninguno</em>
          </MenuItem>
        )}
        {visibles.map((o) => (
          <MenuItem key={String(o.valor)} value={String(o.valor)}>
            {o.etiqueta}
          </MenuItem>
        ))}
      </TextField>
    );
  }
  return (
    <Autocomplete<OpcionCampo>
      size="small"
      fullWidth
      options={visibles}
      value={elegida}
      onChange={(_, o) => onChange(o?.valor ?? null)}
      getOptionLabel={(o) => o.etiqueta}
      isOptionEqualToValue={(a, b) => String(a.valor) === String(b.valor)}
      filterOptions={(ops, { inputValue }) => {
        const q = inputValue.trim().toLocaleLowerCase('es');
        if (!q) return ops.slice(0, 100);
        // Primero la que es igual a lo escrito, después las que empiezan así, después las que lo contienen.
        const puntaje = (o: OpcionCampo) => {
          const e = o.etiqueta.toLocaleLowerCase('es');
          const d = (o.detalle ?? '').toLocaleLowerCase('es');
          if (e === q || d === q) return 0;
          if (e.startsWith(q) || d.startsWith(q)) return 1;
          return `${e} ${d}`.includes(q) ? 2 : 3;
        };
        return ops
          .map((o) => [puntaje(o), o] as const)
          .filter(([p]) => p < 3)
          .sort((a, b) => a[0] - b[0])
          .slice(0, 100)
          .map(([, o]) => o);
      }}
      autoHighlight
      autoSelect
      renderOption={(props, o) => (
        <Box component="li" key={String(o.valor)} {...sinKey(props)}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2">{o.etiqueta}</Typography>
            {o.detalle && (
              <Typography variant="caption" color="text.secondary">
                {o.detalle}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          id={idCampo(clave)}
          label={enTabla ? undefined : c.etiqueta}
          required={c.requerido}
          error={!!error}
          helperText={ayuda}
          slotProps={{ htmlInput: { ...params.inputProps, 'aria-label': c.etiqueta } }}
        />
      )}
      noOptionsText="Sin resultados"
    />
  );
}

function Campo(props: CampoProps) {
  const { c, valor, error, nuevo, onChange, enTabla, clave } = props;
  const bloqueado = !nuevo && !!c.soloAlCrear;
  const ayuda = error ?? (enTabla ? undefined : bloqueado ? 'Es el código del registro: no se cambia.' : c.ayuda);

  if (c.tipo === 'opciones') return <CampoOpciones {...props} />;
  if (c.tipo === 'si-no') {
    return (
      <Box>
        <FormControlLabel
          control={<Switch id={idCampo(clave)} checked={!!valor} onChange={(e) => onChange(e.target.checked)} />}
          label={c.etiqueta}
        />
        {c.ayuda && !enTabla && (
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: -0.5 }}>
            {c.ayuda}
          </Typography>
        )}
      </Box>
    );
  }
  const numero = c.tipo === 'numero' || c.tipo === 'entero';
  const unidad = c.unidad ? (
    <InputAdornment position={c.unidad === '$' ? 'start' : 'end'}>{c.unidad}</InputAdornment>
  ) : undefined;
  return (
    <TextField
      id={idCampo(clave)}
      size="small"
      fullWidth
      label={enTabla ? undefined : c.etiqueta}
      required={c.requerido}
      disabled={bloqueado}
      multiline={c.tipo === 'parrafo'}
      minRows={c.tipo === 'parrafo' ? 2 : undefined}
      maxRows={c.tipo === 'parrafo' ? 8 : undefined}
      value={valor === null || valor === undefined ? '' : String(valor)}
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={ayuda}
      slotProps={{
        input: unidad ? { [c.unidad === '$' ? 'startAdornment' : 'endAdornment']: unidad } : undefined,
        htmlInput: {
          'aria-label': c.etiqueta,
          inputMode: numero ? (c.tipo === 'entero' ? 'numeric' : 'decimal') : undefined,
          maxLength: c.max,
          style: c.mayusculas ? { textTransform: 'uppercase' } : undefined,
        },
      }}
    />
  );
}

function TablaEditor({
  c,
  filas,
  errores,
  nuevo,
  onChange,
}: {
  c: CampoMaestro;
  filas: ValoresMaestro[];
  errores: Errores;
  nuevo: boolean;
  onChange: (filas: ValoresMaestro[]) => void;
}) {
  const cols = c.columnas ?? [];
  const plantilla = cols.map((col) => `${col.ancho ?? 2}fr`).join(' ') + ' 36px';
  const vacia = () => Object.fromEntries(cols.map((col) => [col.clave, col.inicial ?? null]));
  return (
    <Box>
      {filas.length > 0 && (
        <Box sx={{ display: { xs: 'none', sm: 'grid' }, gridTemplateColumns: plantilla, gap: 1, mb: 0.5 }}>
          {cols.map((col) => (
            <Typography key={col.clave} variant="caption" color="text.secondary">
              {col.etiqueta}
              {col.requerido ? ' *' : ''}
            </Typography>
          ))}
        </Box>
      )}
      <Stack spacing={1}>
        {filas.map((f, i) => (
          <Box
            key={i}
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 36px', sm: plantilla }, gap: 1, alignItems: 'start' }}
          >
            {cols.map((col) => (
              <Box key={col.clave} sx={{ gridColumn: { xs: '1', sm: 'auto' } }}>
                <Campo
                  c={col}
                  clave={`${c.clave}.${i}.${col.clave}`}
                  valor={f[col.clave]}
                  error={errores[`${c.clave}.${i}.${col.clave}`]}
                  nuevo={nuevo}
                  enTabla
                  onChange={(v) => onChange(filas.map((x, j) => (j === i ? { ...x, [col.clave]: v } : x)))}
                />
              </Box>
            ))}
            <Tooltip title="Quitar">
              <IconButton
                size="small"
                aria-label={`Quitar fila ${i + 1}`}
                onClick={() => onChange(filas.filter((_, j) => j !== i))}
                sx={{ mt: 0.5, gridColumn: { xs: '2', sm: 'auto' }, gridRow: { xs: '1', sm: 'auto' } }}
              >
                <QuitarIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
      </Stack>
      <Button size="small" startIcon={<AgregarIcon />} onClick={() => onChange([...filas, vacia()])} sx={{ mt: 1 }}>
        Agregar
      </Button>
    </Box>
  );
}

interface EditorProps {
  formulario: FormularioMaestro;
  /** Valores del registro; null = nuevo. */
  actuales: ValoresMaestro | null;
  guardando: boolean;
  /** Error del servidor: mensaje general y errores por campo. */
  errorServidor: { mensaje: string; errores?: Errores } | null;
  onGuardar: (valores: ValoresMaestro) => void;
  onCancelar: () => void;
  onSucio: (sucio: boolean) => void;
}

/**
 * Formulario de alta / cambio de un dato maestro. Enter pasa al campo
 * siguiente (como en el sistema viejo) y Ctrl+S graba; los errores se marcan
 * en cada campo y la pantalla va al primero.
 */
export function EditorMaestro({ formulario, actuales, guardando, errorServidor, onGuardar, onCancelar, onSucio }: EditorProps) {
  const nuevo = actuales === null;
  const inicio = useMemo(() => valoresIniciales(formulario, actuales), [formulario, actuales]);
  const [valores, setValores] = useState<ValoresMaestro>(inicio);
  const [errores, setErrores] = useState<Errores>({});
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({});
  const raiz = useRef<HTMLFormElement>(null);
  const sucio = useMemo(() => JSON.stringify(valores) !== JSON.stringify(inicio), [valores, inicio]);

  useEffect(() => onSucio(sucio), [sucio, onSucio]);
  // Errores por campo que devolvió el servidor: se marcan al llegar.
  const [servidorVisto, setServidorVisto] = useState(errorServidor);
  if (errorServidor !== servidorVisto) {
    setServidorVisto(errorServidor);
    if (errorServidor?.errores) setErrores(errorServidor.errores);
  }

  // Abre las secciones plegadas que tienen errores o datos.
  const seccionAbierta = (titulo: string, campos: CampoMaestro[]) =>
    abiertas[titulo] ?? campos.some((c) => Object.keys(errores).some((k) => k === c.clave || k.startsWith(`${c.clave}.`)));

  const cambiar = (clave: string, v: unknown) => {
    setValores((x) => ({ ...x, [clave]: v }));
    if (errores[clave]) setErrores((x) => Object.fromEntries(Object.entries(x).filter(([k]) => k !== clave)));
  };

  const irAlPrimerError = (e: Errores) => {
    const primero = Object.keys(e)[0];
    if (!primero) return;
    setTimeout(() => {
      const el = document.getElementById(idCampo(primero));
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus({ preventScroll: true });
    }, 50);
  };

  useEffect(() => {
    if (errorServidor?.errores) irAlPrimerError(errorServidor.errores);
  }, [errorServidor]);

  const grabar = () => {
    if (guardando) return;
    const e = validar(formulario, valores, nuevo);
    setErrores(e);
    if (Object.keys(e).length > 0) {
      irAlPrimerError(e);
      return;
    }
    onGuardar(valores);
  };

  const teclas = (ev: React.KeyboardEvent<HTMLFormElement>) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') {
      ev.preventDefault();
      grabar();
      return;
    }
    const t = ev.target as HTMLElement;
    if (ev.key !== 'Enter' || ev.shiftKey || t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON') return;
    if (t.getAttribute('aria-expanded') === 'true') return; // lista abierta: Enter elige
    const lista = Array.from(
      raiz.current?.querySelectorAll<HTMLElement>('input, textarea, [role="combobox"]:not(input)') ?? [],
    ).filter(
      (el) => !el.hasAttribute('disabled') && el.tabIndex >= 0 && el.getAttribute('aria-hidden') !== 'true' && el.offsetParent !== null,
    );
    const i = lista.indexOf(t);
    if (i < 0) return;
    ev.preventDefault();
    lista[i + 1]?.focus();
  };

  const nErrores = Object.keys(errores).length;

  return (
    <Box
      component="form"
      ref={raiz}
      noValidate
      onKeyDown={teclas}
      onSubmit={(e) => {
        e.preventDefault();
        grabar();
      }}
      sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}
    >
      <Stack spacing={2} sx={{ flex: 1, pb: 2 }}>
        {errorServidor && !errorServidor.errores && <Alert severity="error">{errorServidor.mensaje}</Alert>}
        {formulario.secciones.map((s) => {
          const contenido = (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', columnGap: 1.5, rowGap: 2 }}>
              {s.campos.map((c) => (
                <Box key={c.clave} sx={{ gridColumn: c.tipo === 'tabla' ? '1 / -1' : columna(c), minWidth: 0 }}>
                  {c.tipo === 'tabla' ? (
                    <TablaEditor
                      c={c}
                      filas={(valores[c.clave] as ValoresMaestro[] | null) ?? []}
                      errores={errores}
                      nuevo={nuevo}
                      onChange={(f) => {
                        cambiar(c.clave, f);
                        setErrores((x) => Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith(`${c.clave}.`))));
                      }}
                    />
                  ) : (
                    <Campo
                      c={c}
                      clave={c.clave}
                      valor={valores[c.clave]}
                      error={errores[c.clave]}
                      nuevo={nuevo}
                      onChange={(v) => cambiar(c.clave, v)}
                    />
                  )}
                </Box>
              ))}
            </Box>
          );
          if (s.plegada) {
            const llenos = s.campos.filter((c) => c.tipo !== 'si-no' && !vacio(valores[c.clave])).length;
            return (
              <Accordion
                key={s.titulo}
                disableGutters
                variant="outlined"
                expanded={seccionAbierta(s.titulo, s.campos)}
                onChange={(_, abierta) => setAbiertas((x) => ({ ...x, [s.titulo]: abierta }))}
                sx={{ borderRadius: 1, '&::before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<AbrirIcon />}>
                  <Box>
                    <Typography fontWeight={600}>{s.titulo}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {llenos > 0 ? `${llenos} ${llenos === 1 ? 'dato' : 'datos'}` : 'Vacío'}
                      {s.descripcion ? ` · ${s.descripcion}` : ''}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>{contenido}</AccordionDetails>
              </Accordion>
            );
          }
          return (
            <Box key={s.titulo}>
              <Typography fontWeight={600}>{s.titulo}</Typography>
              {s.descripcion && (
                <Typography variant="caption" color="text.secondary" component="div">
                  {s.descripcion}
                </Typography>
              )}
              <Box sx={{ mt: 1.5 }}>{contenido}</Box>
            </Box>
          );
        })}
      </Stack>
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          mx: -2.5,
          px: 2.5,
          py: 1.5,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography
          variant="caption"
          color={nErrores ? 'error' : 'text.secondary'}
          sx={{ flex: 1, minWidth: 0, display: { xs: nErrores ? 'block' : 'none', sm: 'block' } }}
        >
          {nErrores
            ? `Revisa ${nErrores === 1 ? 'el dato marcado' : `los ${nErrores} datos marcados`}.`
            : 'Enter pasa al siguiente campo · Ctrl+S graba'}
        </Typography>
        <Box sx={{ flex: { xs: nErrores ? 0 : 1, sm: 0 } }} />
        <Button onClick={onCancelar} disabled={guardando} sx={{ flexShrink: 0 }}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={guardando || (!nuevo && !sucio)}
          startIcon={guardando ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ flexShrink: 0 }}
        >
          {nuevo ? 'Crear' : 'Grabar cambios'}
        </Button>
      </Box>
    </Box>
  );
}
