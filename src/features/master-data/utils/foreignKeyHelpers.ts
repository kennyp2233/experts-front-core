import { MasterDataConfig, MasterDataFormField, SelectOption } from '../types/common.types';

/**
 * Aplica opciones de foreign keys dinámicamente al config
 * @param config Config base de master data
 * @param foreignKeyOptions Opciones obtenidas del hook personalizado
 * @returns Config con opciones aplicadas
 */
export function applyForeignKeyOptions(
  config: MasterDataConfig,
  foreignKeyOptions: Record<string, SelectOption[]>
): MasterDataConfig {
  return {
    ...config,
    fields: config.fields.map((field: MasterDataFormField) => {
      // Si hay opciones para este campo, aplicarlas
      if (foreignKeyOptions[field.name]) {
        return {
          ...field,
          options: foreignKeyOptions[field.name],
        };
      }
      return field;
    }),
  };
}
