import { useState, useEffect } from 'react';
import { MasterDataEntity, MasterDataFormField } from '../types/master-data.types';

/**
 * Hook personalizado para manejar el estado del formulario
 * Responsabilidades:
 * - Gestionar datos del formulario
 * - Gestionar errores de validación
 * - Gestionar tab activo
 * - Resetear estado cuando sea necesario
 */
export function useFormState<T extends MasterDataEntity>(
  initialData?: Partial<T>,
  fields: MasterDataFormField[] = []
) {
  const [formData, setFormData] = useState<Partial<T>>(initialData || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setFormData(initialData || {});
    setErrors({});
    setActiveTab(0);
  }, [JSON.stringify(initialData)]);

  const updateField = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Limpiar error para este campo cuando cambia
    if (errors[fieldName]) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: '',
      }));
    }
  };

  const setFieldError = (fieldName: string, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const clearFieldError = (fieldName: string) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: '',
    }));
  };

  const setAllErrors = (newErrors: Record<string, string>) => {
    setErrors(newErrors);
  };

  const hasErrors = Object.keys(errors).length > 0;

  const reset = () => {
    setFormData(initialData || {});
    setErrors({});
    setActiveTab(0);
  };

  return {
    formData,
    setFormData,
    errors,
    setFieldError,
    clearFieldError,
    setAllErrors,
    hasErrors,
    updateField,
    reset,
    activeTab,
    setActiveTab,
  };
}
