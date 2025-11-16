'use client';

import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
} from '@mui/material';
import { MasterDataFormField } from '../../types/master-data.types';

interface FormFieldRendererProps {
  field: MasterDataFormField;
  value: any;
  error?: string;
  onChange: (value: any) => void;
  readOnly?: boolean;
  customRenderers?: Record<string, (field: MasterDataFormField, value: any, onChange: (value: any) => void, error?: string, formData?: Record<string, unknown>, readOnly?: boolean) => React.ReactNode>;
  formData?: Record<string, unknown>;
}

/**
 * Componente encargado de renderizar un campo individual del formulario
 * Responsabilidades:
 * - Renderizar el tipo de campo correcto
 * - Manejar cambios de valor
 * - Mostrar errores de validación
 * - Soportar renderizadores personalizados
 */
export function FormFieldRenderer({
  field,
  value,
  error,
  onChange,
  readOnly = false,
  customRenderers = {},
  formData,
}: FormFieldRendererProps) {
  // Verificar si hay un renderizador personalizado para este tipo
  if (customRenderers[field.type]) {
    return (
      <Box key={field.name}>
        {customRenderers[field.type](field, value, onChange, error, formData, readOnly)}
      </Box>
    );
  }

  switch (field.type) {
    case 'text':
    case 'textarea':
      return (
        <TextField
          key={field.name}
          fullWidth
          label={field.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          helperText={error}
          required={field.required}
          multiline={field.type === 'textarea'}
          rows={field.type === 'textarea' ? 3 : 1}
          margin="dense"
          size="small"
          disabled={readOnly}
        />
      );

    case 'number':
      return (
        <TextField
          key={field.name}
          fullWidth
          label={field.label}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          error={!!error}
          helperText={error}
          required={field.required}
          margin="dense"
          size="small"
          disabled={readOnly}
        />
      );

    case 'boolean':
      return (
        <Box
          key={field.name}
          sx={{
            mt: 1,
            mb: 1,
            p: 1.5,
            borderRadius: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(value)}
                onChange={(e) => onChange(e.target.checked)}
                disabled={readOnly}
              />
            }
            label={field.label}
          />
        </Box>
      );

    case 'select':
      // Ensure the value is valid for the available options
      const stringValue = value ? String(value) : '';
      const hasOptions = field.options && field.options.length > 0;
      const validValue = hasOptions ? (field.options?.some((option: any) => String(option.value) === stringValue) ? stringValue : '') : stringValue;
      
      return (
        <FormControl
          key={field.name}
          fullWidth
          margin="dense"
          size="small"
          error={!!error}
          required={field.required}
        >
          <InputLabel>{field.label}</InputLabel>
          <Select
            value={validValue}
            onChange={(e) => {
              const val = e.target.value;
              onChange(val === '' ? null : (isNaN(Number(val)) ? val : Number(val)));
            }}
            label={field.label}
            disabled={readOnly}
          >
            {field.options?.map((option: any) => (
              <MenuItem key={option.value} value={String(option.value)}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {error && (
            <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.5 }}>
              {error}
            </Box>
          )}
        </FormControl>
      );

    case 'color':
      return (
        <TextField
          key={field.name}
          fullWidth
          label={field.label}
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          margin="dense"
          size="small"
          disabled={readOnly}
        />
      );

    case 'file':
      return (
        <Box key={field.name} sx={{ mt: 1, mb: 1 }}>
          <InputLabel sx={{ mb: 0.5 }}>{field.label}</InputLabel>
          <input
            type="file"
            onChange={(e) => {
              const file = (e.target as HTMLInputElement).files?.[0] || null;
              onChange(file);
            }}
            disabled={readOnly}
          />
          {value && typeof value === 'object' && (value as any).name && (
            <Box sx={{ mt: 1 }}>{(value as any).name}</Box>
          )}
        </Box>
      );

    default:
      // Fallback para tipos desconocidos
      return (
        <TextField
          key={field.name}
          fullWidth
          label={field.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          error={!!error}
          helperText={error}
          required={field.required}
          margin="normal"
          disabled={readOnly}
        />
      );
  }
}
