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
  alpha,
  Tooltip,
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
    // For simplicity, keeping pageSize fixed, but this could be made configurable
    console.log('Rows per page changed:', event.target.value);
  };

  // Check if items have estado field
  const hasEstadoField = data.length > 0 && 'estado' in data[0];

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
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
              },
              '&.Mui-focused': {
                bgcolor: 'background.paper',
              },
            },
          }}
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
      <TableContainer 
        component={Paper} 
        elevation={0}
        sx={{ 
          border: 1, 
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow 
              sx={{ 
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
              }}
            >
              {config.tableColumns.map((column) => (
                <TableCell 
                  key={column.key} 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    py: 2,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
              {hasEstadoField && (
                <TableCell 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    py: 2,
                  }}
                >
                  Estado
                </TableCell>
              )}
              <TableCell 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                  py: 2,
                }}
              >
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell 
                  colSpan={config.tableColumns.length + (hasEstadoField ? 2 : 1)} 
                  align="center"
                  sx={{ py: 8, color: 'text.secondary' }}
                >
                  Cargando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={config.tableColumns.length + (hasEstadoField ? 2 : 1)} 
                  align="center"
                  sx={{ py: 8, color: 'text.secondary' }}
                >
                  No hay {config.entityNamePlural.toLowerCase()} disponibles
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow 
                  key={item.id} 
                  hover
                  sx={{
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
                    },
                    '&:last-child td': {
                      borderBottom: 0,
                    },
                  }}
                >
                  {config.tableColumns.map((column) => (
                    <TableCell 
                      key={column.key}
                      sx={{ py: 2 }}
                    >
                      {column.render
                        ? column.render(item[column.key as keyof T], item)
                        : String(item[column.key as keyof T] || '')
                      }
                    </TableCell>
                  ))}
                  {hasEstadoField && (
                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={item.estado ? 'Activo' : 'Inactivo'}
                        color={item.estado ? 'success' : 'error'}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 24,
                          borderRadius: 2,
                        }}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {onView && (
                        <Tooltip title="Ver detalles" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onView(item)}
                            sx={{
                              color: 'info.main',
                              '&:hover': {
                                bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                              },
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Editar" arrow>
                        <IconButton
                          size="small"
                          onClick={() => onEdit(item)}
                          sx={{
                            color: 'primary.main',
                            '&:hover': {
                              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar" arrow>
                        <IconButton
                          size="small"
                          onClick={() => onDelete(item.id)}
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                            },
                          }}
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
        rowsPerPageOptions={[pageSize]}
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count}`
        }
        labelRowsPerPage="Filas por página"
        sx={{
          mt: 2,
          '.MuiTablePagination-toolbar': {
            px: 2,
          },
        }}
      />
    </Box>
  );
}