import api from '../../../shared/services/api';
import type {
  BoxWeightInput,
  BoxWeightResult,
  CreateCoordinacionDto,
  CreateCoordinacionResult,
  CreateFormSpec,
  SelectOption,
  VueloCard,
} from '../types/coordinar';
import type {
  DeleteCoordinacionResult,
  UpdateCoordinacionDto,
  UpdateCoordinacionResult,
  UpdateFormSpec,
} from '../types/coordinar-update';

const BASE = '/integrations/ebf-portal/coordinar';

export const ebfCoordinarService = {
  /** Lista exportadores (parseado del select de la página coordinar). */
  listExportadores: async (): Promise<SelectOption[]> => {
    const { data } = await api.get<SelectOption[]>(`${BASE}/exportadores`);
    return data;
  },

  listMarcaciones: async (exportador: number): Promise<SelectOption[]> => {
    const { data } = await api.get<SelectOption[]>(`${BASE}/marcaciones`, {
      params: { exportador },
    });
    return data;
  },

  listVuelos: async (
    exportador: number,
    marcacion: number,
  ): Promise<SelectOption[]> => {
    const { data } = await api.get<SelectOption[]>(`${BASE}/vuelos`, {
      params: { exportador, marcacion },
    });
    return data;
  },

  listDaes: async (
    exportador: number,
    marcacion: number,
    vuelo: number,
  ): Promise<SelectOption[]> => {
    const { data } = await api.get<SelectOption[]>(`${BASE}/daes`, {
      params: { exportador, marcacion, vuelo },
    });
    return data;
  },

  getVueloCard: async (params: {
    exportador: number;
    marcacion: number;
    vuelo: number;
    dae?: number;
  }): Promise<VueloCard> => {
    const { data } = await api.get<VueloCard>(`${BASE}/vuelo-card`, {
      params,
    });
    return data;
  },

  /** Spec parseada del modal "Crear Detalle De Coordinación" (productos + flags + formset). */
  getCreateForm: async (params: {
    exportador: number;
    marcacion: number;
    vuelo: number;
    dae: number;
  }): Promise<CreateFormSpec> => {
    const { data } = await api.get<CreateFormSpec>(`${BASE}/form`, { params });
    return data;
  },

  /** Calcula bxs/pcs en el portal a partir de fb/hb/qb/eb. */
  calcBoxWeight: async (input: BoxWeightInput): Promise<BoxWeightResult> => {
    const { data } = await api.post<BoxWeightResult>(
      `${BASE}/box-weight`,
      input,
    );
    return data;
  },

  /** Submit del detalle. Devuelve el report del back (ok/status/redirect/errors). */
  create: async (dto: CreateCoordinacionDto): Promise<CreateCoordinacionResult> => {
    const { data } = await api.post<CreateCoordinacionResult>(BASE, dto);
    return data;
  },

  // === Update / Delete ===

  getEditForm: async (detalleId: number): Promise<UpdateFormSpec> => {
    const { data } = await api.get<UpdateFormSpec>(
      `${BASE}/${detalleId}/edit-form`,
    );
    return data;
  },

  update: async (
    detalleId: number,
    dto: UpdateCoordinacionDto,
  ): Promise<UpdateCoordinacionResult> => {
    const { data } = await api.patch<UpdateCoordinacionResult>(
      `${BASE}/${detalleId}`,
      dto,
    );
    return data;
  },

  delete: async (detalleId: number): Promise<DeleteCoordinacionResult> => {
    const { data } = await api.delete<DeleteCoordinacionResult>(
      `${BASE}/${detalleId}`,
    );
    return data;
  },
};
