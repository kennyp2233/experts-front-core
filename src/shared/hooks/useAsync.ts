import { useState, useCallback } from 'react';
import { logger } from '../utils/logger';

const asyncLogger = logger.createChild('useAsync');

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface AsyncHandlers<T, Args extends any[]> {
  execute: (...args: Args) => Promise<T>;
  reset: () => void;
}

export type UseAsyncReturn<T, Args extends any[]> = AsyncState<T> & AsyncHandlers<T, Args>;

/**
 * Generic hook for handling async operations with loading, error, and success states
 *
 * @param asyncFunction - The async function to execute
 * @param options - Optional configuration
 * @returns Object with state and handlers
 *
 * @example
 * ```tsx
 * const { execute, isLoading, data, error } = useAsync(
 *   async (id: string) => api.get(`/users/${id}`),
 *   { onSuccess: (data) => console.log('Done!', data) }
 * );
 *
 * <Button onClick={() => execute('123')} disabled={isLoading}>
 *   Load User
 * </Button>
 * ```
 */
export function useAsync<T = any, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    logErrors?: boolean;
    logContext?: string;
  } = {}
): UseAsyncReturn<T, Args> {
  const { onSuccess, onError, logErrors = true, logContext = 'AsyncOp' } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T> => {
      setState({
        data: null,
        error: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
      });

      try {
        const result = await asyncFunction(...args);

        setState({
          data: result,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
        });

        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        setState({
          data: null,
          error,
          isLoading: false,
          isSuccess: false,
          isError: true,
        });

        if (logErrors) {
          asyncLogger.error(`${logContext} failed`, error);
        }

        onError?.(error);
        throw error;
      }
    },
    [asyncFunction, onSuccess, onError, logErrors, logContext]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
