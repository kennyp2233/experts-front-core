import { useState } from 'react';
import { useMasterData } from '../common/useMasterData';

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

  return transformed;
}

// Transform data from API to form format
function transformAerolineaDataFromAPI(data: any): any {
  const transformed = { ...data };

  // If plantilla exists, flatten it to individual fields for form
  if (transformed.plantilla) {
    transformed.plantillaGuiaMadre = transformed.plantilla.plantillaGuiaMadre;
    transformed.plantillaFormatoAerolinea = transformed.plantilla.plantillaFormatoAerolinea;
    transformed.plantillaReservas = transformed.plantilla.plantillaReservas;
    transformed.tarifaRate = transformed.plantilla.tarifaRate;
    transformed.pca = transformed.plantilla.pca;
    transformed.conceptos = transformed.plantilla.conceptos || [];
  }

  // Remove plantilla object as it's now flattened
  delete transformed.plantilla;

  return transformed;
}

export function useAerolineasMasterData(endpoint: string) {
  const baseHook = useMasterData(endpoint);
  const [transforming, setTransforming] = useState(false);

  const create = async (data: any) => {
    setTransforming(true);
    try {
      const transformedData = transformAerolineaData(data);
      return await baseHook.create(transformedData);
    } finally {
      setTransforming(false);
    }
  };

  const update = async (id: number, data: any) => {
    setTransforming(true);
    try {
      const transformedData = transformAerolineaData(data);
      return await baseHook.update(id, transformedData);
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