/**
 * Retry utility with exponential backoff
 *
 * Usage:
 * const result = await retryWithBackoff(
 *   () => fetchProfile(),
 *   { maxRetries: 3, initialDelay: 100 }
 * );
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // in milliseconds
  maxDelay?: number; // maximum delay between retries
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 5000,
  backoffMultiplier: 2,
  shouldRetry: () => true,
};

/**
 * Executes a function with exponential backoff retry logic
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...defaultOptions, ...options };
  let lastError: unknown;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if shouldRetry returns false
      if (!config.shouldRetry(error)) {
        throw error;
      }

      // Don't delay after the last attempt
      if (attempt === config.maxRetries) {
        break;
      }

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next retry (exponential backoff)
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry specifically for verifying authentication after login/register
 * This is a specialized version that checks if the profile can be fetched
 */
export async function retryProfileFetch<T>(
  fetchFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  return retryWithBackoff(fetchFn, {
    maxRetries,
    initialDelay: 100,
    maxDelay: 1000,
    backoffMultiplier: 2,
    shouldRetry: (error: unknown) => {
      // Only retry on network errors or 401s (cookie might not be set yet)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        return axiosError.response?.status === 401 || !axiosError.response;
      }
      return true;
    },
  });
}
