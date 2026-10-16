'use client';

import { useState } from 'react';
import {
  Box,
  Button,
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
} from '@mui/icons-material';
import type { Opcion, ParametrosCoordinacion } from '../../types/coordinacion';
import { num } from '../../utils/formato';
import { LineaForm, numero } from './formulario';
import { OpcionAutocomplete } from './OpcionAutocomplete';

type CampoNumerico = 'cajas' | 'fulls' | 'pesoKg' | 'tallos' | 'valor' | 'largo' | 'ancho' | 'alto';

interface Props {
  lineas: LineaForm[];
  parametros: ParametrosCoordinacion | undefined;
  onCambiar: (key: string, cambios: Partial<LineaForm>, finca?: Opcion | null) => void;
  onAgregar: (duplicarKey?: string) => void;
  onQuitar: (key: string) => void;
}


function Numero({
  value,
  onChange,
  auto,
  width = '100%',
  label,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  auto?: boolean;
  width?: number | string;
  label: string;
  placeholder?: string;
}) {
  return (
    <TextField
      size="small"
      value={value}
      placeholder={placeholder}
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

/**
 * Carga de la coordinación: una línea por finca + producto + tipo de caja.
 * Fulls, kg, tallos y valor se proponen (en cursiva) y se pueden corregir; las
 * medidas salen de la caja de la finca. El sistema agrupa las líneas en guías
 * hijas (una por marca + finca + producto).
 */
export function LineasEditor({ lineas, parametros, onCambiar, onAgregar, onQuitar }: Props) {
  // Las medidas salen de la finca y solo cambian el volumen: se ocultan por defecto.
  const [medidas, setMedidas] = useState(false);
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

  const editarNumero = (l: LineaForm, campo: CampoNumerico) => (v: string) => {
    const auto = { ...l.auto };
    if (campo === 'fulls' || campo === 'pesoKg' || campo === 'tallos' || campo === 'valor') auto[campo] = false;
    if (campo === 'largo' || campo === 'ancho' || campo === 'alto') auto.medidas = false;
    onCambiar(l.key, { [campo]: v, auto });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }} spacing={1}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Carga
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Los valores en cursiva son sugeridos ({parametros?.lineas.cajasPorFull ?? 2} cajas × {parametros?.lineas.kgPorCaja ?? 22} kg por full,{' '}
            {parametros?.lineas.tallosPorFull ?? 700} tallos por full, $ {parametros?.lineas.valorPorCaja ?? 140} por caja); al
            escribir encima quedan fijos.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          <FormControlLabel
            control={<Switch size="small" checked={medidas} onChange={(e) => setMedidas(e.target.checked)} />}
            label={<Typography variant="body2">Medidas</Typography>}
          />
          <Button startIcon={<AddIcon />} onClick={() => onAgregar()} variant="outlined" size="small">
            Línea
          </Button>
        </Stack>
      </Stack>

      <TableContainer sx={{ mx: -2, px: 2, width: 'calc(100% + 32px)' }}>
        <Table
          size="small"
          sx={{
            '& td, & th': { px: 0.5, borderBottom: 'none' },
            // Celdas compactas: que la fila entre en una pantalla de laptop sin las medidas.
            '& .MuiInputBase-root': { fontSize: 14 },
            '& .MuiOutlinedInput-input': { px: 1 },
            tableLayout: 'fixed',
            minWidth: medidas ? 1260 : 1080,
          }}
        >
          {/* Anchos fijos: la finca se lleva el espacio que sobra. */}
          <colgroup>
            <col style={{ width: 28 }} />
            <col />
            <col style={{ width: 150 }} />
            <col style={{ width: 182 }} />
            <col style={{ width: 92 }} />
            <col style={{ width: 64 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 84 }} />
            {medidas && <col style={{ width: 180 }} />}
            <col style={{ width: 76 }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Finca</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>DAE</TableCell>
              <TableCell>Caja</TableCell>
              <TableCell align="right">Cajas</TableCell>
              <TableCell align="right">Fulls</TableCell>
              <TableCell align="right">Kg</TableCell>
              <TableCell align="right">Tallos</TableCell>
              <TableCell align="right">Valor $</TableCell>
              {medidas && <TableCell>Medidas cm (L × A × H)</TableCell>}
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {lineas.map((l, i) => (
              <TableRow key={l.key} sx={{ verticalAlign: 'top' }}>
                <TableCell sx={{ pt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {i + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <OpcionAutocomplete
                    sinEtiqueta
                    tipo="fincas"
                    label="Finca"
                    value={l.idFinca}
                    onChange={(id, o) => onCambiar(l.key, { idFinca: id }, o)}
                  />
                </TableCell>
                <TableCell>
                  <OpcionAutocomplete
                    sinEtiqueta
                    tipo="productos"
                    label="Producto"
                    value={l.idProducto}
                    onChange={(id) => onCambiar(l.key, { idProducto: id })}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={l.dae}
                    placeholder="055-2026-40-00000000"
                    onChange={(e) => onCambiar(l.key, { dae: e.target.value })}
                    error={!!l.dae.trim() && !/^\d{3}-\d{4}-\d{2}-\d{8}$/.test(l.dae.trim())}
                    slotProps={{ htmlInput: { 'aria-label': 'DAE', spellCheck: false } }}
                    fullWidth
                    sx={{ '& input': { fontVariantNumeric: 'tabular-nums' } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    select
                    size="small"
                    value={l.idTipoCaja ?? ''}
                    onChange={(e) =>
                      onCambiar(l.key, {
                        idTipoCaja: e.target.value === '' ? null : Number(e.target.value),
                        auto: { ...l.auto, fulls: e.target.value !== '' ? true : l.auto.fulls },
                      })
                    }
                    fullWidth
                    slotProps={{ htmlInput: { 'aria-label': 'Tipo de caja' } }}
                  >
                    <MenuItem value="">
                      <em>mixta</em>
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
                <TableCell align="right">
                  <Numero label="Cajas" value={l.cajas} onChange={editarNumero(l, 'cajas')} />
                </TableCell>
                <TableCell align="right">
                  <Numero label="Fulls" value={l.fulls} auto={l.auto.fulls} onChange={editarNumero(l, 'fulls')} />
                </TableCell>
                <TableCell align="right">
                  <Numero label="Kg" value={l.pesoKg} auto={l.auto.pesoKg} onChange={editarNumero(l, 'pesoKg')} />
                </TableCell>
                <TableCell align="right">
                  <Numero label="Tallos" value={l.tallos} auto={l.auto.tallos} onChange={editarNumero(l, 'tallos')} />
                </TableCell>
                <TableCell align="right">
                  <Numero label="Valor" value={l.valor} auto={l.auto.valor} onChange={editarNumero(l, 'valor')} />
                </TableCell>
                {medidas && (
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {(['largo', 'ancho', 'alto'] as const).map((k) => (
                        <Numero key={k} label={k} value={l[k]} auto={l.auto.medidas} onChange={editarNumero(l, k)} width="33%" />
                      ))}
                    </Stack>
                  </TableCell>
                )}
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="Duplicar línea">
                    <IconButton size="small" onClick={() => onAgregar(l.key)} aria-label="Duplicar línea">
                      <DuplicarIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Quitar línea">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => onQuitar(l.key)}
                        disabled={lineas.length === 1}
                        aria-label="Quitar línea"
                      >
                        <BorrarIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ '& td': { fontWeight: 600, pt: 1.5 } }}>
              <TableCell />
              <TableCell colSpan={4}>Total ({lineas.length} líneas)</TableCell>
              <TableCell align="right" sx={{ pr: '12px !important' }}>{num(tot.cajas, 0)}</TableCell>
              <TableCell align="right" sx={{ pr: '12px !important' }}>{num(tot.fulls, 4)}</TableCell>
              <TableCell align="right" sx={{ pr: '12px !important' }}>{num(tot.kg)}</TableCell>
              <TableCell align="right" sx={{ pr: '12px !important' }}>{num(tot.tallos, 0)}</TableCell>
              <TableCell align="right" sx={{ pr: '12px !important' }}>{num(tot.valor)}</TableCell>
              <TableCell colSpan={medidas ? 2 : 1} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
