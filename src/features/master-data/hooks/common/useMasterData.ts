import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { MasterDataEntity, MasterDataResponse } from '../../types/master-data.types';
import { api } from '../../../../shared/services';

interface UseMasterDataOptions {
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  idField?: string; // The field name for the ID, defaults to 'id'
}

// Helper function to extract error message from axios error
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message || 'Unknown error';
  }
  return error instanceof Error ? error.message : 'Unknown error';
};

// Hook simple para obtener listas de master data (solo lectura)
export function useMasterDataList<T extends { id: number; nombre: string }>(
  endpoint: string
) {
  const { data, error, isLoading } = useSWR<T[]>(
    endpoint,
    async (url: string) => {
      const response = await api.get(url);
      // Handle paginated response structure
      if (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return response.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    data: data || [],
    loading: isLoading,
    error,
    refresh: () => mutate(endpoint),
  };
}

export function useMasterData<T extends MasterDataEntity>(
  endpoint: string,
  options: UseMasterDataOptions = {}
) {
  const { pageSize: initialPageSize = 10, search = '', sortField, sortOrder = 'desc', idField = 'id' } = options;
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [loading, setLoading] = useState(false);

  const queryParams = new URLSearchParams({
    skip: (page * pageSize).toString(),
    take: pageSize.toString(),
    ...(search && { search }),
    ...(sortField && { sortField, sortOrder }),
  });

  const { data, error, isLoading } = useSWR<MasterDataResponse<T>>(
    `${endpoint}?${queryParams}`,
    async (url: string) => {
      const response = await api.get(url);
      return response.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const create = async (data: Partial<T>): Promise<void> => {
    setLoading(true);
    try {
      await api.post(endpoint, data);
      // Refresh all queries for this endpoint
      mutate((key) => typeof key === 'string' && key.startsWith(endpoint));
    } catch (error) {
      throw new Error(`Error creating item: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: number, data: Partial<T>): Promise<void> => {
    setLoading(true);
    try {
      await api.patch(`${endpoint}/${id}`, data);
      // Refresh all queries for this endpoint
      mutate((key) => typeof key === 'string' && key.startsWith(endpoint));
    } catch (error) {
      throw new Error(`Error updating item: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number): Promise<void> => {
    setLoading(true);
    try {
      await api.delete(`${endpoint}/${id}`);
      // Refresh all queries for this endpoint
      mutate((key) => typeof key === 'string' && key.startsWith(endpoint));
    } catch (error) {
      throw new Error(`Error deleting item: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const searchByName = async (name: string): Promise<T[]> => {
    setLoading(true);
    try {
      const response = await api.get(`${endpoint}/search?name=${encodeURIComponent(name)}`);
      return response.data;
    } catch (error) {
      throw new Error(`Error searching items: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    data: data?.data || [],
    total: data?.total || 0,
    page,
    setPage,
    pageSize,
    setPageSize,
    loading: isLoading || loading,
    error,
    create,
    update,
    remove,
    searchByName,
    refresh: () => mutate((key) => typeof key === 'string' && key.startsWith(endpoint)),
    // Generic hook doesn't provide foreignKeyOptions, but custom hooks can
    foreignKeyOptions: undefined,
    transformDataForForm: undefined,
  };
}