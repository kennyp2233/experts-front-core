'use client';

import React, { useState } from 'react';
import { Button, Box } from '@mui/material';
import { ValidationError } from 'yup';
import { MasterDataEntity, MasterDataFormField, MasterDataConfig } from '../../types/master-data.types';
import { useFormState } from '../../hooks/common/useFormState';
import { FormValidator } from '../../utils/FormValidator';
import { FormFieldRenderer } from './FormFieldRenderer';
import { MasterDataDialog, FormTabs } from '@/shared/components/ui';
import { logger } from '@/shared/utils/logger';

const masterDataLogger = logger.createChild('master-data');

interface MasterDataFormProps<T extends MasterDataEntity> {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<T>) => Promise<void>;
  config: MasterDataConfig;
  initialData?: Partial<T>;
  title: string;
  loading?: boolean;
  readOnly?: boolean;
  customFieldRenderers?: Record<string, (field: MasterDataFormField, value: any, onChange: (value: any) => void, error?: string, formData?: Record<string, unknown>, readOnly?: boolean) => React.ReactNode>;
  /** Optional custom header - if provided, will replace the default DialogTitle */
  header?: React.ReactNode;
  /** Optional custom footer - if provided, will replace the default DialogActions */
  footer?: React.ReactNode;
}

/**
 * Componente base para formularios de datos maestros
 * Responsabilidades:
 * - Gestionar el estado del formulario (delegado a useFormState)
 * - Validar campos (delegado a FormValidator)
 * - Renderizar campos (delegado a FormFieldRenderer)
 * - Orquestar el flujo del formulario (submit, close, etc.)
 */
export function MasterDataForm<T extends MasterDataEntity>({
  open,
  onClose,
  onSubmit,
  config,
  initialData = {},
  title,
  loading = false,
  readOnly = false,
  customFieldRenderers = {},
  header,
  footer,
}: MasterDataFormProps<T>) {
  // Safety check - if config or config.fields is undefined, don't render
  if (!config || !config.fields) {
    return null;
  }

  const [activeTab, setActiveTab] = useState(0);
  const { formData, errors, updateField, setAllErrors, reset } = useFormState<T>(
    initialData,
    config.fields
  );

  /**
   * Obtiene el valor de un campo anidado usando notación de puntos
   */
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    updateField(fieldName, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if in read-only mode
    if (readOnly) {
      return;
    }

    // Validar el formulario completo
    let validationErrors: Record<string, string> = {};

    if (config.validationSchema) {
      try {
        await config.validationSchema.validate(formData, { abortEarly: false });
      } catch (err) {
        if (err instanceof ValidationError) {
          validationErrors = err.inner.reduce((acc, error) => {
            if (error.path) {
              acc[error.path] = error.message;
            }
            return acc;
          }, {} as Record<string, string>);
        }
      }
    } else {
      validationErrors = FormValidator.validateForm(config.fields, formData);
    }

    if (Object.keys(validationErrors).length > 0) {
      setAllErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(formData);
      reset();
      onClose();
    } catch (error) {
      masterDataLogger.error('Error submitting form', error);
      // Re-throw para que el componente padre maneje el error
      throw error;
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Agrupar campos por tabs si están definidos
  const hasTabs = config.tabs && config.tabs.length > 0;
  const tabFields = hasTabs
    ? config.tabs!.map(tab => ({
      ...tab,
      fields: config.fields.filter(field => field.tab === tab.key)
    }))
    : [{ key: 'default', label: 'Información', fields: config.fields }];

  const renderTabContent = (fields: MasterDataFormField[]) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
      {fields.map((field) => (
        <Box key={field.name}>
          <FormFieldRenderer
            field={field}
            value={getNestedValue(formData, field.name)}
            error={errors[field.name]}
            onChange={(value) => handleFieldChange(field.name, value)}
            readOnly={readOnly}
            customRenderers={customFieldRenderers}
            formData={formData}
          />
        </Box>
      ))}
    </Box>
  );

  const dialogActions = footer ? undefined : (
    <>
      <Button onClick={handleClose} disabled={loading} variant="outlined" color="inherit">
        {readOnly ? 'Cerrar' : 'Cancelar'}
      </Button>
      {!readOnly && (
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      )}
    </>
  );

  return (
    <MasterDataDialog
      open={open}
      onClose={handleClose}
      title={title}
      size="lg"
      header={header}
      footer={footer}
      actions={dialogActions}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {hasTabs ? (
          <>
            <FormTabs
              tabs={tabFields.map((tab) => ({ key: tab.key, label: tab.label }))}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            {renderTabContent(tabFields[activeTab].fields)}
          </>
        ) : (
          renderTabContent(config.fields)
        )}
      </form>
    </MasterDataDialog>
  );
}