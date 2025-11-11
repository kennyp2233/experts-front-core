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
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { AerolineaRuta } from '../../types/master-data.types';
import { useMasterDataList } from '../../hooks/common/useMasterData';

interface RutasManagerProps {
  rutas: AerolineaRuta[];
  onChange: (rutas: AerolineaRuta[]) => void;
  isCreating?: boolean; // Indica si estamos creando una nueva aerolínea
  currentAerolineaId?: number; // ID de la aerolínea actual (para excluirla de rutas VIA)
}

export function RutasManager({ rutas, onChange, isCreating = false, currentAerolineaId }: RutasManagerProps) {
  const [nuevaRuta, setNuevaRuta] = useState<Partial<AerolineaRuta>>({
    tipoRuta: 'ORIGEN',
    orden: rutas.length + 1,
  });

  // Usar hooks para obtener datos de master data
  const { data: paises, loading: loadingPaises, error: errorPaises } = useMasterDataList('/master-data/paises');
  const { data: aerolineas, loading: loadingAerolineas, error: errorAerolineas } = useMasterDataList('/master-data/aerolinea');

  // Filtrar aerolíneas para excluir la actual cuando estamos editando
  const availableAerolineas = aerolineas?.filter(a => !currentAerolineaId || a.id !== currentAerolineaId) || [];

  const loading = loadingPaises || loadingAerolineas;
  const error = errorPaises || errorAerolineas;

  const agregarRuta = () => {
    if (!nuevaRuta.tipoRuta) {
      return;
    }

    // Validar que los datos requeridos estén disponibles
    if ((nuevaRuta.tipoRuta === 'ORIGEN' && nuevaRuta.origenId && (!paises || !paises.find(p => p.id === nuevaRuta.origenId)))) {
      return;
    }
    if ((nuevaRuta.tipoRuta?.startsWith('DESTINO') && nuevaRuta.destinoId && (!paises || !paises.find(p => p.id === nuevaRuta.destinoId)))) {
      return;
    }
    if ((nuevaRuta.tipoRuta?.startsWith('VIA') && nuevaRuta.viaAerolineaId && (!availableAerolineas || !availableAerolineas.find(a => a.id === nuevaRuta.viaAerolineaId)))) {
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

  const getEntityName = (id: number | undefined, entities: { id: number; nombre: string }[]) => {
    if (!entities || entities.length === 0) {
      return 'No disponible';
    }
    return entities.find(e => e.id === id)?.nombre || 'No seleccionado';
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

  if (!paises || paises.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Rutas de la Aerolínea
        </Typography>
        <Typography color="text.secondary">
          No hay países disponibles. Debe crear países primero antes de configurar rutas.
        </Typography>
      </Box>
    );
  }

  if (!availableAerolineas || availableAerolineas.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Rutas de la Aerolínea
        </Typography>
        <Typography color="text.secondary">
          {isCreating
            ? 'Las rutas se pueden configurar después de crear la aerolínea.'
            : 'No hay otras aerolíneas disponibles para rutas vía.'
          }
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Rutas de la Aerolínea
      </Typography>

      {/* Lista de rutas existentes */}
      {rutas.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          No hay rutas configuradas
        </Typography>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {rutas.map((ruta, index) => (
            <Card key={index} variant="outlined">
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${getTipoRutaLabel(ruta.tipoRuta)} (Orden ${ruta.orden})`}
                    color="primary"
                    size="small"
                  />

                  {ruta.origenId && (
                    <Typography variant="body2">
                      <strong>Origen:</strong> {getEntityName(ruta.origenId, paises)}
                    </Typography>
                  )}

                  {ruta.destinoId && (
                    <Typography variant="body2">
                      <strong>Destino:</strong> {getEntityName(ruta.destinoId, paises)}
                    </Typography>
                  )}

                  {ruta.viaAerolineaId && (
                    <Typography variant="body2">
                      <strong>Vía:</strong> {getEntityName(ruta.viaAerolineaId, aerolineas || [])}
                    </Typography>
                  )}

                  <Box sx={{ ml: 'auto' }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => eliminarRuta(index)}
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

      {/* Formulario para agregar nueva ruta */}
      <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Agregar Nueva Ruta
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
                  disabled={!paises || paises.length === 0}
                >
                  {paises && paises.length > 0 ? (
                    paises.map((pais) => (
                      <MenuItem key={pais.id} value={pais.id}>
                        {pais.nombre}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      <em>No hay países disponibles</em>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}

            {(nuevaRuta.tipoRuta?.startsWith('DESTINO')) && (
              <FormControl fullWidth size="small">
                <InputLabel>Destino</InputLabel>
                <Select
                  value={nuevaRuta.destinoId || ''}
                  onChange={(e) => setNuevaRuta({ ...nuevaRuta, destinoId: Number(e.target.value) })}
                  label="Destino"
                  disabled={!paises || paises.length === 0}
                >
                  {paises && paises.length > 0 ? (
                    paises.map((pais) => (
                      <MenuItem key={pais.id} value={pais.id}>
                        {pais.nombre}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      <em>No hay países disponibles</em>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}

            {(nuevaRuta.tipoRuta?.startsWith('VIA')) && (
              <FormControl fullWidth size="small">
                <InputLabel>Aerolínea Vía</InputLabel>
                <Select
                  value={nuevaRuta.viaAerolineaId || ''}
                  onChange={(e) => setNuevaRuta({ ...nuevaRuta, viaAerolineaId: Number(e.target.value) })}
                  label="Aerolinea Vía"
                  disabled={!availableAerolineas || availableAerolineas.length === 0}
                >
                  {availableAerolineas && availableAerolineas.length > 0 ? (
                    availableAerolineas.map((aerolinea) => (
                      <MenuItem key={aerolinea.id} value={aerolinea.id}>
                        {aerolinea.nombre}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      <em>
                        {isCreating
                          ? 'Configure rutas después de crear la aerolínea'
                          : 'No hay otras aerolíneas disponibles'
                        }
                      </em>
                    </MenuItem>
                  )}
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
    </Box>
  );
}