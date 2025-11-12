import { Components, Theme } from '@mui/material/styles';

export const createFormFieldComponents = (mode: 'light' | 'dark'): Components<Theme> => ({
  MuiTextField: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiOutlinedInput-root': {
          borderRadius: 10,
          backgroundColor: mode === 'light' ? theme.palette.background.paper : 'rgba(255, 255, 255, 0.05)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'light' ? theme.palette.divider : 'rgba(255, 255, 255, 0.12)',
            borderWidth: 1.5,
          },
          '&:hover': {
            backgroundColor: mode === 'light' ? theme.palette.action.hover : 'rgba(255, 255, 255, 0.08)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
            },
          },
          '&.Mui-focused': {
            backgroundColor: mode === 'light' ? theme.palette.background.paper : 'rgba(255, 255, 255, 0.08)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
            },
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
        '& .MuiInputLabel-root': {
          fontWeight: 500,
          fontSize: '0.9375rem',
          '&.Mui-focused': {
            color: theme.palette.primary.main,
            fontWeight: 600,
          },
        },
        '& .MuiFormHelperText-root': {
          marginLeft: 4,
          marginTop: 6,
          fontSize: '0.8125rem',
        },
      }),
    },
  },
  MuiFormControl: {
    styleOverrides: {
      root: ({ theme }) => ({
        '& .MuiOutlinedInput-root': {
          borderRadius: 10,
          backgroundColor: mode === 'light' ? theme.palette.background.paper : 'rgba(255, 255, 255, 0.05)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }),
    },
  },
  MuiSelect: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 10,
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
        },
      }),
      icon: ({ theme }) => ({
        color: theme.palette.text.secondary,
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }),
    },
  },
  MuiFormControlLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        margin: 0,
        alignItems: 'center',
        userSelect: 'none',
        '& .MuiFormControlLabel-label': {
          fontWeight: 500,
          fontSize: '0.9375rem',
          marginLeft: 8,
          color: theme.palette.text.primary,
        },
      }),
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: ({ theme }) => ({
        fontWeight: 500,
        fontSize: '0.9375rem',
        '&.Mui-focused': {
          color: theme.palette.primary.main,
          fontWeight: 600,
        },
      }),
    },
  },
  MuiCheckbox: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 6,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: mode === 'light'
            ? 'rgba(255, 107, 53, 0.08)'
            : 'rgba(255, 138, 91, 0.12)',
        },
      }),
    },
  },
  MuiRadio: {
    styleOverrides: {
      root: ({ theme }) => ({
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: mode === 'light'
            ? 'rgba(255, 107, 53, 0.08)'
            : 'rgba(255, 138, 91, 0.12)',
        },
      }),
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: ({ theme }) => ({
        width: 40,
        height: 24,
        padding: 0,
        '& .MuiSwitch-switchBase': {
          padding: 0,
          margin: 2,
          transitionDuration: '300ms',
          '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
              backgroundColor: theme.palette.primary.main,
              opacity: 1,
              border: 0,
              ...(mode === 'dark' && {
                backgroundColor: theme.palette.primary.light,
              }),
            },
            '&.Mui-disabled + .MuiSwitch-track': {
              opacity: 0.5,
            },
          },
          '&.Mui-focusVisible .MuiSwitch-thumb': {
            color: theme.palette.primary.main,
            border: '6px solid #fff',
          },
          '&.Mui-disabled .MuiSwitch-thumb': {
            color: theme.palette.grey[100],
            ...(mode === 'dark' && {
              color: theme.palette.grey[600],
            }),
          },
          '&.Mui-disabled + .MuiSwitch-track': {
            opacity: 0.7,
            ...(mode === 'dark' && {
              opacity: 0.3,
            }),
          },
        },
        '& .MuiSwitch-thumb': {
          boxSizing: 'border-box',
          width: 20,
          height: 20,
        },
        '& .MuiSwitch-track': {
          borderRadius: 12,
          backgroundColor: mode === 'light' ? '#E9E9EA' : '#39393D',
          opacity: 1,
          transition: theme.transitions.create(['background-color'], {
            duration: 500,
          }),
        },
      }),
    },
  },
});