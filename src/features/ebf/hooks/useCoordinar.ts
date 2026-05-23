import { useState } from 'react';
import useSWR from 'swr';
import { ebfCoordinarService } from '../services/ebf-coordinar.service';
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

const k = (...parts: (string | number | boolean | undefined | null)[]) =>
  parts.filter((p) => p !== undefined && p !== null && p !== '').join('|');

export const useExportadores = (enabled = true) => {
  const { data, error, isLoading } = useSWR<SelectOption[]>(
    enabled ? 'ebf/coordinar/exportadores' : null,
    () => ebfCoordinarService.listExportadores(),
    { revalidateOnFocus: false },
  );
  return { exportadores: data ?? [], error, isLoading };
};

export const useMarcaciones = (exportador: number | null) => {
  const { data, error, isLoading } = useSWR<SelectOption[]>(
    exportador ? k('ebf/coordinar/marcaciones', exportador) : null,
    () => ebfCoordinarService.listMarcaciones(exportador!),
  );
  return { marcaciones: data ?? [], error, isLoading };
};

export const useVuelos = (exportador: number | null, marcacion: number | null) => {
  const { data, error, isLoading } = useSWR<SelectOption[]>(
    exportador && marcacion
      ? k('ebf/coordinar/vuelos', exportador, marcacion)
      : null,
    () => ebfCoordinarService.listVuelos(exportador!, marcacion!),
  );
  return { vuelos: data ?? [], error, isLoading };
};

export const useCoordinarDaes = (
  exportador: number | null,
  marcacion: number | null,
  vuelo: number | null,
) => {
  const { data, error, isLoading } = useSWR<SelectOption[]>(
    exportador && marcacion && vuelo
      ? k('ebf/coordinar/daes', exportador, marcacion, vuelo)
      : null,
    () => ebfCoordinarService.listDaes(exportador!, marcacion!, vuelo!),
  );
  return { daes: data ?? [], error, isLoading };
};

export const useVueloCard = (params: {
  exportador: number | null;
  marcacion: number | null;
  vuelo: number | null;
  dae?: number | null;
}) => {
  const ready = !!(params.exportador && params.marcacion && params.vuelo);
  const { data, error, isLoading } = useSWR<VueloCard>(
    ready
      ? k(
          'ebf/coordinar/vuelo-card',
          params.exportador,
          params.marcacion,
          params.vuelo,
          params.dae,
        )
      : null,
    () =>
      ebfCoordinarService.getVueloCard({
        exportador: params.exportador!,
        marcacion: params.marcacion!,
        vuelo: params.vuelo!,
        dae: params.dae ?? undefined,
      }),
  );
  return { card: data, error, isLoading };
};

export const useCreateForm = (params: {
  exportador: number | null;
  marcacion: number | null;
  vuelo: number | null;
  dae: number | null;
}) => {
  const ready = !!(
    params.exportador &&
    params.marcacion &&
    params.vuelo &&
    params.dae
  );
  const { data, error, isLoading } = useSWR<CreateFormSpec>(
    ready
      ? k(
          'ebf/coordinar/form',
          params.exportador,
          params.marcacion,
          params.vuelo,
          params.dae,
        )
      : null,
    () =>
      ebfCoordinarService.getCreateForm({
        exportador: params.exportador!,
        marcacion: params.marcacion!,
        vuelo: params.vuelo!,
        dae: params.dae!,
      }),
  );
  return { spec: data, error, isLoading };
};

/**
 * Submit del flujo coordinar. Mantiene `submitting` + `result` + `error`.
 * Sigue el patrón de useSyncRunner — un solo entry point `submit(dto)`
 * que devuelve el resultado pero también lo cachea para la UI.
 */
export const useCoordinarSubmit = () => {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateCoordinacionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const submit = async (
    dto: CreateCoordinacionDto,
  ): Promise<CreateCoordinacionResult> => {
    setSubmitting(true);
    setError(null);
    try {
      const r = await ebfCoordinarService.create(dto);
      setResult(r);
      return r;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { submit, submitting, result, error, reset };
};

/** Calculadora bxs/pcs — call manual con debouncing del lado del consumer. */
export const useBoxWeightCalc = () => {
  const [calc, setCalc] = useState<BoxWeightResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const run = async (input: BoxWeightInput): Promise<BoxWeightResult> => {
    setCalculating(true);
    try {
      const r = await ebfCoordinarService.calcBoxWeight(input);
      setCalc(r);
      return r;
    } finally {
      setCalculating(false);
    }
  };

  return { calc, calculating, run };
};

// === Update / Delete hooks ===

export const useEditForm = (detalleId: number | null) => {
  const { data, error, isLoading, mutate } = useSWR<UpdateFormSpec>(
    detalleId ? `ebf/coordinar/edit-form|${detalleId}` : null,
    () => ebfCoordinarService.getEditForm(detalleId!),
    { revalidateOnFocus: false },
  );
  return { spec: data, error, isLoading, mutate };
};

export const useUpdateSubmit = () => {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<UpdateCoordinacionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const submit = async (
    detalleId: number,
    dto: UpdateCoordinacionDto,
  ): Promise<UpdateCoordinacionResult> => {
    setSubmitting(true);
    setError(null);
    try {
      const r = await ebfCoordinarService.update(detalleId, dto);
      setResult(r);
      return r;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { submit, submitting, result, error, reset };
};

export const useDeleteSubmit = () => {
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<DeleteCoordinacionResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const remove = async (
    detalleId: number,
  ): Promise<DeleteCoordinacionResult> => {
    setDeleting(true);
    setError(null);
    try {
      const r = await ebfCoordinarService.delete(detalleId);
      setResult(r);
      return r;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { remove, deleting, result, error, reset };
};
