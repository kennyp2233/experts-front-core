import { MasterDataFormField, MasterDataEntity } from '../types/master-data.types';

/**
 * Servicio de validación para formularios
 * Responsabilidades:
 * - Validar campos individuales
 * - Validar formulario completo
 * - Retornar errores formateados
 */
export class FormValidator {
  /**
   * Obtiene el valor de un campo anidado usando notación de puntos
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Valida un campo individual basándose en sus reglas
   */
  static validateField(field: MasterDataFormField, value: any): string | null {
    // Validar requerido
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `El campo ${field.label} es requerido`;
    }

    // Si no hay valor y no es requerido, pasar validación
    if (!value) {
      return null;
    }

    // Validar según las reglas del campo
    if (field.validation) {
      const validationError = this.validateFieldRules(field, value);
      if (validationError) {
        return validationError;
      }
    }

    return null;
  }

  /**
   * Valida las reglas específicas del campo
   */
  private static validateFieldRules(field: MasterDataFormField, value: any): string | null {
    const { validation } = field;

    if (!validation) {
      return null;
    }

    const { min, max, minLength, maxLength, pattern, custom } = validation as any;

    // Validar número mínimo
    if (min !== undefined && typeof value === 'number' && value < min) {
      return `El valor debe ser mayor o igual a ${min}`;
    }

    // Validar número máximo
    if (max !== undefined && typeof value === 'number' && value > max) {
      return `El valor debe ser menor o igual a ${max}`;
    }

    // Validar largo mínimo de string
    if (minLength !== undefined && typeof value === 'string' && value.length < minLength) {
      return `${field.label} debe tener al menos ${minLength} caracteres`;
    }

    // Validar largo máximo de string
    if (maxLength !== undefined && typeof value === 'string' && value.length > maxLength) {
      return `${field.label} no puede exceder ${maxLength} caracteres`;
    }

    // Validar patrón (regex)
    if (pattern && typeof value === 'string') {
      const re = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      if (!re.test(value)) {
        return `El formato del campo ${field.label} no es válido`;
      }
    }

    // Validación personalizada
    if (custom && typeof custom === 'function') {
      const customError = custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }

  /**
   * Valida todos los campos del formulario
   */
  static validateForm<T extends { [key: string]: any }>(
    fields: MasterDataFormField[],
    formData: T
  ): Record<string, string> {
    const errors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = this.getNestedValue(formData, field.name);
      const error = this.validateField(field, value);
      if (error) {
        errors[field.name] = error;
      }
    });

    return errors;
  }

  /**
   * Verifica si hay errores en el registro
   */
  static hasErrors(errors: Record<string, string>): boolean {
    return Object.keys(errors).length > 0;
  }
}
