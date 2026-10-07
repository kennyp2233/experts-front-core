'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  InboxOutlined as EmptyIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ViewColumnOutlined as ColumnsIcon,
} from '@mui/icons-material';
import { getErrorMessage } from '../../utils/errors';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  /** Explicación corta (siglas, unidades). Se muestra como tooltip en el encabezado. */
  description?: string;
  /** Valor plano: se usa para la búsqueda y como contenido por defecto de la celda. */
  value?: (row: T) => string | number | null | undefined;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Oculta la columna por defecto (el usuario puede activarla en "Columnas"). */
  defaultHidden?: boolean;
  /** Columna que no se puede ocultar. */
  pinned?: boolean;
  /** Ancho máximo antes de cortar con "…" (default 280px). */
  maxWidth?: number;
  /** Rol en la vista de tarjetas (móvil). Por defecto: campo, si la columna está visible. */
  mobile?: 'title' | 'subtitle' | 'field' | 'hidden';
}

export interface DataTableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  color?: 'default' | 'error';
  hidden?: (row: T) => boolean;
}

export interface DataTablePagination {
  page: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  /** Id estable de la tabla: se usa para recordar las columnas elegidas. */
  id: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T, index: number) => string;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRefresh?: () => void;
  onRowClick?: (row: T) => void;
  isRowClickable?: (row: T) => boolean;
  selectedRowId?: string | null;
  actions?: DataTableAction<T>[];
  /** Búsqueda local sobre las filas cargadas. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Filtros adicionales, a la derecha del buscador. */
  filters?: React.ReactNode;
  pagination?: DataTablePagination;
  /** Fila de totales: valor por key de columna. */
  totals?: Partial<Record<string, React.ReactNode>>;
  emptyMessage?: string;
  /** Alto máximo del área con scroll (el encabezado queda fijo). */
  maxHeight?: number | string;
  /** Oculta la barra superior (búsqueda, conteo, columnas). */
  hideToolbar?: boolean;
}

// Columnas ocultas por tabla, recordadas por navegador (localStorage).
const STORAGE_PREFIX = 'datatable:';
const STORAGE_EVENT = 'datatable-columns';

const storageKey = (id: string) => `${STORAGE_PREFIX}${id}:hidden`;

const readStored = (id: string): string | null => {
  try {
    return window.localStorage.getItem(storageKey(id));
  } catch {
    return null;
  }
};

const writeStored = (id: string, keys: string[]) => {
  try {
    window.localStorage.setItem(storageKey(id), JSON.stringify(keys));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {
    // almacenamiento no disponible: la preferencia vive solo en memoria
  }
};

const subscribeStorage = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  window.addEventListener(STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(STORAGE_EVENT, onChange);
  };
};

const parseStored = (raw: string | null): string[] | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : null;
  } catch {
    return null;
  }
};

const cellText = <T,>(col: DataTableColumn<T>, row: T): string => {
  const v = col.value?.(row);
  return v === null || v === undefined ? '' : String(v);
};

