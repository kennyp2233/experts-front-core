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
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useDaes } from '../hooks/useEbf';

export function DaesTable() {
  const [page, setPage] = useState(1);
  const { page: data, error, isLoading, mutate } = useDaes({ page });

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        No se pudo cargar DAEs: {(error as Error).message}
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

  const columns = data?.columns ?? [];
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
              {columns.map((c) => (
                <TableCell key={c}>{c}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Math.max(columns.length, 1)} align="center">
                  Sin DAEs para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, idx) => (
                <TableRow key={idx} hover>
                  {columns.map((c) => (
                    <TableCell key={c}>{r.raw[c] ?? '—'}</TableCell>
                  ))}
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
    </Stack>
  );
}
