'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as AnteriorIcon,
  ChevronRight as SiguienteIcon,
  FileDownloadOutlined as DescargarIcon,
  KeyboardArrowDown as AbrirIcon,
  StickyNote2Outlined as NotaIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useToast } from '@/shared/providers';
import { AppPage, DataTable, type DataTableColumn } from '@/shared/components/ui';
import { formatDate, getErrorMessage, toIsoDate } from '@/shared/utils';
import { useCoordinaciones } from '../hooks/useCoordinaciones';
import type { CoordinacionResumen, EstadoCoordinacion } from '../types/coordinacion';
import { operacionService } from '../services/operacion.service';
import { formatoAwb, kg, nombreCorto, num, ordenDelDia, usd } from '../utils/formato';
import { OpcionAutocomplete } from './coordinar/OpcionAutocomplete';
import { AnuladasTabla } from './AnuladasTabla';
import { ETIQUETA_ESTADO, EstadoCoordinacionChip } from './EstadoCoordinacionChip';

const PAGE_SIZE = 50;

const nums = { fontVariantNumeric: 'tabular-nums' } as const;

const idDe = (sp: URLSearchParams, k: string) => (sp.get(k) ? Number(sp.get(k)) || undefined : undefined);

/** Pestañas de la lista vieja: Todos los documentos / Guías no cortadas / Guía cortada. */
const PESTANAS: Array<{ valor: '' | EstadoCoordinacion; label: string }> = [
  { valor: '', label: 'Todas' },
  { valor: 'BORRADOR', label: 'Por cortar' },
  { valor: 'CORTADO', label: 'Cortadas' },
  { valor: 'ANULADO', label: 'Anuladas' },
];

/** Excel del día de vuelo (los dos de la lista vieja y Reservas por aerolínea). */
const REPORTES_DIA = [
  ['programacion', 'Programación', 'Por guía: fulls, peso, peso cobrable y promedios del día'],
  ['antinarcoticos', 'Antinarcóticos', 'Para la Policía: una fila por finca de cada guía del día'],
  ['reservas', 'Reservas', 'Por aerolínea: una fila por guía con lo que pide la reserva'],
] as const;
type ReporteDia = (typeof REPORTES_DIA)[number][0];

/** Día ± n, en "YYYY-MM-DD". */
const otroDia = (dia: string, n: number) => {
  const d = new Date(`${dia}T12:00:00`);
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
};

/**
 * Columnas en el orden de la lista vieja (Doc. · Manifiesto · Fecha · Marcación ·
 * Cliente · Aerolínea · Guía · Fulls · PCS · KGS · VOL. · Nota), con la guía
 * adelante porque es como se busca.
 */
