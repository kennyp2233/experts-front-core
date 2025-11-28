'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Stack,
  Grid,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { AerolineaRuta } from '../../types/master-data.types';
import { useMasterDataList } from '../../hooks/common/useMasterData';

interface RutasManagerProps {
  rutas: AerolineaRuta[];
  onChange: (rutas: AerolineaRuta[]) => void;
  isCreating?: boolean; // Indica si estamos creando una nueva aerolínea
  currentAerolineaId?: number; // ID de la aerolínea actual (para excluirla de rutas VIA)
  readOnly?: boolean; // Indica si es modo solo lectura (view mode)
}

const STANDARD_ROUTES = [
  { tipoRuta: 'ORIGEN', orden: 1 },
  { tipoRuta: 'DESTINO1', orden: 2 },
  { tipoRuta: 'VIA1', orden: 3 },
  { tipoRuta: 'DESTINO2', orden: 4 },
  { tipoRuta: 'VIA2', orden: 5 },
  { tipoRuta: 'DESTINO3', orden: 6 },
  { tipoRuta: 'VIA3', orden: 7 },
];

export function RutasManager({ rutas, onChange, isCreating = false, currentAerolineaId, readOnly = false }: RutasManagerProps) {
  const [nuevaRuta, setNuevaRuta] = useState<Partial<AerolineaRuta>>({
    tipoRuta: 'ORIGEN',
    orden: rutas.length + 1,
  });

  // Usar hooks para obtener datos de master data
  const { data: origenes, loading: loadingOrigenes, error: errorOrigenes } = useMasterDataList('/master-data/origen');
  const { data: destinos, loading: loadingDestinos, error: errorDestinos } = useMasterDataList('/master-data/destino');
  const { data: aerolineas, loading: loadingAerolineas, error: errorAerolineas } = useMasterDataList('/master-data/aerolinea');

  // No filtrar la aerolínea actual, permitir auto-referencia
  const availableAerolineas = aerolineas || [];

  const loading = loadingOrigenes || loadingDestinos || loadingAerolineas;
  const error = errorOrigenes || errorDestinos || errorAerolineas;

  // Pre-fill standard template if empty (regardless of creating or editing)
  useEffect(() => {
    if (rutas.length === 0 && !readOnly) {
      // We need to cast to any because the template items are partials but we want to initialize them
      // The actual values (origenId, etc) will be undefined which is fine
      onChange(STANDARD_ROUTES as any[]);
    }
  }, [rutas.length, onChange, readOnly]);

  const handleRouteChange = (index: number, field: keyof AerolineaRuta, value: any) => {
    const newRutas = [...rutas];
    newRutas[index] = { ...newRutas[index], [field]: value };
    onChange(newRutas);
  };

  const agregarRuta = () => {
    if (!nuevaRuta.tipoRuta) {
      return;
    }

    const rutaCompleta: AerolineaRuta = {
      tipoRuta: nuevaRuta.tipoRuta as any,
      orden: nuevaRuta.orden || rutas.length + 1,
      origenId: nuevaRuta.origenId,
      destinoId: nuevaRuta.destinoId,
      viaAerolineaId: nuevaRuta.viaAerolineaId,
    };
    onChange([...rutas, rutaCompleta]);
    setNuevaRuta({
      tipoRuta: 'ORIGEN',
      orden: rutas.length + 2,
    });
  };

  const eliminarRuta = (index: number) => {
    const nuevasRutas = rutas.filter((_, i) => i !== index);
    onChange(nuevasRutas);
  };

  const getTipoRutaLabel = (tipo: string) => {
    const labels = {
      ORIGEN: 'Origen',
      DESTINO1: 'Destino 1',
      DESTINO2: 'Destino 2',
      DESTINO3: 'Destino 3',
      VIA1: 'Vía 1',
      VIA2: 'Vía 2',
      VIA3: 'Vía 3',
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Rutas de la Aerolínea
        </Typography>
        <Typography>Cargando datos...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Rutas de la Aerolínea
        </Typography>
        <Typography color="error">
          Error al cargar los datos: {error.message || 'Error desconocido'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Rutas de la Aerolínea
      </Typography>

      {/* Lista de rutas existentes (Editable) */}
      {rutas.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          No hay rutas configuradas
        </Typography>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {rutas.map((ruta, index) => (
            <Card key={index} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Chip
                      label={`${getTipoRutaLabel(ruta.tipoRuta)}`}
                      color="primary"
                      size="small"
                      sx={{ width: '100%' }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 8 }}>
                    {ruta.tipoRuta === 'ORIGEN' && (
                      <FormControl fullWidth size="small">
                        <InputLabel>Origen</InputLabel>
                        <Select
                          value={ruta.origenId || ''}
                          onChange={(e) => handleRouteChange(index, 'origenId', Number(e.target.value))}
                          label="Origen"
                          disabled={readOnly || !origenes || origenes.length === 0}
                        >
                          {origenes?.map((origen) => (
                            <MenuItem key={origen.id} value={origen.id}>
                              {origen.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    {ruta.tipoRuta?.startsWith('DESTINO') && (
                      <FormControl fullWidth size="small">
                        <InputLabel>Destino</InputLabel>
                        <Select
                          value={ruta.destinoId || ''}
                          onChange={(e) => handleRouteChange(index, 'destinoId', Number(e.target.value))}
                          label="Destino"
                          disabled={readOnly || !destinos || destinos.length === 0}
                        >
                          {destinos?.map((destino) => (
                            <MenuItem key={destino.id} value={destino.id}>
                              {destino.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    {ruta.tipoRuta?.startsWith('VIA') && (
                      <FormControl fullWidth size="small">
                        <InputLabel>Aerolínea Vía</InputLabel>
                        <Select
                          value={ruta.viaAerolineaId || ''}
                          onChange={(e) => handleRouteChange(index, 'viaAerolineaId', Number(e.target.value))}
                          label="Aerolinea Vía"
                          disabled={readOnly || !availableAerolineas || availableAerolineas.length === 0}
                        >
                          {availableAerolineas?.map((aerolinea) => (
                            <MenuItem key={aerolinea.id} value={aerolinea.id}>
                              {aerolinea.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Grid>

                  {!readOnly && (
                    <Grid size={{ xs: 12, sm: 1 }}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => eliminarRuta(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Formulario para agregar nueva ruta (Opcional, para rutas extra) */}
      {!readOnly && (
        <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Agregar Ruta Adicional
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Ruta</InputLabel>
                <Select
                  value={nuevaRuta.tipoRuta || ''}
                  onChange={(e) => setNuevaRuta({ ...nuevaRuta, tipoRuta: e.target.value })}
                  label="Tipo de Ruta"
                >
                  <MenuItem value="ORIGEN">Origen</MenuItem>
                  <MenuItem value="DESTINO1">Destino 1</MenuItem>
                  <MenuItem value="DESTINO2">Destino 2</MenuItem>
                  <MenuItem value="DESTINO3">Destino 3</MenuItem>
                  <MenuItem value="VIA1">Vía 1</MenuItem>
                  <MenuItem value="VIA2">Vía 2</MenuItem>
                  <MenuItem value="VIA3">Vía 3</MenuItem>
                </Select>
              </FormControl>

              {(nuevaRuta.tipoRuta === 'ORIGEN') && (
                <FormControl fullWidth size="small">
                  <InputLabel>Origen</InputLabel>
                  <Select
                    value={nuevaRuta.origenId || ''}
                    onChange={(e) => setNuevaRuta({ ...nuevaRuta, origenId: Number(e.target.value) })}
                    label="Origen"
                    disabled={!origenes || origenes.length === 0}
                  >
                    {origenes?.map((origen) => (
                      <MenuItem key={origen.id} value={origen.id}>
                        {origen.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {nuevaRuta.tipoRuta?.startsWith('DESTINO') && (
                <FormControl fullWidth size="small">
                  <InputLabel>Destino</InputLabel>
                  <Select
                    value={nuevaRuta.destinoId || ''}
                    onChange={(e) => setNuevaRuta({ ...nuevaRuta, destinoId: Number(e.target.value) })}
                    label="Destino"
                    disabled={!destinos || destinos.length === 0}
                  >
                    {destinos?.map((destino) => (
                      <MenuItem key={destino.id} value={destino.id}>
                        {destino.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {nuevaRuta.tipoRuta?.startsWith('VIA') && (
                <FormControl fullWidth size="small">
                  <InputLabel>Aerolínea Vía</InputLabel>
                  <Select
                    value={nuevaRuta.viaAerolineaId || ''}
                    onChange={(e) => setNuevaRuta({ ...nuevaRuta, viaAerolineaId: Number(e.target.value) })}
                    label="Aerolinea Vía"
                    disabled={!availableAerolineas || availableAerolineas.length === 0}
                  >
                    {availableAerolineas?.map((aerolinea) => (
                      <MenuItem key={aerolinea.id} value={aerolinea.id}>
                        {aerolinea.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={agregarRuta}
                size="small"
              >
                Agregar
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}