'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, InputAdornment, Link as MuiLink, Stack, Tab, Tabs, TextField, Tooltip, Typography } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { AppPage, DataTable, type DataTableColumn } from '@/shared/components/ui';
import { useToast } from '@/shared/providers';
import { formatDate } from '@/shared/utils';
import { useIngresos, useResumenStock } from '../../hooks/useStockGuias';
import type { IngresoResumen, PestanaIngreso } from '../../types/coordinacion';
import { formatoAwb, nombreCorto, textoIngreso } from '../../utils/formato';
import { OpcionAutocomplete } from '../coordinar/OpcionAutocomplete';
import { EstadoIngresoChip, ETIQUETA_INGRESO, situacionGuia, SituacionGuiaTexto } from './EstadosGuias';
import { IngresoGuiasDialog } from './IngresoGuiasDialog';

const PAGE_SIZE = 50;
const nums = { fontVariantNumeric: 'tabular-nums' } as const;

const PESTANAS: Array<{ valor: PestanaIngreso; label: string }> = [
  { valor: 'todos', label: 'Ingresos de guías' },
  { valor: 'activos', label: 'Activos' },
  { valor: 'cancelados', label: 'Cancelados' },
  { valor: 'anulados', label: 'Anulados' },
];

/**
 * La guía del ingreso (96 % trae una sola) en una línea: número, situación y la
 * coordinación que la usa; si hay más, "+N" con todas en el globo.
 */
function GuiasCelda({ i }: { i: IngresoResumen }) {
  const vigentes = i.estado === 'ANULADO' ? i.guias : i.guias.filter((g) => g.estado !== 'ANULADA');
  const g = vigentes[0];
  if (!g) return null;
  const resto = vigentes.length - 1;
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ whiteSpace: 'nowrap' }}>
      <Typography variant="body2" fontWeight={600} sx={nums}>
        {formatoAwb(g.numero)}
      </Typography>
      <SituacionGuiaTexto guia={g} />
      {g.coordinacion &&
        (g.coordinacion.id ? (
          <MuiLink
            component={Link}
            href={`/operacion/coordinaciones/${g.coordinacion.id}`}
            onClick={(e) => e.stopPropagation()}
            variant="body2"
          >
            N° {g.coordinacion.numero}
          </MuiLink>
        ) : (
          <Typography variant="body2" color="text.secondary">
            N° {g.coordinacion.numero}
          </Typography>
        ))}
      {resto > 0 && (
        <Tooltip
          title={vigentes
            .slice(1)
            .map((x) => `${formatoAwb(x.numero)} · ${situacionGuia(x).label}`)
            .join('\n')}
          slotProps={{ tooltip: { sx: { whiteSpace: 'pre-line' } } }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ cursor: 'help' }}>
            +{resto} {resto === 1 ? 'guía' : 'guías'}
          </Typography>
        </Tooltip>
      )}
    </Stack>
  );
}

const columnas: DataTableColumn<IngresoResumen>[] = [
  {
    key: 'numero',
    label: 'Ingreso',
    pinned: true,
    mobile: 'title',
    value: (i) => textoIngreso(i.numero),
    render: (i) => (
      <Typography variant="body2" fontWeight={600} sx={{ ...nums, whiteSpace: 'nowrap' }}>
        {textoIngreso(i.numero)}
      </Typography>
    ),
  },
  { key: 'fecha', label: 'Fecha', value: (i) => formatDate(i.fecha), mobile: 'subtitle' },
  { key: 'aerolinea', label: 'Aerolínea', maxWidth: 170, value: (i) => (i.aerolinea ? nombreCorto(i.aerolinea) : null) },
  {
    key: 'guias',
    label: 'Guía',
    description: 'Guía(s) del ingreso y su situación: libre, coordinada (N° de coordinación), prestada',
    value: (i) => i.guias.map((g) => formatoAwb(g.numero)).join(', '),
    render: (i) => <GuiasCelda i={i} />,
  },
  {
    key: 'referencia',
    label: 'Referencia',
    description: 'Agencia IATA con la que se reservó la guía (su código IATA, como en el sistema viejo)',
    maxWidth: 200,
    value: (i) => i.agencia?.nombre ?? i.referencia,
    render: (i) =>
      i.agencia ? (
        <Tooltip title={i.referencia ?? ''}>
          <span>{i.agencia.nombre}</span>
        </Tooltip>
      ) : (
        (i.referencia ?? '')
      ),
  },
  { key: 'tipo', label: 'Tipo de stock', value: (i) => (i.tipoStock === 'NORMAL' ? 'Normal' : i.tipoStock === 'VIRTUAL' ? 'Virtual' : '—') },
  {
    key: 'estado',
    label: 'Estado',
    value: (i) => (i.estado ? ETIQUETA_INGRESO[i.estado] : null),
    render: (i) => <EstadoIngresoChip estado={i.estado} />,
  },
];

