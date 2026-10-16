'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Link as MuiLink,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { AppPage, DataTable, type DataTableColumn } from '@/shared/components/ui';
import { formatDate } from '@/shared/utils';
import { useToast } from '@/shared/providers';
import { IngresarLoteDialog } from './stock/IngresarLoteDialog';
import { MoverGuiaDialog, type MovimientoGuia } from './stock/MoverGuiaDialog';
import { useGuiasMadre, useResumenStock } from '../hooks/useStockGuias';
import type { EstadoGuia, GuiaMadreFila } from '../types/coordinacion';

const PAGE_SIZE = 50;

const ESTADO: Record<EstadoGuia, { label: string; color: 'success' | 'default' | 'warning' }> = {
  INGRESADA: { label: 'Disponible', color: 'success' },
  COORDINADA: { label: 'Coordinada', color: 'default' },
  PRESTADA: { label: 'Prestada', color: 'warning' },
};

const columnas: DataTableColumn<GuiaMadreFila>[] = [
  {
    key: 'numero',
    label: 'Guía (AWB)',
    pinned: true,
    mobile: 'title',
    value: (g) => g.numero,
    render: (g) => (
      <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {g.numero ?? '—'}
      </Typography>
    ),
  },
  {
    key: 'aerolinea',
    label: 'Aerolínea',
    mobile: 'subtitle',
    value: (g) => (g.aerolinea ? `${g.aerolinea.codigo ?? ''} ${g.aerolinea.nombre}`.trim() : null),
  },
  {
    key: 'estado',
    label: 'Estado',
    value: (g) => (g.estado ? ESTADO[g.estado].label : null),
    render: (g) =>
      g.estado ? (
        <Stack direction="row" spacing={0.5}>
          <Chip size="small" variant="outlined" label={ESTADO[g.estado].label} color={ESTADO[g.estado].color} />
          {g.devuelta && <Chip size="small" variant="outlined" label="Devuelta" />}
        </Stack>
      ) : (
        '—'
      ),
  },
  { key: 'tipo', label: 'Tipo', value: (g) => (g.virtual ? 'Virtual' : 'Física') },
  {
    key: 'coordinacion',
    label: 'Coordinación',
    value: (g) => g.coordinacion?.codigoAccess ?? g.coordinacion?.id ?? null,
    render: (g) =>
      g.coordinacion ? (
        <MuiLink component={Link} href={`/operacion/coordinaciones/${g.coordinacion.id}`} onClick={(e) => e.stopPropagation()}>
          N° {g.coordinacion.codigoAccess ?? g.coordinacion.id} · vuelo {formatDate(g.coordinacion.fechaVuelo)}
        </MuiLink>
      ) : (
        ''
      ),
  },
  {
    key: 'lote',
    label: 'Lote',
    value: (g) => (g.lote ? `N° ${g.lote.codigoAccess ?? g.lote.id} · ${formatDate(g.lote.fecha)}` : null),
    defaultHidden: true,
  },
  {
    key: 'prestamo',
    label: 'Préstamo',
    value: (g) =>
      g.fechaPrestamo
        ? `${formatDate(g.fechaPrestamo)}${g.fechaDevolucion ? ` → devuelta ${formatDate(g.fechaDevolucion)}` : ''}`
        : null,
    defaultHidden: true,
  },
  { key: 'obs', label: 'Observaciones', value: (g) => g.observaciones, maxWidth: 240, defaultHidden: true },
];

