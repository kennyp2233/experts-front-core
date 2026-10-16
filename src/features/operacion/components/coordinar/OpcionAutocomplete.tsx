'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { operacionService } from '../../services/operacion.service';
import type { Opcion, TipoOpcion } from '../../types/coordinacion';

interface Props {
  tipo: TipoOpcion;
  label: string;
  value: number | null;
  onChange: (id: number | null, opcion: Opcion | null) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
  placeholder?: string;
  /** Muestra el código antes del nombre (ej. "AMS · Amsterdam"). */
  conCodigo?: boolean;
  /** Sin etiqueta visible (dentro de una tabla); `label` queda como aria-label. */
  sinEtiqueta?: boolean;
  /** Id del input (para llevar la pantalla hasta el campo). */
  id?: string;
  /** Debajo del campo, el detalle de la opción elegida (p. ej. el cliente de la marca). */
  mostrarDetalle?: boolean;
  /** Qué decir cuando la búsqueda no trae nada (default "Sin resultados"). */
  sinResultados?: React.ReactNode;
  /** Solo guías: las libres de esta aerolínea (como el combo del sistema viejo). */
  idAerolinea?: number | null;
}

const etiqueta = (o: Opcion, conCodigo: boolean) => (conCodigo && o.codigo ? `${o.codigo} · ${o.nombre}` : o.nombre);

/**
 * Buscador de datos maestros activos (GET /operacion/opciones/:tipo). Busca
 * mientras se escribe (300 ms) y, si llega un id ya elegido (al editar), trae
 * esa opción para mostrar su nombre.
 */
export function OpcionAutocomplete({
  tipo,
  label,
  value,
  onChange,
  required,
  error,
  helperText,
  size = 'small',
  disabled,
  placeholder,
  conCodigo = false,
  sinEtiqueta = false,
  id,
  mostrarDetalle = false,
  sinResultados = 'Sin resultados',
  idAerolinea,
}: Props) {
  const [texto, setTexto] = useState('');
  const [q, setQ] = useState('');
  const [elegida, setElegida] = useState<Opcion | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(texto), 300);
    return () => clearTimeout(t);
  }, [texto]);

  const { data: opciones, isLoading } = useSWR(
    disabled ? null : ['operacion/opciones', tipo, q, idAerolinea ?? null],
    () => operacionService.opciones(tipo, q, undefined, idAerolinea),
    { keepPreviousData: true, revalidateOnFocus: false },
  );

  // Opción del id recibido desde afuera (editar / sugerencias).
  const faltante = value !== null && elegida?.id !== value;
  const { data: porId } = useSWR(
    faltante ? ['operacion/opciones', tipo, 'id', value] : null,
    () => operacionService.opciones(tipo, '', [value!]),
    { revalidateOnFocus: false },
  );
  const actual = value === null ? null : elegida?.id === value ? elegida : (porId?.find((o) => o.id === value) ?? null);

  const lista = opciones ?? [];
  const conElegida = actual && !lista.some((o) => o.id === actual.id) ? [actual, ...lista] : lista;

  return (
    <Autocomplete
      id={id}
      size={size}
      fullWidth
      options={conElegida}
      value={actual}
      loading={isLoading}
      disabled={disabled}
      filterOptions={(x) => x}
      onChange={(_, o) => {
        setElegida(o);
        onChange(o?.id ?? null, o);
      }}
      onInputChange={(_, v, reason) => {
        if (reason === 'input') setTexto(v);
        if (reason === 'clear') setTexto('');
      }}
      getOptionLabel={(o) => etiqueta(o, conCodigo)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      noOptionsText={q || tipo === 'guias' ? sinResultados : 'Escribe para buscar'}
      renderOption={({ key, ...props }, o) => (
        <Box component="li" key={key} {...props}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {etiqueta(o, conCodigo)}
            </Typography>
            {(o.detalle || (!conCodigo && o.codigo)) && (
              <Typography variant="caption" color="text.secondary" noWrap component="div">
                {[!conCodigo ? o.codigo : null, o.detalle].filter(Boolean).join(' · ')}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      renderInput={(p) => (
        <TextField
          {...p}
          label={sinEtiqueta ? undefined : label}
          required={required}
          error={error}
          helperText={helperText ?? (mostrarDetalle && actual?.detalle ? actual.detalle : undefined)}
          placeholder={sinEtiqueta ? (placeholder ?? label) : placeholder}
          inputProps={{ ...p.inputProps, 'aria-label': label }}
        />
      )}
    />
  );
}