/**
 * Ingreso de guías (menú del sistema viejo Guías › Ingreso): los documentos
 * con los que nace cada guía AWB. Filtros en la URL (?pestana=&q=&aerolinea=&page=).
 */
export function IngresosGuiasPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const toast = useToast();
  const [nuevo, setNuevo] = useState(false);

  const filtros = useMemo(
    () => ({
      pestana: (sp.get('pestana') as PestanaIngreso | null) ?? 'todos',
      q: sp.get('q') ?? undefined,
      idAerolinea: sp.get('aerolinea') ? Number(sp.get('aerolinea')) || undefined : undefined,
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

  const [texto, setTexto] = useState(filtros.q ?? '');
  useEffect(() => {
    const t = setTimeout(() => {
      if ((filtros.q ?? '') !== texto.trim()) actualizar({ q: texto.trim() || undefined });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const { pagina, error, isLoading, isValidating, mutate } = useIngresos(filtros);
  const { mutate: mutateResumen } = useResumenStock();
  const total = pagina?.total ?? 0;

  return (
    <AppPage
      title="Ingreso de guías"
      subtitle="Aquí nace cada guía: el número que da la aerolínea al reservar. Después se coordina."
      actions={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNuevo(true)}>
          Ingreso de guías
        </Button>
      }
    >
      <Tabs
        value={filtros.pestana}
        onChange={(_, v) => actualizar({ pestana: v === 'todos' ? undefined : v })}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {PESTANAS.map((p) => (
          <Tab key={p.valor} value={p.valor} label={p.label} />
        ))}
      </Tabs>
      <DataTable
        id="operacion-ingresos-guias"
        columns={columnas}
        rows={pagina?.items ?? []}
        getRowId={(i) => String(i.id)}
        loading={isLoading || isValidating}
        error={error}
        onRetry={() => mutate()}
        onRefresh={() => mutate()}
        onRowClick={(i) => router.push(`/operacion/guias/ingresos/${i.id}`)}
        emptyMessage="No hay ingresos con esos filtros."
        dense
        filters={
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ width: '100%' }}>
            <TextField
              size="small"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="N° de ingreso, número de guía u observación"
              sx={{ minWidth: 260, flex: '1 1 260px' }}
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
            <Box sx={{ width: 220 }}>
              <OpcionAutocomplete
                tipo="aerolineas"
                label="Aerolínea"
                value={filtros.idAerolinea ?? null}
                onChange={(id) => actualizar({ aerolinea: id ? String(id) : undefined })}
              />
            </Box>
          </Stack>
        }
        pagination={{
          page: filtros.page,
          hasNextPage: filtros.page * PAGE_SIZE < total,
          onPageChange: (p) => actualizar({ page: p > 1 ? String(p) : undefined }, false),
          total: pagina?.total,
          pageSize: PAGE_SIZE,
        }}
      />
      {nuevo && (
        <IngresoGuiasDialog
          open
          onClose={() => setNuevo(false)}
          onGrabado={(r) => {
            toast.success(`Ingreso ${textoIngreso(r.numero)} grabado. Ya se puede coordinar su guía.`);
            mutate();
            mutateResumen();
          }}
        />
      )}
    </AppPage>
  );
}
