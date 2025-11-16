import { useState, useCallback } from 'react';
import { mutate } from 'swr';
import { logger } from '../utils/logger';

const mutationLogger = logger.createChild('useMutation');

export interface MutationState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface MutationOptions<T> {
  onSuccess?: (data: T) => void | Promise<void>;
  onError?: (error: Error) => void;
  invalidateKeys?: (string | ((key: any) => boolean))[];
  logErrors?: boolean;
  logContext?: string;
}

export interface MutationHandlers<T, Args extends any[]> {
  mutate: (...args: Args) => Promise<T>;
  reset: () => void;
}

export type UseMutationReturn<T, Args extends any[]> = MutationState<T> & MutationHandlers<T, Args>;

/**
 * Hook for handling mutations with automatic SWR cache invalidation
 *
 * @param mutationFn - The mutation function to execute
 * @param options - Configuration including cache invalidation keys
 * @returns Object with mutation state and handlers
 *
 * @example
 * ```tsx
 * const { mutate, isLoading, error } = useMutation(
 *   async (data: User) => api.post('/users', data),
 *   {
 *     invalidateKeys: ['/users'], // Invalidate user list cache
 *     onSuccess: () => toast.success('User created!'),
 *   }
 * );
 *
 * <Button onClick={() => mutate(userData)} disabled={isLoading}>
 *   Create User
 * </Button>
 * ```
 */
export function useMutation<T = any, Args extends any[] = any[]>(
  mutationFn: (...args: Args) => Promise<T>,
  options: MutationOptions<T> = {}
): UseMutationReturn<T, Args> {
  const {
    onSuccess,
    onError,
    invalidateKeys = [],
    logErrors = true,
    logContext = 'Mutation',
  } = options;

  const [state, setState] = useState<MutationState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const executeMutation = useCallback(
    async (...args: Args): Promise<T> => {
      setState({
        data: null,
        error: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
      });

      try {
        const result = await mutationFn(...args);

        setState({
          data: result,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
        });

        // Invalidate SWR cache keys
        if (invalidateKeys.length > 0) {
          mutationLogger.debug(`Invalidating cache keys:`, invalidateKeys);
          await Promise.all(
            invalidateKeys.map((key) => {
              if (typeof key === 'function') {
                return mutate(key);
              }
              return mutate(key);
            })
          );
        }

        await onSuccess?.(result);
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
          mutationLogger.error(`${logContext} failed`, error);
        }

        onError?.(error);
        throw error;
      }
    },
    [mutationFn, onSuccess, onError, invalidateKeys, logErrors, logContext]
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
    mutate: executeMutation,
    reset,
  };
}