/** Tarjetas de stock disponible por aerolínea (clic = filtrar). */
function ResumenPorAerolinea({ onElegir, elegida }: { onElegir: (id?: number) => void; elegida?: number }) {
  const { resumen, isLoading } = useResumenStock();
  if (isLoading) return <Skeleton variant="rounded" height={84} sx={{ mb: 2 }} />;
  const conStock = (resumen ?? []).filter((r) => r.disponibles > 0);
  if (conStock.length === 0) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Disponibles para coordinar
      </Typography>
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5}>
        {conStock.map((r) => {
          const id = r.aerolinea?.id;
          const activa = id !== undefined && id === elegida;
          return (
            <Paper
              key={id ?? 'sin'}
              variant="outlined"
              onClick={() => onElegir(activa ? undefined : id)}
              sx={{
                px: 2,
                py: 1.25,
                minWidth: 150,
                cursor: 'pointer',
                borderColor: activa ? 'primary.main' : undefined,
                bgcolor: activa ? 'action.selected' : undefined,
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {r.aerolinea ? `${r.aerolinea.codigo ?? ''} · ${r.aerolinea.nombre}` : 'Sin aerolínea'}
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {r.disponibles}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {r.disponiblesVirtuales ? `${r.disponiblesVirtuales} virtuales` : 'físicas'}
              </Typography>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}

export function StockGuiasPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const filtros = useMemo(
    () => ({
      q: sp.get('q') ?? undefined,
      estado: (sp.get('estado') as EstadoGuia | null) ?? undefined,
      idAerolinea: sp.get('aerolinea') ? Number(sp.get('aerolinea')) : undefined,
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

  const { pagina, error, isLoading, isValidating, mutate } = useGuiasMadre(filtros);
  const { mutate: mutateResumen } = useResumenStock();
  const total = pagina?.total ?? 0;
  const toast = useToast();
  const [ingresando, setIngresando] = useState(false);

  // Solo las guías creadas en el sistema nuevo se mueven desde aquí; las del
  // sistema viejo se mueven allá mientras ese sistema mande.
  const esDelSistemaNuevo = (g: GuiaMadreFila) => g.lote?.codigoAccess === null;
  const [moviendo, setMoviendo] = useState<{ guia: GuiaMadreFila; accion: MovimientoGuia } | null>(null);

  return (
    <AppPage
      title="Stock de guías"
      subtitle="Guías AWB ingresadas por lote: disponibles para coordinar, coordinadas o prestadas a otra agencia."
      actions={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIngresando(true)}>
          Ingresar lote
        </Button>
      }
    >
      <ResumenPorAerolinea
        elegida={filtros.idAerolinea}
        onElegir={(id) => actualizar({ aerolinea: id ? String(id) : undefined, estado: id ? 'INGRESADA' : undefined })}
      />
      <DataTable
        id="operacion-guias-madre"
        columns={columnas}
        rows={pagina?.items ?? []}
        getRowId={(g) => String(g.id)}
        loading={isLoading || isValidating}
        error={error}
        onRetry={() => mutate()}
        onRefresh={() => mutate()}
        emptyMessage="No hay guías con esos filtros."
        actions={[
          {
            label: 'Prestar',
            onClick: (g) => setMoviendo({ guia: g, accion: 'prestar' }),
            hidden: (g) => !esDelSistemaNuevo(g) || g.estado !== 'INGRESADA',
          },
          {
            label: 'Registrar devolución',
            onClick: (g) => setMoviendo({ guia: g, accion: 'devolver' }),
            hidden: (g) => !esDelSistemaNuevo(g) || g.estado !== 'PRESTADA' || g.devuelta,
          },
        ]}
        filters={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
            <TextField
              size="small"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Número AWB"
              sx={{ minWidth: 220, flex: 1 }}
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
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="INGRESADA">Disponibles</MenuItem>
              <MenuItem value="COORDINADA">Coordinadas</MenuItem>
              <MenuItem value="PRESTADA">Prestadas</MenuItem>
            </TextField>
          </Stack>
        }
        pagination={{
          page: filtros.page,
          hasNextPage: filtros.page * PAGE_SIZE < total,
          onPageChange: (p) => actualizar({ page: p > 1 ? String(p) : undefined }, false),
        }}
      />
      <MoverGuiaDialog
        guia={moviendo?.guia ?? null}
        accion={moviendo?.accion ?? 'prestar'}
        onClose={() => setMoviendo(null)}
        onHecho={(m) => {
          toast.success(m);
          mutate();
          mutateResumen();
        }}
      />
      <IngresarLoteDialog
        open={ingresando}
        onClose={() => setIngresando(false)}
        onIngresado={(n) => {
          toast.success(`Se ingresaron ${n} guías al stock.`);
          mutate();
          mutateResumen();
        }}
      />
    </AppPage>
  );
}
