'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { AppPage, DataTable, type DataTableColumn } from '@/shared/components/ui';
import { formatDate } from '@/shared/utils';
import { useCoordinaciones } from '../hooks/useCoordinaciones';
import type { CoordinacionResumen, EstadoCoordinacion } from '../types/coordinacion';
import { kg, num, usd } from '../utils/formato';
import { ETIQUETA_ESTADO, EstadoCoordinacionChip } from './EstadoCoordinacionChip';

const PAGE_SIZE = 50;

const columnas: DataTableColumn<CoordinacionResumen>[] = [
  {
    key: 'guia',
    label: 'Guía (AWB)',
    pinned: true,
    mobile: 'title',
    value: (c) => c.numeroGuia,
    render: (c) => (
      <Stack spacing={0}>
        <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {c.numeroGuia ?? '—'}
        </Typography>
        {c.codigoAccess !== null && (
          <Typography variant="caption" color="text.secondary">
            Coord. {c.codigoAccess}
          </Typography>
        )}
      </Stack>
    ),
  },
  { key: 'vuelo', label: 'Vuelo', value: (c) => formatDate(c.fechaVuelo), mobile: 'subtitle' },
  {
    key: 'aerolinea',
    label: 'Aerolínea',
    value: (c) => (c.aerolinea ? `${c.aerolinea.codigo ?? ''} ${c.aerolinea.nombre}`.trim() : null),
  },
  { key: 'consignatario', label: 'Consignatario', value: (c) => c.consignatario?.nombre, maxWidth: 220 },
  {
    key: 'destino',
    label: 'Destino',
    description: 'Aeropuerto de la guía → destino final',
    value: (c) =>
      [c.destino?.codigo, c.destinoFinal?.codigo && c.destinoFinal.codigo !== c.destino?.codigo ? c.destinoFinal.codigo : null]
        .filter(Boolean)
        .join(' → '),
  },
  { key: 'hijas', label: 'Hijas', description: 'Guías hijas (HAWB)', align: 'right', value: (c) => c.guiasHijas },
  { key: 'fulls', label: 'Fulls', align: 'right', value: (c) => num(c.totalFulls) },
  { key: 'cajas', label: 'Cajas', align: 'right', value: (c) => num(c.totalCajas, 0), defaultHidden: true },
  { key: 'kgs', label: 'Peso', align: 'right', value: (c) => kg(c.totalKgs) },
  { key: 'total', label: 'Total', description: 'Lo que se cobra al cliente (o el total de la guía madre)', align: 'right', value: (c) => usd(c.liqTotal) },
  {
    key: 'estado',
    label: 'Estado',
    description: '* = al cliente se le cobró distinto que la guía madre',
    value: (c) => ETIQUETA_ESTADO[c.estado],
    render: (c) => <EstadoCoordinacionChip estado={c.estado} corteExtra={c.corteExtra} />,
  },
];

/**
 * Lista de coordinaciones del sistema nuevo. Los filtros viven en la URL
 * (?q=&estado=&desde=&hasta=&page=) para que "atrás" y los links funcionen.
 * Usa `useSearchParams`: la página que la monta la envuelve en <Suspense>.
 */
export function CoordinacionesListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const filtros = useMemo(
    () => ({
      q: sp.get('q') ?? undefined,
      estado: (sp.get('estado') as EstadoCoordinacion | null) ?? undefined,
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
      subtitle={
        pagina
          ? `${total.toLocaleString('es-EC')} coordinaciones. Las del sistema viejo se actualizan solas cada 15 minutos.`
          : 'Embarques coordinados: guía madre, guías hijas por finca y liquidación.'
      }
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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
            <TextField
              size="small"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="AWB, guía hija, DAE o N° coordinación"
              sx={{ minWidth: 280, flex: 1 }}
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
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="BORRADOR">Abiertas</MenuItem>
              <MenuItem value="CORTADO">Cortadas</MenuItem>
            </TextField>
            <TextField
              type="date"
              size="small"
              label="Vuelo desde"
              value={filtros.desde ?? ''}
              onChange={(e) => actualizar({ desde: e.target.value || undefined })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="date"
              size="small"
              label="hasta"
              value={filtros.hasta ?? ''}
              onChange={(e) => actualizar({ hasta: e.target.value || undefined })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        }
        pagination={{
          page,
          hasNextPage: page * PAGE_SIZE < total,
          onPageChange: (p) => actualizar({ page: p > 1 ? String(p) : undefined }, false),
        }}
      />
    </AppPage>
  );
}
