import api from '../../../shared/services/api';
import type {
  CustomerAwbCustomersView,
  CustomerAwbDetailsView,
  CustomerAwbDocumentsView,
  CustomerAwbHeader,
  CustomerAwbListPage,
  CustomerAwbListQuery,
  CustomerProfile,
} from '../types/customer-awb';

const BASE = '/integrations/ebf-portal/customer';

export const ebfCustomerService = {
  health: async (): Promise<{ ok: true }> => {
    const { data } = await api.get<{ ok: true }>(`${BASE}/health`);
    return data;
  },

  listAwbs: async (query: CustomerAwbListQuery): Promise<CustomerAwbListPage> => {
    const { data } = await api.get<CustomerAwbListPage>(`${BASE}/awbs`, {
      params: {
        etdStart: query.etdStart,
        etdEnd: query.etdEnd,
        aerolinea: query.aerolinea || undefined,
        consignatarios: query.consignatarios ?? undefined,
        awb: query.awb || undefined,
        page: query.page ?? undefined,
        sort: query.sort || undefined,
      },
    });
    return data;
  },

  getHeader: async (id: number): Promise<CustomerAwbHeader> => {
    const { data } = await api.get<CustomerAwbHeader>(`${BASE}/awbs/${id}`);
    return data;
  },

  getDetails: async (
    id: number,
    filters: {
      consignatarioMarcacion?: number;
      truck?: number;
      shipper?: number;
      onlyDailyCoo?: boolean;
    } = {},
  ): Promise<CustomerAwbDetailsView> => {
    const { data } = await api.get<CustomerAwbDetailsView>(
      `${BASE}/awbs/${id}/details`,
      {
        params: {
          consignatarioMarcacion: filters.consignatarioMarcacion ?? undefined,
          truck: filters.truck ?? undefined,
          shipper: filters.shipper ?? undefined,
          onlyDailyCoo:
            filters.onlyDailyCoo === undefined
              ? undefined
              : String(filters.onlyDailyCoo),
        },
      },
    );
    return data;
  },

  getCustomers: async (
    id: number,
    sort?: string,
  ): Promise<CustomerAwbCustomersView> => {
    const { data } = await api.get<CustomerAwbCustomersView>(
      `${BASE}/awbs/${id}/customers`,
      { params: { sort: sort || undefined } },
    );
    return data;
  },

  getDocuments: async (id: number): Promise<CustomerAwbDocumentsView> => {
    const { data } = await api.get<CustomerAwbDocumentsView>(
      `${BASE}/awbs/${id}/documents`,
    );
    return data;
  },

  getProfile: async (clienteId: number): Promise<CustomerProfile> => {
    const { data } = await api.get<CustomerProfile>(
      `${BASE}/profile/${clienteId}`,
    );
    return data;
  },
};
