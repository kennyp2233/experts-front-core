import { useState } from 'react';
import type { KeyedMutator } from 'swr';

interface RefreshState {
  key: string | null;
  refreshing: boolean;
  error: unknown;
}

const IDLE: RefreshState = { key: null, refreshing: false, error: null };

/**
 * Botón "Actualizar" de las listas EBF: vuelve a pedir la página con
 * `fresh=true` (salta la caché del back) y escribe el resultado en la caché de
 * SWR sin disparar otra revalidación. Las cargas normales no pasan por aquí.
 *
 * El estado queda atado a la key: si el usuario cambia de página o de vista,
 * un error de un refresco anterior no se arrastra a la nueva.
 */
export function useFreshRefresh<T>(
  key: string | null,
  mutate: KeyedMutator<T>,
  fetchFresh: () => Promise<T>,
) {
  const [state, setState] = useState<RefreshState>(IDLE);

  const refresh = async () => {
    if (!key) return;
    setState({ key, refreshing: true, error: null });
    try {
      await mutate(fetchFresh(), { revalidate: false });
      setState({ key, refreshing: false, error: null });
    } catch (error) {
      setState({ key, refreshing: false, error });
    }
  };

  const current = state.key === key ? state : IDLE;
  return {
    refresh,
    refreshing: current.refreshing,
    refreshError: current.error,
  };
}
