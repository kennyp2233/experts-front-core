'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import { MasterDataEntity, MasterDataFormField, MasterDataConfig } from '../../types/master-data.types';
import { useFormState } from '../../hooks/common/useFormState';
import { FormValidator } from '../../utils/FormValidator';
import { FormFieldRenderer } from './FormFieldRenderer';

interface MasterDataFormProps<T extends MasterDataEntity> {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<T>) => Promise<void>;
  config: MasterDataConfig;
  initialData?: Partial<T>;
  title: string;
  loading?: boolean;
  readOnly?: boolean;
  customFieldRenderers?: Record<string, (field: MasterDataFormField, value: any, onChange: (value: any) => void, error?: string) => React.ReactNode>;
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
    const validationErrors = FormValidator.validateForm(config.fields, formData);

    if (FormValidator.hasErrors(validationErrors)) {
      setAllErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(formData);
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
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
          />
        </Box>
      ))}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg" // Changed from md to lg for complex forms like aerolineas
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 24,
          maxHeight: '95vh', // Increased from 90vh for complex forms like aerolineas
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header slot - use provided header if available, otherwise default title */}
        {header ? (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, py: 1, flexShrink: 0 }}>{header}</Box>
        ) : (
          <DialogTitle
            sx={{
              fontWeight: 600,
              fontSize: '1.5rem',
              pb: 2,
              flexShrink: 0,
            }}
          >
            {title}
          </DialogTitle>
        )}

        {/* Body - scrollable */}
        <DialogContent
          sx={{
            px: 2, // Reduced from 3 to 2 for more space
            py: 1, // Reduced from 2 to 1 for more space
            flex: 1,
            overflow: 'auto',
            minHeight: 0, // Allow flex shrinking
          }}
        >
          {hasTabs ? (
            <>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                variant="fullWidth"
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  mb: 2,
                  '& .MuiTab-root': {
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                  },
                  '& .Mui-selected': {
                    fontWeight: 600,
                  },
                }}
              >
                {tabFields.map((tab, index) => (
                  <Tab key={tab.key} label={tab.label} />
                ))}
              </Tabs>
              {renderTabContent(tabFields[activeTab].fields)}
            </>
          ) : (
            renderTabContent(config.fields)
          )}
        </DialogContent>

        {/* Footer slot - use provided footer if available, otherwise default actions */}
        {footer ? (
          <Box sx={{ px: 2, py: 1, flexShrink: 0 }}>{footer}</Box>
        ) : (
          <DialogActions sx={{ flexShrink: 0 }}>
            <Button
              onClick={handleClose}
              disabled={loading}
              variant="outlined"
              color="inherit"
            >
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!readOnly && (
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
          </DialogActions>
        )}
      </form>
    </Dialog>
  );
}