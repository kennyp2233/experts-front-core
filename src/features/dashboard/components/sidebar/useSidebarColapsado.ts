'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

const CLAVE = 'experts.sidebar.colapsado';
const EVENTO = 'experts:sidebar-colapsado';

/** Pantallas anchas de trabajo: el menú arranca plegado si el usuario no eligió otra cosa. */
const RUTAS_ANCHAS = [/^\/operacion\/coordinaciones\/nueva$/, /^\/operacion\/coordinaciones\/\d+\/editar$/];

/** Respaldo en memoria si el navegador no deja guardar. */
let enMemoria: 'si' | 'no' | null = null;

function leer(): 'si' | 'no' | null {
  try {
    const v = window.localStorage.getItem(CLAVE);
    return v === 'si' || v === 'no' ? v : enMemoria;
  } catch {
    return enMemoria;
  }
}

function suscribir(cb: () => void) {
  window.addEventListener(EVENTO, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENTO, cb);
    window.removeEventListener('storage', cb);
  };
}

/**
 * Menú lateral plegado a íconos (para ganar ancho en pantallas de 1366 px).
 * La elección se recuerda en el navegador; sin elección, se pliega solo en las
 * pantallas de coordinar.
 */
export function useSidebarColapsado() {
  const pathname = usePathname();
  const preferencia = useSyncExternalStore(suscribir, leer, () => null);
  const colapsado = preferencia ? preferencia === 'si' : RUTAS_ANCHAS.some((r) => r.test(pathname ?? ''));

  const alternar = useCallback(() => {
    enMemoria = colapsado ? 'no' : 'si';
    try {
      window.localStorage.setItem(CLAVE, enMemoria);
    } catch {
      // Sin almacenamiento: vale hasta recargar la página.
    }
    window.dispatchEvent(new Event(EVENTO));
  }, [colapsado]);

  return { colapsado, alternar };
}
