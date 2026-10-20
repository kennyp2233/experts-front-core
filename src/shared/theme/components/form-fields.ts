import { alpha, Components, Theme } from '@mui/material/styles';

// Campos: borde fino, hover discreto y foco naranja. El hover no cambia el
// fondo (en formularios largos, como coordinar, distraía al pasar el mouse).
export const createFormFieldComponents = (mode: 'light' | 'dark'): Components<Theme> => {
  const borde = mode === 'light' ? '#CBD5E1' : 'rgba(255, 255, 255, 0.16)';
  const bordeHover = mode === 'light' ? '#94A3B8' : 'rgba(255, 255, 255, 0.32)';
  return {
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          backgroundColor: mode === 'light' ? theme.palette.background.paper : 'rgba(255, 255, 255, 0.04)',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: borde },
          '&:hover:not(.Mui-disabled):not(.Mui-focused):not(.Mui-error) .MuiOutlinedInput-notchedOutline': {
            borderColor: bordeHover,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: 1.5,
          },
          '&.Mui-disabled': {
            backgroundColor: mode === 'light' ? '#F8FAFC' : 'transparent',
          },
          // Campos chicos (filtros, grillas) con el mismo tamaño de letra que la tabla.
          '&.MuiInputBase-sizeSmall': { fontSize: '0.875rem' },
        }),
        input: {
          '&::placeholder': { opacity: 0.7 },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiFormHelperText-root': {
            marginLeft: 2,
            marginTop: 4,
            fontSize: '0.75rem',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: theme.palette.primary.main,
          },
        }),
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        sizeSmall: {
          fontSize: '0.875rem',
          '&.MuiInputLabel-shrink': { fontSize: '1rem' },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: ({ theme }) => ({
          color: theme.palette.text.secondary,
        }),
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 10,
          marginTop: 4,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: mode === 'light' ? '0 8px 24px rgba(15, 23, 42, 0.12)' : '0 8px 24px rgba(0, 0, 0, 0.5)',
        }),
        option: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          marginLeft: 0,
          marginRight: 0,
          gap: 8,
          userSelect: 'none',
          '& .MuiFormControlLabel-label': {
            fontWeight: 500,
            fontSize: '0.875rem',
            color: theme.palette.text.primary,
          },
        }),
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 6,
          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
        }),
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
        }),
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: ({ theme }) => ({
          width: 36,
          height: 20,
          padding: 0,
          flexShrink: 0,
          '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: 2,
            transitionDuration: '200ms',
            '&.Mui-checked': {
              transform: 'translateX(16px)',
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: theme.palette.primary.main,
                opacity: 1,
                border: 0,
              },
              '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.5 },
            },
            '&.Mui-focusVisible .MuiSwitch-thumb': {
              outline: `2px solid ${theme.palette.primary.main}`,
            },
            '&.Mui-disabled .MuiSwitch-thumb': {
              color: mode === 'dark' ? theme.palette.grey[600] : theme.palette.grey[100],
            },
            '&.Mui-disabled + .MuiSwitch-track': { opacity: mode === 'dark' ? 0.3 : 0.7 },
          },
          '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width: 16,
            height: 16,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          },
          '& .MuiSwitch-track': {
            borderRadius: 10,
            backgroundColor: mode === 'light' ? '#CBD5E1' : '#475569',
            opacity: 1,
            transition: theme.transitions.create(['background-color'], { duration: 200 }),
          },
        }),
      },
    },
  };
};
