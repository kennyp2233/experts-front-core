import { isAxiosError } from 'axios';

/**
 * Convierte cualquier error (axios, Error, string) en un mensaje legible para
 * el usuario. Nunca devuelve textos técnicos tipo "Request failed with status
 * code 500".
 */
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (!error) return fallback;

  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'El servidor tardó demasiado en responder. Intenta de nuevo.';
    }
    if (!error.response) {
      return 'No hay conexión con el servidor. Revisa tu red e intenta de nuevo.';
    }
    const { status, data } = error.response;
    const backendMessage = extractBackendMessage(data);
    if (status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    if (status === 403) return 'No tienes permisos para realizar esta acción.';
    if (status === 404) return backendMessage ?? 'No se encontró la información solicitada.';
    if (status === 429) return 'Demasiadas solicitudes seguidas. Espera unos segundos e intenta de nuevo.';
    if (status >= 500) {
      return 'El servidor tuvo un problema al procesar la solicitud. Intenta de nuevo en unos minutos.';
    }
    return backendMessage ?? fallback;
  }

  if (error instanceof Error && error.message && !/status code \d+/i.test(error.message)) {
    return error.message;
  }
  if (typeof error === 'string') return error;
  return fallback;
}

function extractBackendMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const message = (data as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message) && message.length) return message.filter(Boolean).join('. ');
  return null;
}
