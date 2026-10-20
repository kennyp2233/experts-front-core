import useSWR from 'swr';
import api from '@/shared/services/api';
import { cuentasService } from '../services/cuentas.service';
import type { DaeFiltros, EmpresaEmisor, FiltrosCuentas } from '../types/cuentas';

export const useEstadoCuenta = (f: (FiltrosCuentas & { idCliente?: number }) | null) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    f?.idCliente ? ['operacion/cuentas/estado-cuenta', f.idCliente, f.desde, f.hasta, !!f.incluirAbiertas] : null,
    () => cuentasService.estadoCuenta(f as FiltrosCuentas & { idCliente: number }),
    { revalidateOnFocus: false },
  );
  return { estado: data, error, isLoading, isValidating, mutate };
};

export const useVentas = (f: FiltrosCuentas) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ['operacion/cuentas/ventas', f.desde, f.hasta, f.idAerolinea ?? null, f.idCliente ?? null, !!f.incluirAbiertas],
    () => cuentasService.ventas(f),
    { revalidateOnFocus: false, keepPreviousData: true },
  );
  return { ventas: data, error, isLoading, isValidating, mutate };
};

export const useLiquidacionGuia = (id: number) => {
  const { data, error, isLoading } = useSWR(['operacion/cuentas/guia', id], () => cuentasService.liquidacionGuia(id), {
    revalidateOnFocus: false,
  });
  return { liquidacion: data, error, isLoading };
};

/**
 * Datos del emisor (Experts) para los documentos de cobro. Las cuentas no los
 * traen: salen de la misma fuente que las guías hijas (parámetros EMPRESA.*).
 * `idCoordinacion` = una coordinación con guías hijas; si falla, el documento
 * sale con el nombre de la empresa solamente.
 */
export const useEmpresaEmisor = (idCoordinacion: number | null | undefined, yaLaTiene = false) => {
  const { data } = useSWR<EmpresaEmisor>(
    idCoordinacion && !yaLaTiene ? ['operacion/empresa-emisor', idCoordinacion] : null,
    async () => (await api.get(`/operacion/coordinaciones/${idCoordinacion}/guias-hijas/impresion`)).data.empresa,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  return data;
};

export const useDaes = (f: DaeFiltros) => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ['operacion/daes', f.idFinca ?? null, f.q ?? '', !!f.vigentes],
    () => cuentasService.listarDaes(f),
    { revalidateOnFocus: false, keepPreviousData: true },
  );
  return { daes: data, error, isLoading, isValidating, mutate };
};

export const useEstadoCorte = () => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    'operacion/corte-definitivo',
    () => cuentasService.estadoCorte(),
    { revalidateOnFocus: false },
  );
  return { corte: data, error, isLoading, isValidating, mutate };
};
