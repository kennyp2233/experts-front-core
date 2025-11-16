import { useState, useEffect } from 'react';
import { api } from '../../../../shared/services';
import { logger } from '../../../../shared/utils';

const fkLogger = logger.createChild('FK-Options');

export interface SelectOption {
  value: number | string;
  label: string;
}

export interface ForeignKeyConfig<T = Record<string, unknown>> {
  key: string; // The name of the option set (e.g., 'paises', 'acuerdos')
  endpoint: string; // API endpoint to fetch from
  mapper: (item: T) => SelectOption; // Function to map API data to SelectOption
}

interface UseForeignKeyOptionsReturn {
  options: Record<string, SelectOption[]>;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Generic hook to load foreign key options from multiple endpoints
 *
 * This eliminates code duplication across all master data hooks that need
 * to load reference data for select fields.
 *
 * @example
 * const { options, loading } = useForeignKeyOptions([
 *   {
 *     key: 'paises',
 *     endpoint: '/master-data/paises',
 *     mapper: (p) => ({ value: p.idPais, label: `${p.siglasPais} - ${p.nombre}` })
 *   },
 *   {
 *     key: 'acuerdos',
 *     endpoint: '/master-data/acuerdos-arancelarios',
 *     mapper: (a) => ({ value: a.idAcuerdo, label: a.nombre })
 *   }
 * ]);
 *
 * // Later use: options.paises, options.acuerdos
 */
export function useForeignKeyOptions(
  configs: ForeignKeyConfig<any>[]
): UseForeignKeyOptionsReturn {
  const [options, setOptions] = useState<Record<string, SelectOption[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    const loadOptions = async () => {
      if (configs.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        fkLogger.debug(`Loading FK options for: ${configs.map((c) => c.key).join(', ')}`);

        // Fetch all endpoints in parallel
        const responses = await Promise.all(
          configs.map(async (config) => {
            try {
              const response = await api.get(config.endpoint);
              // Handle both paginated and non-paginated responses
              const data = response.data.data || response.data;
              return { key: config.key, data, mapper: config.mapper };
            } catch (err) {
              fkLogger.error(`Failed to load FK options for ${config.key}`, err);
              return { key: config.key, data: [], mapper: config.mapper };
            }
          })
        );

        // Map responses to options object
        const mappedOptions: Record<string, SelectOption[]> = {};
        responses.forEach(({ key, data, mapper }) => {
          if (Array.isArray(data)) {
            mappedOptions[key] = data.map(mapper);
          } else {
            mappedOptions[key] = [];
          }
        });

        setOptions(mappedOptions);
        fkLogger.debug('FK options loaded successfully', {
          keys: Object.keys(mappedOptions),
          counts: Object.entries(mappedOptions).map(([k, v]) => `${k}:${v.length}`),
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load FK options');
        fkLogger.error('Error loading FK options', error);
        setError(error);

        // Set empty options as fallback
        const emptyOptions: Record<string, SelectOption[]> = {};
        configs.forEach((config) => {
          emptyOptions[config.key] = [];
        });
        setOptions(emptyOptions);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadTrigger, JSON.stringify(configs.map((c) => ({ key: c.key, endpoint: c.endpoint })))]);

  const reload = () => {
    setReloadTrigger((prev) => prev + 1);
  };

  return {
    options,
    loading,
    error,
    reload,
  };
}
