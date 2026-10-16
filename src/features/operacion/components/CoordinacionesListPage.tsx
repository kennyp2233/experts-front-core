'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Box, Button, InputAdornment, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { AppPage, DataTable, type DataTableColumn } from '@/shared/components/ui';
import { formatDate } from '@/shared/utils';
import { useCoordinaciones } from '../hooks/useCoordinaciones';
import type { CoordinacionResumen, EstadoCoordinacion } from '../types/coordinacion';
import { formatoAwb, kg, nombreCorto, num, usd } from '../utils/formato';
import { OpcionAutocomplete } from './coordinar/OpcionAutocomplete';
import { ETIQUETA_ESTADO, EstadoCoordinacionChip } from './EstadoCoordinacionChip';

const PAGE_SIZE = 50;

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

const idDe = (sp: URLSearchParams, k: string) => (sp.get(k) ? Number(sp.get(k)) || undefined : undefined);

const columnas: DataTableColumn<CoordinacionResumen>[] = [
  {
    key: 'guia',
    label: 'Guía madre',
    pinned: true,
    mobile: 'title',
    value: (c) => `${formatoAwb(c.numeroGuia)} N° ${c.codigoAccess ?? c.id}`,
    render: (c) => (
      <Stack spacing={0}>
        <Typography variant="body2" fontWeight={600} sx={{ ...nums, whiteSpace: 'nowrap' }}>
          {formatoAwb(c.numeroGuia)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={nums}>
          N° {c.codigoAccess ?? c.id}
        </Typography>
      </Stack>
    ),
  },
  {
    key: 'estado',
    label: 'Estado',
    value: (c) => ETIQUETA_ESTADO[c.estado],
    render: (c) => <EstadoCoordinacionChip estado={c.estado} />,
  },
  { key: 'vuelo', label: 'Fecha vuelo', value: (c) => formatDate(c.fechaVuelo), mobile: 'subtitle' },
  {
    key: 'aerolinea',
    label: 'Aerol.',
    description: 'Aerolínea (código)',
    value: (c) => c.aerolinea?.codigo ?? (c.aerolinea ? nombreCorto(c.aerolinea) : null),
    render: (c) =>
      c.aerolinea ? (
        <Tooltip title={nombreCorto(c.aerolinea)}>
          <span>{c.aerolinea.codigo ?? nombreCorto(c.aerolinea)}</span>
        </Tooltip>
      ) : (
        '—'
      ),
  },
  { key: 'consignatario', label: 'Consignatario', value: (c) => c.consignatario?.nombre, maxWidth: 190 },
  { key: 'cliente', label: 'Cliente', value: (c) => c.cliente?.nombre, maxWidth: 140 },
  {
    key: 'destino',
    label: 'Destino',
    description: 'Destino de la guía → destino final',
    defaultHidden: true,
    value: (c) =>
      [c.destino?.codigo, c.destinoFinal?.codigo && c.destinoFinal.codigo !== c.destino?.codigo ? c.destinoFinal.codigo : null]
        .filter(Boolean)
        .join(' → '),
  },
  {
    key: 'hijas',
    label: 'G. hijas',
    description: 'Guías hijas (HAWB)',
    align: 'right',
    defaultHidden: true,
    value: (c) => c.guiasHijas,
  },
  { key: 'fulls', label: 'Fulls', align: 'right', value: (c) => num(c.totalFulls) },
  { key: 'cajas', label: 'Cajas', align: 'right', value: (c) => num(c.totalCajas, 0) },
  { key: 'kgs', label: 'Kg', align: 'right', value: (c) => num(c.totalKgs) },
  { key: 'cobrable', label: 'Peso cobrable', align: 'right', value: (c) => kg(c.pesoCobrable), defaultHidden: true },
  {
    key: 'total',
    label: 'Cobro $',
    description: 'Lo que se cobra al cliente (corte extra); si no hay, el total de la guía madre',
    align: 'right',
    value: (c) => usd(c.liqTotal),
  },
];

/**
 * Lista de coordinaciones. Los filtros viven en la URL
 * (?q=&estado=&aerolinea=&consignatario=&desde=&hasta=&page=) para que "atrás"
 * y los links funcionen. Usa `useSearchParams`: la página que la monta la
 * envuelve en <Suspense>.
 */
export function CoordinacionesListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const filtros = useMemo(
    () => ({
      q: sp.get('q') ?? undefined,
      estado: (sp.get('estado') as EstadoCoordinacion | null) ?? undefined,
      idAerolinea: idDe(sp, 'aerolinea'),
      idConsignatario: idDe(sp, 'consignatario'),
      desde: sp.get('desde') ?? undefined,
      hasta: sp.get('hasta') ?? undefined,
      page: Number(sp.get('page') ?? '1') || 1,
      pageSize: PAGE_SIZE,
    }),
    [sp],
  );

  const actualizar = (cambios: Record<string, string | undefined>, resetPage = true) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    if (resetPage) p.delete('page');
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Búsqueda: se aplica 400 ms después de dejar de escribir.
  const [texto, setTexto] = useState(filtros.q ?? '');
  useEffect(() => {
    const t = setTimeout(() => {
      if ((filtros.q ?? '') !== texto.trim()) actualizar({ q: texto.trim() || undefined });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const { pagina, error, isLoading, isValidating, mutate } = useCoordinaciones(filtros);
  const total = pagina?.total ?? 0;
  const page = filtros.page;

  return (
    <AppPage
      title="Coordinaciones"
      subtitle="Las del sistema viejo se actualizan solas cada 15 minutos."
      actions={
        <Button component={Link} href="/operacion/coordinaciones/nueva" variant="contained" startIcon={<AddIcon />}>
          Nueva coordinación
        </Button>
      }
    >
      <DataTable
        id="operacion-coordinaciones"
        columns={columnas}
        rows={pagina?.items ?? []}
        getRowId={(c) => String(c.id)}
        loading={isLoading || isValidating}
        error={error}
        onRetry={() => mutate()}
        onRefresh={() => mutate()}
        onRowClick={(c) => router.push(`/operacion/coordinaciones/${c.id}`)}
        emptyMessage="No hay coordinaciones con esos filtros."
        filters={
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ width: '100%' }}>
            <TextField
              size="small"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Guía, guía hija, DAE, N°, marca o finca"
              sx={{ minWidth: 220, flex: '1 1 220px' }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              select
              size="small"
              label="Estado"
              value={filtros.estado ?? ''}
              onChange={(e) => actualizar({ estado: e.target.value || undefined })}
              sx={{ width: 120 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="BORRADOR">Abiertas</MenuItem>
              <MenuItem value="CORTADO">Cortadas</MenuItem>
            </TextField>
            <Box sx={{ width: 170 }}>
              <OpcionAutocomplete
                tipo="aerolineas"
                label="Aerolínea"
                conCodigo
                value={filtros.idAerolinea ?? null}
                onChange={(id) => actualizar({ aerolinea: id ? String(id) : undefined })}
              />
            </Box>
            <Box sx={{ width: 210 }}>
              <OpcionAutocomplete
                tipo="consignatarios"
                label="Consignatario"
                value={filtros.idConsignatario ?? null}
                onChange={(id) => actualizar({ consignatario: id ? String(id) : undefined })}
              />
            </Box>
            <TextField
              type="date"
              size="small"
              label="Vuelo desde"
              value={filtros.desde ?? ''}
              onChange={(e) => actualizar({ desde: e.target.value || undefined })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 145 }}
            />
            <TextField
              type="date"
              size="small"
              label="hasta"
              value={filtros.hasta ?? ''}
              onChange={(e) => actualizar({ hasta: e.target.value || undefined })}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ width: 145 }}
            />
          </Stack>
        }
        pagination={{
          page,
          hasNextPage: page * PAGE_SIZE < total,
          onPageChange: (p) => actualizar({ page: p > 1 ? String(p) : undefined }, false),
          total: pagina?.total,
          pageSize: PAGE_SIZE,
        }}
      />
    </AppPage>
  );
}
