import { useState } from 'react';
import { useMasterData } from '../common/useMasterData';
import { useForeignKeyOptions } from '../common/useForeignKeyOptions';

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
  // Create a shallow copy
  const transformed = { ...data };

  // Remove system fields and relations that shouldn't be sent
  delete transformed.id;
  delete transformed.createdAt;
  delete transformed.updatedAt;
  delete transformed.medida; // Remove the relation object, keep medidaId

  // Ensure arrays are properly handled and cleaned
  if (transformed.productosAranceles && Array.isArray(transformed.productosAranceles)) {
    transformed.productosAranceles = (transformed.productosAranceles as Record<string, unknown>[]).map((arancel) => ({
      arancelesDestino: arancel.arancelesDestino,
      arancelesCodigo: arancel.arancelesCodigo,
    }));
  }

  if (transformed.productosCompuestos && Array.isArray(transformed.productosCompuestos)) {
    transformed.productosCompuestos = (transformed.productosCompuestos as Record<string, unknown>[]).map((compuesto) => ({
      destino: compuesto.destino,
      declaracion: compuesto.declaracion,
    }));
  }

  if (transformed.productosMiPros && Array.isArray(transformed.productosMiPros)) {
    transformed.productosMiPros = (transformed.productosMiPros as Record<string, unknown>[]).map((miPro) => ({
      acuerdo: miPro.acuerdo,
      djoCode: miPro.djoCode,
      tariffCode: miPro.tariffCode,
    }));
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
      key: 'medidaId',
      endpoint: '/master-data/medidas/simple',
      mapper: (m: Medida) => ({
        value: m.id,
        label: m.nombre,
      }),
    },
  ]);

  const create = async (data: Partial<T>): Promise<void> => {
    setTransforming(true);
    try {
      const transformedData = transformProductoData(data as Record<string, unknown>);
      await baseHook.create(transformedData as Partial<T>);
    } finally {
      setTransforming(false);
    }
  };

  const update = async (id: number, data: Partial<T>): Promise<void> => {
    setTransforming(true);
    try {
      const transformedData = transformProductoData(data as Record<string, unknown>);
      await baseHook.update(id, transformedData as Partial<T>);
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
    foreignKeyOptions: {
      medidaId: fkOptions.medidaId || [],
    },
  };
}
