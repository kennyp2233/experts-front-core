import { useCallback } from 'react';
import { AxiosError } from 'axios';
import { logger } from '../utils/logger';

const errorLogger = logger.createChild('ErrorHandler');

export interface ErrorDetails {
  message: string;
  status?: number;
  code?: string;
  data?: any;
}

/**
 * Hook for handling and extracting error information from various error types
 *
 * @example
 * ```tsx
 * const { getErrorMessage, getErrorDetails, handleError } = useErrorHandler();
 *
 * try {
 *   await api.post('/data', payload);
 * } catch (err) {
 *   const message = getErrorMessage(err);
 *   setError(message);
 *   // or
 *   handleError(err, (details) => {
 *     toast.error(details.message);
 *   });
 * }
 * ```
 */
export function useErrorHandler() {
  /**
   * Extract user-friendly error message from any error type
   */
  const getErrorMessage = useCallback((error: unknown, fallback = 'Ha ocurrido un error'): string => {
    if (!error) return fallback;

    // Axios errors
    if (error instanceof AxiosError) {
      return (
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        fallback
      );
    }

    // Standard errors
    if (error instanceof Error) {
      return error.message || fallback;
    }

    // String errors
    if (typeof error === 'string') {
      return error || fallback;
    }

    // Object with message property
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String(error.message) || fallback;
    }

    return fallback;
  }, []);

  /**
   * Extract detailed error information
   */
  const getErrorDetails = useCallback((error: unknown): ErrorDetails => {
    if (error instanceof AxiosError) {
      return {
        message: getErrorMessage(error),
        status: error.response?.status,
        code: error.code,
        data: error.response?.data,
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        code: error.name,
      };
    }

    return {
      message: getErrorMessage(error),
    };
  }, [getErrorMessage]);

  /**
   * Handle error with logging and optional callback
   */
  const handleError = useCallback(
    (
      error: unknown,
      callback?: (details: ErrorDetails) => void,
      options: {
        log?: boolean;
        logContext?: string;
      } = {}
    ) => {
      const { log = true, logContext = 'Error' } = options;
      const details = getErrorDetails(error);

      if (log) {
        errorLogger.error(`${logContext}:`, error, details);
      }

      callback?.(details);

      return details;
    },
    [getErrorDetails]
  );

  /**
   * Check if error is a specific HTTP status
   */
  const isErrorStatus = useCallback((error: unknown, status: number): boolean => {
    if (error instanceof AxiosError) {
      return error.response?.status === status;
    }
    return false;
  }, []);

  /**
   * Check if error is network related
   */
  const isNetworkError = useCallback((error: unknown): boolean => {
    if (error instanceof AxiosError) {
      return error.code === 'ERR_NETWORK' || !error.response;
    }
    return false;
  }, []);

  return {
    getErrorMessage,
    getErrorDetails,
    handleError,
    isErrorStatus,
    isNetworkError,
  };
}
