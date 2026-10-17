'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as DuplicarIcon,
  DeleteOutline as BorrarIcon,
  Scale as BasculaIcon,
} from '@mui/icons-material';
import { formatDate, formatDateTime } from '@/shared/utils';
import type { CoordinacionArmada, Opcion, ParametrosCoordinacion } from '../../types/coordinacion';
import { num, plural } from '../../utils/formato';
import { formatearDae, ID_CAMPO, LineaForm, numero, PATRON_DAE } from './formulario';
import { OpcionAutocomplete } from './OpcionAutocomplete';

type CampoNumerico = 'cajas' | 'fulls' | 'pesoKg' | 'tallos' | 'valor' | 'largo' | 'ancho' | 'alto';

interface Props {
  lineas: LineaForm[];
  parametros: ParametrosCoordinacion | undefined;
  /** Resultado del servidor: de ahí sale el número de guía hija de cada fila. */
  armada: CoordinacionArmada | undefined;
  onCambiar: (key: string, cambios: Partial<LineaForm>, finca?: Opcion | null) => void;
  onAgregar: (duplicarKey?: string) => void;
  onQuitar: (key: string) => void;
  /** "Ingreso Peso Neto" del sistema viejo: reparte el peso de la báscula entre las filas. */
  onRepartirPeso: (totalKg: number) => string | null;
  /** Ids de los campos que faltan (se marcan en rojo después de intentar grabar). */
  errores: Set<string>;
  /** DAE vigente de cada finca según el registro de DAEs (para mostrarla como propuesta). */
  daesRegistro?: Record<number, { dae: string; hasta: string } | null>;
}

function Numero({
  value,
  onChange,
  auto,
  width = '100%',
  label,
  placeholder,
  id,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  auto?: boolean;
  width?: number | string;
  label: string;
  placeholder?: string;
  id?: string;
  error?: boolean;
}) {
  return (
    <TextField
      id={id}
      size="small"
      value={value}
      placeholder={placeholder}
      error={error}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{ htmlInput: { inputMode: 'decimal', 'aria-label': label } }}
      sx={{
        width,
        '& input': {
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          color: auto && value ? 'text.secondary' : undefined,
          fontStyle: auto && value ? 'italic' : undefined,
        },
      }}
    />
  );
}

/** Número de guía hija que le toca a la fila (una guía hija por marca + finca + producto). */
function guiaHijaDe(l: LineaForm, armada: CoordinacionArmada | undefined) {
  if (!armada || l.idFinca === null) return undefined;
  return armada.guiasHijas.find((g) => g.idFinca === l.idFinca && g.lineas.some((x) => x.idProducto === l.idProducto));
}

/** "UTOPIA (web) · 12/10/2026 09:55": quién registró la línea. */
const textoRegistro = (r: NonNullable<LineaForm['registro']>) =>
  [r.usuario ? `${r.usuario}${r.origen === 'E' ? ' (web)' : ''}` : null, formatDateTime(r.fecha, '')].filter(Boolean).join(' · ');

/**
 * Detalle coordinado (la grilla del sistema viejo): una fila por finca +
 * producto, en el orden Fulls → Cajas → Kg → DAE → Nota. Fulls y cajas se
 * calculan entre sí, el peso se propone (en cursiva) y se corrige; una fila con
 * 0 y una nota es una novedad ("no llegó 1.5"). El sistema agrupa las filas en
 * guías hijas (una por marca + finca + producto).
 */
