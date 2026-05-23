import useSWR from 'swr';
import { ebfCustomerService } from '../services/ebf-customer.service';
import type {
  CustomerAwbCustomersView,
  CustomerAwbDetailsView,
  CustomerAwbDocumentsView,
  CustomerAwbHeader,
  CustomerAwbListPage,
  CustomerAwbListQuery,
  CustomerProfile,
} from '../types/customer-awb';

const k = (...parts: (string | number | boolean | undefined)[]) =>
  parts.filter((p) => p !== undefined && p !== '').join('|');

export const useCustomerHealth = () => {
  const { data, error, isLoading, mutate } = useSWR<{ ok: true }>(
    'ebf/customer/health',
    () => ebfCustomerService.health(),
    { revalidateOnFocus: false },
  );
  return { ok: data?.ok ?? false, error, isLoading, mutate };
};

export const useCustomerAwbs = (query: CustomerAwbListQuery | null) => {
  const key = query
    ? k(
        'ebf/customer/awbs',
        query.etdStart,
        query.etdEnd,
        query.aerolinea,
        query.consignatarios,
        query.awb,
        query.page,
        query.sort,
      )
    : null;
  const { data, error, isLoading, mutate } = useSWR<CustomerAwbListPage>(
    key,
    () => ebfCustomerService.listAwbs(query!),
  );
  return { page: data, error, isLoading, mutate };
};

export const useCustomerAwbHeader = (id: number | null) => {
  const { data, error, isLoading, mutate } = useSWR<CustomerAwbHeader>(
    id ? k('ebf/customer/awb', id) : null,
    () => ebfCustomerService.getHeader(id!),
  );
  return { header: data, error, isLoading, mutate };
};

export const useCustomerAwbDetails = (
  id: number | null,
  filters: {
    consignatarioMarcacion?: number;
    truck?: number;
    shipper?: number;
    onlyDailyCoo?: boolean;
  } = {},
) => {
  const key = id
    ? k(
        'ebf/customer/awb/details',
        id,
        filters.consignatarioMarcacion,
        filters.truck,
        filters.shipper,
        filters.onlyDailyCoo,
      )
    : null;
  const { data, error, isLoading, mutate } = useSWR<CustomerAwbDetailsView>(
    key,
    () => ebfCustomerService.getDetails(id!, filters),
  );
  return { details: data, error, isLoading, mutate };
};

export const useCustomerAwbCustomers = (id: number | null, sort?: string) => {
  const { data, error, isLoading, mutate } = useSWR<CustomerAwbCustomersView>(
    id ? k('ebf/customer/awb/customers', id, sort) : null,
    () => ebfCustomerService.getCustomers(id!, sort),
  );
  return { customers: data, error, isLoading, mutate };
};

export const useCustomerAwbDocuments = (id: number | null) => {
  const { data, error, isLoading, mutate } = useSWR<CustomerAwbDocumentsView>(
    id ? k('ebf/customer/awb/documents', id) : null,
    () => ebfCustomerService.getDocuments(id!),
  );
  return { documents: data, error, isLoading, mutate };
};

export const useCustomerProfile = (clienteId: number | null) => {
  const { data, error, isLoading, mutate } = useSWR<CustomerProfile>(
    clienteId ? k('ebf/customer/profile', clienteId) : null,
    () => ebfCustomerService.getProfile(clienteId!),
  );
  return { profile: data, error, isLoading, mutate };
};
