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
import { ProductosAranceles } from '../../../types/master-data.types';

interface ProductosArancelesManagerProps {
  aranceles: ProductosAranceles[];
  onChange: (aranceles: ProductosAranceles[]) => void;
}

export function ProductosArancelesManager({ aranceles, onChange }: ProductosArancelesManagerProps) {
  const [nuevoArancel, setNuevoArancel] = useState<Partial<ProductosAranceles>>({
    arancelesDestino: '',
    arancelesCodigo: '',
  });

  const agregarArancel = () => {
    if (nuevoArancel.arancelesDestino?.trim() || nuevoArancel.arancelesCodigo?.trim()) {
      const arancelCompleto: ProductosAranceles = {
        id: Date.now(), // ID temporal para UI
        arancelesDestino: nuevoArancel.arancelesDestino || '',
        arancelesCodigo: nuevoArancel.arancelesCodigo || '',
      };
      onChange([...aranceles, arancelCompleto]);
      setNuevoArancel({
        arancelesDestino: '',
        arancelesCodigo: '',
      });
    }
  };

  const eliminarArancel = (index: number) => {
    const nuevosAranceles = aranceles.filter((_, i) => i !== index);
    onChange(nuevosAranceles);
  };

  const actualizarArancel = (index: number, field: keyof ProductosAranceles, value: string) => {
    const nuevosAranceles = [...aranceles];
    nuevosAranceles[index] = { ...nuevosAranceles[index], [field]: value };
    onChange(nuevosAranceles);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Aranceles del Producto
      </Typography>

      {/* Lista de aranceles existentes */}
      {aranceles.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          No hay aranceles configurados
        </Typography>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {aranceles.map((arancel, index) => (
            <Card key={arancel.id || index} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="Destino"
                    value={arancel.arancelesDestino || ''}
                    onChange={(e) => actualizarArancel(index, 'arancelesDestino', e.target.value)}
                    size="small"
                    sx={{ minWidth: 150 }}
                  />
                  <TextField
                    label="Código"
                    value={arancel.arancelesCodigo || ''}
                    onChange={(e) => actualizarArancel(index, 'arancelesCodigo', e.target.value)}
                    size="small"
                    sx={{ minWidth: 150 }}
                  />
                  <Box sx={{ ml: 'auto' }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => eliminarArancel(index)}
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

      {/* Formulario para agregar nuevo arancel */}
      <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Agregar Nuevo Arancel
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <TextField
              label="Destino"
              value={nuevoArancel.arancelesDestino || ''}
              onChange={(e) => setNuevoArancel({ ...nuevoArancel, arancelesDestino: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              label="Código"
              value={nuevoArancel.arancelesCodigo || ''}
              onChange={(e) => setNuevoArancel({ ...nuevoArancel, arancelesCodigo: e.target.value })}
              size="small"
              fullWidth
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={agregarArancel}
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