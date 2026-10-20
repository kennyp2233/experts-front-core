'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  InputAdornment,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Search as BuscarIcon } from '@mui/icons-material';
import { getErrorMessage } from '@/shared/utils';
import { fechaCorta, formatoGuia, type GuiaLista, nombreEstado, num, useGuiasCliente } from './portal';

export function EstadoChip({ estado }: { estado: GuiaLista['estado'] }) {
  return <Chip size="small" variant="outlined" color={estado === 'DESPACHADA' ? 'success' : 'warning'} label={nombreEstado(estado)} />;
}

const celdaNum = { textAlign: 'right' as const, whiteSpace: 'nowrap' as const };

/**
 * "Mis guías": las guías de los clientes del usuario, de la más nueva a la más
 * vieja, con filtro por fechas y búsqueda por número de guía o de guía hija.
 */
export function MisGuiasPage() {
  const router = useRouter();
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [texto, setTexto] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  // La búsqueda espera a que el cliente termine de escribir.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(texto.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [texto]);

  const { data, error, isLoading, mutate } = useGuiasCliente({ desde, hasta, q, page });
  const items = data?.items ?? [];
  const paginas = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const totales = items.reduce((t, g) => ({ fulls: t.fulls + g.fulls, cajas: t.cajas + g.cajas, kgs: t.kgs + g.kgs }), { fulls: 0, cajas: 0, kgs: 0 });
  const hayFiltros = !!(desde || hasta || texto);

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5" component="h1" fontWeight={600}>
          Mis guías
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sus envíos, de la guía más reciente a la más antigua. Toque una guía para ver el detalle y lo que se le cobra.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <TextField
            size="small"
            label="Buscar guía o guía hija"
            placeholder="Ej. 369-1176 3920 o 12034150"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            sx={{ flex: 1, minWidth: { md: 280 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <BuscarIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            size="small"
            type="date"
            label="Vuelo desde"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setPage(1);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="date"
            label="Vuelo hasta"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setPage(1);
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {hayFiltros && (
            <Button
              onClick={() => {
                setDesde('');
                setHasta('');
                setTexto('');
                setQ('');
                setPage(1);
              }}
            >
              Quitar filtros
            </Button>
          )}
        </Stack>
      </Paper>

      {error ? (
        <Alert severity="error" action={<Button onClick={() => mutate()}>Reintentar</Button>}>
          {getErrorMessage(error, 'No se pudieron cargar sus guías.')}
        </Alert>
      ) : isLoading || !data ? (
        <Stack spacing={1}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={52} />
          ))}
        </Stack>
      ) : items.length === 0 ? (
        <Alert severity="info">{hayFiltros ? 'No hay guías con esos filtros.' : 'Todavía no tiene guías.'}</Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary">
            {data.total.toLocaleString('es-EC')} {data.total === 1 ? 'guía' : 'guías'}
            {paginas > 1 ? ` · página ${data.page} de ${paginas}` : ''}
          </Typography>

          {/* Escritorio: tabla */}
          <TableContainer component={Paper} variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Guía</TableCell>
                  <TableCell>Fecha de vuelo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Aerolínea</TableCell>
                  <TableCell>Marca</TableCell>
                  <TableCell>Destino</TableCell>
                  <TableCell sx={celdaNum}>Fulls</TableCell>
                  <TableCell sx={celdaNum}>Cajas</TableCell>
                  <TableCell sx={celdaNum}>Kg</TableCell>
                  <TableCell sx={celdaNum}>Guías hijas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((g) => (
                  <TableRow key={g.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/portal-clientes/guias/${g.id}`)}>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {/* La fila entera abre la guía; el enlace queda para teclado y "abrir en otra pestaña", sin subrayado. */}
                      <Link href={`/portal-clientes/guias/${g.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {formatoGuia(g.numeroGuia)}
                      </Link>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fechaCorta(g.fechaVuelo)}</TableCell>
                    <TableCell>
                      <EstadoChip estado={g.estado} />
                    </TableCell>
                    <TableCell>{g.aerolinea?.nombre ?? '—'}</TableCell>
                    <TableCell>{g.marca?.nombre ?? '—'}</TableCell>
                    <TableCell>{g.destino?.nombre ?? '—'}</TableCell>
                    <TableCell sx={celdaNum}>{num(g.fulls)}</TableCell>
                    <TableCell sx={celdaNum}>{num(g.cajas)}</TableCell>
                    <TableCell sx={celdaNum}>{num(g.kgs)}</TableCell>
                    <TableCell sx={celdaNum}>{g.guiasHijas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} sx={{ fontWeight: 700 }}>
                    Total de las guías de esta página
                  </TableCell>
                  <TableCell sx={{ ...celdaNum, fontWeight: 700 }}>{num(totales.fulls)}</TableCell>
                  <TableCell sx={{ ...celdaNum, fontWeight: 700 }}>{num(totales.cajas)}</TableCell>
                  <TableCell sx={{ ...celdaNum, fontWeight: 700 }}>{num(totales.kgs)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>

          {/* Celular: una tarjeta por guía */}
          <Stack spacing={1.25} sx={{ display: { xs: 'flex', md: 'none' } }}>
            {items.map((g) => (
              <Card key={g.id} variant="outlined">
                <CardActionArea component={Link} href={`/portal-clientes/guias/${g.id}`} sx={{ p: 1.75 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700}>{formatoGuia(g.numeroGuia)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {fechaCorta(g.fechaVuelo)} · {g.aerolinea?.nombre ?? '—'}
                      </Typography>
                      <Typography variant="body2">{g.marca?.nombre ?? '—'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {g.destino?.nombre ?? '—'}
                      </Typography>
                    </Box>
                    <EstadoChip estado={g.estado} />
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {num(g.fulls)} fulls · {num(g.cajas)} cajas · {num(g.kgs)} kg
                  </Typography>
                </CardActionArea>
              </Card>
            ))}
            <Typography variant="body2" fontWeight={700}>
              Total de esta página: {num(totales.fulls)} fulls · {num(totales.cajas)} cajas · {num(totales.kgs)} kg
            </Typography>
          </Stack>

          {paginas > 1 && (
            <Stack alignItems="center">
              <Pagination count={paginas} page={data.page} onChange={(_, p) => setPage(p)} color="primary" siblingCount={1} />
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
