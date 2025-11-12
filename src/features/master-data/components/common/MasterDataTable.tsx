'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TablePagination,
  Box,
  TextField,
  InputAdornment,
  Tooltip,
  Skeleton,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { MasterDataEntity, MasterDataConfig } from '../../types/master-data.types';

interface MasterDataTableProps<T extends MasterDataEntity> {
  config: MasterDataConfig;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView?: (item: T) => void;
  onEdit: (item: T) => void;
  onDelete: (id: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  loading?: boolean;
}

export function MasterDataTable<T extends MasterDataEntity>({
  config,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
  searchValue,
  onSearchChange,
  loading = false,
}: MasterDataTableProps<T>) {
  const handlePageChange = (_: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    onPageSizeChange(newSize);
  };

  return (
    <Box>
      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={`Buscar ${config.entityNamePlural.toLowerCase()}...`}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead sx={{ zIndex: 100 }}>
            <TableRow>
              {config.tableColumns.map((column) => (
                <TableCell key={column.key} sx={{ minWidth: column.width || 120 }}>
                  {column.label}
                </TableCell>
              ))}
              <TableCell
                sx={{
                  minWidth: 120,
                  position: 'sticky',
                  right: 0,
                  bgcolor: 'background.paper',
                  boxShadow: '-4px 0 8px -4px rgba(0,0,0,0.1)',
                  zIndex: 101,
                }}
              >
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {config.tableColumns.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton variant="text" width="80%" height={24} />
                    </TableCell>
                  ))}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      right: 0,
                      bgcolor: 'background.paper',
                      boxShadow: '-4px 0 8px -4px rgba(0,0,0,0.1)',
                      zIndex: 101,
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={config.tableColumns.length + 1}
                  align="center"
                >
                  No hay {config.entityNamePlural.toLowerCase()} disponibles
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow
                  key={item.id}
                >
                  {config.tableColumns.map((column) => (
                    <TableCell
                      key={column.key}
                    >
                      {column.key === 'estado' ? (
                        <Chip
                          label={(item[column.key as keyof T] as boolean) ? 'Activo' : 'Inactivo'}
                          color={(item[column.key as keyof T] as boolean) ? 'success' : 'error'}
                          size="small"
                        />
                      ) : column.render
                        ? column.render(item[column.key as keyof T], item)
                        : String(item[column.key as keyof T] || '')
                      }
                    </TableCell>
                  ))}
                  <TableCell
                    sx={{
                      position: 'sticky',
                      right: 0,
                      bgcolor: 'background.paper',
                      boxShadow: '-4px 0 8px -4px rgba(0,0,0,0.1)',
                      zIndex: 100,
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {onView && (
                        <Tooltip title="Ver detalles" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onView(item)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Editar" arrow>
                        <IconButton
                          size="small"
                          onClick={() => onEdit(item)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar" arrow>
                        <IconButton
                          size="small"
                          onClick={() => onDelete(item[config.idField || 'id'])}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[10, 20, 50, 100]}
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count}`
        }
        labelRowsPerPage="Filas por página"
      />
    </Box>
  );
}