function RowActions<T>({ row, actions }: { row: T; actions: DataTableAction<T>[] }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const visible = actions.filter((a) => !a.hidden?.(row));
  if (visible.length === 0) return null;
  return (
    <>
      <IconButton
        size="small"
        aria-label="Acciones"
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}
      >
        <MoreIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {visible.map((a) => (
          <MenuItem
            key={a.label}
            onClick={() => {
              setAnchor(null);
              a.onClick(row);
            }}
            sx={a.color === 'error' ? { color: 'error.main' } : undefined}
          >
            {a.icon && (
              <ListItemIcon sx={a.color === 'error' ? { color: 'error.main' } : undefined}>
                {a.icon}
              </ListItemIcon>
            )}
            <ListItemText>{a.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export function DataTable<T>({
  id,
  columns,
  rows,
  getRowId,
  loading = false,
  error,
  onRetry,
  onRefresh,
  onRowClick,
  isRowClickable,
  selectedRowId,
  actions,
  searchable = false,
  searchPlaceholder = 'Buscar…',
  filters,
  pagination,
  totals,
  emptyMessage = 'No hay registros para mostrar.',
  maxHeight = 'calc(100vh - 280px)',
  hideToolbar = false,
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const defaultHidden = useMemo(
    () => columns.filter((c) => c.defaultHidden && !c.pinned).map((c) => c.key),
    [columns],
  );
  // En el servidor no hay preferencia guardada (snapshot null) -> sin desajuste de hidratación.
  const stored = useSyncExternalStore(
    subscribeStorage,
    () => readStored(id),
    () => null,
  );
  const [memoryHidden, setMemoryHidden] = useState<string[] | null>(null);
  const hidden = useMemo(() => {
    const allowed = columns.filter((c) => !c.pinned).map((c) => c.key);
    const saved = parseStored(stored) ?? memoryHidden;
    return saved ? saved.filter((k) => allowed.includes(k)) : defaultHidden;
  }, [stored, memoryHidden, columns, defaultHidden]);
  const [query, setQuery] = useState('');
  const [columnsAnchor, setColumnsAnchor] = useState<HTMLElement | null>(null);

  const saveHidden = (next: string[]) => {
    setMemoryHidden(next);
    writeStored(id, next);
  };

  const toggleColumn = (key: string) =>
    saveHidden(hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key]);

  const resetColumns = () => saveHidden(defaultHidden);

  const visibleColumns = columns.filter((c) => !hidden.includes(c.key));
  const hasActions = Boolean(actions && actions.length > 0);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => columns.some((c) => cellText(c, row).toLowerCase().includes(q)));
  }, [rows, columns, query]);

  const clickable = (row: T) => Boolean(onRowClick) && (isRowClickable ? isRowClickable(row) : true);
  const renderCell = (col: DataTableColumn<T>, row: T) =>
    col.render ? col.render(row) : cellText(col, row) || '—';

  const initialLoading = loading && rows.length === 0 && !error;
  const errorMessage = error ? getErrorMessage(error) : null;
  const retry = onRetry ?? onRefresh;

  const countLabel = query.trim()
    ? `${filteredRows.length} de ${rows.length} resultados`
    : `${rows.length} ${rows.length === 1 ? 'resultado' : 'resultados'}`;

  const emptyState = (
    <Stack alignItems="center" spacing={1} sx={{ py: 6, color: 'text.secondary' }}>
      <EmptyIcon />
      <Typography variant="body2">
        {query.trim() ? `Sin resultados para «${query.trim()}».` : emptyMessage}
      </Typography>
    </Stack>
  );

  return (
    <Stack spacing={1.5}>
      {!hideToolbar && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          useFlexGap
          flexWrap="wrap"
        >
          {searchable && (
            <TextField
              size="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              sx={{ minWidth: { sm: 260 }, flex: { sm: '0 1 320px' } }}
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
          )}
          {filters}
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {initialLoading ? 'Cargando…' : countLabel}
              {pagination ? ` · página ${pagination.page}` : ''}
            </Typography>
            {onRefresh && (
              <Tooltip title="Actualizar">
                <span>
                  <IconButton size="small" onClick={onRefresh} disabled={loading} aria-label="Actualizar">
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {!isMobile && columns.some((c) => !c.pinned) && (
              <Button
                size="small"
                variant="text"
                color="inherit"
                startIcon={<ColumnsIcon fontSize="small" />}
                onClick={(e) => setColumnsAnchor(e.currentTarget)}
                sx={{ color: 'text.secondary' }}
              >
                Columnas
              </Button>
            )}
          </Stack>
          <Menu anchorEl={columnsAnchor} open={Boolean(columnsAnchor)} onClose={() => setColumnsAnchor(null)}>
            {columns
              .filter((c) => !c.pinned)
              .map((c) => (
                <MenuItem key={c.key} dense onClick={() => toggleColumn(c.key)}>
                  <Checkbox size="small" checked={!hidden.includes(c.key)} sx={{ p: 0, mr: 1 }} />
                  <ListItemText primary={c.label} secondary={c.description} />
                </MenuItem>
              ))}
            <Divider />
            <MenuItem dense onClick={resetColumns}>
              <ListItemText primary="Restablecer columnas" />
            </MenuItem>
          </Menu>
        </Stack>
      )}

      {errorMessage && (
        <Alert
          severity="error"
          action={
            retry ? (
              <Button color="inherit" size="small" onClick={retry}>
                Reintentar
              </Button>
            ) : undefined
          }
        >
          {errorMessage}
        </Alert>
      )}

      {isMobile ? (
        <Stack spacing={1}>
          {loading && rows.length > 0 && <LinearProgress />}
          {initialLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={96} />
              ))
            : filteredRows.length === 0
              ? !errorMessage && <Paper variant="outlined">{emptyState}</Paper>
              : filteredRows.map((row, index) => {
                  const titleCol =
                    visibleColumns.find((c) => c.mobile === 'title') ?? visibleColumns[0];
                  const subtitleCol = visibleColumns.find((c) => c.mobile === 'subtitle');
                  const fieldCols = visibleColumns
                    .filter(
                      (c) =>
                        c !== titleCol &&
                        c !== subtitleCol &&
                        c.mobile !== 'hidden' &&
                        (c.mobile === 'field' || c.mobile === undefined),
                    )
                    .slice(0, 6);
                  const rowId = getRowId(row, index);
                  return (
                    <Paper
                      key={rowId}
                      variant="outlined"
                      onClick={clickable(row) ? () => onRowClick?.(row) : undefined}
                      sx={{
                        p: 1.5,
                        cursor: clickable(row) ? 'pointer' : 'default',
                        borderColor: selectedRowId === rowId ? 'primary.main' : 'divider',
                      }}
                    >
                      <Stack direction="row" alignItems="flex-start" spacing={1}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          {titleCol && (
                            <Typography variant="subtitle2" fontWeight={600} noWrap>
                              {renderCell(titleCol, row)}
                            </Typography>
                          )}
                          {subtitleCol && (
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {renderCell(subtitleCol, row)}
                            </Typography>
                          )}
                        </Box>
                        {hasActions && <RowActions row={row} actions={actions!} />}
                      </Stack>
                      {fieldCols.length > 0 && (
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            columnGap: 2,
                            rowGap: 0.75,
                            mt: 1,
                          }}
                        >
                          {fieldCols.map((c) => (
                            <Box key={c.key} sx={{ minWidth: 0 }}>
                              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                {c.label}
                              </Typography>
                              <Typography variant="body2" noWrap component="div">
                                {renderCell(c, row)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Paper>
                  );
                })}
        </Stack>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight, position: 'relative' }}>
          {loading && rows.length > 0 && (
            <LinearProgress sx={{ position: 'sticky', top: 0, left: 0, zIndex: 4, height: 3, borderRadius: 0 }} />
          )}
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {visibleColumns.map((c) => (
                  <TableCell key={c.key} align={c.align}>
                    {c.description ? (
                      <Tooltip title={c.description} placement="top">
                        <Box
                          component="span"
                          sx={{ borderBottom: '1px dotted', borderColor: 'text.disabled', cursor: 'help' }}
                        >
                          {c.label}
                        </Box>
                      </Tooltip>
                    ) : (
                      c.label
                    )}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell
                    align="right"
                    sx={{ position: 'sticky', right: 0, zIndex: 3, width: 56 }}
                    aria-label="Acciones"
                  />
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {initialLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {visibleColumns.map((c) => (
                      <TableCell key={c.key}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                    {hasActions && <TableCell />}
                  </TableRow>
                ))
              ) : filteredRows.length === 0 ? (
                !errorMessage && (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + (hasActions ? 1 : 0)}>{emptyState}</TableCell>
                  </TableRow>
                )
              ) : (
                filteredRows.map((row, index) => {
                  const rowId = getRowId(row, index);
                  const isClickable = clickable(row);
                  return (
                    <TableRow
                      key={rowId}
                      hover
                      selected={selectedRowId === rowId}
                      onClick={isClickable ? () => onRowClick?.(row) : undefined}
                      onKeyDown={
                        isClickable
                          ? (e) => {
                              if (e.key === 'Enter') onRowClick?.(row);
                            }
                          : undefined
                      }
                      tabIndex={isClickable ? 0 : undefined}
                      sx={{ cursor: isClickable ? 'pointer' : 'default' }}
                    >
                      {visibleColumns.map((c) => {
                        const text = cellText(c, row);
                        return (
                          <TableCell
                            key={c.key}
                            align={c.align}
                            title={text.length > 24 ? text : undefined}
                            sx={{
                              whiteSpace: 'nowrap',
                              maxWidth: c.maxWidth ?? 280,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontVariantNumeric: c.align === 'right' ? 'tabular-nums' : undefined,
                            }}
                          >
                            {renderCell(c, row)}
                          </TableCell>
                        );
                      })}
                      {hasActions && (
                        <TableCell
                          align="right"
                          sx={{
                            position: 'sticky',
                            right: 0,
                            bgcolor: 'background.paper',
                            py: 0.5,
                          }}
                        >
                          <RowActions row={row} actions={actions!} />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
              {totals && filteredRows.length > 0 && (
                <TableRow>
                  {visibleColumns.map((c, i) => (
                    <TableCell
                      key={c.key}
                      align={c.align}
                      sx={{
                        fontWeight: 600,
                        bgcolor: 'action.hover',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {totals[c.key] ?? (i === 0 ? 'Totales' : '')}
                    </TableCell>
                  ))}
                  {hasActions && <TableCell sx={{ bgcolor: 'action.hover' }} />}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {pagination && (pagination.page > 1 || pagination.hasNextPage) && (
        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
          <Button
            size="small"
            variant="outlined"
            startIcon={<PrevIcon />}
            disabled={pagination.page <= 1 || loading}
            onClick={() => pagination.onPageChange(pagination.page - 1)}
          >
            Anterior
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
            Página {pagination.page}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            endIcon={<NextIcon />}
            disabled={!pagination.hasNextPage || loading}
            onClick={() => pagination.onPageChange(pagination.page + 1)}
          >
            Siguiente
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
