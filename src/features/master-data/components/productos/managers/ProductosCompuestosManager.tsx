'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Stack,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ProductosCompuesto } from '../../../types/master-data.types';

interface ProductosCompuestosManagerProps {
  compuestos: ProductosCompuesto[];
  onChange: (compuestos: ProductosCompuesto[]) => void;
}

export function ProductosCompuestosManager({ compuestos, onChange }: ProductosCompuestosManagerProps) {
  const [nuevoCompuesto, setNuevoCompuesto] = useState<Partial<ProductosCompuesto>>({
    destino: '',
    declaracion: '',
  });

  const agregarCompuesto = () => {
    if (nuevoCompuesto.destino?.trim() || nuevoCompuesto.declaracion?.trim()) {
      const compuestoCompleto: ProductosCompuesto = {
        id: Date.now(), // ID temporal para UI
        destino: nuevoCompuesto.destino || '',
        declaracion: nuevoCompuesto.declaracion || '',
      };
      onChange([...compuestos, compuestoCompleto]);
      setNuevoCompuesto({
        destino: '',
        declaracion: '',
      });
    }
  };

  const eliminarCompuesto = (index: number) => {
    const nuevosCompuestos = compuestos.filter((_, i) => i !== index);
    onChange(nuevosCompuestos);
  };

  const actualizarCompuesto = (index: number, field: keyof ProductosCompuesto, value: string) => {
    const nuevosCompuestos = [...compuestos];
    nuevosCompuestos[index] = { ...nuevosCompuestos[index], [field]: value };
    onChange(nuevosCompuestos);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Productos Compuestos
      </Typography>

      {/* Lista de compuestos existentes */}
      {compuestos.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          No hay productos compuestos configurados
        </Typography>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {compuestos.map((compuesto, index) => (
            <Card key={compuesto.id || index} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="Destino"
                    value={compuesto.destino || ''}
                    onChange={(e) => actualizarCompuesto(index, 'destino', e.target.value)}
                    size="small"
                    sx={{ minWidth: 150 }}
                  />
                  <TextField
                    label="Declaración"
                    value={compuesto.declaracion || ''}
                    onChange={(e) => actualizarCompuesto(index, 'declaracion', e.target.value)}
                    size="small"
                    sx={{ minWidth: 200 }}
                    multiline
                    rows={2}
                  />
                  <Box sx={{ ml: 'auto' }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => eliminarCompuesto(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Formulario para agregar nuevo compuesto */}
      <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Agregar Nuevo Producto Compuesto
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <TextField
              label="Destino"
              value={nuevoCompuesto.destino || ''}
              onChange={(e) => setNuevoCompuesto({ ...nuevoCompuesto, destino: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              label="Declaración"
              value={nuevoCompuesto.declaracion || ''}
              onChange={(e) => setNuevoCompuesto({ ...nuevoCompuesto, declaracion: e.target.value })}
              size="small"
              fullWidth
              multiline
              rows={2}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={agregarCompuesto}
              size="small"
            >
              Agregar
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}