export function LineasEditor({ lineas, parametros, armada, onCambiar, onAgregar, onQuitar, onRepartirPeso, errores, daesRegistro }: Props) {
  // Tipo de caja, tallos, valor, factura y medidas casi siempre son los sugeridos o no se usan.
  const [mas, setMas] = useState(false);
  const [bascula, setBascula] = useState<string | null>(null);
  const [errorBascula, setErrorBascula] = useState<string | null>(null);
  const tot = lineas.reduce(
    (a, l) => ({
      cajas: a.cajas + (numero(l.cajas) ?? 0),
      fulls: a.fulls + (numero(l.fulls) ?? 0),
      kg: a.kg + (numero(l.pesoKg) ?? 0),
      tallos: a.tallos + (numero(l.tallos) ?? 0),
      valor: a.valor + (numero(l.valor) ?? 0),
    }),
    { cajas: 0, fulls: 0, kg: 0, tallos: 0, valor: 0 },
  );
  const fincas = new Set(lineas.map((l) => l.idFinca).filter((x) => x !== null)).size;

  const editarNumero = (l: LineaForm, campo: CampoNumerico) => (v: string) => {
    const auto = { ...l.auto };
    if (campo === 'fulls' || campo === 'cajas' || campo === 'pesoKg' || campo === 'tallos' || campo === 'valor') auto[campo] = false;
    if (campo === 'largo' || campo === 'ancho' || campo === 'alto') auto.medidas = false;
    onCambiar(l.key, { [campo]: v, auto });
  };

  const repartir = () => {
    const total = numero(bascula ?? '');
    if (total === undefined || total <= 0) {
      setErrorBascula('Escribe el peso de la báscula en kg.');
      return;
    }
    const problema = onRepartirPeso(total);
    if (problema) setErrorBascula(problema);
    else setBascula(null);
  };

  const totalCelda = { pr: '12px !important' } as const;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }} spacing={1}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Detalle coordinado
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Fulls y cajas se calculan entre sí; en cursiva lo sugerido ({parametros?.lineas.cajasPorFull ?? 2} cajas ×{' '}
            {parametros?.lineas.kgPorCaja ?? 22} kg por full). Una fila en 0 con nota es una novedad.
          </Typography>
        </Box>
        <FormControlLabel
          sx={{ flexShrink: 0 }}
          control={<Switch size="small" checked={mas} onChange={(e) => setMas(e.target.checked)} />}
          label={<Typography variant="body2">Caja, tallos, valor, factura y medidas</Typography>}
        />
      </Stack>

      <TableContainer sx={{ mx: -2, px: 2, width: 'calc(100% + 32px)' }}>
        <Table
          size="small"
          sx={{
            '& td, & th': { px: 0.5, borderBottom: 'none' },
            '& th': { color: 'text.secondary', fontWeight: 600 },
            '& .MuiInputBase-root': { fontSize: 14 },
            '& .MuiOutlinedInput-input': { px: 1 },
            tableLayout: 'fixed',
            // Debajo de este ancho se desplaza; a 1366 entra con el menú plegado.
            minWidth: mas ? 1400 : 940,
          }}
        >
          {/* Anchos fijos: la finca se lleva el espacio que sobra. */}
          <colgroup>
            <col style={{ width: 28 }} />
            <col />
            <col style={{ width: 130 }} />
            <col style={{ width: 66 }} />
            <col style={{ width: 62 }} />
            <col style={{ width: 70 }} />
            <col style={{ width: 196 }} />
            <col style={{ width: 170 }} />
            {mas && <col style={{ width: 80 }} />}
            {mas && <col style={{ width: 72 }} />}
            {mas && <col style={{ width: 80 }} />}
            {mas && <col style={{ width: 96 }} />}
            {mas && <col style={{ width: 170 }} />}
            <col style={{ width: 88 }} />
            <col style={{ width: 72 }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Finca</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell align="right">Fulls</TableCell>
              <TableCell align="right">Cajas</TableCell>
              <TableCell align="right">Kg</TableCell>
              <TableCell>DAE</TableCell>
              <TableCell>Nota</TableCell>
              {mas && <TableCell>Tipo caja</TableCell>}
              {mas && <TableCell align="right">Tallos</TableCell>}
              {mas && <TableCell align="right">Valor $</TableCell>}
              {mas && <TableCell>Factura</TableCell>}
              {mas && <TableCell>Medidas cm (L × A × H)</TableCell>}
              <TableCell>Guía hija</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {lineas.map((l, i) => {
              const daeMal = !!l.dae.trim() && !PATRON_DAE.test(l.dae.trim());
              // En cursiva: la propuso el registro de DAEs (como los otros valores sugeridos).
              const registro = l.idFinca ? daesRegistro?.[l.idFinca] : null;
              const daeDelRegistro = l.auto.dae && registro && registro.dae === l.dae ? registro : null;
              // Se buscó y el registro no tiene DAE vigente para la fecha y el destino (el viejo la pintaba de rojo).
              const sinVigente = l.auto.dae && !!l.idFinca && registro === null && !!l.dae.trim();
              const gh = guiaHijaDe(l, armada);
              const novedad = numero(l.cajas) === 0 && !!l.nota.trim();
              return (
                <TableRow key={l.key} sx={{ verticalAlign: 'top', bgcolor: novedad ? 'action.hover' : undefined }}>
                  <TableCell sx={{ pt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {i + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <OpcionAutocomplete
                      id={ID_CAMPO.fila(l.key, 'finca')}
                      sinEtiqueta
                      tipo="fincas"
                      label="Finca"
                      error={errores.has(ID_CAMPO.fila(l.key, 'finca'))}
                      value={l.idFinca}
                      helperText={l.registro ? textoRegistro(l.registro) : undefined}
                      onChange={(id, o) => onCambiar(l.key, { idFinca: id }, o)}
                    />
                  </TableCell>
                  <TableCell>
                    <OpcionAutocomplete
                      id={ID_CAMPO.fila(l.key, 'producto')}
                      sinEtiqueta
                      tipo="productos"
                      label="Producto"
                      error={errores.has(ID_CAMPO.fila(l.key, 'producto'))}
                      value={l.idProducto}
                      onChange={(id) => onCambiar(l.key, { idProducto: id })}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Numero label="Fulls" value={l.fulls} auto={l.auto.fulls} onChange={editarNumero(l, 'fulls')} />
                  </TableCell>
                  <TableCell align="right">
                    <Numero
                      id={ID_CAMPO.fila(l.key, 'cajas')}
                      label="Cajas"
                      value={l.cajas}
                      auto={l.auto.cajas}
                      error={errores.has(ID_CAMPO.fila(l.key, 'cajas'))}
                      onChange={editarNumero(l, 'cajas')}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Numero
                      id={ID_CAMPO.fila(l.key, 'kg')}
                      label="Kg"
                      value={l.pesoKg}
                      auto={l.auto.pesoKg}
                      error={errores.has(ID_CAMPO.fila(l.key, 'kg'))}
                      onChange={editarNumero(l, 'pesoKg')}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      id={ID_CAMPO.fila(l.key, 'dae')}
                      size="small"
                      value={l.dae}
                      placeholder="055-AAAA-40-XXXXXXXX"
                      onChange={(e) =>
                        onCambiar(l.key, { dae: formatearDae(e.target.value, l.dae), auto: { ...l.auto, dae: false } })
                      }
                      error={daeMal || errores.has(ID_CAMPO.fila(l.key, 'dae'))}
                      helperText={daeMal ? 'Formato 055-AAAA-40-XXXXXXXX' : sinVigente ? 'Sin DAE vigente para el vuelo' : undefined}
                      title={
                        daeDelRegistro
                          ? `Del registro de DAEs de la finca, vigente hasta ${formatDate(daeDelRegistro.hasta)}. Escríbela para cambiarla.`
                          : undefined
                      }
                      slotProps={{
                        htmlInput: { 'aria-label': 'DAE', spellCheck: false, inputMode: 'numeric' },
                        formHelperText: { sx: { mx: 0.5, whiteSpace: 'nowrap', color: sinVigente && !daeMal ? 'warning.dark' : undefined } },
                      }}
                      fullWidth
                      sx={{
                        '& input': { fontVariantNumeric: 'tabular-nums', fontStyle: daeDelRegistro ? 'italic' : undefined },
                        ...(sinVigente && !daeMal ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: 'warning.main' } } : {}),
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={l.nota.length > 22 ? l.nota : ''} placement="top">
                      <TextField
                        size="small"
                        fullWidth
                        value={l.nota}
                        placeholder="no llegó 1.5…"
                        onChange={(e) => onCambiar(l.key, { nota: e.target.value })}
                        slotProps={{ htmlInput: { 'aria-label': 'Nota', maxLength: 120 } }}
                        sx={{ '& input': { fontWeight: novedad ? 600 : undefined } }}
                      />
                    </Tooltip>
                  </TableCell>
                  {mas && (
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={l.idTipoCaja ?? ''}
                        onChange={(e) =>
                          onCambiar(l.key, {
                            idTipoCaja: e.target.value === '' ? null : Number(e.target.value),
                            // Si las cajas las escribió él, los fulls se recalculan con el nuevo factor.
                            auto: { ...l.auto, fulls: l.auto.cajas ? l.auto.fulls : true },
                          })
                        }
                        fullWidth
                        slotProps={{ htmlInput: { 'aria-label': 'Tipo de caja' } }}
                      >
                        <MenuItem value="">
                          <em>—</em>
                        </MenuItem>
                        {parametros?.tiposCaja.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            <Tooltip title={`${t.nombre}: ${t.factorFull} full`} placement="right">
                              <span>{t.codigo ?? t.nombre}</span>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                  )}
                  {mas && (
                    <TableCell align="right">
                      <Numero label="Tallos" value={l.tallos} auto={l.auto.tallos} onChange={editarNumero(l, 'tallos')} />
                    </TableCell>
                  )}
                  {mas && (
                    <TableCell align="right">
                      <Numero label="Valor" value={l.valor} auto={l.auto.valor} onChange={editarNumero(l, 'valor')} />
                    </TableCell>
                  )}
                  {mas && (
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={l.factura}
                        onChange={(e) => onCambiar(l.key, { factura: e.target.value })}
                        slotProps={{ htmlInput: { 'aria-label': 'Factura', maxLength: 20 } }}
                      />
                    </TableCell>
                  )}
                  {mas && (
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {(['largo', 'ancho', 'alto'] as const).map((k) => (
                          <Numero key={k} label={k} value={l[k]} auto={l.auto.medidas} onChange={editarNumero(l, k)} width="33%" />
                        ))}
                      </Stack>
                    </TableCell>
                  )}
                  <TableCell sx={{ pt: 1.25 }}>
                    {gh?.numeroGuiaHija ? (
                      <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {gh.numeroGuiaHija}
                      </Typography>
                    ) : gh ? (
                      <Tooltip title="El número de guía hija se asigna al grabar.">
                        <Typography variant="caption" color="text.secondary" fontStyle="italic">
                          al grabar
                        </Typography>
                      </Tooltip>
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Duplicar fila">
                      <IconButton size="small" onClick={() => onAgregar(l.key)} aria-label="Duplicar fila">
                        <DuplicarIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Quitar fila">
                      <span>
                        <IconButton size="small" onClick={() => onQuitar(l.key)} disabled={lineas.length === 1} aria-label="Quitar fila">
                          <BorrarIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow sx={{ '& td': { fontWeight: 600, pt: 1 } }}>
              <TableCell />
              <TableCell colSpan={2}>
                <Button id={ID_CAMPO.fincas} startIcon={<AddIcon />} onClick={() => onAgregar()} size="small" sx={{ mr: 2 }}>
                  Agregar finca
                </Button>
                <Typography component="span" variant="body2" fontWeight={600}>
                  Total ({plural(fincas, 'finca')})
                </Typography>
              </TableCell>
              <TableCell align="right" sx={totalCelda}>{num(tot.fulls, 4)}</TableCell>
              <TableCell align="right" sx={totalCelda}>{num(tot.cajas, 0)}</TableCell>
              <TableCell align="right" sx={totalCelda}>{num(tot.kg)}</TableCell>
              <TableCell colSpan={2}>
                <Button size="small" startIcon={<BasculaIcon />} onClick={() => setBascula('')}>
                  Ingreso peso neto
                </Button>
              </TableCell>
              {mas && <TableCell />}
              {mas && <TableCell align="right" sx={totalCelda}>{num(tot.tallos, 0)}</TableCell>}
              {mas && <TableCell align="right" sx={totalCelda}>{num(tot.valor)}</TableCell>}
              {mas && <TableCell />}
              {mas && <TableCell />}
              <TableCell colSpan={2}>
                {armada && (
                  <Typography variant="body2" fontWeight={600}>
                    {plural(armada.guiasHijas.length, 'guía hija', 'guías hijas')}
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={bascula !== null}
        onClose={() => setBascula(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            component: 'form',
            onSubmit: (e: React.FormEvent) => {
              e.preventDefault();
              repartir();
            },
          },
        }}
      >
        <DialogTitle>Ingreso peso neto</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            El peso de la báscula se reparte entre las fincas según lo que tiene cada una (o sus cajas), en kilos enteros.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Peso de la báscula (kg)"
            value={bascula ?? ''}
            onChange={(e) => {
              setBascula(e.target.value);
              setErrorBascula(null);
            }}
            slotProps={{ htmlInput: { inputMode: 'decimal' } }}
          />
          {errorBascula && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {errorBascula}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBascula(null)}>Cancelar</Button>
          <Button type="submit" variant="contained">
            Repartir
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
