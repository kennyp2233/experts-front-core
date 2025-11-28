import { useState } from 'react';
import { useMasterData } from '../common/useMasterData';

interface UseAerolineasMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

// Transform data for aerolineas endpoint
function transformAerolineaData(data: any): any {
  const transformed = { ...data };

  // rutas and conceptos are now arrays from visual components, no need to parse JSON
  // But we still need to build the plantilla object from individual fields
  if (transformed.plantillaGuiaMadre || transformed.plantillaFormatoAerolinea ||
    transformed.plantillaReservas || transformed.tarifaRate || transformed.pca ||
    (transformed.conceptos && Array.isArray(transformed.conceptos))) {
    transformed.plantilla = {
      plantillaGuiaMadre: transformed.plantillaGuiaMadre,
      plantillaFormatoAerolinea: transformed.plantillaFormatoAerolinea,
      plantillaReservas: transformed.plantillaReservas,
      tarifaRate: transformed.tarifaRate,
      pca: transformed.pca,
      conceptos: transformed.conceptos || [],
    };
  }

  // Remove individual plantilla fields as they're now in the plantilla object
  delete transformed.plantillaGuiaMadre;
  delete transformed.plantillaFormatoAerolinea;
  delete transformed.plantillaReservas;
  delete transformed.tarifaRate;
  delete transformed.pca;

  // Remove conceptos from root as it is now inside plantilla
  delete transformed.conceptos;

  // Clean up rutas to only include allowed fields
  if (transformed.rutas && Array.isArray(transformed.rutas)) {
    transformed.rutas = transformed.rutas.map((ruta: any) => ({
      tipoRuta: ruta.tipoRuta,
      orden: ruta.orden,
      origenId: ruta.origenId,
      destinoId: ruta.destinoId,
      viaAerolineaId: ruta.viaAerolineaId,
    }));
  }

  return transformed;
}

// Transform data from API to form format
function transformAerolineaDataFromAPI(data: any): any {
  const transformed = { ...data };

  // Handle both 'plantilla' (from some endpoints) and 'aerolineasPlantilla' (from Prisma relation)
  const plantillaSource = transformed.plantilla || transformed.aerolineasPlantilla;

  // If plantilla exists, flatten it to individual fields for form
  if (plantillaSource) {
    transformed.plantillaGuiaMadre = plantillaSource.plantillaGuiaMadre;
    transformed.plantillaFormatoAerolinea = plantillaSource.plantillaFormatoAerolinea;
    transformed.plantillaReservas = plantillaSource.plantillaReservas;
    transformed.tarifaRate = plantillaSource.tarifaRate;
    transformed.pca = plantillaSource.pca;
    transformed.conceptos = plantillaSource.conceptos || [];
  }

  // Remove nested objects as they're now flattened
  delete transformed.plantilla;
  delete transformed.aerolineasPlantilla;

  return transformed;
}

export function useAerolineasMasterData(endpoint: string, options: UseAerolineasMasterDataOptions = {}) {
  const baseHook = useMasterData(endpoint, options);
  const [transforming, setTransforming] = useState(false);

  const create = async (data: any): Promise<void> => {
    setTransforming(true);
    try {
      const transformedData = transformAerolineaData(data);
      await baseHook.create(transformedData);
    } finally {
      setTransforming(false);
    }
  };

  const update = async (id: number, data: any): Promise<void> => {
    setTransforming(true);
    try {
      const transformedData = transformAerolineaData(data);
      await baseHook.update(id, transformedData);
    } finally {
      setTransforming(false);
    }
  };

  const transformDataForForm = (data: any) => {
    return transformAerolineaDataFromAPI(data);
  };

  return {
    ...baseHook,
    loading: baseHook.loading || transforming,
    create,
    update,
    transformDataForForm,
  };
}