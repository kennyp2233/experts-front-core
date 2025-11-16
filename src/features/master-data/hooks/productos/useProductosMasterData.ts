import { useState } from 'react';
import { useMasterData } from '../common/useMasterData';
import { useForeignKeyOptions } from '../../../../shared/hooks';

interface UseProductosMasterDataOptions {
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

interface Medida {
  id: number;
  nombre: string;
}

// Transform data for productos endpoint
function transformProductoData(data: Record<string, unknown>): Record<string, unknown> {
  const transformed = { ...data };

  // Ensure arrays are properly handled
  if (transformed.productosAranceles && Array.isArray(transformed.productosAranceles)) {
    // Remove temporary IDs used in UI
    transformed.productosAranceles = (transformed.productosAranceles as Record<string, unknown>[]).map((arancel) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...cleanArancel } = arancel;
      return cleanArancel;
    });
  }

  if (transformed.productosCompuestos && Array.isArray(transformed.productosCompuestos)) {
    transformed.productosCompuestos = (transformed.productosCompuestos as Record<string, unknown>[]).map((compuesto) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...cleanCompuesto } = compuesto;
      return cleanCompuesto;
    });
  }

  if (transformed.productosMiPros && Array.isArray(transformed.productosMiPros)) {
    transformed.productosMiPros = (transformed.productosMiPros as Record<string, unknown>[]).map((miPro) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...cleanMiPro } = miPro;
      return cleanMiPro;
    });
  }

  return transformed;
}

// Transform data from API to form format
function transformProductoDataFromAPI(data: Record<string, unknown>): Record<string, unknown> {
  const transformed = { ...data };

  // Ensure arrays exist
  transformed.productosAranceles = transformed.productosAranceles || [];
  transformed.productosCompuestos = transformed.productosCompuestos || [];
  transformed.productosMiPros = transformed.productosMiPros || [];

  return transformed;
}

export function useProductosMasterData<T extends { id: number }>(endpoint: string, options: UseProductosMasterDataOptions = {}) {
  const baseHook = useMasterData<T>(endpoint, options);
  const [transforming, setTransforming] = useState(false);

  // Load FK options using the generic hook
  const { options: fkOptions, loading: loadingOptions } = useForeignKeyOptions([
    {
      key: 'medidas',
      endpoint: '/master-data/medidas/simple',
      mapper: (m: Medida) => ({
        value: m.id,
        label: m.nombre,
      }),
    },
  ]);

  const create = async (data: Partial<T>) => {
    setTransforming(true);
    try {
      const transformedData = transformProductoData(data as Record<string, unknown>);
      return await baseHook.create(transformedData as Partial<T>);
    } finally {
      setTransforming(false);
    }
  };

  const update = async (id: number, data: Partial<T>) => {
    setTransforming(true);
    try {
      const transformedData = transformProductoData(data as Record<string, unknown>);
      return await baseHook.update(id, transformedData as Partial<T>);
    } finally {
      setTransforming(false);
    }
  };

  const transformDataForForm = (data: Record<string, unknown>) => {
    return transformProductoDataFromAPI(data);
  };

  return {
    ...baseHook,
    loading: baseHook.loading || transforming || loadingOptions,
    create,
    update,
    transformDataForForm,
    medidas: fkOptions.medidas || [],
  };
}
