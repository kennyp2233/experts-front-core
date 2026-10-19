'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as NuevoIcon,
  ArrowBack as VolverIcon,
  Close as CerrarIcon,
  Search as SearchIcon,
  SyncOutlined as SyncIcon,
} from '@mui/icons-material';
import { AppPage, DataTable, type DataTableColumn } from '@/shared/components/ui';
import { getErrorMessage } from '@/shared/utils';
import { useEntidadesMaestros, useFichaMaestro, useListaMaestro } from '../hooks/useMaestros';
import type { FilaMaestro } from '../types';
import { FichaRegistro } from './FichaRegistro';
import { PanelMaestro } from './PanelMaestro';

const AVISO =
  'Vienen del sistema viejo y se actualizan solos. Mientras se use el sistema viejo, lo que viene de allá se cambia allá; aquí se pueden crear nuevos y cambiar los creados aquí.';
const AVISO_SOLO_LECTURA = 'Vienen del sistema viejo y se actualizan solos; se editan allá.';

/** Índice: entidades agrupadas, con su cantidad de registros. */
export function MaestrosIndexPage() {
  const { entidades, error, isLoading, mutate } = useEntidadesMaestros();
  const grupos = useMemo(() => {
    const m = new Map<string, NonNullable<typeof entidades>>();
    for (const e of entidades ?? []) m.set(e.grupo, [...(m.get(e.grupo) ?? []), e]);
    return [...m.entries()];
  }, [entidades]);

  return (
    <AppPage title="Datos maestros" subtitle={AVISO}>
      {error && (
        <Alert severity="error" action={<Button onClick={() => mutate()}>Reintentar</Button>}>
          {getErrorMessage(error)}
        </Alert>
      )}
      {isLoading && <Skeleton variant="rounded" height={240} />}
      <Stack spacing={3}>
        {grupos.map(([grupo, lista]) => (
          <Box key={grupo}>
            <Typography variant="overline" color="text.secondary">
              {grupo}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              }}
            >
              {lista.map((e) => (
                <Paper
                  key={e.clave}
                  component={Link}
                  href={`/maestros/${e.clave}`}
                  variant="outlined"
                  sx={{
                    p: 2,
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                    <Typography fontWeight={600}>{e.titulo}</Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {e.total.toLocaleString('es-EC')}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {e.descripcion}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        ))}
      </Stack>
    </AppPage>
  );
}

const PAGE_SIZE = 50;

const columnasDe = (marcarNuevos: boolean): DataTableColumn<FilaMaestro>[] => [
  {
    key: 'nombre',
    label: 'Nombre',
    pinned: true,
    mobile: 'title',
    value: (f) => f.nombre,
    render: (f) => (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {f.nombre}
        </Typography>
        {marcarNuevos && f.nuevo && <Chip size="small" color="primary" variant="outlined" label="Creado aquí" />}
      </Stack>
    ),
    maxWidth: 380,
  },
  { key: 'codigo', label: 'Código', value: (f) => f.codigo, mobile: 'subtitle' },
  { key: 'detalle', label: 'Detalle', value: (f) => f.detalle, maxWidth: 320 },
  {
    key: 'activo',
    label: 'Estado',
    value: (f) => (f.activo === null ? '' : f.activo ? 'Activo' : 'Inactivo'),
    render: (f) =>
      f.activo === null ? null : (
        <Chip size="small" variant="outlined" label={f.activo ? 'Activo' : 'Inactivo'} color={f.activo ? 'success' : 'default'} />
      ),
  },
];

function Ficha({ entidad, id, onClose }: { entidad: string; id: string | number | null; onClose: () => void }) {
  const { ficha, error, isLoading } = useFichaMaestro(entidad, id);
  return (
    <Drawer anchor="right" open={id !== null} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 640 } } }}>
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {ficha?.titulo}
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {ficha?.fila.nombre ?? ' '}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Cerrar">
            <CerrarIcon />
          </IconButton>
        </Stack>
        {error && <Alert severity="error">{getErrorMessage(error)}</Alert>}
        {isLoading && <Skeleton variant="rounded" height={320} />}
        {ficha && <FichaRegistro registro={ficha.registro} />}
      </Box>
    </Drawer>
  );
}

/** Lista de una entidad con búsqueda en el servidor y ficha lateral. */
export function MaestroListaPage({ entidad }: { entidad: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const q = sp.get('q') ?? undefined;
  const page = Number(sp.get('page') ?? '1') || 1;
  const abierto = sp.get('id');
  const creando = sp.get('nuevo') === '1';

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

  const [texto, setTexto] = useState(q ?? '');
  useEffect(() => {
    const t = setTimeout(() => {
      if ((q ?? '') !== texto.trim()) actualizar({ q: texto.trim() || undefined });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const { pagina, error, isLoading, isValidating, mutate } = useListaMaestro(entidad, q, page);
  const total = pagina?.total ?? 0;
  const edicion = pagina?.edicion ?? null;
  const columnas = useMemo(() => columnasDe(edicion?.modo === 'sombra'), [edicion?.modo]);

  return (
    <AppPage
      title={pagina?.titulo ?? 'Datos maestros'}
      subtitle={pagina?.descripcion}
      actions={
        <>
          {pagina && !edicion && (
            <Chip size="small" icon={<SyncIcon />} label="Solo lectura · sincronizado" variant="outlined" title={AVISO_SOLO_LECTURA} />
          )}
          {edicion?.modo === 'sombra' && (
            <Chip size="small" icon={<SyncIcon />} label="Lo del sistema viejo se cambia allá" variant="outlined" title={AVISO} />
          )}
          <Button component={Link} href="/maestros" startIcon={<VolverIcon />}>
            Datos maestros
          </Button>
          {edicion && (
            <Button variant="contained" startIcon={<NuevoIcon />} onClick={() => actualizar({ nuevo: '1', id: undefined }, false)}>
              {edicion.femenino ? 'Nueva' : 'Nuevo'} {edicion.singular}
            </Button>
          )}
        </>
      }
    >
      <DataTable
        id={`maestros-${entidad}`}
        columns={columnas}
        rows={pagina?.items ?? []}
        getRowId={(f) => String(f.id)}
        loading={isLoading || isValidating}
        error={error}
        onRetry={() => mutate()}
        onRefresh={() => mutate()}
        onRowClick={(f) => actualizar({ id: String(f.id) }, false)}
        selectedRowId={abierto}
        emptyMessage="Sin resultados."
        filters={
          <TextField
            size="small"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar por nombre, código, RUC…"
            sx={{ minWidth: 280 }}
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
        }
        pagination={{
          page,
          hasNextPage: page * PAGE_SIZE < total,
          onPageChange: (p) => actualizar({ page: p > 1 ? String(p) : undefined }, false),
        }}
      />
      {pagina && !edicion && <Ficha entidad={entidad} id={abierto} onClose={() => actualizar({ id: undefined }, false)} />}
      {edicion && (
        <PanelMaestro
          entidad={entidad}
          id={creando ? null : abierto}
          nuevo={creando}
          onCerrar={() => actualizar({ id: undefined, nuevo: undefined }, false)}
          onCreado={(id) => actualizar({ id: String(id), nuevo: undefined }, false)}
          onGuardado={() => mutate()}
        />
      )}
    </AppPage>
  );
}
