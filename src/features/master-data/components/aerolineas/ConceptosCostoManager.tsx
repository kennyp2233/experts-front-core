
'use client';

import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { ConceptoCosto } from '../../types/master-data.types';

interface ConceptosCostoManagerProps {
  conceptos: ConceptoCosto[];
  onChange: (conceptos: ConceptoCosto[]) => void;
}

const ALL_TIPOS: ConceptoCosto['tipo'][] = [
  'COSTO_GUIA',
  'COMBUSTIBLE',
  'SEGURIDAD',
  'AUX_CALCULO',
  'IVA',
  'OTROS',
  'AUX1',
  'AUX2',
];

export function ConceptosCostoManager({ conceptos, onChange }: ConceptosCostoManagerProps) {
  const theme = useTheme();
  // Pre-generar con todos los enums si no hay conceptos
  useEffect(() => {
    if (!conceptos || conceptos.length === 0) {
      const defaults: ConceptoCosto[] = ALL_TIPOS.map((t) => ({
        tipo: t,
        abreviatura: '',
        valor: 0,
        multiplicador: null, // Sin multiplicador por defecto
      }));
      onChange(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdate = (index: number, partial: Partial<ConceptoCosto>) => {
    const nuevos = conceptos.map((c, i) => (i === index ? { ...c, ...partial } : c));
    onChange(nuevos);
  };

  const handleDelete = (index: number) => {
    const nuevos = conceptos.filter((_, i) => i !== index);
    onChange(nuevos);
  };

  const getTipoConceptoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      COSTO_GUIA: 'Costo de Guía',
      COMBUSTIBLE: 'Combustible',
      SEGURIDAD: 'Seguridad',
      AUX_CALCULO: 'Auxiliar Cálculo',
      IVA: 'IVA',
      OTROS: 'Otros',
      AUX1: 'Auxiliar 1',
      AUX2: 'Auxiliar 2',
    };
    return labels[tipo] || tipo;
  };

  const getMultiplicadorLabel = (multi?: string | null) => {
    if (!multi) return 'Ninguno';
    const labels: Record<string, string> = {
      GROSS_WEIGHT: 'Gross Weight',
      CHARGEABLE_WEIGHT: 'Chargeable Weight',
    };
    return labels[multi] || multi;
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Conceptos de Costo
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead sx={{ bgcolor: theme.palette.action.hover }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: '30%' }}>Concepto</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '20%' }}>Abreviatura</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '15%', textAlign: 'center' }}>
                Valor
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: '25%' }}>Multiplicador</TableCell>
              <TableCell sx={{ fontWeight: 600, width: '10%', textAlign: 'center' }}>
                Acción
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {conceptos.map((concepto, index) => (
              <TableRow key={index} hover>
                {/* Concepto */}
                <TableCell>
                  <Typography variant="body2">{getTipoConceptoLabel(concepto.tipo)}</Typography>
                </TableCell>

                {/* Abreviatura */}
                <TableCell>
                  <TextField
                    size="small"
                    variant="outlined"
                    value={concepto.abreviatura ?? ''}
                    onChange={(e) => handleUpdate(index, { abreviatura: e.target.value })}
                    placeholder="ej: CG"
                    fullWidth
                    inputProps={{ maxLength: 10 }}
                  />
                </TableCell>

                {/* Valor */}
                <TableCell>
                  <TextField
                    size="small"
                    variant="outlined"
                    type="number"
                    inputProps={{ step: '0.01', min: 0 }}
                    value={typeof concepto.valor === 'number' ? concepto.valor : 0}
                    onChange={(e) =>
                      handleUpdate(index, { valor: parseFloat(e.target.value) || 0 })
                    }
                    fullWidth
                  />
                </TableCell>

                {/* Multiplicador */}
                <TableCell>
                  <FormControl fullWidth size="small" variant="outlined">
                    <InputLabel>Multiplicador</InputLabel>
                    <Select
                      value={concepto.multiplicador ?? ''}
                      label="Multiplicador"
                      onChange={(e) => {
                        const v = e.target.value as string;
                        handleUpdate(index, {
                          multiplicador: v === '' ? null : (v as 'GROSS_WEIGHT' | 'CHARGEABLE_WEIGHT'),
                        });
                      }}
                    >
                      <MenuItem value="">Ninguno</MenuItem>
                      <MenuItem value="GROSS_WEIGHT">Gross Weight</MenuItem>
                      <MenuItem value="CHARGEABLE_WEIGHT">Chargeable Weight</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>

                {/* Eliminar */}
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(index)}
                    title="Eliminar concepto"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="caption" color="text.secondary">
        ℹ️ Los conceptos se pre-generan con todos los tipos disponibles. Edita valores y
        abreviaturas según necesites. El multiplicador es opcional.
      </Typography>
    </Box>
  );
}