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
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { AppPage, DataTable, type DataTableColumn } from '@/shared/components/ui';
import { formatDate, getErrorMessage } from '@/shared/utils';
import { useToast } from '@/shared/providers';
import { useGuiasMadre, useResumenStock } from '../../hooks/useStockGuias';
import { operacionService } from '../../services/operacion.service';
import type { EstadoGuia, GuiaMadreFila } from '../../types/coordinacion';
import { formatoAwb, nombreCorto, textoIngreso } from '../../utils/formato';
import { OpcionAutocomplete } from '../coordinar/OpcionAutocomplete';
import { MoverGuiaDialog, type MovimientoGuia } from '../stock/MoverGuiaDialog';
import { situacionGuia, SituacionGuiaChip } from './EstadosGuias';

const PAGE_SIZE = 50;
const nums = { fontVariantNumeric: 'tabular-nums' } as const;

/** Pestañas del sistema viejo (frmPIN_ManGuias). */
const PESTANAS: Array<{ valor: '' | EstadoGuia; label: string }> = [
  { valor: '', label: 'Guías' },
  { valor: 'INGRESADA', label: 'Activas (libres)' },
  { valor: 'COORDINADA', label: 'Coordinadas' },
  { valor: 'PRESTADA', label: 'Prestadas y/o devueltas' },
];

const columnas: DataTableColumn<GuiaMadreFila>[] = [
  {
    key: 'numero',
    label: 'Número de guía',
    pinned: true,
    mobile: 'title',
    value: (g) => formatoAwb(g.numero),
    render: (g) => (
      <Typography variant="body2" fontWeight={600} sx={{ ...nums, whiteSpace: 'nowrap' }}>
        {formatoAwb(g.numero)}
      </Typography>
    ),
  },
  {
    key: 'ingreso',
    label: 'Ingreso',
    value: (g) => (g.lote ? textoIngreso(g.lote.numero) : null),
    render: (g) =>
      g.lote ? (
        <MuiLink component={Link} href={`/operacion/guias/ingresos/${g.lote.id}`} onClick={(e) => e.stopPropagation()} sx={nums}>
          {textoIngreso(g.lote.numero)}
        </MuiLink>
      ) : (
        '—'
      ),
  },
  { key: 'fechaIngreso', label: 'Fecha ingreso', value: (g) => formatDate(g.lote?.fecha) },
  {
    key: 'aerolinea',
    label: 'Aerolínea',
    mobile: 'subtitle',
    maxWidth: 170,
    value: (g) => (g.aerolinea ? [g.aerolinea.codigo, nombreCorto(g.aerolinea)].filter(Boolean).join(' · ') : null),
  },
  {
    key: 'situacion',
    label: 'Situación',
    value: (g) => situacionGuia({ estado: g.estado, devuelta: g.devuelta }).label,
    render: (g) => <SituacionGuiaChip guia={{ estado: g.estado, devuelta: g.devuelta }} />,
  },
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
  { key: 'prestamo', label: 'Fecha préstamo', value: (g) => (g.fechaPrestamo ? formatDate(g.fechaPrestamo) : null) },
  { key: 'devolucion', label: 'Fecha devolución', value: (g) => (g.fechaDevolucion ? formatDate(g.fechaDevolucion) : null), defaultHidden: true },
  { key: 'obs', label: 'Observaciones', value: (g) => g.observaciones, maxWidth: 220 },
  { key: 'tipo', label: 'Tipo de stock', value: (g) => (g.virtual ? 'Virtual' : 'Normal'), defaultHidden: true },
];

/** Guías libres por aerolínea, en una línea (clic = ver las libres de esa aerolínea). */
function GuiasLibres({ onElegir, elegida }: { onElegir: (id?: number) => void; elegida?: number }) {
  const { resumen, isLoading } = useResumenStock();
  if (isLoading) return <Skeleton variant="rounded" height={32} sx={{ mb: 2 }} />;
  const conStock = (resumen ?? []).filter((r) => r.disponibles > 0);
  if (conStock.length === 0) return null;
  return (
    <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} alignItems="center" sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
        Guías libres:
      </Typography>
      {conStock.map((r) => {
        const id = r.aerolinea?.id;
        const activa = id !== undefined && id === elegida;
        const nombre = r.aerolinea ? [r.aerolinea.codigo, nombreCorto(r.aerolinea)].filter(Boolean).join(' · ') : 'Sin aerolínea';
        return (
          <Tooltip key={id ?? 'sin'} title={r.disponiblesVirtuales ? `${r.disponiblesVirtuales} de ellas virtuales` : 'Todas normales'}>
            <Chip
              clickable
              color={activa ? 'primary' : 'default'}
              variant={activa ? 'filled' : 'outlined'}
              onClick={() => onElegir(activa ? undefined : id)}
              label={
                <span>
                  {nombre} <strong style={nums}>{r.disponibles}</strong>
                </span>
              }
            />
          </Tooltip>
        );
      })}
    </Stack>
  );
}