const columnas: DataTableColumn<CoordinacionResumen>[] = [
  {
    key: 'numero',
    label: 'N°',
    description: 'N° de coordinación (Doc. en el sistema viejo)',
    value: (c) => c.numero,
    render: (c) => (
      <Typography variant="body2" color="text.secondary" sx={nums}>
        {c.numero}
      </Typography>
    ),
    mobile: 'hidden',
  },
  {
    key: 'guia',
    label: 'Guía madre',
    pinned: true,
    mobile: 'title',
    value: (c) => formatoAwb(c.numeroGuia),
    render: (c) => (
      <Typography variant="body2" fontWeight={600} sx={{ ...nums, whiteSpace: 'nowrap' }}>
        {formatoAwb(c.numeroGuia)}
      </Typography>
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
    label: 'Aerolínea',
    value: (c) => (c.aerolinea ? nombreCorto(c.aerolinea) : null),
    maxWidth: 110,
  },
  { key: 'consignatario', label: 'Consignatario', value: (c) => c.consignatario?.nombre, maxWidth: 160 },
  { key: 'cliente', label: 'Cliente', value: (c) => c.cliente?.nombre, maxWidth: 110 },
  {
    key: 'manifiesto',
    label: 'Manifiesto',
    description: 'Manifiesto aduanero (CEC-año-…); llega después del corte',
    value: (c) => c.codigoManifiesto,
    // "CEC-2026-" se repite en todas: se muestra lo que cambia y el código completo al pasar el mouse.
    render: (c) => (
      <Typography variant="body2" color="text.secondary" sx={{ ...nums, whiteSpace: 'nowrap' }}>
        {c.codigoManifiesto?.replace(/^[A-Z]{3}-\d{4}-/, '') ?? ''}
      </Typography>
    ),
  },
  {
    key: 'nota',
    label: 'Nota',
    description: 'Nota de la coordinación (termógrafo…)',
    value: (c) => c.nota,
    render: (c) =>
      c.nota ? (
        <Tooltip title={c.nota}>
          <NotaIcon fontSize="small" color="action" />
        </Tooltip>
      ) : (
        ''
      ),
  },
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
  {
    key: 'cobrable',
    label: 'Peso cobrable',
    description: 'Peso cobrable que da la aerolínea (VOL. en el sistema viejo)',
    align: 'right',
    value: (c) => num(c.pesoCobrable),
  },
  {
    key: 'total',
    label: 'Cobro $',
    description: 'Lo que se cobra al cliente (corte extra); si no hay, el total de la guía madre',
    align: 'right',
    defaultHidden: true,
    value: (c) => usd(c.liqTotal),
  },
];

/**
 * Lista de coordinaciones, pensada como el "día de vuelo" de la lista vieja:
 * pestañas Todas / Por cortar / Cortadas, un día con Hoy y Mañana, y los
 * totales del filtro al pie. Filtros en la URL
 * (?q=&estado=&dia=&aerolinea=&consignatario=&page=) para que "atrás" y los
 * links funcionen. Usa `useSearchParams`: la página que la monta la envuelve
 * en <Suspense>.
 */
export function CoordinacionesListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const dia = sp.get('dia') ?? undefined;
  const filtros = useMemo(
    () => ({
      q: sp.get('q') ?? undefined,
      estado: (sp.get('estado') as EstadoCoordinacion | null) ?? undefined,
      idAerolinea: idDe(sp, 'aerolinea'),
      idConsignatario: idDe(sp, 'consignatario'),
      desde: sp.get('dia') ?? undefined,
      hasta: sp.get('dia') ?? undefined,
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
  const toast = useToast();
  const [bajando, setBajando] = useState<ReporteDia | null>(null);
  const [menuReportes, setMenuReportes] = useState<HTMLElement | null>(null);
  const descargar = async (tipo: ReporteDia) => {
    if (!dia) return;
    setBajando(tipo);
    try {
      await operacionService.descargarReporteDia(tipo, dia, filtros.idAerolinea);
    } catch (e) {
      toast.error(getErrorMessage(e, 'No se pudo generar el reporte.'));
    } finally {
      setBajando(null);
    }
  };
  const total = pagina?.total ?? 0;
  const page = filtros.page;
  const hoy = toIsoDate(new Date());
  const manana = otroDia(hoy, 1);

  // Dentro de un día, como la lista vieja: por aerolínea y después por consignatario.
  const filas = useMemo(() => {
    const items = pagina?.items ?? [];
    if (!dia) return items;
    return [...items].sort(ordenDelDia);
  }, [pagina, dia]);

  const t = pagina?.totales;
  const totales = t
    ? {
        guia: `${total.toLocaleString('es-EC')} ${total === 1 ? 'guía' : 'guías'}`,
        fulls: num(t.fulls),
        cajas: num(t.cajas, 0),
        kgs: num(t.kgs),
        cobrable: kg(t.pesoCobrable),
      }
    : undefined;

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
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
        columnGap={2}
        rowGap={1}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tabs
          value={filtros.estado ?? ''}
          onChange={(_, v) => actualizar({ estado: v || undefined })}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ maxWidth: '100%' }}
        >
          {PESTANAS.map((p) => (
            <Tab key={p.valor} value={p.valor} label={p.label} />
          ))}
        </Tabs>
        {/* El día de vuelo, como el filtro de la lista vieja. */}
        <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
            Vuelo
          </Typography>
          <Tooltip title="Día anterior">
            <span>
              <IconButton size="small" disabled={!dia} onClick={() => dia && actualizar({ dia: otroDia(dia, -1) })} aria-label="Día anterior">
                <AnteriorIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <TextField
            type="date"
            size="small"
            value={dia ?? ''}
            onChange={(e) => actualizar({ dia: e.target.value || undefined })}
            slotProps={{ htmlInput: { 'aria-label': 'Día de vuelo' } }}
            sx={{ width: 150, '& .MuiOutlinedInput-input': { py: 0.75 } }}
          />
          <Tooltip title="Día siguiente">
            <span>
              <IconButton size="small" disabled={!dia} onClick={() => dia && actualizar({ dia: otroDia(dia, 1) })} aria-label="Día siguiente">
                <SiguienteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <ToggleButtonGroup
            exclusive
            value={dia === hoy ? 'hoy' : dia === manana ? 'manana' : !dia ? 'todos' : null}
            onChange={(_, v: string | null) => {
              if (v === 'hoy') actualizar({ dia: hoy });
              else if (v === 'manana') actualizar({ dia: manana });
              else if (v === 'todos') actualizar({ dia: undefined });
            }}
            aria-label="Atajos de día de vuelo"
            sx={{ ml: 0.5 }}
          >
            <ToggleButton value="hoy">Hoy</ToggleButton>
            <ToggleButton value="manana">Mañana</ToggleButton>
            <ToggleButton value="todos">Todos los días</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>
      {filtros.estado === 'ANULADO' ? (
        <AnuladasTabla dia={dia} />
      ) : (
      <DataTable
        id="operacion-coordinaciones"
        // Con un día elegido, la fecha de vuelo sobra.
        columns={dia ? columnas.filter((c) => c.key !== 'vuelo') : columnas}
        rows={filas}
        getRowId={(c) => String(c.id)}
        loading={isLoading || isValidating}
        error={error}
        onRetry={() => mutate()}
        onRefresh={() => mutate()}
        onRowClick={(c) => router.push(`/operacion/coordinaciones/${c.id}`)}
        emptyMessage={dia ? `No hay coordinaciones con vuelo el ${formatDate(dia)}.` : 'No hay coordinaciones con esos filtros.'}
        dense
        totals={totales}
        filters={
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ flex: '1 1 640px' }}>
            <TextField
              size="small"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Guía, guía hija, DAE, N°, marca, finca"
              sx={{ minWidth: 200, flex: '1 1 200px', maxWidth: { sm: 320 } }}
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
            <Box sx={{ width: { xs: '100%', sm: 170 } }}>
              <OpcionAutocomplete
                tipo="aerolineas"
                label="Aerolínea"
                value={filtros.idAerolinea ?? null}
                onChange={(id) => actualizar({ aerolinea: id ? String(id) : undefined })}
              />
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 210 } }}>
              <OpcionAutocomplete
                tipo="consignatarios"
                label="Consignatario"
                value={filtros.idConsignatario ?? null}
                onChange={(id) => actualizar({ consignatario: id ? String(id) : undefined })}
              />
            </Box>
            {/* Los Excel del día (Programación y Antinarcóticos de la lista vieja, y Reservas) en un solo botón:
                salen para el día elegido y la aerolínea, si se filtró. */}
            <Tooltip title={dia ? '' : 'Elija un día de vuelo'}>
              <span>
                <Button
                  variant="outlined"
                  disabled={!dia || bajando !== null || total === 0}
                  startIcon={bajando ? <CircularProgress size={14} color="inherit" /> : <DescargarIcon />}
                  endIcon={<AbrirIcon />}
                  onClick={(e) => setMenuReportes(e.currentTarget)}
                  sx={{ whiteSpace: 'nowrap', height: 40 }}
                >
                  Reportes del día
                </Button>
              </span>
            </Tooltip>
            <Menu anchorEl={menuReportes} open={menuReportes !== null} onClose={() => setMenuReportes(null)}>
              {REPORTES_DIA.map(([tipo, texto, ayuda]) => (
                <MenuItem
                  key={tipo}
                  onClick={() => {
                    setMenuReportes(null);
                    void descargar(tipo);
                  }}
                >
                  <ListItemText primary={texto} secondary={ayuda} />
                </MenuItem>
              ))}
            </Menu>
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
      )}
    </AppPage>
  );
}
