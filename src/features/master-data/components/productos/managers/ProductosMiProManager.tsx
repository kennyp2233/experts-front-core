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
import { ProductosMiPro } from '../../../types/master-data.types';

interface ProductosMiProManagerProps {
  miPros: ProductosMiPro[];
  onChange: (miPros: ProductosMiPro[]) => void;
}

export function ProductosMiProManager({ miPros, onChange }: ProductosMiProManagerProps) {
  const [nuevoMiPro, setNuevoMiPro] = useState<Partial<ProductosMiPro>>({
    acuerdo: '',
    djoCode: '',
    tariffCode: '',
  });

  const agregarMiPro = () => {
    if (nuevoMiPro.acuerdo?.trim() || nuevoMiPro.djoCode?.trim() || nuevoMiPro.tariffCode?.trim()) {
      const miProCompleto: ProductosMiPro = {
        id: Date.now(), // ID temporal para UI
        acuerdo: nuevoMiPro.acuerdo || '',
        djoCode: nuevoMiPro.djoCode || '',
        tariffCode: nuevoMiPro.tariffCode || '',
      };
      onChange([...miPros, miProCompleto]);
      setNuevoMiPro({
        acuerdo: '',
        djoCode: '',
        tariffCode: '',
      });
    }
  };

  const eliminarMiPro = (index: number) => {
    const nuevosMiPros = miPros.filter((_, i) => i !== index);
    onChange(nuevosMiPros);
  };

  const actualizarMiPro = (index: number, field: keyof ProductosMiPro, value: string) => {
    const nuevosMiPros = [...miPros];
    nuevosMiPros[index] = { ...nuevosMiPros[index], [field]: value };
    onChange(nuevosMiPros);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Configuración MiPro
      </Typography>

      {/* Lista de MiPro existentes */}
      {miPros.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          No hay configuraciones MiPro
        </Typography>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {miPros.map((miPro, index) => (
            <Card key={miPro.id || index} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="Acuerdo"
                    value={miPro.acuerdo || ''}
                    onChange={(e) => actualizarMiPro(index, 'acuerdo', e.target.value)}
                    size="small"
                    sx={{ minWidth: 120 }}
                  />
                  <TextField
                    label="DJO Code"
                    value={miPro.djoCode || ''}
                    onChange={(e) => actualizarMiPro(index, 'djoCode', e.target.value)}
                    size="small"
                    sx={{ minWidth: 120 }}
                  />
                  <TextField
                    label="Tariff Code"
                    value={miPro.tariffCode || ''}
                    onChange={(e) => actualizarMiPro(index, 'tariffCode', e.target.value)}
                    size="small"
                    sx={{ minWidth: 120 }}
                  />
                  <Box sx={{ ml: 'auto' }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => eliminarMiPro(index)}
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

      {/* Formulario para agregar nuevo MiPro */}
      <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Agregar Nueva Configuración MiPro
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
            <TextField
              label="Acuerdo"
              value={nuevoMiPro.acuerdo || ''}
              onChange={(e) => setNuevoMiPro({ ...nuevoMiPro, acuerdo: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              label="DJO Code"
              value={nuevoMiPro.djoCode || ''}
              onChange={(e) => setNuevoMiPro({ ...nuevoMiPro, djoCode: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              label="Tariff Code"
              value={nuevoMiPro.tariffCode || ''}
              onChange={(e) => setNuevoMiPro({ ...nuevoMiPro, tariffCode: e.target.value })}
              size="small"
              fullWidth
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={agregarMiPro}
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