'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useCoordinaciones } from '../hooks/useEbf';
import type { CoordinacionListItem } from '../types/coordinacion';
import { EditCoordinacionDialog } from './EditCoordinacionDialog';
import { DeleteCoordinacionDialog } from './DeleteCoordinacionDialog';

type StringColumnKey = {
  [K in keyof CoordinacionListItem]: CoordinacionListItem[K] extends
    | string
    | null
    ? K
    : never;
}[keyof CoordinacionListItem];

const COLUMNS: { key: StringColumnKey; label: string }[] = [
  { key: 'etd', label: 'ETD' },
  { key: 'awb', label: 'AWB' },
  { key: 'exportador', label: 'Exportador' },
  { key: 'marcacion', label: 'Marcación' },
  { key: 'producto', label: 'Producto' },
  { key: 'dae', label: 'DAE' },
  { key: 'hawb', label: 'HAWB' },
  { key: 'bxsCoo', label: 'BXS-COO' },
  { key: 'pcsCoo', label: 'PCS-COO' },
  { key: 'origen', label: 'Origen' },
  { key: 'destinoAwb', label: 'D. AWB' },
  { key: 'destinoFinal', label: 'D. Final' },
  { key: 'creacion', label: 'Creación' },
];

interface Props {
  includeHistorico?: boolean;
}

export function CoordinacionesTable({ includeHistorico = false }: Props) {
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteRow, setDeleteRow] = useState<CoordinacionListItem | null>(null);
  const { page: data, error, isLoading, mutate } = useCoordinaciones({
    page,
    includeHistorico,
  });

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        No se pudo cargar la lista del portal EBF: {(error as Error).message}
      </Alert>
    );
  }

  if (isLoading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const rows = data?.items ?? [];

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="body2" color="text.secondary">
          {rows.length} resultados — página {data?.page ?? page}
        </Typography>
        <IconButton size="small" onClick={() => mutate()} aria-label="Refrescar">
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableCell key={c.key}>{c.label}</TableCell>
              ))}
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1} align="center">
                  Sin coordinaciones para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, idx) => (
                <TableRow key={r.detalleId ?? `${r.awb}-${idx}`} hover>
                  {COLUMNS.map((c) => (
                    <TableCell key={c.key}>{r[c.key] ?? '—'}</TableCell>
                  ))}
                  <TableCell align="right">
                    {r.detalleId ? (
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          component={Link}
                          href={`/ebf/coordinaciones/${encodeURIComponent(r.detalleId)}`}
                          aria-label="Ver detalle"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {!includeHistorico && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() =>
                                setEditId(parseInt(r.detalleId!, 10))
                              }
                              aria-label="Editar"
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => setDeleteRow(r)}
                              aria-label="Eliminar"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Stack>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button
          size="small"
          disabled={page <= 1 || isLoading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Anterior
        </Button>
        <Button
          size="small"
          disabled={!data?.hasNextPage || isLoading}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
        </Button>
      </Stack>

      <EditCoordinacionDialog
        detalleId={editId}
        open={editId != null}
        onClose={() => setEditId(null)}
        onUpdated={() => {
          mutate();
        }}
      />
      <DeleteCoordinacionDialog
        row={deleteRow}
        onClose={() => setDeleteRow(null)}
        onDeleted={() => {
          mutate();
        }}
      />
    </Stack>
  );
}