/**
 * Administración de guías (sistema viejo: Guías › Administración,
 * "Mantenimiento Maestro de Guias"): todas las guías, para marcar préstamo y
 * devolución y verificar su estado contra la coordinación.
 */
export function AdministracionGuiasPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const toast = useToast();

  const filtros = useMemo(
    () => ({
      q: sp.get('q') ?? undefined,
      estado: (sp.get('estado') as EstadoGuia | null) ?? undefined,
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

  const { pagina, error, isLoading, isValidating, mutate } = useGuiasMadre(filtros);
  const { mutate: mutateResumen } = useResumenStock();
  const total = pagina?.total ?? 0;
  const refrescar = () => {
    mutate();
    mutateResumen();
  };

  // Mientras manden los dos sistemas, solo se mueven aquí las guías ingresadas en el nuevo.
  const delSistemaNuevo = (g: GuiaMadreFila) => g.lote?.codigoAccess === null;
  const [moviendo, setMoviendo] = useState<{ guia: GuiaMadreFila; accion: MovimientoGuia } | null>(null);

  const ejecutar = async (g: GuiaMadreFila, a: 'quitar' | 'verificar') => {
    try {
      if (a === 'quitar') await operacionService.quitarPrestamo(g.id);
      else await operacionService.verificarGuia(g.id);
      toast.success(a === 'quitar' ? `Guía ${formatoAwb(g.numero)} libre otra vez.` : `Estado de la guía ${formatoAwb(g.numero)} verificado.`);
      refrescar();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <AppPage
      title="Administración de guías"
      subtitle="Todas las guías ingresadas: préstamos, devoluciones y su coordinación."
      actions={
        <Button component={Link} href="/operacion/guias/ingresos" variant="outlined">
          Ingreso de guías
        </Button>
      }
    >
      <GuiasLibres
        elegida={filtros.idAerolinea}
        onElegir={(id) => actualizar({ aerolinea: id ? String(id) : undefined, estado: id ? 'INGRESADA' : undefined })}
      />
      <Tabs
        value={filtros.estado ?? ''}
        onChange={(_, v) => actualizar({ estado: v || undefined })}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {PESTANAS.map((p) => (
          <Tab key={p.valor} value={p.valor} label={p.label} />
        ))}
      </Tabs>
      <DataTable
        id="operacion-administracion-guias"
        columns={columnas}
        rows={pagina?.items ?? []}
        getRowId={(g) => String(g.id)}
        loading={isLoading || isValidating}
        error={error}
        onRetry={() => mutate()}
        onRefresh={() => mutate()}
        onRowClick={(g) => g.lote && router.push(`/operacion/guias/ingresos/${g.lote.id}`)}
        emptyMessage="No hay guías con esos filtros."
        actions={[
          {
            label: 'Prestar',
            onClick: (g) => setMoviendo({ guia: g, accion: 'prestar' }),
            hidden: (g) => !delSistemaNuevo(g) || g.estado !== 'INGRESADA',
          },
          {
            label: 'Quitar préstamo',
            onClick: (g) => ejecutar(g, 'quitar'),
            hidden: (g) => !delSistemaNuevo(g) || g.estado !== 'PRESTADA',
          },
          {
            label: 'Registrar devolución',
            onClick: (g) => setMoviendo({ guia: g, accion: 'devolver' }),
            hidden: (g) => !delSistemaNuevo(g) || g.estado !== 'PRESTADA' || g.devuelta,
          },
          {
            label: 'Verificar estado',
            onClick: (g) => ejecutar(g, 'verificar'),
            hidden: (g) => !delSistemaNuevo(g),
          },
        ]}
        filters={
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ width: '100%' }}>
            <TextField
              size="small"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Número de guía"
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
            <Box sx={{ width: 220 }}>
              <OpcionAutocomplete
                tipo="aerolineas"
                label="Aerolínea"
                conCodigo
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
      <MoverGuiaDialog
        guia={moviendo?.guia ?? null}
        accion={moviendo?.accion ?? 'prestar'}
        onClose={() => setMoviendo(null)}
        onHecho={(m) => {
          toast.success(m);
          refrescar();
        }}
      />
    </AppPage>
  );
}
